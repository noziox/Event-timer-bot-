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

// 🔥 EVENTS REGROUPÉS PAR NOM
const events = {
  "🎪 Carnival Event": ["01:30", "13:30"],
  "🌑 Darkness Event": ["02:00", "08:00", "20:00"],
  "🌊 Underwater Event": ["04:30", "16:30"],
  "☣️ Toxic Event": ["05:00", "17:00", "23:00"],
  "🔥❄️ Ice & Fire Zombie Event": ["07:30", "19:30"],
  "🍀 Lucky Rot Event": ["09:00", "15:00", "21:00"],
  "🗼 Tokyo Event": ["10:30", "22:30"],
  "🍫 Chocolate Event": ["11:00"],
  "❤️ Love Event": ["14:00"]
};

// 🔎 Prochaine occurrence pour un event
function getNextDate(times) {
  const now = new Date();

  let nextDate = null;

  for (const time of times) {
    const [hour, minute] = time.split(":").map(Number);

    const eventDate = new Date();
    eventDate.setUTCHours(hour - 1, minute, 0, 0);

    if (eventDate < now) {
      eventDate.setDate(eventDate.getDate() + 1);
    }

    if (!nextDate || eventDate < nextDate) {
      nextDate = eventDate;
    }
  }

  return nextDate;
}

function getStatus(date) {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 60000 && diff >= -60000) {
    return "🟢 ACTIVE NOW";
  }

  const totalMinutes = Math.max(0, Math.floor(diff / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `dans ${hours}h ${minutes}m`;
  return `dans ${minutes}m`;
}

async function updateMessage() {
  const channel = await client.channels.fetch(CHANNEL_ID);

  let description = "🌍 **Fruits vs Brainrots | Live Status**\n\n";

  for (const [name, times] of Object.entries(events)) {
    const nextDate = getNextDate(times);
    const status = getStatus(nextDate);

    description += `**${name}**\n${status}\n\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setDescription(description)
    .setFooter({ text: "Live countdowns update automatically." });

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
