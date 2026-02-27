const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// 🌐 Mini serveur web pour Render (obligatoire)
app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// 🔐 Variables Render
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// 📅 Planning des events (HEURE FRANCE)
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

let messageId = null;

// 🔎 Trouver le prochain event (-1 heure pour France UTC+1)
function getNextEvent() {
  const now = new Date();

  for (const event of events) {
    const [hour, minute] = event.time.split(":").map(Number);

    const eventDate = new Date();
    eventDate.setUTCHours(hour - 1, minute, 0, 0); // ⚠️ -1

    if (eventDate > now) {
      return { ...event, date: eventDate };
    }
  }

  // Premier event du lendemain
  const [hour, minute] = events[0].time.split(":").map(Number);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(hour - 1, minute, 0, 0); // ⚠️ -1

  return { ...events[0], date: tomorrow };
}

// 🔄 Mise à jour du message
async function updateMessage() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const next = getNextEvent();

  const embed = new EmbedBuilder()
    .setColor(0x00ffcc)
    .setTitle("⏱️ EVENT TIMER")
    .setDescription(
      `**${next.name}**\n⏳ Commence <t:${Math.floor(
        next.date.getTime() / 1000
      )}:R>\n🕒 Heure exacte : ${next.time}`
    )
    .setFooter({ text: "Heure France (UTC+1)" });

  if (!messageId) {
    const msg = await channel.send({ embeds: [embed] });
    messageId = msg.id;
  } else {
    const msg = await channel.messages.fetch(messageId);
    await msg.edit({ embeds: [embed] });
  }
}

// 🚀 Démarrage
client.once("ready", () => {
  console.log("Bot prêt !");
  updateMessage();
  setInterval(updateMessage, 60000);
});

client.login(TOKEN);
