/* ==========================================================================
   ThrHIVE: EVENT DETAILS
   --------------------------------------------------------------------------
   This is the ONLY file you need to touch to update the event info.

   Any field left as `null` shows on the site as a locked
   "CLASSIFIED / DROPPING SOON" card. Fill it in and the card unlocks
   automatically. Same for the countdown: set `date` and the scrambling
   digits turn into a live countdown + an "Add to calendar" button.
   ========================================================================== */

window.THRHIVE = {
  /* --- The big one ------------------------------------------------------ */
  // ISO date-time WITH the Utah offset, e.g. "2027-01-23T08:00:00-07:00"
  // (Mountain Standard Time is -07:00, Mountain Daylight Time is -06:00)
  date: null,
  // How long the event runs, used for the calendar invite
  durationHours: 6,
  // Optional friendly label shown on the WHEN card, e.g. "Sat · Jan 23 · 8AM"
  dateLabel: null,

  /* --- The intel cards -------------------------------------------------- */
  // Each one: null = locked. Otherwise { value: "BIG TEXT", detail: "small text" }
  where: null,     // e.g. { value: "Salty Hive CrossFit", detail: "4050 S Howick St, SLC" }
  format: null,    // e.g. { value: "Teams of 2", detail: "3 workouts, 1 day" }
  who: null,       // e.g. { value: "RX · INT · Rookie", detail: "Men's, Women's & Masters 35+" }
  cost: null,      // e.g. { value: "$149 / team", detail: "Spots capped at 60 teams" }
  why: null,       // e.g. { value: "Funding ____", detail: "Where every dollar goes" }

  /* --- Calls to action -------------------------------------------------- */
  // Paste the registration link (Competition Corner, etc.) to light up
  // the big REGISTER button everywhere on the page.
  registerUrl: null,

  /* --- Gym info (already filled in) ------------------------------------- */
  announcedOn: "2026-11-05",
  youtubeId: "nTL6EOq-iPo",
  instagram: "https://www.instagram.com/saltyhivecrossfit/",
  youtubeChannel: "https://www.youtube.com/@saltyhivecrossfit8588",
  website: "https://www.saltyhivecrossfit.com/",
  phone: "8014490478",
  email: "justin@saltyhivecrossfit.com",
  address: "4050 S Howick St, Salt Lake City, UT 84107",
};
