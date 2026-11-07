/* ==========================================================================
   ThrHIVE: SITE DETAILS
   --------------------------------------------------------------------------
   This is the ONLY file you need to touch to update the site.

   - Any intel card with `value: null` shows as a locked
     "CLASSIFIED / DROPPING SOON" card. Fill it in and it unlocks.
   - Paste donation links into `giving.links` and the Give buttons go
     straight to checkout. Until then they collect pledges.
   - Update `programs[].raised` as money comes in and the honeycomb
     tracker fills.
   ========================================================================== */

window.THRHIVE = {
  /* --- Countdown --------------------------------------------------------- */
  // Thrive Throwdown day. When the start time is announced, change this to
  // e.g. "2026-12-12T08:00:00-07:00" and set timeTBA to false.
  countdownTo: "2026-12-12T00:00:00-07:00",
  timeTBA: true,
  countdownLabel: "Thrive Throwdown · Sat, Dec 12",

  /* --- Calendar invite (the "Save Dec 11–12" button) --------------------- */
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
    { label: "Registration", value: null, teaser: "Get on the early list below." },
  ],

  // Official Throwdown registration link (Competition Corner, Zeffy, etc.).
  // When set, a big REGISTER button appears above the early-list form.
  registerUrl: null,

  /* --- Giving ------------------------------------------------------------ */
  giving: {
    programCost: 4000, // what one 12-week ThrHIVE program costs
    programWeeks: 12,

    // Checkout page for each way to give (Zeffy, Givebutter, Donorbox,
    // Stripe Payment Links...). Leave null and the button collects a pledge
    // (name + email) so you can follow up when online giving is live.
    links: { monthly: null, yearly: null, once: null },
    // If your checkout accepts the amount in its URL (e.g. ?amount=25),
    // put the parameter name here and the chosen amount carries over.
    amountParam: null,

    // The Swarm: recurring tiers. `amount` is per month; yearly = 12x.
    swarm: [
      { name: "5 for Thrive", amount: 5, line: "Where every swarm starts." },
      { name: "Worker Bee", amount: 25, line: "The steady engine of the Hive." },
      { name: "Honey Maker", amount: 50, line: "Turns sweat into something sweet." },
      { name: "Hive Keeper", amount: 100, line: "Keeps the whole thing running." },
    ],

    // One-time gifts.
    once: [
      { name: "Bloom", amount: 25, line: "Small gift. Real growth." },
      { name: "Comb Builder", amount: 100, line: "Builds what the Hive stands on." },
      { name: "Fund a Week", amount: 333, line: "One full week of a program." },
      { name: "Fund a Month", amount: 1333, line: "Four weeks, start to finish." },
    ],
  },

  /* --- Program tracker (the honeycomb meter) ----------------------------- */
  // One entry per 12-week program. Update `raised` as donations come in.
  programs: [
    { name: "Program 01", goal: 4000, raised: null, status: "Funding now" },
  ],

  /* --- Where form submissions go ----------------------------------------- */
  // Supabase project URL + publishable key (see supabase/schema.sql).
  // Leave null and forms open a pre-filled email to the gym instead.
  backend: { supabaseUrl: null, supabaseKey: null },

  /* --- Gym info (already filled in) ------------------------------------- */
  announcedOn: "2026-11-05",
  youtubeId: "nTL6EOq-iPo",
  instagram: "https://www.instagram.com/saltyhivecrossfit/",
  phone: "8014490478",
  email: "justin@saltyhivecrossfit.com",
  address: "4050 S Howick St, Salt Lake City, UT 84107",
};
