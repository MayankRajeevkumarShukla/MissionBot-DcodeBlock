require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const cron = require("node-cron");
const { connectDB, DailyMission, WeeklyMission } = require("./database");

// Discord Client Setup
const client = new Client({
  intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages],
});

// Connect to MongoDB
connectDB();

// Bot Ready Event
client.once("ready", () => {
  console.log(`🤖 ${client.user.tag} is online`);
});

// Fetch Daily Mission with Debugging
async function fetchDailyMission() {
  try {
    const today = new Date().toISOString().split("T")[0];
    console.log(`🔍 Fetching Daily Mission for: ${today}`);

    const mission = await DailyMission.findOne({ time: today });

    if (mission) {
      console.log(`✅ Daily Mission Found: ${mission.description}`);
      return mission.description;
    } else {
      console.log("⚠️ No Daily Mission found for today.");
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching daily mission:", error.message);
    return null;
  }
}

// Fetch Weekly Mission with Debugging
async function fetchWeeklyMission() {
  try {
    const today = new Date().toISOString().split("T")[0];
    console.log(`🔍 Fetching Weekly Mission for: ${today}`);

    const mission = await WeeklyMission.findOne({ time: today });

    if (mission) {
      console.log(`✅ Weekly Mission Found: ${mission.description}`);
      return mission.description;
    } else {
      console.log("⚠️ No Weekly Mission found for today.");
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching weekly mission:", error.message);
    return null;
  }
}

// Daily Mission Reminder - Runs Every 5 Minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    console.log("🕒 Running Daily Mission Reminder...");

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel) {
      console.error("❌ Failed to fetch the Discord channel. Check CHANNEL_ID.");
      return;
    }

    const mission = await fetchDailyMission();

    if (mission) {
      await channel.send(`🎯 **Daily Mission Reminder:** ${mission}`);
      console.log("✅ Daily mission sent to the channel.");
    } else {
      await channel.send("🚫 No daily mission found for today.");
      console.log("⚠️ No daily mission was sent.");
    }
  } catch (error) {
    console.error("❌ Error in Daily Mission Cron Job:", error.message);
  }
});

// Weekly Mission Reminder - Runs Every 5 Minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    console.log("🕒 Running Weekly Mission Reminder...");

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel) {
      console.error("❌ Failed to fetch the Discord channel. Check CHANNEL_ID.");
      return;
    }

    const mission = await fetchWeeklyMission();

    if (mission) {
      await channel.send(`📅 **Weekly Mission Reminder:** ${mission}`);
      console.log("✅ Weekly mission sent to the channel.");
    } else {
      await channel.send("🚫 No weekly mission found for today.");
      console.log("⚠️ No weekly mission was sent.");
    }
  } catch (error) {
    console.error("❌ Error in Weekly Mission Cron Job:", error.message);
  }
});

// Bot Login
client.login(process.env.DISCORD_TOKEN);
