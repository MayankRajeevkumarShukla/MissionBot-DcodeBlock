const mongoose = require("mongoose");
const DailyMissionSchema = new mongoose.Schema({
  name: String,
  description: String,
  trophy: Number,
  credits: Number,
  completed: Boolean,
  typeOfMission: String,
  type: String,
  completedTime: String,
  time: String,
  claimed: Boolean,
});
const WeeklyMissionSchema = new mongoose.Schema({
  name: String,
  description: String,
  trophy: Number,
  credits: Number,
  completed: Boolean,
  typeOfMission: String,
  type: String,
  completedTime: String,
  time: [String],  
  claimed: Boolean,
});
const DailyMission = mongoose.model("DailyMission", DailyMissionSchema);
const WeeklyMission = mongoose.model("WeeklyMission", WeeklyMissionSchema);
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { connectDB, DailyMission, WeeklyMission };
