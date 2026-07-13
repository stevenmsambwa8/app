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

export const POSTS = [
  { id: 1, uid: 0, kind: "post", text: "Jua linachomoza pwani asubuhi hii. Mandhari zingine haziitaji maneno.", tag: "Safari", gradient: "linear-gradient(135deg, var(--accent), var(--accent-2))", likes: 128, comments: 14, time: "saa 2" },
  { id: 2, uid: 1, kind: "ad" },
  { id: 3, uid: 2, kind: "post", text: "Nimejaribu kupika mandazi kutoka mwanzo mara ya kwanza. 9/10, nitarudia tena.", tag: "Chakula", gradient: "linear-gradient(135deg, var(--accent-lime), var(--accent-teal))", likes: 342, comments: 41, time: "saa 4" },
  { id: 4, uid: 3, kind: "post", text: "Playlist mpya ya wiki iko tayari. Zaidi Afrobeat na kidogo amapiano.", tag: "Muziki", gradient: null, likes: 76, comments: 22, time: "saa 6" },
  { id: 5, uid: 4, kind: "post", text: "Nimemaliza 10k yangu ya kwanza wikendi hii. Miguu inajuta, kila kitu kingine hakijutii.", tag: "Mazoezi", gradient: "linear-gradient(135deg, var(--accent-amber), var(--accent))", likes: 501, comments: 88, time: "saa 8" },
  { id: 6, uid: 5, kind: "ad" },
  { id: 7, uid: 6, kind: "post", text: "Nimekuwa nikichora kila siku mwezi huu. Hii ni siku ya 21 ya changamoto.", tag: "Sanaa", gradient: "linear-gradient(135deg, var(--accent-2), var(--accent))", likes: 219, comments: 19, time: "siku 1" },
];

export const ADS = [
  { brand: "SonicPesa", gradient: "linear-gradient(135deg, #232336, #37375a)", headline: "Jaza pochi yako kwa sekunde", body: "Tuma, pokea na toa pesa za simu, imejengwa kwa ajili ya Afrika Mashariki.", cta: "Pata App" },
  { brand: "Kahawa Collective", gradient: "linear-gradient(135deg, var(--accent-lime), var(--accent-teal))", headline: "Kahawa ya asili, inafika ikiwa mbichi", body: "Jisajili upate mfuko wako wa kwanza kwa nusu bei.", cta: "Nunua sasa" },
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

export const BADGE_META = {
  verified: { icon: "ri-checkbox-circle-fill", label: "Aliyethibitishwa" },
  rising: { icon: "ri-arrow-up-circle-fill", label: "Anayeinukia" },
  "top-creator": { icon: "ri-star-fill", label: "Muumbaji Bora" },
};
