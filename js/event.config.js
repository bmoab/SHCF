/* ==========================================================================
   ThrHIVE: SITE DETAILS
   --------------------------------------------------------------------------
   This is the ONLY file you need to touch to update the site.

   - Any intel card with `value: null` shows as a locked
     "CLASSIFIED / DROPPING SOON" card. Fill it in and it unlocks.
   - Set `registerUrl` / `donateUrl` and the Register / Donate buttons
     light up everywhere on the page.
   - Set `goal` (and `raised`) to switch the honeycomb meter from
     "goal reveal coming" to a live fundraising tracker.
   ========================================================================== */

window.THRHIVE = {
  /* --- Countdown --------------------------------------------------------- */
  // Thrive Throwdown day. When the start time is announced, change this to
  // e.g. "2026-12-12T08:00:00-07:00" and set timeTBA to false.
  countdownTo: "2026-12-12T00:00:00-07:00",
  timeTBA: true,
  countdownLabel: "Thrive Throwdown · Sat, Dec 12",

  /* --- Calendar invite (the "Add to calendar" button) -------------------- */
  // Dates only = all-day events. Add start/end ISO times once they're known,
  // e.g. { title: "...", start: "2026-12-12T08:00:00-07:00", end: "2026-12-12T15:00:00-07:00" }
  calendar: [
    { title: "The Liftoff @ Salty Hive CrossFit", date: "2026-12-11" },
    { title: "Thrive Throwdown @ Salty Hive CrossFit 🐝", date: "2026-12-12" },
  ],

  /* --- Throwdown intel cards ---------------------------------------------- */
  // value: big text, detail: small text. value: null = locked card + teaser.
  intel: [
    { label: "When", value: "Dec 11–12", detail: "Liftoff Friday · Throwdown Saturday" },
    { label: "Where", value: "Salty Hive CrossFit", detail: "4050 S Howick St · Salt Lake City" },
    { label: "The Cause", value: "Funding ThrHIVE", detail: "Free CrossFit for local recovery programs" },
    { label: "Start Time", value: null, teaser: "Times dropping soon." },
    { label: "The Format", value: null, teaser: "What you'll be doing. Classified." },
    { label: "Divisions", value: null, teaser: "Who's in. Stay tuned." },
    { label: "Entry", value: null, teaser: "Price drops with the details." },
    { label: "Sign-ups", value: null, teaser: "Registration opens soon." },
  ],

  /* --- Calls to action --------------------------------------------------- */
  registerUrl: null, // Throwdown registration link (Competition Corner, etc.)
  donateUrl: null,   // ThrHIVE donation page

  /* --- Fundraising goal (honeycomb meter) -------------------------------- */
  goal: null,   // e.g. 25000
  raised: null, // e.g. 6200

  /* --- Gym info (already filled in) ------------------------------------- */
  announcedOn: "2026-11-05",
  youtubeId: "nTL6EOq-iPo",
  instagram: "https://www.instagram.com/saltyhivecrossfit/",
  phone: "8014490478",
  email: "justin@saltyhivecrossfit.com",
  address: "4050 S Howick St, Salt Lake City, UT 84107",
};
