const express = require("express");
const bodyParser = require("body-parser");
const Redis = require("ioredis");
const amqp = require("amqplib");

const app = express();
const PORT = 3001;

// Підключення до Redis
const client = new Redis({
    port: 6379,          // Redis port
    host: '127.0.0.1',   // Redis host
    family: 4,           // 4(IPv4) or 6(IPv6)
    password: 'auth',
    db: 0
  });
client.on("error", (err) => console.error("Redis error:", err));
client.on("connect", () => console.log("Connected to Redis"));

app.use(bodyParser.json());

// RabbitMQ connection settings
const RABBITMQ_URL = 'amqp://localhost';
let channel;

// Підключення до RabbitMQ
const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue("droneDataQueue", { durable: true });
    console.log("Connected to RabbitMQ");
  } catch (err) {
    console.error("Failed to connect to RabbitMQ:", err);
  }
};
connectRabbitMQ();

// Маршрут для отримання даних про дронів
app.post("/api/drone", async (req, res) => {
  const { longitude, latitude, altitude, droneId } = req.body;

  if (!longitude || !latitude || !altitude || !droneId) {
    return res.status(400).json({ error: "Missing required drone data" });
  }

  try {
    const droneData = {
      longitude,
      latitude,
      altitude,
      droneId,
    };

    console.log(`Hub save data to drones ${JSON.stringify(droneData)}`);

    // Зберігаємо дані у Redis з ключем "drones:{droneId}"
    await client.set(`drones:${droneId}`, JSON.stringify(droneData), 'PX', 5000);

    console.log(`Drone data saved successfully ${droneId}`);

    // Надсилаємо дані у RabbitMQ
    if (channel) {
      channel.sendToQueue("droneDataQueue", Buffer.from(JSON.stringify(droneData)), {
        persistent: true,
      });
      console.log(`Drone data sent to RabbitMQ queue: ${droneId}`);
    } else {
      console.error("RabbitMQ channel is not available");
    }

    res.status(200).json({ message: "Drone data saved successfully" });
  } catch (err) {
    console.error("Error saving to Redis or sending to RabbitMQ:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(
    `HTTP сервер для прийому даних дронів запущено на http://localhost:${PORT}`
  );
});
