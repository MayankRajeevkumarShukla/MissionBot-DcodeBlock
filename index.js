require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const cron = require("node-cron");
const { connectDB, DailyMission, WeeklyMission } = require("./database");

// Create client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Connect to MongoDB
connectDB();

// Enhanced startup function with channel verification
client.once("ready", () => {
  console.log(`${client.user.tag} is online!`);
  
  // Log all available guilds and channels for verification
  console.log("\n=== AVAILABLE GUILDS AND CHANNELS ===");
  client.guilds.cache.forEach(guild => {
    console.log(`\nGuild: ${guild.name} (${guild.id})`);
    let textChannels = 0;
    
    guild.channels.cache.forEach(channel => {
      if (channel.isTextBased()) {
        console.log(`- Text Channel: ${channel.name} (${channel.id})`);
        textChannels++;
      }
    });
    
    if (textChannels === 0) {
      console.log("  No text channels found in this guild!");
    }
  });
  console.log("\n=====================================");
  
  // Verify the channel from .env exists
  const targetChannelId = process.env.CHANNEL_ID;
  let foundChannel = false;
  
  client.guilds.cache.forEach(guild => {
    const channel = guild.channels.cache.get(targetChannelId);
    if (channel) {
      console.log(`✅ Target channel found: ${channel.name} (${channel.id}) in guild ${guild.name}`);
      foundChannel = true;
    }
  });
  
  if (!foundChannel) {
    console.log(`❌ Channel with ID ${targetChannelId} not found in any guild! Please check the ID and bot permissions.`);
  }
});

async function fetchDailyMission() {
  try {
    const today = new Date().toISOString().split("T")[0];
    console.log(`Looking for mission for today: ${today}`);
    
    // Find mission for today
    const mission = await DailyMission.find();
    const date = new Date().toISOString().split("T")[0];
    const filterData = mission.filter((mission) => {
      return mission.time === date;
    });

    if (!filterData || filterData.length === 0) {
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
    const today = new Date().toISOString().split("T")[0];
    console.log(`Looking for weekly mission for today: ${today}`);
    
    // Find mission for today in the weekly mission's time array
    const mission = await WeeklyMission.find();
    const filtermission = mission.filter((el) => {
      return el.time.includes(today);
    });

    if (!filtermission || filtermission.length === 0) {
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

// Function to find channel using multiple methods
async function findChannel() {
  // Method 1: Try directly with channel ID from env
  const targetChannelId = process.env.CHANNEL_ID;
  
  for (const guild of client.guilds.cache.values()) {
    const channelById = guild.channels.cache.get(targetChannelId);
    if (channelById && channelById.isTextBased()) {
      console.log(`Found channel by ID: ${channelById.name}`);
      return channelById;
    }
  }
  
  // Method 2: Try to find a channel by name if specified in env
  if (process.env.CHANNEL_NAME) {
    for (const guild of client.guilds.cache.values()) {
      const channelByName = guild.channels.cache.find(c => 
        c.name === process.env.CHANNEL_NAME && c.isTextBased());
      if (channelByName) {
        console.log(`Found channel by name: ${channelByName.name}`);
        return channelByName;
      }
    }
  }
  
  // Method 3: Fallback to first text channel in first guild
  const firstGuild = client.guilds.cache.first();
  if (firstGuild) {
    const firstChannel = firstGuild.channels.cache.find(c => c.isTextBased());
    if (firstChannel) {
      console.log(`Fallback to first available text channel: ${firstChannel.name}`);
      return firstChannel;
    }
  }
  
  return null;
}

// Add test command to manually trigger the message
client.on('messageCreate', async message => {
  if (message.content === '!testmission') {
    console.log("Test command received. Sending mission message...");
    try {
      // Use the channel where the command was sent
      const channel = message.channel;
      await sendMissionMessage(channel);
      console.log("Test message sent successfully!");
    } catch (error) {
      console.error("Error sending test message:", error);
    }
  }
});

// Extracted logic for sending the mission message
async function sendMissionMessage(channel) {
  if (!channel) {
    console.error("No valid channel found to send messages to!");
    return;
  }
  
  const dailyMissions = await fetchDailyMission();
  const weeklyMission = await fetchWeeklyMission();

  const platformEmbed = new EmbedBuilder()
    .setTitle('DcodeBlock - The Ultimate Developer Platform')
    .setDescription('AI-powered gamified platform for Web3 learning & building projects, enabling developers to transition & unlock opportunities in web3.')
    .setURL('https://www.dcodeblock.com/')
    .setColor('#3498db');
  
  let messageContent = `GM Bro$kiis, @everyone\n\n`;
  messageContent += `- **Daily missions are live** - 10 Trophies + 20 Yuzus\n`;
  
  if (dailyMissions && dailyMissions.length > 0) {
    const problemMission = dailyMissions.find(m => m.typeOfMission === "problem");
    const docMission = dailyMissions.find(m => m.typeOfMission === "doc");
  
    if (problemMission) {
      messageContent += `- **Problem Mission:** ${problemMission.description} ${problemMission.time} [projectSaga](https://www.dcodeblock.com/project-sagas)\n`;
    }
  
    if (docMission) {
      messageContent += `- **Doc Mission:** ${docMission.description} ${docMission.time} [monk-ai](https://www.dcodeblock.com/monk-ai)\n`;
    }
  } else {
    messageContent += `🚫 No daily mission available today. Please check the database.\n`;
  }
  
  messageContent += `\n- **Do not forget to complete the weekly mission** -\n`;
  
  if (weeklyMission && weeklyMission.length > 0) {
    const problemMission = weeklyMission.find(m => m.typeOfMission === "problem");
    const docMission = weeklyMission.find(m => m.typeOfMission === "doc");
  
    if (problemMission) {
      messageContent += `- **Problem Mission:** ${problemMission.description} ${problemMission.time[0]}-${problemMission.time[6]} [projectSaga](https://www.dcodeblock.com/project-sagas)\n`;
    }
  
    if (docMission) {
      messageContent += `- **Doc Mission:** ${docMission.description} ${docMission.time[0]}-${docMission.time[6]} [monk-ai](https://www.dcodeblock.com/monk-ai)\n`;
    }
  } else {
    messageContent += `🚫 No weekly mission available today. Please check the database.\n`;
  }
  messageContent += `\nComplete to win awesome benefits!\n\n`;
  messageContent += `Share a Screenshot on X tagging DcodeBlock with your completed mission alongside a headline and we'll select the most creative headline for a **10$ USDT giveaway** 🎉\n`;
  
  await channel.send({
    content: messageContent,
    allowedMentions: { parse: ['everyone'] },
    embeds: [platformEmbed],
  });
  
  console.log(`Successfully sent message to channel: ${channel.name} (${channel.id})`);
}

// Cron job to send daily message - set to run once a day at 9am
// Change to * * * * * for testing every minute
cron.schedule("* * * * *", async () => {
  console.log("Cron job triggered! Finding channel to send message...");

  try {
    const channel = await findChannel();
    if (channel) {
      await sendMissionMessage(channel);
    } else {
      console.error("No suitable channel found to send the mission message.");
    }
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("Bot logged in successfully"))
  .catch(error => console.error("Failed to login:", error));