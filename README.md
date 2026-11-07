# ThrHIVE · Salty Hive CrossFit

The site for **ThrHIVE**, Salty Hive CrossFit's new 501(c)(3) nonprofit that brings
free CrossFit training to drug and alcohol recovery programs in Salt Lake, and for
its kickoff fundraiser:

- **The Liftoff**: Friday, Dec 11, 2026
- **The first annual Thrive Throwdown**: Saturday, Dec 12, 2026

([Watch the announcement](https://youtube.com/shorts/nTL6EOq-iPo))

It's a static site: plain HTML, CSS and JavaScript, with no build step and no
dependencies. Open `index.html` in a browser, or host the folder anywhere.

## Updating the site

Everything that will change lives in **`js/event.config.js`**.

| Field | What it does |
| --- | --- |
| `countdownTo`, `timeTBA`, `countdownLabel` | The hero countdown. It currently counts to the start of Dec 12. Set the real start time once it's announced. |
| `calendar` | Events in the **Save Dec 11–12** calendar file. Dates alone give all-day events. Add `start`/`end` times once they're known. |
| `intel` | The Throwdown intel cards. A card with `value: null` shows as locked **CLASSIFIED**. Give it a `value` (and an optional `detail`) to unlock it. |
| `registerUrl` | Shows a **Register now** button above the early-list form. |
| `giving.links` | Checkout pages for `monthly`, `yearly` and `once`. Until a link is set, that button collects a pledge (name + email) instead. |
| `giving.amountParam` | If your checkout page reads the amount from its URL (e.g. `?amount=25`), put the parameter name here. |
| `giving.swarm`, `giving.once` | The giving tiers and their names. Swarm amounts are per month; yearly is 12×. |
| `giving.programCost` | What one 12-week program costs ($4,000). All the impact math on the page comes from this. |
| `programs` | The honeycomb tracker. Update `raised` as money comes in. |
| `backend` | Where sign-ups, pledges and partner inquiries are saved (see below). |

## Giving: the Swarm, Pollinators and the Apiary

- **The Swarm** is the monthly or yearly giving community: 5 for Thrive ($5), Worker Bee ($25), Honey Maker ($50), Hive Keeper ($100).
- **Pollinators** give one time: Bloom ($25), Comb Builder ($100), Fund a Week ($333), Fund a Month ($1,333).
- **The Apiary** is for businesses and major donors: Program Sponsor ($4,000), Year-Round Sponsor ($16,000), Throwdown Partner.

The site doesn't take payments itself. Point `giving.links` at checkout pages on a
nonprofit giving platform that supports monthly, yearly and one-time gifts and
emails tax receipts.

## Where form submissions go

With `backend` left `null`, each form opens the visitor's email app with a
pre-filled message to the gym, so nothing is lost.

To save submissions in a database instead:

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
   That creates `signups` and `pledges` tables the public can insert into but
   never read.
2. Put the project URL and its publishable key into `backend`.
3. View or export submissions in the Supabase dashboard (Table Editor → Export).

## Putting it online

**Vercel:** live at https://shcf.vercel.app. Every push to the connected branch
redeploys automatically. (Framework preset "Other", no build command.)

**GitHub Pages:** go to **Settings → Pages**, choose **Deploy from a branch**,
pick the branch, and select the root folder (`/`).

If the site moves to a custom domain, update the `og:url` and `og:image` meta tags
in `index.html` to match. Some apps only show the link preview image when the URL
is absolute.

## What's inside

```
index.html            page markup
css/styles.css        all styles (brand colors are CSS variables at the top)
js/event.config.js    ← dates, intel, giving tiers, links: edit this one
js/main.js            interactions: honeycomb hero, countdown, intel cards,
                      giving widget, forms, program tracker, calendar invite,
                      share button, scroll gallery, quotes, hype meter
supabase/schema.sql   optional database for sign-ups, pledges and partners
assets/img/           Salty Hive photos (by @bhofferphoto) and the logo
assets/og-image.jpg   the link-preview image for texts and social posts
assets/favicon.svg
```

Brand: neon hive yellow `#e8f52a` on ink `#0a0a09`. Fonts are Anton,
Epilogue and Source Code Pro (the same as saltyhivecrossfit.com), plus
Kaushan Script for the "salty" script.

Every effect respects the visitor's **reduce motion** setting.
