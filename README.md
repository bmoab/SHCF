# ThrHIVE · Salty Hive CrossFit

The hype site for **ThrHIVE**, the event Salty Hive CrossFit announced on
Nov 5, 2026 ([watch the announcement](https://youtube.com/shorts/nTL6EOq-iPo)).

It's a static site: plain HTML, CSS and JavaScript, with no build step and no
dependencies. Open `index.html` in a browser, or host the folder anywhere.

## Updating the event details

Everything event-specific lives in **`js/event.config.js`**. While a field is
`null`, the site shows it as a locked **CLASSIFIED / DROPPING SOON** card.
Fill a field in and that card unlocks.

| Field | What it does |
| --- | --- |
| `date` | Turns the scrambled "date classified" counter into a live countdown and shows an **Add to calendar** button. Use the Utah offset, e.g. `"2027-01-23T08:00:00-07:00"`. |
| `dateLabel` | Optional friendly label for the WHEN card, e.g. `"Sat · Jan 23 · 8AM"`. |
| `where`, `format`, `who`, `cost`, `why` | Each takes `{ value: "BIG TEXT", detail: "small text" }` and unlocks its intel card. |
| `registerUrl` | Shows **Register now** and points every "I'm In" button at registration. |

The Hosted By and Announced cards are always unlocked.

## Putting it online (GitHub Pages)

1. On GitHub, go to **Settings → Pages**.
2. Under **Source**, pick **Deploy from a branch**, choose the branch, and
   select the root folder (`/`).
3. Your site will be live at `https://<user>.github.io/<repo>/` within a
   minute or so.

Once the URL is known, change the `og:image` meta tag in `index.html` to the
full URL (e.g. `https://…/assets/og-image.jpg`). Some apps only show the
link preview image when the URL is absolute.

## What's inside

```
index.html            page markup
css/styles.css        all styles (brand colors are CSS variables at the top)
js/event.config.js    ← event details: edit this one
js/main.js            interactions: honeycomb hero, countdown, intel cards,
                      scroll gallery, quotes, hype meter, calendar invite
assets/img/           Salty Hive photos (by @bhofferphoto) and the logo
assets/og-image.jpg   the link-preview image for texts and social posts
assets/favicon.svg
```

Brand: neon hive yellow `#e8f52a` on ink `#0a0a09`. Fonts are Anton,
Epilogue and Source Code Pro (the same as saltyhivecrossfit.com), plus
Kaushan Script for the "salty" script.

Every effect respects the visitor's **reduce motion** setting.
