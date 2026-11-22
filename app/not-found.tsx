import Link from "next/link"

export default function NotFound() {
  return (
    <main id="main-content" className="container content-page">
      <h1 className="display page-title">PAGE NOT FOUND</h1>
      <p className="page-intro">This page may have moved or the product may have left the collection.</p>
      <Link href="/products" className="button primary">Browse the collection</Link>
    </main>
  )
}
