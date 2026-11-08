# ThrHIVE

**CrossFit for the communities that need it most.**

ThrHIVE is a 501(c)(3) nonprofit that partners local programs serving underserved
communities with CrossFit gyms, and funds 12-week programs so they're free for
participants. It's a separate organization from Salty Hive CrossFit, its founding
partner gym.

First fundraiser: **The Liftoff** (Fri, Dec 11) and the **Thrive Throwdown**
(Sat, Dec 12), hosted by Salty Hive CrossFit.

Live at https://shcf.vercel.app. Every push to the connected branch redeploys.

## Editing the site

Everything that changes lives in **`js/event.config.js`**:

| Field | What it does |
| --- | --- |
| `countdownTo`, `countdownLabel` | Hero countdown. Set the real start time when it's announced. |
| `calendar` | Events in the "Save Dec 11–12" calendar file. |
| `details` | Throwdown detail cards. `value: null` shows "Coming soon". |
| `registerUrl` | Shows a Register button once registration is open. |
| `giving.links` | Checkout pages for monthly, yearly and one-time gifts. Until set, the Give button collects a pledge. |
| `giving.amountParam` | Name of the URL parameter your checkout uses for the amount, if any. |
| `giving.swarm`, `giving.once` | Giving tiers and names. Swarm amounts are monthly; yearly is 12×. |
| `giving.programCost` | Cost of one 12-week program ($4,000). The giving math uses this. |
| `programs` | The honeycomb tracker. Update `raised` as money comes in. |
| `backend` | Where form submissions are saved (see below). |
| `email`, `phone` | Contact details used by the forms and footer. |

## Forms

Three forms: Throwdown sign-up, giving pledge, and partner inquiry.

With `backend` left `null`, each form opens the visitor's email app with a
pre-filled message. To save submissions in a database instead, create a Supabase
project, run `supabase/schema.sql` in its SQL editor, then put the project URL
and publishable key into `backend`.

## Files

```
index.html            page markup
css/styles.css        styles (colors are CSS variables at the top)
js/event.config.js    ← edit this one
js/main.js            interactions
supabase/schema.sql   optional database for form submissions
assets/               photos, link-preview image, favicon
```
