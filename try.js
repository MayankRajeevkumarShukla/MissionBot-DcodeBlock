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
    const today = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD
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
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = daysOfWeek[new Date().getDay()]; // Get the day of the week (e.g., "Mon")

    console.log(`Looking for weekly mission for today: ${today}`);
    
    // Find mission for today in the weekly mission's time array
    const mission = await WeeklyMission.findOne({ time: today });

    if (!mission) {
      console.error("No weekly mission found for today.");
      return null;
    }

    // console.log("Found weekly mission:", filterData);
    return mission;
  } catch (error) {
    console.error("Error fetching weekly mission:", error);
    return null;
  }
}

// Cron job to send daily mission reminder every minute (adjust the timing as needed)
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
    const clickHere = "https://www.dcodeblock.com/project-sagas";
    const learnHere = "https://www.dcodeblock.com/monk-ai";
    
    const dailyMissions = await fetchDailyMission();
    if (dailyMissions && dailyMissions.length > 0) {
      let messageContent = `@everyone 🎯 **Daily Mission Reminder:**\n`;
    
      // Find the first mission of type "problem" and "doc"
      const problemMission = dailyMissions.find(m => m.typeOfMission === "problem");
      const docMission = dailyMissions.find(m => m.typeOfMission === "doc");
    
      // Add the problem mission to the message
      if (problemMission) {
        const link = problemMission.typeOfMission === "problem" ? clickHere : learnHere;
        messageContent += `- **Problem Mission:** ${problemMission.description} ${problemMission.time} ${link}\n`;
      }
    
      // Add the doc mission to the message
      if (docMission) {
        const link = docMission.typeOfMission === "doc" ? learnHere : clickHere;
        messageContent += `- **Doc Mission:** ${docMission.description} ${docMission.time} ${link}\n`;
      }
    
      await channel.send({
        content: messageContent,
        allowedMentions: { parse: ['everyone'] }
      });
      console.log("Daily missions sent successfully:", messageContent);
    } else {
      await channel.send({
        content: "@everyone 🚫 No daily mission available today. Please check the database.",
        allowedMentions: { parse: ['everyone'] }
      });
      console.log("No daily mission available message sent.");
    }
    

    // Fetch Weekly Mission
    const weeklyMission = await fetchWeeklyMission();
    if (weeklyMission && weeklyMission.description) {
      await channel.send({
        content: `@everyone 🎯 **Weekly Mission Reminder:** ${weeklyMission.description} `,
        allowedMentions: { parse: ['everyone'] }
      });
      console.log("Weekly mission sent successfully:", weeklyMission.description);
    } else {
      await channel.send({
        content: "@everyone 🚫 No weekly mission available today. Please check the database.",
        allowedMentions: { parse: ['everyone'] }
      });
      console.log("No weekly mission available message sent.");
    }

  } catch (error) {
    console.error("Error in cron job:", error);
  }
});

client.login(process.env.DISCORD_TOKEN);
