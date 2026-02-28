const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Bot running"));
app.listen(PORT, () => console.log("Web server started"));

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const EVENT_DURATION = 20 * 60 * 1000; // 20 minutes

const events = {
  "🌑 Void Event": ["01:00", "03:00", "05:00", "07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00", "23:00"],
  "🍀 Lucky Rot Event": ["02:00", "08:00", "14:00", "20:00"],
  "🍫 Chocolate Event": ["04:30", "13:30"],
  "❤️ Love Event": ["01:30", "10:30", "19:30"],
  "☢️ Toxic Event": ["07:30", "10:30", "16:30", "22:30"]
};
let currentActive = null; // { name, startTime, messageId }

function buildEventDate(time) {
  const now = new Date();
  const [hour, minute] = time.split(":").map(Number);

  const date = new Date();
  date.setUTCHours(hour - 1, minute, 0, 0);

  if (date < now) date.setDate(date.getDate() + 1);

  return date;
}

function getNextOccurrence(times) {
  const now = new Date();
  let next = null;

  for (const t of times) {
    const d = buildEventDate(t);
    if (!next || d < next) next = d;
  }

  return next;
}

function formatCountdown(date) {
  const now = new Date();
  const diff = date - now;

  const minutes = Math.floor(diff / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h > 0) return `dans ${h}h ${m}m`;
  return `dans ${m}m`;
}

async function update() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const now = new Date();

  // 🔥 Supprimer ping si 20 minutes passées
  if (currentActive && now - currentActive.startTime >= EVENT_DURATION) {
    try {
      const msg = await channel.messages.fetch(currentActive.messageId);
      await msg.delete();
    } catch {}
    currentActive = null;
  }

  let description = "🌍 **EVENT TIMERS !**\n\n";

  for (const [name, times] of Object.entries(events)) {
    const next = getNextOccurrence(times);

    let status = formatCountdown(next);

    // 🔔 Détection démarrage
    if (!currentActive) {
      const diff = next - now;
      if (diff <= 60000 && diff >= -60000) {
        const ping = await channel.send(
          `@everyone 🚨 **${name} vient de commencer !**`
        );

        currentActive = {
          name,
          startTime: new Date(),
          messageId: ping.id
        };
      }
    }

    // 🟢 ACTIVE pendant 20 minutes
    if (
      currentActive &&
      currentActive.name === name &&
      now - currentActive.startTime < EVENT_DURATION
    ) {
      status = "🟢 événement en cours ";
    }

    description += `**${name}**\n${status}\n\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setDescription(description)
    .setFooter({ text: "Les compteurs sont actualisés automatiquement." });

  const messages = await channel.messages.fetch({ limit: 10 });
  const botMessage = messages.find(
    m => m.author.id === client.user.id && m.embeds.length > 0
  );

  if (botMessage) {
    await botMessage.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

client.once("ready", async () => {
  console.log("Bot prêt !");
  await update();
  setInterval(update, 60000);
});

client.login(TOKEN);
