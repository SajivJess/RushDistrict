import type { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"
import { SkipLink } from "@/components/layout/skip-link"
import "./globals.css"
import "./launch.css"
import "./experience.css"

export const metadata: Metadata = {
  title: { default: "Rush District | Monster Energy Flavours & Packs", template: "%s | Rush District" },
  description: "Shop four Monster Energy flavours. Get Solo cans for ₹249 or choose a Collectors Case or Gift Box.",
  icons: { icon: { url: "/media/logo-96.webp", type: "image/webp" } },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className="dark">
      <body>
        <SkipLink />
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
