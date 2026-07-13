// All demo data lives here. Nothing in this file talks to a network —
// swap this module out for real API calls when the backend is ready.

export const AVATARS = ["🦁", "🐯", "🦊", "🐺", "🐸", "🦅", "🐲", "🦂", "🐙", "🦈", "🐼", "🦉"];
export const GAMES = ["PUBG Mobile", "Free Fire", "CODM", "eFootball", "FIFA 26"];
const NAMES = ["Zawadi", "Baraka", "Neema", "Juma", "Amani", "Faraja", "Kiptoo", "Wanjiru", "Otieno", "Achieng", "Mwangi", "Nakato"];
const RANKS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite"];

function seedUsers(n) {
  return Array.from({ length: n }).map((_, i) => ({
    id: i + 1,
    name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : ""),
    handle: "@" + NAMES[i % NAMES.length].toLowerCase() + (i + 21),
    avatar: AVATARS[i % AVATARS.length],
    game: GAMES[i % GAMES.length],
    rank: RANKS[i % RANKS.length],
    followers: 200 + i * 37,
  }));
}

export const USERS = seedUsers(12);

export const ME = { name: "You", handle: "@you_flex", avatar: "🐧", game: "PUBG Mobile", rank: "Diamond" };

export const POSTS = [
  { id: 1, uid: 0, kind: "post", text: "Chicken dinner with the squad. Erangel never gets old.", tag: "PUBG Mobile", gradient: "linear-gradient(135deg, var(--accent), var(--accent-2))", likes: 128, comments: 14, time: "2h" },
  { id: 2, uid: 1, kind: "ad" },
  { id: 3, uid: 2, kind: "post", text: "Clutch 1v4 to close out the clan war. Clip incoming.", tag: "Free Fire", gradient: "linear-gradient(135deg, var(--accent-lime), var(--accent-teal))", likes: 342, comments: 41, time: "4h" },
  { id: 4, uid: 3, kind: "post", text: "New sensitivity settings dropped my recoil control massively. Sharing the code in comments.", tag: "CODM", gradient: null, likes: 76, comments: 22, time: "6h" },
  { id: 5, uid: 4, kind: "post", text: "Finals tonight. Nairobi vs Dar es Salaam. Who's watching?", tag: "eFootball", gradient: "linear-gradient(135deg, var(--accent-amber), var(--accent))", likes: 501, comments: 88, time: "8h" },
  { id: 6, uid: 5, kind: "ad" },
  { id: 7, uid: 6, kind: "post", text: "Hit Diamond rank solo queue. Grind was worth it.", tag: "PUBG Mobile", gradient: "linear-gradient(135deg, var(--accent-2), var(--accent))", likes: 219, comments: 19, time: "1d" },
];

export const ADS = [
  { brand: "SonicPesa", gradient: "linear-gradient(135deg, #0b0b0f, #1c1c24)", headline: "Top up your wallet in seconds", body: "Send, receive, and cash out mobile money, built for East Africa.", cta: "Get the app" },
  { brand: "Erangel Energy", gradient: "linear-gradient(135deg, var(--accent-lime), var(--accent-teal))", headline: "Fuel the grind. Zero sugar.", body: "The official drink of the Advat Regional Finals.", cta: "Shop now" },
];

export const NOTIFS = [
  { id: 1, type: "like", uid: 2, text: "liked your post", time: "12m", unread: true },
  { id: 2, type: "follow", uid: 5, text: "started following you", time: "38m", unread: true },
  { id: 3, type: "comment", uid: 1, text: 'commented: "insane clip"', time: "1h", unread: true },
  { id: 4, type: "flex", uid: 7, text: "beat your Diamond streak record", time: "3h", unread: false },
  { id: 5, type: "like", uid: 4, text: "and 23 others liked your flex card", time: "5h", unread: false },
  { id: 6, type: "follow", uid: 9, text: "started following you", time: "1d", unread: false },
];

export const CONVOS = [
  {
    id: 1, uid: 0, unread: 2,
    messages: [
      { from: "them", text: "yo you seeing this bracket?" },
      { from: "me", text: "yeah we got the easy side lol" },
      { from: "them", text: "gg that was clutch" },
    ],
  },
  {
    id: 2, uid: 3, unread: 0,
    messages: [
      { from: "me", text: "can you share your codm sensitivity?" },
      { from: "them", text: "sending sens settings now" },
    ],
  },
  {
    id: 3, uid: 6, unread: 1,
    messages: [{ from: "them", text: "squad up for finals?" }],
  },
];

export const FLEX_CARDS = [
  { id: 1, title: "Diamond Streak", stat: "17 wins", icon: "ri-fire-fill", gradient: "linear-gradient(135deg, var(--accent), var(--accent-2))" },
  { id: 2, title: "MVP Finals", stat: "3x MVP", icon: "ri-trophy-fill", gradient: "linear-gradient(135deg, var(--accent-lime), var(--accent-teal))" },
  { id: 3, title: "Clutch King", stat: "1v4 clutch", icon: "ri-flashlight-fill", gradient: "linear-gradient(135deg, var(--accent-amber), var(--accent))" },
  { id: 4, title: "Top Fragger", stat: "412 kills", icon: "ri-medal-fill", gradient: "linear-gradient(135deg, var(--accent-2), var(--accent-teal))" },
];

export const LEADERBOARD = USERS.slice(0, 6).map((u, i) => ({ ...u, flexScore: 980 - i * 61 }));

export function userById(uid) {
  return USERS[uid] || USERS[0];
}
