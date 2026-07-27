// All demo data lives here. Nothing in this file talks to a network —
// swap this module out for real API calls when the backend is ready.

export const AVATARS = ["🦁", "🐯", "🦊", "🐺", "🐸", "🦅", "🐲", "🦂", "🐙", "🦈", "🐼", "🦉"];
export const VIBES = ["Safari", "Chakula", "Muziki", "Mazoezi", "Sanaa", "Vichekesho", "Teknolojia", "Mitindo"];
const NAMES = ["Zawadi", "Baraka", "Neema", "Juma", "Amani", "Faraja", "Kiptoo", "Wanjiru", "Otieno", "Achieng", "Mwangi", "Nakato"];

// Optional small credibility badges — not a game-rank ladder, just a light social signal.
const BADGES = [null, null, "verified", null, "rising", null, null, "top-creator", null, "verified", null, null];

function seedUsers(n) {
  return Array.from({ length: n }).map((_, i) => ({
    id: i + 1,
    name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : ""),
    handle: "@" + NAMES[i % NAMES.length].toLowerCase() + (i + 21),
    avatar: AVATARS[i % AVATARS.length],
    vibe: VIBES[i % VIBES.length],
    badge: BADGES[i % BADGES.length],
    followers: 200 + i * 37,
  }));
}

export const HEROES = [
  {
    id: 1,
    eyebrow: "Fahari ya Wiki",
    title: "Zawadi anaongoza ubao wa Flex",
    body: "Mfululizo wa siku 17 na bado anaendelea. Mfuate asikuachie nafasi.",
    icon: "ri-trophy-fill",
    gradient: "linear-gradient(135deg, var(--accent), var(--accent-2))",
  },
  {
    id: 2,
    eyebrow: "Changamoto",
    title: "Siku 21 za kuchora mfululizo",
    body: "Baraka hajakosa siku moja mwezi huu. Jiunge na changamoto ya wiki hii.",
    icon: "ri-brush-fill",
    gradient: "linear-gradient(135deg, var(--accent-lime), var(--accent-teal))",
  },
  {
    id: 3,
    eyebrow: "Advat kwa Wote",
    title: "Alika marafiki, mjenge klabu yenu",
    body: "Unda kikundi chako cha vibe na muwe wa kwanza kuonana kwenye Mlisho.",
    icon: "ri-group-fill",
    gradient: "linear-gradient(135deg, var(--accent-amber), var(--accent))",
  },
];

export const USERS = seedUsers(12);

export const ME = { name: "Wewe", handle: "@wewe", avatar: "🐧", vibe: "Upigaji Picha", badge: null };

export const ADS = [
  { brand: "SonicPesa", gradient: "linear-gradient(135deg, #232336, #37375a)", headline: "Jaza pochi yako kwa sekunde", body: "Tuma, pokea na toa pesa za simu, imejengwa kwa ajili ya Afrika Mashariki.", cta: "Pata App", url: "https://sonicpesa.co.tz" },
  { brand: "Kahawa Collective", gradient: "linear-gradient(135deg, var(--accent-lime), var(--accent-teal))", headline: "Kahawa ya asili, inafika ikiwa mbichi", body: "Jisajili upate mfuko wako wa kwanza kwa nusu bei.", cta: "Nunua sasa", url: "https://kahawacollective.co.tz" },
];

export const NOTIFS = [
  { id: 1, type: "like", uid: 2, text: "amependa chapisho lako", time: "dakika 12", unread: true },
  { id: 2, type: "follow", uid: 5, text: "amekufuata", time: "dakika 38", unread: true },
  { id: 3, type: "comment", uid: 1, text: 'ameandika maoni: "hii imenifurahisha siku yangu"', time: "saa 1", unread: true },
  { id: 4, type: "flex", uid: 7, text: "amevunja rekodi yako ya mfululizo wa machapisho", time: "saa 3", unread: false },
  { id: 5, type: "like", uid: 4, text: "na wengine 23 wamependa flex card yako", time: "saa 5", unread: false },
  { id: 6, type: "follow", uid: 9, text: "amekufuata", time: "siku 1", unread: false },
];

export const CONVOS = [
  {
    id: 1, uid: 0, unread: 2,
    messages: [
      { from: "them", text: "nimependa hiyo picha ya jua" },
      { from: "me", text: "asante! muda wa jua ndio ulifanya kazi yote" },
      { from: "them", text: "bado, hongera kwa muda mzuri" },
    ],
  },
  {
    id: 2, uid: 3, unread: 0,
    messages: [
      { from: "me", text: "unaweza kunitumia link ya hiyo playlist?" },
      { from: "them", text: "ninatuma sasa hivi" },
    ],
  },
  {
    id: 3, uid: 6, unread: 1,
    messages: [{ from: "them", text: "tukutane kuchora wikendi hii?" }],
  },
];

export const FLEX_CARDS = [
  { id: 1, title: "Mfululizo wa Kuchapisha", stat: "siku 17", icon: "ri-fire-fill", gradient: "linear-gradient(135deg, var(--accent), var(--accent-2))" },
  { id: 2, title: "Fahari ya Muumbaji", stat: "Ameangaziwa mara 3", icon: "ri-trophy-fill", gradient: "linear-gradient(135deg, var(--accent-lime), var(--accent-teal))" },
  { id: 3, title: "Wakati wa Kusambaa", stat: "Mapendo 12k", icon: "ri-flashlight-fill", gradient: "linear-gradient(135deg, var(--accent-amber), var(--accent))" },
  { id: 4, title: "Malengo ya Kikundi", stat: "Marafiki wa karibu 50", icon: "ri-group-fill", gradient: "linear-gradient(135deg, var(--accent-2), var(--accent-teal))" },
];

export const LEADERBOARD = USERS.slice(0, 6).map((u, i) => ({ ...u, flexScore: 980 - i * 61 }));

export function userById(uid) {
  return USERS[uid] || USERS[0];
}

const COMMENT_LINES = [
  "hii imenifurahisha siku yangu",
  "mandhari nzuri sana",
  "nimependa vibe hii",
  "hongera kwa hii",
  "naipenda energy hii sana",
  "hii ndio content tunayotaka",
  "umefanya vizuri sana",
  "hii inanikumbusha nyumbani",
  "nataka kujua zaidi kuhusu hii",
  "usiache kutu-update na hii",
  "sijawahi kuona kitu kama hiki",
  "hii inanipa motisha kweli",
  "poa sana, endelea hivyo",
];

const REPLY_LINES = [
  "kweli kabisa!",
  "nakubaliana nawe 100%",
  "hii ndio ukweli",
  "ahsante kwa kutaja hii",
  "mimi pia nilihisi hivyo",
  "umenena poa sana",
  "hasa hilo ndilo nililokuwa nafikiria",
  "😂 kweli tho",
];

// Posts that get a fuller, more active comment thread with replies.
const RICH_COMMENT_POST_IDS = [1, 3];

function buildComment(post, i) {
  const uid = (post.uid + i + 1) % USERS.length;
  return {
    id: `${post.id}-${i}`,
    uid,
    text: COMMENT_LINES[(post.id + i) % COMMENT_LINES.length],
    time: `dakika ${5 + i * 7}`,
    likes: (i * 7 + post.id * 3) % 24,
  };
}

function buildReplies(post, i, uid, count) {
  return Array.from({ length: count }).map((_, j) => {
    const ruid = (uid + j + 2) % USERS.length;
    return {
      id: `${post.id}-${i}-r${j}`,
      uid: ruid,
      text: REPLY_LINES[(post.id + i + j) % REPLY_LINES.length],
      time: `dakika ${2 + j * 3}`,
      likes: (j * 5 + i) % 12,
    };
  });
}

// Deterministic mock comment thread for a post, since there's no backend yet.
export function commentsForPost(post) {
  if (typeof post.id !== 'number') return []; // real posts: comments backend not wired up yet
  if (RICH_COMMENT_POST_IDS.includes(post.id)) {
    const replyCounts = [0, 2, 0, 1, 3, 0, 0, 1, 2, 0, 1, 0, 4];
    return Array.from({ length: 13 }).map((_, i) => {
      const base = buildComment(post, i);
      return { ...base, replies: buildReplies(post, i, base.uid, replyCounts[i]) };
    });
  }
  const n = 3 + (post.id % 4);
  return Array.from({ length: n }).map((_, i) => ({ ...buildComment(post, i), replies: [] }));
}

export const BADGE_META = {
  verified: { icon: "ri-checkbox-circle-fill", label: "Aliyethibitishwa" },
  rising: { icon: "ri-arrow-up-circle-fill", label: "Anayeinukia" },
  "top-creator": { icon: "ri-star-fill", label: "Muumbaji Bora" },
  business: { icon: "ri-store-2-fill", label: "Biashara" },
};

// Preset gradient swatches used by the create-post page to simulate picking photos,
// since there's no upload/storage backend wired up yet.
export const IMAGE_PRESETS = [
  "/post-templates/advat-special.png",
  "/post-templates/bear.png",
  "/post-templates/cute-kid.png",
  "/post-templates/panda.png",
  "/post-templates/sale-man.png",
  "/post-templates/sale-woman.png",
  "/post-templates/space-man.png",
  "/post-templates/yellow-bird.png",
];

// Gradient backgrounds for text-only posts. These are plain CSS gradient
// strings, not image URLs — PostCard/PostViewer already know how to render
// a non-URL `images[0]` as a full-bleed color background (see isColorOnly).
export const BACKGROUND_PRESETS = [
  "linear-gradient(135deg, #232336, #37375a)",
  "linear-gradient(135deg, #0d9be1, #7a2bff)",
  "linear-gradient(135deg, #c6ff3d, #0fb5a3)",
  "linear-gradient(135deg, #ff6b6b, #ffb020)",
  "linear-gradient(135deg, #7a2bff, #ff3d9a)",
  "linear-gradient(135deg, #0fb5a3, #0d9be1)",
  "linear-gradient(135deg, #ff3d9a, #ffb020)",
  "linear-gradient(135deg, #1c1c28, #0d9be1)",
  "linear-gradient(135deg, #0fb5a3, #c6ff3d)",
  "linear-gradient(135deg, #7a2bff, #0d9be1)",
  "linear-gradient(135deg, #ffb020, #ff6b6b)",
  "linear-gradient(135deg, #232336, #7a2bff)",
  "linear-gradient(135deg, #0d9be1, #c6ff3d)",
  "linear-gradient(135deg, #ff3d9a, #7a2bff)",
  "linear-gradient(135deg, #0fb5a3, #232336)",
  "linear-gradient(135deg, #ffb020, #7a2bff)",
];

// Auto-picked when a post has only a description and no photo/template/
// background was chosen — a plain white caption card is a worse default
// than a colorful one, so text-only posts always get a background.
export function randomBackground() {
  return BACKGROUND_PRESETS[Math.floor(Math.random() * BACKGROUND_PRESETS.length)];
}

export const CTA_ICON_PRESETS = [
  { icon: "ri-play-circle-fill", label: "Cheza" },
  { icon: "ri-flashlight-fill", label: "Jiunge" },
  { icon: "ri-shopping-bag-3-fill", label: "Nunua" },
  { icon: "ri-whatsapp-fill", label: "Tuma WhatsApp", whatsapp: true },
  { icon: "ri-external-link-fill", label: "Fungua Kiungo" },
  { icon: "ri-calendar-event-fill", label: "Hifadhi Nafasi" },
];

// Feeling / activity chips for the create-post composer (Facebook-style
// "is feeling..." tag). Purely a text-composition aid — merged into the
// post's text on submit since there's no dedicated backend column for it.
export const FEELINGS = [
  { emoji: "🔥", label: "Kachu" },
  { emoji: "😊", label: "Furaha" },
  { emoji: "😍", label: "Mapenzi" },
  { emoji: "🥳", label: "Sherehe" },
  { emoji: "💪", label: "Nguvu" },
  { emoji: "😴", label: "Uchovu" },
  { emoji: "😢", label: "Huzuni" },
  { emoji: "😤", label: "Hasira" },
  { emoji: "🙏", label: "Shukrani" },
  { emoji: "🤔", label: "Kufikiria" },
  { emoji: "🎉", label: "Kusherehekea" },
  { emoji: "😎", label: "Kujiamini" },
];

// Quick-insert emoji strip shown under the textarea.
export const QUICK_EMOJIS = ["😂", "🔥", "❤️", "😍", "👏", "😢", "😮", "🙏", "💯", "🥳", "😎", "👀"];

// ---------------------------------------------------------------------
// Business analytics + campaigns (app/flex) — ALL MOCK DATA.
// This screen has no backend yet (no analytics_events / campaigns tables).
// It exists to shape the UI first so we know what to build behind it.
// Swap each export below for a real Supabase query once those tables and
// the event-tracking pipeline exist; the page itself doesn't need to
// change shape, just where these numbers come from.
// ---------------------------------------------------------------------

export const ANALYTICS_OVERVIEW = [
  { id: "views", label: "Watazamaji", value: "4,812", delta: "+12.4%", up: true, icon: "ri-eye-line" },
  { id: "sales", label: "Mauzo", value: "TSh 1.86M", delta: "+8.1%", up: true, icon: "ri-money-dollar-circle-line" },
  { id: "orders", label: "Maagizo", value: "231", delta: "+3.6%", up: true, icon: "ri-shopping-bag-3-line" },
  { id: "followers", label: "Wafuasi Wapya", value: "97", delta: "-2.2%", up: false, icon: "ri-user-add-line" },
  { id: "conversion", label: "Kiwango cha Ubadilishaji", value: "4.9%", delta: "+0.4%", up: true, icon: "ri-percent-line" },
  { id: "aov", label: "Wastani wa Agizo", value: "TSh 8,050", delta: "+1.1%", up: true, icon: "ri-price-tag-3-line" },
];

// Last 7 days — used for the sales/views line chart.
export const ANALYTICS_SALES_SERIES = {
  labels: ["Jumatatu", "Jumanne", "Jumatano", "Alhamisi", "Ijumaa", "Jumamosi", "Jumapili"],
  sales: [180000, 240000, 210000, 260000, 300000, 420000, 260000],
  views: [520, 610, 590, 700, 810, 1120, 640],
};

// Last 6 weeks — used for the orders bar chart.
export const ANALYTICS_ORDERS_SERIES = {
  labels: ["Wiki 1", "Wiki 2", "Wiki 3", "Wiki 4", "Wiki 5", "Wiki 6"],
  orders: [28, 34, 31, 42, 39, 57],
};

export const CAMPAIGNS = [
  {
    id: "c1",
    title: "Punguzo la Wikendi",
    status: "active",
    icon: "ri-price-tag-3-fill",
    gradient: "linear-gradient(135deg, #ff6a3d, #ff2d78)",
    dateRange: "Jul 25 – Jul 27",
    budget: 150000,
    spend: 96000,
    reach: 6200,
    clicks: 340,
  },
  {
    id: "c2",
    title: "Uzinduzi wa Bidhaa Mpya",
    status: "upcoming",
    icon: "ri-rocket-2-fill",
    gradient: "linear-gradient(135deg, #6a5bff, #00c6ff)",
    dateRange: "Ago 3 – Ago 10",
    budget: 300000,
    spend: 0,
    reach: 0,
    clicks: 0,
  },
  {
    id: "c3",
    title: "Kampeni ya Sikukuu",
    status: "ended",
    icon: "ri-gift-fill",
    gradient: "linear-gradient(135deg, #22c55e, #0f766e)",
    dateRange: "Jun 20 – Jun 27",
    budget: 200000,
    spend: 200000,
    reach: 9100,
    clicks: 510,
  },
];
