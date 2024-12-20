const express = require("express");
const amqp = require("amqplib");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const turf = require("@turf/turf");

const app = express();
const PORT = 3002;

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
});

// Redis connection
const redisClient = new Redis({
  port: 6379, // Redis port
  host: "127.0.0.1", // Redis host
  family: 4, // 4(IPv4) or 6(IPv6)
  password: "auth",
  db: 0,
});
redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient.on("connect", () => console.log("Connected to Redis"));

// MongoDB Schemas
const DroneSchema = new mongoose.Schema({
  droneId: String,
  longitude: Number,
  latitude: Number,
  altitude: Number,
  timestamp: { type: Date, default: Date.now },
});

const NoFlyZoneSchema = new mongoose.Schema({
  type: { type: String, default: "Feature" },
  geometry: {
    type: { type: String, enum: ["Polygon"], required: true },
    coordinates: { type: [[[Number]]], required: true },
  },
  properties: {
    height: Number,
    description: String,
  },
});

const Drone = mongoose.model("Drone", DroneSchema);
const NoFlyZone = mongoose.model("NoFlyZone", NoFlyZoneSchema);

// RabbitMQ connection settings
const RABBITMQ_URL = "amqp://localhost";
let channel;

// Підключення до RabbitMQ та створення консюмера
const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue("droneDataQueue", { durable: true });
    console.log("Connected to RabbitMQ");

    // Консюмер для отримання даних із черги
    channel.consume("droneDataQueue", async (msg) => {
      if (msg !== null) {
        const droneData = JSON.parse(msg.content.toString());
        console.log("Received drone data:", droneData);

        try {
          // Зберігаємо отримані дані у MongoDB (колекція history)
          const newDrone = new Drone(droneData);
          await newDrone.save();
          console.log("Drone data saved to MongoDB (history)");
        } catch (error) {
          console.error("Error saving drone data to MongoDB:", error);
        }

        // Перевіряємо, чи входять координати в будь-який полігон із noFlyZones
        try {
          const noFlyZones = await NoFlyZone.find();

          const point = turf.point([droneData.longitude, droneData.latitude]);

          noFlyZones.forEach((zone) => {
            const polygon = turf.polygon(zone.geometry.coordinates);
            const isInside = turf.booleanPointInPolygon(point, polygon);

            if (isInside && droneData.altitude <= zone.properties.height) {
              console.log(
                `Drone ${droneData.droneId} is inside a no-fly zone:`,
                zone.properties.description
              );
            } else {
              console.log(
                `Drone ${droneData.droneId} is outside a no-fly zones`
              );
            }
          });
        } catch (error) {
          console.error("Error checking no-fly zones:", error);
        }

        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error("Failed to connect to RabbitMQ:", err);
  }
};
connectRabbitMQ();

// Express server routes
app.get("/", (req, res) => {
  res.send("Server is running and connected to RabbitMQ, MongoDB, and Redis");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
