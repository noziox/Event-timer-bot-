const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1476554892117151865";

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

function getNextEvent() {
  const now = new Date();

  for (const e of events) {
    const [h2, m2] = events[0].time.split(":").map(Number);

    const eventDate = new Date();
    eventDate.setUTCHours(h - 1, m, 0, 0);

    const diff = eventDate.getTime() - now.getTime();

    // Si l'event est en train de commencer (dans les 60 dernières secondes)
    if (diff <= 0 && diff > -60000) {
      return { ...e, date: eventDate, starting: true };
    }

    if (diff > 0) {
      return { ...e, date: eventDate };
    }

  const [h, m] = events[0].time.split(":").map(Number);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(h2 - 1, m2, 0, 0);

  return { ...events[0], date: tomorrow };
}

async function updateMessage() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const next = getNextEvent();

  // 🔔 Si event commence → ping
  if (next.starting) {
    await channel.send(`@everyone 🚨 **${next.name} commence maintenant !**`);
    return; // On laisse le prochain update afficher le suivant
  }

  const embed = new EmbedBuilder()
    .setColor(0x00ffcc)
    .setTitle("⏱️ EVENT TIMER")
    .setDescription(
      `**${next.name}**\n⏳ Commence <t:${Math.floor(
        next.date.getTime() / 1000
      )}:R>`
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

client.once("ready", () => {
  console.log("Bot prêt !");
  updateMessage();
  setInterval(updateMessage, 60000);
});

client.login(TOKEN);
