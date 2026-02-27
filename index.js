const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// 🌐 Mini serveur pour Render
app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// 🔐 Variables Render
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// 📅 Planning des events (HEURE FRANCE UTC+1)
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

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🔎 Trouver le prochain event (-1 heure fixe)
function getNextEvent() {
  const now = new Date();

  for (const event of events) {
    const [hour, minute] = event.time.split(":").map(Number);

    const eventDate = new Date();
    eventDate.setUTCHours(hour - 1, minute, 0, 0); // ⚠️ -1 pour France

    if (eventDate > now) {
      return { ...event, date: eventDate };
    }
  }

  const [hour, minute] = events[0].time.split(":").map(Number);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(hour - 1, minute, 0, 0);

  return { ...events[0], date: tomorrow };
}

// 🔄 Mise à jour du message (ANTI SPAM)
async function updateMessage() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const next = getNextEvent();

  const now = new Date();
  const diffMs = next.date.getTime() - now.getTime();

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const customCountdown = `${hours}h ${minutes}m`;

  const embed = new EmbedBuilder()
    .setColor(0x00ffcc)
    .setTitle("⏱️ EVENT TIMER")
    .setDescription(
      `**${next.name}**
⏳ Dans ${customCountdown}
🕒 Heure exacte : ${next.time}`
    )
    .setFooter({ text: "Heure France (UTC+1)" });

  // 🔎 Cherche le dernier message du bot
  const messages = await channel.messages.fetch({ limit: 10 });
  const botMessage = messages.find(
    msg => msg.author.id === client.user.id
  );

  if (botMessage) {
    await botMessage.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

// 🚀 Démarrage
client.once("ready", () => {
  console.log("Bot prêt !");
  updateMessage();
  setInterval(updateMessage, 60000);
});

client.login(TOKEN);
