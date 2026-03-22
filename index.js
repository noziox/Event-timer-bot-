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

// 🎯 emoji selon event
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

// 📥 récupération events (bonne semaine + sans doublons)
async function getEvents() {
  try {
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);

    const now = new Date();
    const today = now.getDate();

    let events = [];
    let validSection = false;

    $("h2, h3, p, li").each((i, el) => {
      const text = $(el).text().trim();

      // 🎯 détecte la bonne semaine
      const match = text.match(/Programme du (\d{1,2}) au (\d{1,2})/i);

      if (match) {
        const start = parseInt(match[1]);
        const end = parseInt(match[2]);

        validSection = today >= start && today <= end;
        return;
      }

      // si nouvelle section → stop
      if (validSection && text.includes("Programme")) {
        validSection = false;
      }

      // récupère uniquement la bonne section
      if (validSection) {
        const matches = text.match(/\d{1,2}h\d{0,2}\s*:\s*[^0-9]+/g);

        if (matches) {
          matches.forEach(m => events.push(m.trim()));
        }
      }
    });

    // 🔥 suppression doublons
    return [...new Set(events)];

  } catch (err) {
    console.error("Erreur récupération :", err);
    return [];
  }
}

// 🔄 parsing events
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

// 🚀 update discord
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

  // 🔥 update toutes les minutes
  cron.schedule("* * * * *", () => {
    updateDiscord();
  });
});

client.login(process.env.TOKEN);
