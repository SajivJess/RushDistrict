# Rush District

Rush District is an independent Monster Energy storefront prototype serving Kanyakumari District.

## Run locally

Use Node.js 22.13 or later with the built-in SQLite module. Hosting the rewards database requires a persistent writable directory.

```sh
npm ci
npm run dev
```

Open [Rush District](http://localhost:3000). Run `npm run build` to check the production build.

## Launch catalogue and packs

The four 500 ml cans are masked from the source product photos in `public/media/1.jpeg` through `4.jpeg`, which stay in the repo; the site serves optimized transparent `can-*.webp` renders site-wide. The hero includes a pointer-lit grid, a 3D flavour carousel and a top-three leaderboard. The full-width launch offer banner sits below the four flavours. The collectibles glide continuously and open a detail card when selected. Reduced-motion preferences keep the row still and allow manual horizontal scrolling.

| Pack | Selection | Included |
| --- | --- | --- |
| Solo | One can | Order collectible |
| Collectors Case | Three or more cans | Special casing and one collectible per can |
| Gift Box | Any three or five cans | Gift packaging, optional custom text card, keychain, sticker and collectible |

Solo costs ₹249 per can during the website launch offer, with ₹350 displayed as the reference price. The Collectors Case costs ₹400 per can. Gift Boxes cost ₹999 for three cans or ₹1,599 for five cans. Orders of ₹499 or more receive free local delivery and a sticker. A sticker included in a Gift Box counts toward that order’s sticker reward.

The ten gallery slots in `data/collectibles.ts` have provisional Common, Uncommon and Rare tiers. Add a name, image path and description to each slot when the product photos and details are available.

## Customer accounts

The account and delivery profile are stored in the rewards SQLite database. Verified customers can save their name, mobile number, street address, locality and PIN for checkout. A recorded paid order is required for referrals.

Enable sign-in through `.env.local` using the keys in `.env.example`.

- **Email codes** use `RESEND_API_KEY` and a sender address verified in Resend as `RUSH_EMAIL_FROM`. The server emails six-digit codes that expire after ten minutes and limits requests and verification attempts.
- **Google** uses `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `RUSH_SITE_ORIGIN`. Register the exact redirect URI `<RUSH_SITE_ORIGIN>/api/account/google/callback` in the Google Web OAuth client. Google accounts with an external, non-hosted email verify ownership through the email-code flow.

## Checkout and leaderboard

The browser stores the bag and simulates checkout. Gift card text is stored with its pack in the bag. `/api/delivery-quote` validates the pack quantities, selected Kanyakumari locality and `629xxx` PIN format. It calculates the ₹50 local fee for orders below ₹499. Checkout requests this quote after address entry and displays the total before simulated payment. The endpoint receives locality and PIN along with pack quantities. Street address and contact fields stay in the browser for this demo.

`/leaderboard` ranks collectors by can quantity with filters for locality and flavour. Demo orders can contribute using an opt-in alias at checkout. Ranking data is stored in the current browser and includes the alias, locality and counts by flavour. Street addresses, contact details and gift messages stay off the board. A shared live leaderboard needs a verified order backend and a persistent customer identifier.

To enable a WhatsApp ordering draft, copy `.env.example` to `.env.local`, set `WHATSAPP_BUSINESS_NUMBER` to the merchant’s number including country code, and restart or rebuild.

## Community rewards

The server stores verified-buyer accounts and unboxing reviews in `.rush-data/rewards.sqlite`. Set `RUSH_REWARDS_DB` to a different absolute path if needed. Use the same database path for the site and the operator commands.

Unboxing rewards run through Instagram: customers post a public Rush District Reel and tag the store. Set `RUSH_INSTAGRAM_HANDLE` in `.env.local` so the rewards card links to the profile. Tagging is reviewed manually; Instagram posts do not submit through the website and do not generate coupons automatically.

The `pending`, `approve` and `decline` commands below only apply to unboxing videos submitted before the Instagram change. For those legacy submissions, confirm at least 1,000 visible views before granting a coupon. Choose the whole-rupee coupon value at approval. The approval command emails the coupon when store email is configured. Otherwise, it returns the coupon and recipient for manual delivery. The quote applies the coupon to cans and bases the free-delivery threshold on the subtotal before the coupon.

```sh
npm run rewards -- pending
npm run rewards -- approve 1 1200 75
npm run rewards -- decline 2
```

Record a paid order after independently confirming payment. The matching verified email account automatically receives the referral link. The command also issues a private buyer key for buyers using the existing key-based flow. Demo checkout leaves paid-order records and coupons untouched. For an externally paid order with a coupon or referral, pass the matching option. Recording marks an approved coupon as redeemed. Rotation revokes the old buyer key and key-based sessions.

```sh
npm run rewards -- record-paid ORDER-123 buyer@example.com
npm run rewards -- record-paid ORDER-124 friend@example.com --referral RUSH-000000000000 --coupon UNBOX-000000000000
npm run rewards -- rotate-key buyer@example.com
```

## Hosting on Netlify

`netlify.toml` is included. Import the repo in Netlify and the Next.js adapter is picked up automatically — no static export needed; the storefront demo is served as a Next.js app.

Do not enable Google/email accounts or live coupon/referral features on Netlify until the SQLite data (sessions, OTP challenges, accounts and rewards) is moved to a managed persistent database, or the backend is hosted somewhere with a persistent writable disk. Pointing `RUSH_REWARDS_DB` at `/tmp` is not a fix. For the storefront demo, leave Google and email provider secrets unset; the bag, browsing, and simulated checkout remain available. Provider secret setup and the exact redirect URI remain as described in the Customer accounts section.
