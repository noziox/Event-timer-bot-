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

// 🎯 emoji selon event + fallback auto
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

  const emojis = ["🔥", "⚡", "🌟", "💥", "🎯", "🌀", "🎮", "👾"];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

// 📥 récupération events
async function getEvents() {
  try {
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);

    let events = [];

    $("p, li").each((i, el) => {
      let text = $(el).text();

      const matches = text.match(/\d{1,2}h\d{0,2}\s*:\s*[^0-9]+/g);

      if (matches) {
        matches.forEach(m => {
          events.push(m.trim());
        });
      }
    });

    return events;
  } catch (err) {
    console.error("Erreur récupération :", err);
    return [];
  }
}

// 🔄 transformation propre
function parseEvents(events) {
  const now = new Date();
  let parsed = [];

  events.forEach(e => {
    const match = e.match(/(\d{1,2})h(\d{2})?\s*:\s*(.+)/);

    if (!match) return;

    let hour = parseInt(match[1]);
    let minute = match[2] ? parseInt(match[2]) : 0;
    let name = match[3].trim();

    let eventDate = new Date();
    eventDate.setHours(hour, minute, 0, 0);

    if (eventDate < now) {
      eventDate.setDate(eventDate.getDate() + 1);
    }

    parsed.push({ name, time: eventDate });
  });

  return parsed.sort((a, b) => a.time - b.time);
}

// 🚀 update Discord
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

    const now = new Date();
    const diff = e.time - now;

    let line;

    if (diff <= 60000) {
      line = "🟢 événement en cours";
    } else {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      line = h > 0 ? `dans ${h}h ${m}m` : `dans ${m}m`;
    }

    content += `${emoji} **${e.name}**\n`;
    content += `${line}\n\n`;
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

  // 🔥 update toutes les minutes
  cron.schedule("* * * * *", () => {
    updateDiscord();
  });
});

client.login(process.env.TOKEN);
