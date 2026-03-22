const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const CHANNEL_ID = "1476554892117151865";
const URL = "https://dealhub.fr/blog/steal-the-brainrot/toutes-les-heures-des-events-de-la-semaine-steal-the-brainrot-fortnite-mise-a-jour/";

let messageId = null;

// 🎯 emoji auto
function getEmoji(name) {
  name = name.toLowerCase();

  if (name.includes("void")) return "🌑";
  if (name.includes("lucky")) return "🍀";
  if (name.includes("chocolate")) return "🍫";
  if (name.includes("love")) return "❤️";
  if (name.includes("toxic")) return "☢️";
  if (name.includes("heaven")) return "☁️";
  if (name.includes("box")) return "📦";

  return "✨";
}

// 📥 récupération events (fix doublons + parsing propre)
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

    // 🔥 SUPPRESSION DOUBLONS
    return [...new Set(events)];

  } catch (err) {
    console.error(err);
    return [];
  }
}

// 🔄 parsing
function parseEvents(events) {
  const now = new Date();
  let parsed = [];

  events.forEach(e => {
    const match = e.match(/(\d{1,2})h(\d{2})?\s*:\s*(.+)/);
    if (!match) return;

    let hour = parseInt(match[1]);
    let minute = match[2] ? parseInt(match[2]) : 0;
    let name = match[3].trim();

    let date = new Date();
    date.setHours(hour, minute, 0, 0);

    if (date < now) date.setDate(date.getDate() + 1);

    parsed.push({ name, time: date });
  });

  return parsed.sort((a, b) => a.time - b.time);
}

// 🚀 update
async function updateDiscord() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return;

  const raw = await getEvents();
  const events = parseEvents(raw);

  if (events.length === 0) return;

  const embed = new EmbedBuilder()
    .setTitle("🌍 EVENT TIMERS !")
    .setColor(0x2b2d31)
    .setFooter({ text: "Les compteurs sont actualisés automatiquement." });

  events.slice(0, 5).forEach(e => {
    const emoji = getEmoji(e.name);
    const now = new Date();
    const diff = e.time - now;

    let text;

    if (diff <= 60000) {
      text = "🟢 événement en cours";
    } else {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      text = h > 0 ? `dans ${h}h ${m}m` : `dans ${m}m`;
    }

    embed.addFields({
      name: `${emoji} ${e.name}`,
      value: text,
      inline: false
    });
  });

  try {
    if (messageId) {
      const msg = await channel.messages.fetch(messageId);
      await msg.edit({ embeds: [embed] });
    } else {
      const msg = await channel.send({ embeds: [embed] });
      messageId = msg.id;
    }
  } catch {
    const msg = await channel.send({ embeds: [embed] });
    messageId = msg.id;
  }
}

client.once("ready", () => {
  console.log(`Connecté en tant que ${client.user.tag}`);

  updateDiscord();

  cron.schedule("* * * * *", () => {
    updateDiscord();
  });
});

client.login(process.env.TOKEN);
