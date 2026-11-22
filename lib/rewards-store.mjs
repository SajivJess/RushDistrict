import { createHash, randomBytes } from "node:crypto"
import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { minUnboxingViews, referralCode, unboxingCouponCode } from "../data/rewards.mjs"

export const sessionLifetime = 7 * 24 * 60 * 60
let database

function db() {
  if (database) return database

  // This is runtime-owned data and must stay outside Next.js deployment traces.
  const path = resolve(/*turbopackIgnore: true*/ process.env.RUSH_REWARDS_DB ?? ".rush-data/rewards.sqlite")
  mkdirSync(dirname(path), { recursive: true })
  const connection = new DatabaseSync(path)
  connection.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS buyers (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      access_hash TEXT NOT NULL UNIQUE,
      referral_code TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS paid_orders (
      reference TEXT PRIMARY KEY,
      buyer_id INTEGER NOT NULL REFERENCES buyers(id),
      referred_by INTEGER REFERENCES buyers(id)
    );
    CREATE TABLE IF NOT EXISTS buyer_sessions (
      token_hash TEXT PRIMARY KEY,
      buyer_id INTEGER NOT NULL REFERENCES buyers(id),
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_accounts (
      id INTEGER PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      google_subject TEXT UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      locality TEXT NOT NULL DEFAULT '',
      postcode TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS customer_sessions (
      token_hash TEXT PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES customer_accounts(id),
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS email_challenges (
      token_hash TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      issued_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      consumed INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS email_challenges_issuance ON email_challenges(email, issued_at);
    CREATE TABLE IF NOT EXISTS unboxings (
      id INTEGER PRIMARY KEY,
      url TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      claimed_views INTEGER NOT NULL,
      claim_hash TEXT NOT NULL UNIQUE,
      verified_views INTEGER,
      coupon_code TEXT UNIQUE,
      discount INTEGER,
      rejected INTEGER NOT NULL DEFAULT 0,
      redeemed_by TEXT UNIQUE REFERENCES paid_orders(reference),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
  database = connection
  return connection
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex")
}

function secret() {
  return randomBytes(24).toString("base64url")
}

function code(prefix) {
  return `${prefix}-${randomBytes(6).toString("hex").toUpperCase()}`
}

function transaction(operation) {
  const connection = db()
  connection.exec("BEGIN IMMEDIATE")
  try {
    const result = operation(connection)
    connection.exec("COMMIT")
    return result
  } catch (error) {
    connection.exec("ROLLBACK")
    throw error
  }
}

function emailAddress(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : ""
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

export { db as storeDatabase, transaction as storeTransaction, emailAddress as normaliseStoreEmail }

function publicVideoLink(value) {
  if (typeof value !== "string" || value.length > 2000) return null
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" || url.username || url.password || url.pathname === "/") return null

    if (["www.youtube.com", "youtube.com", "m.youtube.com", "youtu.be"].includes(url.hostname)) {
      let video = url.searchParams.get("v")
      if (url.hostname === "youtu.be") video = url.pathname.split("/")[1]
      if (url.pathname.startsWith("/shorts/")) video = url.pathname.split("/")[2]
      if (video && /^[A-Za-z0-9_-]{11}$/.test(video)) return `https://www.youtube.com/watch?v=${video}`
    }

    url.hash = ""
    url.pathname = url.pathname.replace(/\/+$/, "")
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || ["igsh", "fbclid", "si"].includes(key)) url.searchParams.delete(key)
    }
    url.searchParams.sort()
    return url.toString()
  } catch {
    return null
  }
}

/** @param {{url:unknown,email:unknown,views:unknown}} input */
export function submitUnboxing({ url, email, views }) {
  const link = publicVideoLink(url)
  const contact = emailAddress(email)
  if (!link || !contact || typeof views !== "number" || !Number.isSafeInteger(views) || views < minUnboxingViews) {
    return { error: "Enter a public HTTPS video link, an email address and at least 1,000 views." }
  }

  const claim = secret()
  const submitted = db().prepare(`
    INSERT INTO unboxings (url, email, claimed_views, claim_hash)
    VALUES (?, ?, ?, ?) ON CONFLICT(url) DO NOTHING
  `).run(link, contact, views, hash(claim))

  return submitted.changes ? { claim, status: "pending" } : { error: "This video has already been submitted. Use its review code to check the status." }
}

/** @param {unknown} claim */
export function unboxingStatus(claim) {
  if (typeof claim !== "string" || !/^[A-Za-z0-9_-]{32}$/.test(claim)) return null
  const row = db().prepare("SELECT rejected, coupon_code, discount, redeemed_by FROM unboxings WHERE claim_hash = ?").get(hash(claim))
  if (!row) return null
  if (row.rejected) return { status: "declined" }
  if (!row.coupon_code) return { status: "pending" }
  return { status: row.redeemed_by ? "redeemed" : "approved", coupon: String(row.coupon_code), discount: Number(row.discount) }
}

/** @param {unknown} value */
export function availableCoupon(value) {
  const coupon = unboxingCouponCode(value)
  if (!coupon) return null
  const row = db().prepare("SELECT discount FROM unboxings WHERE coupon_code = ? AND redeemed_by IS NULL").get(coupon)
  return row ? { code: coupon, discount: Number(row.discount) } : null
}

/** @param {unknown} value */
export function validReferral(value) {
  const referral = referralCode(value)
  if (!referral) return null
  const buyer = db().prepare(`
    SELECT id FROM buyers WHERE referral_code = ?
    AND EXISTS (SELECT 1 FROM paid_orders WHERE buyer_id = buyers.id)
  `).get(referral)
  return buyer ? referral : null
}

/** @param {unknown} key */
export function signInBuyer(key) {
  if (typeof key !== "string" || !/^RD-[A-Za-z0-9_-]{32}$/.test(key)) return null
  const connection = db()
  const buyer = connection.prepare(`
    SELECT id, referral_code FROM buyers WHERE access_hash = ?
    AND EXISTS (SELECT 1 FROM paid_orders WHERE buyer_id = buyers.id)
  `).get(hash(key))
  if (!buyer) return null

  const token = secret()
  const now = Math.floor(Date.now() / 1000)
  connection.prepare("DELETE FROM buyer_sessions WHERE expires_at <= ?").run(now)
  connection.prepare("INSERT INTO buyer_sessions (token_hash, buyer_id, expires_at) VALUES (?, ?, ?)").run(hash(token), buyer.id, now + sessionLifetime)
  return { token, referral: String(buyer.referral_code) }
}

/** @param {string | undefined} token */
export function buyerReferral(token) {
  if (!token || !/^[A-Za-z0-9_-]{32}$/.test(token)) return null
  const buyer = db().prepare(`
    SELECT buyers.referral_code FROM buyer_sessions
    JOIN buyers ON buyers.id = buyer_sessions.buyer_id
    WHERE buyer_sessions.token_hash = ? AND buyer_sessions.expires_at > ?
    AND EXISTS (SELECT 1 FROM paid_orders WHERE buyer_id = buyers.id)
  `).get(hash(token), Math.floor(Date.now() / 1000))
  return buyer ? String(buyer.referral_code) : null
}

/** @param {string} email */
export function referralForCustomer(email) {
  const buyer = db().prepare(`
    SELECT referral_code FROM buyers WHERE email = ?
    AND EXISTS (SELECT 1 FROM paid_orders WHERE buyer_id = buyers.id)
  `).get(email)
  return buyer ? String(buyer.referral_code) : null
}

/** @param {string | undefined} token */
export function signOutBuyer(token) {
  if (token) db().prepare("DELETE FROM buyer_sessions WHERE token_hash = ?").run(hash(token))
}

export function pendingUnboxings() {
  return db().prepare(`
    SELECT id, url, email, claimed_views, created_at FROM unboxings
    WHERE coupon_code IS NULL AND rejected = 0 ORDER BY id
  `).all()
}

export function approveUnboxing(id, verifiedViews, discount) {
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(verifiedViews) || verifiedViews < minUnboxingViews ||
    !Number.isSafeInteger(discount) || discount < 1) throw new Error("Use a submission ID, at least 1,000 verified views and a positive whole-rupee coupon value.")

  const coupon = code("UNBOX")
  const result = db().prepare(`
    UPDATE unboxings SET verified_views = ?, coupon_code = ?, discount = ?
    WHERE id = ? AND coupon_code IS NULL AND rejected = 0
  `).run(verifiedViews, coupon, discount, id)
  if (!result.changes) throw new Error("That pending submission was not found.")
  const recipient = db().prepare("SELECT email FROM unboxings WHERE id = ?").get(id)
  return { coupon, discount, email: String(recipient?.email ?? "") }
}

export function declineUnboxing(id) {
  const result = db().prepare("UPDATE unboxings SET rejected = 1 WHERE id = ? AND coupon_code IS NULL AND rejected = 0").run(id)
  if (!result.changes) throw new Error("That pending submission was not found.")
}

export function recordPaidOrder(reference, contactEmail, referral, coupon) {
  const email = emailAddress(contactEmail)
  if (!email || !/^[\w-]{1,80}$/.test(reference)) throw new Error("Provide a confirmed order reference and the buyer’s email.")

  return transaction((connection) => {
    const duplicate = connection.prepare(`
      SELECT buyers.email, buyers.referral_code FROM paid_orders
      JOIN buyers ON buyers.id = paid_orders.buyer_id WHERE reference = ?
    `).get(reference)
    if (duplicate) {
      if (duplicate.email !== email) throw new Error("This reference belongs to another buyer.")
      return { reference, referral: duplicate.referral_code, alreadyRecorded: true }
    }

    let buyer = connection.prepare("SELECT id, referral_code FROM buyers WHERE email = ?").get(email)
    let accessKey
    if (!buyer) {
      accessKey = `RD-${secret()}`
      const referralValue = code("RUSH")
      const result = connection.prepare("INSERT INTO buyers (email, access_hash, referral_code) VALUES (?, ?, ?)").run(email, hash(accessKey), referralValue)
      buyer = { id: result.lastInsertRowid, referral_code: referralValue }
    }

    const source = referral ? connection.prepare(`
      SELECT id FROM buyers WHERE referral_code = ? AND id != ?
      AND EXISTS (SELECT 1 FROM paid_orders WHERE buyer_id = buyers.id)
    `).get(referralCode(referral), buyer.id) : null
    if (referral && !source) throw new Error("The referral must belong to another verified buyer.")

    connection.prepare("INSERT INTO paid_orders (reference, buyer_id, referred_by) VALUES (?, ?, ?)").run(reference, buyer.id, source?.id ?? null)

    if (coupon) {
      const used = connection.prepare("UPDATE unboxings SET redeemed_by = ? WHERE coupon_code = ? AND redeemed_by IS NULL").run(reference, unboxingCouponCode(coupon))
      if (!used.changes) throw new Error("That coupon is invalid or has already been redeemed.")
    }

    return { reference, referral: buyer.referral_code, ...(accessKey ? { accessKey } : {}) }
  })
}

export function rotateBuyerKey(contactEmail) {
  const email = emailAddress(contactEmail)
  if (!email) throw new Error("Provide the buyer’s email.")
  return transaction((connection) => {
    const buyer = connection.prepare(`
      SELECT id FROM buyers WHERE email = ?
      AND EXISTS (SELECT 1 FROM paid_orders WHERE buyer_id = buyers.id)
    `).get(email)
    if (!buyer) throw new Error("No verified buyer was found.")
    const accessKey = `RD-${secret()}`
    connection.prepare("UPDATE buyers SET access_hash = ? WHERE id = ?").run(hash(accessKey), buyer.id)
    connection.prepare("DELETE FROM buyer_sessions WHERE buyer_id = ?").run(buyer.id)
    return { accessKey }
  })
}
