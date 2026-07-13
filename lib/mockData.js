// All demo data lives here. Nothing in this file talks to a network —
// swap this module out for real API calls when the backend is ready.

export const AVATARS = ["🦁", "🐯", "🦊", "🐺", "🐸", "🦅", "🐲", "🦂", "🐙", "🦈", "🐼", "🦉"];
export const VIBES = ["Travel", "Food", "Music", "Fitness", "Art", "Comedy", "Tech", "Fashion"];
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

export const USERS = seedUsers(12);

export const ME = { name: "You", handle: "@you", avatar: "🐧", vibe: "Photography", badge: null };

export const POSTS = [
  { id: 1, uid: 0, kind: "post", text: "Sunrise over the coast this morning. Some views just don't need a caption.", tag: "Travel", gradient: "linear-gradient(135deg, var(--accent), var(--accent-2))", likes: 128, comments: 14, time: "2h" },
  { id: 2, uid: 1, kind: "ad" },
  { id: 3, uid: 2, kind: "post", text: "Tried making mandazi from scratch for the first time. 9/10, will make again.", tag: "Food", gradient: "linear-gradient(135deg, var(--accent-lime), var(--accent-teal))", likes: 342, comments: 41, time: "4h" },
  { id: 4, uid: 3, kind: "post", text: "New playlist for the week is up. Mostly Afrobeat and a little bit of amapiano.", tag: "Music", gradient: null, likes: 76, comments: 22, time: "6h" },
  { id: 5, uid: 4, kind: "post", text: "Finished my first 10k this weekend. Legs regret it, everything else does not.", tag: "Fitness", gradient: "linear-gradient(135deg, var(--accent-amber), var(--accent))", likes: 501, comments: 88, time: "8h" },
  { id: 6, uid: 5, kind: "ad" },
  { id: 7, uid: 6, kind: "post", text: "Been sketching every day this month. Here's day 21 of the challenge.", tag: "Art", gradient: "linear-gradient(135deg, var(--accent-2), var(--accent))", likes: 219, comments: 19, time: "1d" },
];

export const ADS = [
  { brand: "SonicPesa", gradient: "linear-gradient(135deg, #232336, #37375a)", headline: "Top up your wallet in seconds", body: "Send, receive, and cash out mobile money, built for East Africa.", cta: "Get the app" },
  { brand: "Kahawa Collective", gradient: "linear-gradient(135deg, var(--accent-lime), var(--accent-teal))", headline: "Locally roasted, delivered fresh", body: "Subscribe and get your first bag half price.", cta: "Shop now" },
];

export const NOTIFS = [
  { id: 1, type: "like", uid: 2, text: "liked your post", time: "12m", unread: true },
  { id: 2, type: "follow", uid: 5, text: "started following you", time: "38m", unread: true },
  { id: 3, type: "comment", uid: 1, text: 'commented: "this made my day"', time: "1h", unread: true },
  { id: 4, type: "flex", uid: 7, text: "beat your posting streak record", time: "3h", unread: false },
  { id: 5, type: "like", uid: 4, text: "and 23 others liked your flex card", time: "5h", unread: false },
  { id: 6, type: "follow", uid: 9, text: "started following you", time: "1d", unread: false },
];

export const CONVOS = [
  {
    id: 1, uid: 0, unread: 2,
    messages: [
      { from: "them", text: "loved that sunrise shot" },
      { from: "me", text: "thank you! golden hour did all the work" },
      { from: "them", text: "still, gg on the timing" },
    ],
  },
  {
    id: 2, uid: 3, unread: 0,
    messages: [
      { from: "me", text: "can you send that playlist link?" },
      { from: "them", text: "sending it over now" },
    ],
  },
  {
    id: 3, uid: 6, unread: 1,
    messages: [{ from: "them", text: "sketch meetup this weekend?" }],
  },
];

export const FLEX_CARDS = [
  { id: 1, title: "Posting Streak", stat: "17 days", icon: "ri-fire-fill", gradient: "linear-gradient(135deg, var(--accent), var(--accent-2))" },
  { id: 2, title: "Creator Spotlight", stat: "Featured 3x", icon: "ri-trophy-fill", gradient: "linear-gradient(135deg, var(--accent-lime), var(--accent-teal))" },
  { id: 3, title: "Viral Moment", stat: "12k likes", icon: "ri-flashlight-fill", gradient: "linear-gradient(135deg, var(--accent-amber), var(--accent))" },
  { id: 4, title: "Squad Goals", stat: "50 close friends", icon: "ri-group-fill", gradient: "linear-gradient(135deg, var(--accent-2), var(--accent-teal))" },
];

export const LEADERBOARD = USERS.slice(0, 6).map((u, i) => ({ ...u, flexScore: 980 - i * 61 }));

export function userById(uid) {
  return USERS[uid] || USERS[0];
}

export const BADGE_META = {
  verified: { icon: "ri-checkbox-circle-fill", label: "Verified" },
  rising: { icon: "ri-arrow-up-circle-fill", label: "Rising" },
  "top-creator": { icon: "ri-star-fill", label: "Top Creator" },
};
