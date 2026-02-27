const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Serveur pour Render
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

// 📅 TES EVENTS
const events = [
  { time: "01:30", name: "🎪 Carnival Event" },
  { time: "02:00", name: "🌑 Darkness Event" },
  { time: "04:30", name: "🌊 Underwater Event" },
  { time: "05:00", name: "☣️ Toxic Event" },
  { time: "07:30", name: "🔥❄️ Ice & Fire Zombie Event" },
  { time: "08:00", name: "🌑 Darkness Event" },
  { time: "09:00", name: "🍀 Lucky Rot Event" },
  { time: "10:30", name: "🗼 Tokyo Event" },
  { time: "11:00", name: "🍫 Chocolate Event" },
  { time: "13:30", name: "🎪 Carnival Event" },
  { time: "14:00", name: "❤️ Love Event" },
  { time: "15:00", name: "🍀 Lucky Rot Event" },
  { time: "16:30", name: "🌊 Underwater Event" },
  { time: "17:00", name: "☣️ Toxic Event" },
  { time: "19:30", name: "🔥❄️ Ice & Fire Zombie Event" },
  { time: "20:00", name: "🌑 Darkness Event" },
  { time: "21:00", name: "🍀 Lucky Rot Event" },
  { time: "22:30", name: "🗼 Tokyo Event" },
  { time: "23:00", name: "☣️ Toxic Event" }
];

// 🔎 Calcule prochaine occurrence (-1 heure France)
function getNextDate(time) {
  const now = new Date();
  const [hour, minute] = time.split(":").map(Number);

  const eventDate = new Date();
  eventDate.setUTCHours(hour - 1, minute, 0, 0);

  if (eventDate < now) {
    eventDate.setDate(eventDate.getDate() + 1);
  }

  return eventDate;
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

  let description = "🌍 **EVENT TIMERS | Live Status**\n\n";

  for (const event of events) {
    const nextDate = getNextDate(event.time);
    const status = getStatus(nextDate);

    description += `**${event.name}**\n${status}\n\n`;
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
