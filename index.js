const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1476554892117151865";

// 📅 Liste des events (heure FRANCE)
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

// 🔎 Trouver le prochain event
function getNextEvent() {
  const now = new Date();

  for (const event of events) {
    const [hourStr, minuteStr] = event.time.split(":");
    const hour = Number(hourStr);
    const minute = Number(minuteStr);

    const eventDate = new Date();
    eventDate.setUTCHours(hour - 1, minute, 0, 0); // France UTC+1

    if (eventDate.getTime() > now.getTime()) {
      return { ...event, date: eventDate };
    }
  }

  // Si aucun event restant aujourd'hui → premier de demain
  const [firstHourStr, firstMinuteStr] = events[0].time.split(":");
  const firstHour = Number(firstHourStr);
  const firstMinute = Number(firstMinuteStr);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(firstHour - 1, firstMinute, 0, 0);

  return { ...events[0], date: tomorrow };
}

// 🔄 Mettre à jour le message
async function updateMessage() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  const nextEvent = getNextEvent();

  const embed = new EmbedBuilder()
    .setColor(0x00ffcc)
    .setTitle("⏱️ EVENT TIMER")
    .setDescription(
      `**${nextEvent.name}**\n⏳ Commence <t:${Math.floor(
        nextEvent.date.getTime() / 1000
      )}:R>\n🕒 Heure exacte : <t:${Math.floor(
        nextEvent.date.getTime() / 1000
      )}:t>`
    )
    .setFooter({ text: "Heure France" });

  if (!messageId) {
    const msg = await channel.send({ embeds: [embed] });
    messageId = msg.id;
  } else {
    const msg = await channel.messages.fetch(messageId);
    await msg.edit({ embeds: [embed] });
  }
}

// 🚀 Lancement
client.once("ready", () => {
  console.log("Bot prêt !");
  updateMessage();
  setInterval(updateMessage, 60000);
});

client.login(TOKEN);
