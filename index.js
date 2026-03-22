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

async function updateDiscord() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return;

  const events = await getEvents();

  let content;

  if (events.length === 0) {
    content = "❌ Impossible de récupérer les événements.";
  } else {
    content = "📅 **Événements Fortnite (auto)**\n\n";

    events.forEach(e => {
      content += `🕒 ${e}\n`;
    });

    content += "\n🔄 Mis à jour automatiquement";
  }

  try {
    if (messageId) {
      const msg = await channel.messages.fetch(messageId);
      await msg.edit(content);
    } else {
      const msg = await channel.send(content);
      messageId = msg.id;
    }
  } catch (err) {
    console.log("Recréation du message...");
    const msg = await channel.send(content);
    messageId = msg.id;
  }
}

client.once("ready", () => {
  console.log(`Connecté en tant que ${client.user.tag}`);

  updateDiscord();

  cron.schedule("*/30 * * * *", () => {
    console.log("Update events...");
    updateDiscord();
  });
});

client.login(process.env.TOKEN);
