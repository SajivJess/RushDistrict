import type { Metadata } from "next"
import { Leaderboard } from "@/components/vault/leaderboard"

export const metadata: Metadata = { title: "Collector Leaderboard" }

export default function LeaderboardPage() {
  return (
    <section className="container content-page">
      <h1 className="display page-title">COLLECTOR LEADERBOARD</h1>
      <p className="page-intro">See who’s collecting the most cans in your area. Filter by locality or track a favourite flavour.</p>
      <Leaderboard />
    </section>
  )
}
