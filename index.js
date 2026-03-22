const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const CHANNEL_ID = "1476554892117151865";
const URL = "https://dealhub.fr/blog/steal-the-brainrot/toutes-les-heures-des-events-de-la-semaine-steal-the-brainrot-fortnite-mise-a-jour/";

let messageId = null;

// 🎯 emojis connus + fallback auto
function getEmoji(name) {
  name = name.toLowerCase();

  if (name.includes("void")) return "🌑";
  if (name.includes("lucky")) return "🍀";
  if (name.includes("chocolate")) return "🍫";
  if (name.includes("love")) return "❤️";
  if (name.includes("toxic")) return "☢️";
  if (name.includes("dark")) return "🌙";
  if (name.includes("heaven")) return "☁️";
  if (name.includes("box")) return "📦";

  // 🎲 emoji auto pour nouveaux events
  const emojis = ["🔥", "⚡", "🌟", "💥", "🎯", "🌀", "🎮", "👾"];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

// 📥 récupère les events depuis Dealhub
async function getEvents() {
  try {
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);

    let events = [];

    $("p, li").each((i, el) => {
      const text = $(el).text().trim();

      if (/^\d{1,2}h/.test(text)) {
        events.push(text);
      }
    });

    return events;
  } catch (err) {
    console.error("Erreur récupération :", err);
    return [];
  }
}

// 🔄 transforme les events
function parseEvents(events) {
  const now = new Date();
  let parsed = [];

  events.forEach(e => {
    const match = e.match(/(\d{1,2})h(\d{2})?\s*:? ?(.+)/);

    if (!match) return;

    let hour = parseInt(match[1]);
    let minute = match[2] ? parseInt(match[2]) : 0;
    let name = match[3];

    let eventDate = new Date();
    eventDate.setHours(hour, minute, 0, 0);

    if (eventDate < now) {
      eventDate.setDate(eventDate.getDate() + 1);
    }

    parsed.push({
      name,
      time: eventDate
    });
  });

  return parsed.sort((a, b) => a.time - b.time);
}

// ⏱️ temps restant
function formatTimeLeft(date) {
  const now = new Date();
  const diff = date - now;

  if (diff <= 0) return "🟢 événement en cours";

  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (h > 0) return `dans ${h}h ${m}m`;
  return `dans ${m}m`;
}

// 🚀 update discord
async function updateDiscord() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return;

  const rawEvents = await getEvents();
  const events = parseEvents(rawEvents);

  if (events.length === 0) {
    await channel.send("❌ Impossible de récupérer les événements.");
    return;
  }

  let content = "🌍 **EVENT TIMERS !**\n\n";

  events.slice(0, 5).forEach(e => {
    const emoji = getEmoji(e.name);

    content += `${emoji} **${e.name}**\n`;
    content += `${formatTimeLeft(e.time)}\n\n`;
  });

  content += "Les compteurs sont actualisés automatiquement.";

  try {
    if (messageId) {
      const msg = await channel.messages.fetch(messageId);
      await msg.edit(content);
    } else {
      const msg = await channel.send(content);
      messageId = msg.id;
    }
  } catch {
    const msg = await channel.send(content);
    messageId = msg.id;
  }
}

client.once("ready", () => {
  console.log(`Connecté en tant que ${client.user.tag}`);

  updateDiscord();

  // 🔥 update toutes les minutes (effet live)
  cron.schedule("* * * * *", () => {
    updateDiscord();
  });
});

client.login(process.env.TOKEN);
