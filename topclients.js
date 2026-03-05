const fs = require("fs")
const { EmbedBuilder, PermissionsBitField } = require("discord.js")

const TOP_CHANNEL = process.env.TOP_CHANNEL_ID
const HALL_OF_FAME = process.env.HALL_OF_FAME_ID
const TOP_ROLE = process.env.TOP_ROLE_ID

let data = { points: {}, messageId: null, lastWinner: null }

if (fs.existsSync("points.json")) {
 data = JSON.parse(fs.readFileSync("points.json"))
}

function save(){
 fs.writeFileSync("points.json", JSON.stringify(data,null,2))
}

function leaderboard(){
 return Object.entries(data.points).sort((a,b)=>b[1]-a[1])
}

function format(){

 const board = leaderboard()

 let text = ""

 board.slice(0,10).forEach((user,i)=>{

  const medals = ["🥇","🥈","🥉"]
  const medal = medals[i] || `${i+1}️⃣`

  text += `${medal} <@${user[0]}> — ${user[1]} points\n`

 })

 if(text === "") text = "Aucun point pour le moment."

 return text
}

async function update(client){

 const channel = await client.channels.fetch(TOP_CHANNEL)

 const embed = new EmbedBuilder()
 .setColor(0xf1c40f)
 .setTitle("🏆 Classement Clients")
 .setDescription(format())

 if(data.messageId){

  try{

   const msg = await channel.messages.fetch(data.messageId)
   await msg.edit({embeds:[embed]})
   return

  }catch{}

 }

 const msg = await channel.send({embeds:[embed]})
 data.messageId = msg.id

 save()
}

module.exports = (client)=>{

 client.on("interactionCreate", async interaction=>{

  if(!interaction.isChatInputCommand()) return

  if(interaction.commandName === "ajouterpoints"){

   if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
    return interaction.reply({content:"❌ Permission refusée",ephemeral:true})

   const user = interaction.options.getUser("membre")
   const amount = interaction.options.getInteger("points")

   if(!data.points[user.id]) data.points[user.id]=0

   data.points[user.id]+=amount

   save()

   await update(client)

   interaction.reply({content:`✅ ${amount} points ajoutés à ${user.tag}`,ephemeral:true})

  }

 })

 setInterval(()=>update(client),60000)

}
