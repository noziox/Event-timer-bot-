const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const events = {
  "🎪 Carnival Event": ["01:30", "13:30"],
  "🌑 Darkness Event": ["02:00", "08:00", "20:00"],
  "🌊 Underwater Event": ["04:30", "16:30"],
  "☣️ Toxic Event": ["05:00", "17:00", "23:00"],
  "🔥❄️🧟 Ice & Fire Zombie Event": ["07:30", "19:30"],
  "🍀 Lucky Rot Event": ["09:00", "15:00", "21:00"],
  "🗼 Tokyo Event": ["10:30", "22:30"],
  "🍫 Chocolate Event": ["11:00"],
  "❤️ Love Event": ["14:00"]
};

let activeEvents = {};
let activePing = null; // { messageId, timestamp }

function getNextDate(times) {
  const now = new Date();
  let nextDate = null;
  let usedTime = null;

  for (const time of times) {
    const [hour, minute] = time.split(":").map(Number);
    const eventDate = new Date();
    eventDate.setUTCHours(hour - 1, minute, 0, 0);

    if (eventDate < now) {
      eventDate.setDate(eventDate.getDate() + 1);
    }

    if (!nextDate || eventDate < nextDate) {
      nextDate = eventDate;
      usedTime = time;
    }
  }

  return { nextDate, usedTime };
}

function getStatus(name, date) {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (activeEvents[name] && now - activeEvents[name] < 20 * 60 * 1000) {
    return "🟢 événement en cours";
  }

  if (diff <= 60000 && diff >= -60000) {
    activeEvents[name] = now;
    return "🟢 événement en cours";
  }

  const totalMinutes = Math.max(0, Math.floor(diff / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `dans ${hours}h ${minutes}m`;
  return `dans ${minutes}m`;
}

async function updateMessage() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const now = new Date();

  // 🔥 Supprime ping après 20 min (même après redémarrage)
  if (activePing && now - activePing.timestamp >= 20 * 60 * 1000) {
    try {
      const msg = await channel.messages.fetch(activePing.messageId);
      await msg.delete();
    } catch {}
    activePing = null;
  }

  let description = "🌍 **EVENT TIMERS !**\n\n";

  for (const [name, times] of Object.entries(events)) {
    const { nextDate, usedTime } = getNextDate(times);
    const status = getStatus(name, nextDate);

    description += `**${name}**\n${status}\n\n`;

    // 🔔 Envoie ping si event démarre
    if (status === "🟢 événement en cours") {
      const announceKey = `${name}-${usedTime}`;

      if (!activePing) {
        const pingMessage = await channel.send(
          `@everyone 🚨 **${name} vient de commencer !**`
        );

        activePing = {
          messageId: pingMessage.id,
          timestamp: now
        };
      }
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setDescription(description)
    .setFooter({ text: "Les compteurs sont actualisés automatiquement." });

  const messages = await channel.messages.fetch({ limit: 10 });
  const botMessage = messages.find(
    msg => msg.author.id === client.user.id && msg.embeds.length > 0
  );

  if (botMessage) {
    await botMessage.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

client.once("ready", async () => {
  console.log("Bot prêt !");
  await updateMessage();
  setInterval(updateMessage, 60000);
});

client.login(TOKEN);
