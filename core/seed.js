const mongoose = require("mongoose");
const fs = require("fs");

// MongoDB connection
const MONGO_URI = "mongodb://localhost:27017/droneData";
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
  populateNoFlyZones();
});

// Function to populate NoFlyZones from JSON file
const populateNoFlyZones = () => {
  fs.readFile("no-fly-zones.json", "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading JSON file:", err);
      return;
    }

    try {
      const noFlyZones = JSON.parse(data);
      const collection = db.collection("noflyzones");
      await collection.deleteMany({}); // Clear existing data
      await collection.insertMany(noFlyZones.features);
      console.log("No-fly zones successfully populated in MongoDB");
      process.exit(0);
    } catch (error) {
      console.error("Error populating no-fly zones:", error);
      process.exit(1);
    }
  });
};

