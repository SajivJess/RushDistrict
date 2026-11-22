const number = process.env.WHATSAPP_BUSINESS_NUMBER?.replace(/\D/g, "") ?? ""

export const whatsappNumber = /^[1-9]\d{7,14}$/.test(number) ? number : ""

const handle = (process.env.RUSH_INSTAGRAM_HANDLE ?? "").trim().replace(/^@/, "")

export const instagramHandle = /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : ""
