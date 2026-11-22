import { CartProvider } from "@/context/vault-cart"
import { VaultHeader, VaultFooter } from "@/components/vault/shell"

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <VaultHeader />
      <main id="main-content">{children}</main>
      <VaultFooter />
    </CartProvider>
  )
}
