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
| `registerUrl` | Shows **Register now** and points every "I'm In" button at registration. |
| `donateUrl` | Shows **Donate to ThrHIVE** and points the Donate tile there. Until then, "Ask how to give" opens a text to the gym. |
| `goal`, `raised` | Turns the honeycomb meter from "Goal reveal coming soon" into a live tracker, e.g. `goal: 25000, raised: 6200`. |

## Putting it online

**Vercel:** import the repo as a new project. The framework preset is "Other",
with no build command and the output directory left as the root.

**GitHub Pages:** go to **Settings → Pages**, choose **Deploy from a branch**,
pick the branch, and select the root folder (`/`).

Once the final URL is known, change the `og:image` meta tag in `index.html` to
the full URL (e.g. `https://…/assets/og-image.jpg`). Some apps only show the link
preview image when the URL is absolute.

## What's inside

```
index.html            page markup
css/styles.css        all styles (brand colors are CSS variables at the top)
js/event.config.js    ← dates, intel, links, fundraising goal: edit this one
js/main.js            interactions: honeycomb hero, countdown, intel cards,
                      fundraising meter, calendar invite, share button,
                      scroll gallery, quotes, hype meter
assets/img/           Salty Hive photos (by @bhofferphoto) and the logo
assets/og-image.jpg   the link-preview image for texts and social posts
assets/favicon.svg
```

Brand: neon hive yellow `#e8f52a` on ink `#0a0a09`. Fonts are Anton,
Epilogue and Source Code Pro (the same as saltyhivecrossfit.com), plus
Kaushan Script for the "salty" script.

Every effect respects the visitor's **reduce motion** setting.
