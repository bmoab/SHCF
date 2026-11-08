/* ==========================================================================
   ThrHIVE: SITE DETAILS
   This is the only file you need to edit to update the site.
   ========================================================================== */

window.THRHIVE = {
  /* --- Countdown --------------------------------------------------------- */
  // When the start time is announced, change to e.g. "2026-12-12T08:00:00-07:00".
  countdownTo: "2026-12-12T00:00:00-07:00",
  countdownLabel: "Thrive Throwdown · Sat, Dec 12",

  /* --- "Save the date" calendar file ------------------------------------- */
  // Dates only = all-day events. Add start/end ISO times once they're known.
  calendar: [
    { title: "The Liftoff @ Salty Hive CrossFit", date: "2026-12-11" },
    { title: "Thrive Throwdown @ Salty Hive CrossFit", date: "2026-12-12" },
  ],

  /* --- Throwdown details ------------------------------------------------- */
  // value: null shows "Coming soon" with the teaser underneath.
  details: [
    { label: "When", value: "Dec 11–12", detail: "Liftoff Fri · Throwdown Sat" },
    { label: "Where", value: "Salty Hive CrossFit", detail: "4050 S Howick St, SLC" },
    { label: "Format", value: null, teaser: "Workouts and divisions soon." },
    { label: "Entry", value: null, teaser: "Pricing announced soon." },
  ],

  // Official registration link. When set, a REGISTER button appears.
  registerUrl: null,

  /* --- Giving ------------------------------------------------------------ */
  giving: {
    programCost: 4000, // one 12-week program
    programWeeks: 12,

    // Checkout pages from your giving platform. Leave null to collect pledges.
    links: { monthly: null, yearly: null, once: null },
    // If checkout reads the amount from the URL (e.g. ?amount=25), name it here.
    amountParam: null,

    // The Swarm: monthly amounts (yearly = 12x).
    swarm: [
      { name: "5 for Thrive", amount: 5 },
      { name: "Worker Bee", amount: 25 },
      { name: "Honey Maker", amount: 50 },
      { name: "Hive Keeper", amount: 100 },
    ],
    // One-time gifts.
    once: [
      { name: "First Flight", amount: 25 },
      { name: "Comb Builder", amount: 100 },
      { name: "Fund a Week", amount: 333 },
      { name: "Fund a Month", amount: 1333 },
    ],
  },

  /* --- Program tracker --------------------------------------------------- */
  // Update `raised` as donations come in.
  programs: [{ name: "Program 01", goal: 4000, raised: null }],

  /* --- Where form submissions go ----------------------------------------- */
  // Supabase URL + publishable key (see supabase/schema.sql).
  // Leave null and forms open a pre-filled email instead.
  backend: { supabaseUrl: null, supabaseKey: null },

  /* --- Contact ----------------------------------------------------------- */
  youtubeId: "nTL6EOq-iPo",
  email: "justin@saltyhivecrossfit.com",
  phone: "8014490478",
  address: "4050 S Howick St, Salt Lake City, UT 84107",
};
