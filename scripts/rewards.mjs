import { parseArgs } from "node:util"
import { existsSync } from "node:fs"
import { loadEnvFile } from "node:process"
import { approveUnboxing, declineUnboxing, pendingUnboxings, recordPaidOrder, rotateBuyerKey } from "../lib/rewards-store.mjs"
import { sendStoreMail, storeMailReady } from "../lib/store-mail.mjs"

if (existsSync(".env.local")) loadEnvFile(".env.local")

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { referral: { type: "string" }, coupon: { type: "string" } },
})
const [command, first, second, third] = positionals

try {
  switch (command) {
    case "pending":
      console.log(JSON.stringify(pendingUnboxings(), null, 2))
      break
    case "approve": {
      const reward = approveUnboxing(Number(first), Number(second), Number(third))
      let delivery = "Send this coupon to the recipient by email."
      if (storeMailReady()) {
        try {
          await sendStoreMail({
            to: reward.email,
            subject: "Your Rush District unboxing coupon",
            text: `Your unboxing was approved. Use ${reward.coupon} at checkout for ₹${reward.discount} off your cans.`,
          })
          delivery = "Coupon emailed."
        } catch {
          delivery = "Email delivery failed. Send this coupon to the recipient manually."
        }
      }
      console.log({ ...reward, delivery })
      break
    }
    case "decline":
      declineUnboxing(Number(first))
      console.log("Submission declined.")
      break
    case "record-paid":
      console.log(recordPaidOrder(first ?? "", second, values.referral, values.coupon))
      break
    case "rotate-key":
      console.log(rotateBuyerKey(first))
      break
    default:
      console.log("Use pending, approve <id> <verified-views> <discount-rupees>, decline <id>, record-paid <reference> <buyer-email> [--referral <code>] [--coupon <code>], or rotate-key <buyer-email>.")
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "The operation failed.")
  process.exitCode = 1
}
