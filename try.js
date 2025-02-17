require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const cron = require("node-cron");
const { connectDB, DailyMission, WeeklyMission } = require("./database");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// Connect to MongoDB
connectDB();

client.once("ready", () => {
  console.log(`${client.user.tag} is online!`);
});
async function fetchDailyMission() {
  try {
    const today = new Date().toISOString().split("T")[0];
    console.log(`Looking for mission for today: ${today}`);
    
    // Find mission for today
    const mission = await DailyMission.find() ;
    const date = new Date().toISOString().split("T")[0];
    const filterData =mission.filter((mission)=>{
    return mission.time === date
  })

    if (!mission) {
      console.error("No mission found for today.");
      return null;
    }

    console.log("Found daily mission:", filterData);
    return filterData;
  } catch (error) {
    console.error("Error fetching daily mission:", error);
    return null;
  }
}

async function fetchWeeklyMission() {
  try {
    // const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // const today = daysOfWeek[new Date().toISOString().split("T")[0]]; 
    const today = new Date().toISOString().split("T")[0];
    console.log(`Looking for weekly mission for today: ${today}`);
    // Find mission for today in the weekly mission's time array
    const mission = await WeeklyMission.find();
    // console.log(mission)
    const filtermission = mission.filter((el)=>{
      return el.time.includes(today)
    })

    if (!mission) {
      console.error("No weekly mission found for today.");
      return null;
    }

    console.log("Found weekly mission:", filtermission);
    return filtermission;
  } catch (error) {
    console.error("Error fetching weekly mission:", error);
    return null;
  }
}
cron.schedule("* * * * *", async () => {
  console.log("Cron job triggered! Fetching the channel...");

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.log("No guilds found!");
      return;
    }

    const channel = guild.channels.cache.find(channel => channel.isTextBased());
    if (!channel) {
      console.log("No text channels found in the guild!");
      return;
    }
    const clickHere = "[projectSaga]"+"(https://www.dcodeblock.com/project-sagas)";
    const learnHere = "[monk-ai]"+"(https://www.dcodeblock.com/monk-ai)";
    
    const dailyMissions = await fetchDailyMission();
    const weeklyMission = await fetchWeeklyMission();
    
    let messageContent = `GM Bro$kiis, @everyone\n\n`;

    messageContent += `- **Daily missions are live** - 10 Trophies + 20 Yuzus\n`;
    
    if (dailyMissions && dailyMissions.length > 0) {
      const problemMission = dailyMissions.find(m => m.typeOfMission === "problem");
      const docMission = dailyMissions.find(m => m.typeOfMission === "doc");
    
      if (problemMission) {
        messageContent += `- **Problem Mission:** ${problemMission.description} ${problemMission.time} ${clickHere}\n`;
      }
    
      if (docMission) {
        messageContent += `- **Doc Mission:** ${docMission.description} ${docMission.time} ${learnHere}\n`;
      }
    } else {
      messageContent += `🚫 No daily mission available today. Please check the database.\n`;
    }
    
    messageContent += `\n- **Do not forget to complete the weekly mission** -\n`;
    
    if (weeklyMission && weeklyMission.length > 0) {
      const problemMission = weeklyMission.find(m => m.typeOfMission === "problem");
      const docMission = weeklyMission.find(m => m.typeOfMission === "doc");
    
      if (problemMission) {
        messageContent += `- **Problem Mission:** ${problemMission.description} ${problemMission.time[0]}-${problemMission.time[6]} ${clickHere}\n`;
      }
    
      if (docMission) {
        messageContent += `- **Doc Mission:** ${docMission.description} ${docMission.time[0]}-${docMission.time[6]} ${learnHere}\n`;
      }
    } else {
      messageContent += `🚫 No weekly mission available today. Please check the database.\n`;
    }
    
    // Add the embed only once
    messageContent += `\nComplete to win awesome benefits : <https://www.dcodeblock.com/>\n\n`;
    messageContent += `Share a Screenshot on X tagging DcodeBlock with your completed mission alongside a headline and we’ll select the most creative headline for a **10$ USDT giveaway** 🎉\n`;
    
    // Send the message
    await channel.send({
      content: messageContent,
      allowedMentions: { parse: ['everyone'] },
      embeds: [],
    });
    
    
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});

client.login(process.env.DISCORD_TOKEN);
