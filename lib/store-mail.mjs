export function storeMailReady() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RUSH_EMAIL_FROM)
}

/** @param {{to:string,subject:string,text:string}} message */
export async function sendStoreMail(message) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RUSH_EMAIL_FROM
  if (!apiKey || !from) throw new Error("Store email is unavailable.")
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text }),
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error("Store email could not be sent.")
}
