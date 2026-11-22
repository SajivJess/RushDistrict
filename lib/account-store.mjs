import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto"
import { storeDatabase, storeTransaction, normaliseStoreEmail, sessionLifetime } from "./rewards-store.mjs"

export const accountCookie = "rush-account"
export const otpCookie = "rush-otp"
export const otpLifetime = 10 * 60

const maxAttempts = 5
const emailWindow = 15 * 60

function digest(value) {
  return createHash("sha256").update(value).digest("hex")
}

function token() {
  return randomBytes(24).toString("base64url")
}

function now() {
  return Math.floor(Date.now() / 1000)
}

/** @param {unknown} value */
export function createEmailChallenge(value) {
  const email = normaliseStoreEmail(value)
  if (!email) return { error: "Enter a valid email address.", status: 400 }
  return storeTransaction((database) => {
    const issuedAt = now()
    database.prepare("DELETE FROM email_challenges WHERE issued_at <= ?").run(issuedAt - emailWindow)
    const issuance = database.prepare(`
      SELECT count(*) AS count, max(issued_at) AS last_issued
      FROM email_challenges WHERE email = ?
    `).get(email)
    if (Number(issuance?.count) >= 3 || Number(issuance?.last_issued) > issuedAt - 60) {
      return { error: "Please wait before requesting another code.", status: 429 }
    }

    const challenge = token()
    const code = String(randomInt(1_000_000)).padStart(6, "0")
    database.prepare(`
      INSERT INTO email_challenges (token_hash, email, code_hash, issued_at)
      VALUES (?, ?, ?, ?)
    `).run(digest(challenge), email, digest(challenge + code), issuedAt)
    return { email, challenge, code }
  })
}

/** @param {string} challenge */
export function cancelEmailChallenge(challenge) {
  storeDatabase().prepare("UPDATE email_challenges SET consumed = 1 WHERE token_hash = ?").run(digest(challenge))
}

/** @param {string | undefined} challenge @param {unknown} input */
export function verifyEmailChallenge(challenge, input) {
  if (!challenge || !/^[A-Za-z0-9_-]{32}$/.test(challenge) || typeof input !== "string" || !/^\d{6}$/.test(input)) return null
  return storeTransaction((database) => {
    const key = digest(challenge)
    const row = database.prepare(`
      SELECT email, code_hash FROM email_challenges
      WHERE token_hash = ? AND issued_at > ? AND attempts < ? AND consumed = 0
    `).get(key, now() - otpLifetime, maxAttempts)
    if (!row) return null

    const expected = Buffer.from(String(row.code_hash), "hex")
    const actual = Buffer.from(digest(challenge + input), "hex")
    if (!timingSafeEqual(expected, actual)) {
      database.prepare("UPDATE email_challenges SET attempts = attempts + 1 WHERE token_hash = ?").run(key)
      return null
    }

    database.prepare("UPDATE email_challenges SET consumed = 1 WHERE email = ?").run(row.email)
    return String(row.email)
  })
}

/** @param {string} email @param {string | null} [googleSubject] */
export function openCustomerAccount(email, googleSubject = null) {
  const normalized = normaliseStoreEmail(email)
  if (!normalized) return null
  return storeTransaction((database) => {
    const googleAccount = googleSubject
      ? database.prepare("SELECT id, email FROM customer_accounts WHERE google_subject = ?").get(googleSubject)
      : null
    if (googleAccount && googleAccount.email !== normalized) return null

    const current = database.prepare("SELECT id, google_subject FROM customer_accounts WHERE email = ?").get(normalized)
    if (googleSubject && current?.google_subject && current.google_subject !== googleSubject) return null

    let accountId = current?.id
    if (!current) {
      accountId = database.prepare("INSERT INTO customer_accounts (email, google_subject) VALUES (?, ?)").run(normalized, googleSubject).lastInsertRowid
    } else if (googleSubject && !current.google_subject) {
      database.prepare("UPDATE customer_accounts SET google_subject = ? WHERE id = ?").run(googleSubject, current.id)
    }

    const session = token()
    const issuedAt = now()
    database.prepare("DELETE FROM customer_sessions WHERE expires_at <= ?").run(issuedAt)
    database.prepare("INSERT INTO customer_sessions (token_hash, account_id, expires_at) VALUES (?, ?, ?)").run(digest(session), accountId, issuedAt + sessionLifetime)
    return session
  })
}

/** @param {string | undefined} session */
export function customerProfile(session) {
  if (!session || !/^[A-Za-z0-9_-]{32}$/.test(session)) return null
  const row = storeDatabase().prepare(`
    SELECT account.id, account.email, account.name, account.phone, account.address, account.locality, account.postcode
    FROM customer_sessions sessions JOIN customer_accounts account ON account.id = sessions.account_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(digest(session), now())
  if (!row) return null
  const profile = {
    email: String(row.email),
    name: String(row.name),
    phone: String(row.phone),
    address: String(row.address),
    locality: String(row.locality),
    postcode: String(row.postcode),
  }
  return { id: Number(row.id), profile, complete: Object.values(profile).every(Boolean) }
}

/** @param {number} id @param {{name:string,phone:string,address:string,locality:string,postcode:string}} profile */
export function saveCustomerAddress(id, { name, phone, address, locality, postcode }) {
  storeDatabase().prepare(`
    UPDATE customer_accounts SET name = ?, phone = ?, address = ?, locality = ?, postcode = ? WHERE id = ?
  `).run(name, phone, address, locality, postcode, id)
}

/** @param {string | undefined} session */
export function closeCustomerSession(session) {
  if (session) storeDatabase().prepare("DELETE FROM customer_sessions WHERE token_hash = ?").run(digest(session))
}
