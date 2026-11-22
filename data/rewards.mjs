export const minUnboxingViews = 1000
export const referralStorageKey = "rush-district-referral"

/** @param {unknown} value */
export function referralCode(value) {
  const code = typeof value === "string" ? value.trim().toUpperCase() : ""
  return /^RUSH-[0-9A-F]{12}$/.test(code) ? code : null
}

/** @param {unknown} value */
export function unboxingCouponCode(value) {
  const code = typeof value === "string" ? value.trim().toUpperCase() : ""
  return /^UNBOX-[0-9A-F]{12}$/.test(code) ? code : null
}
