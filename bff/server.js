const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");

const app = express();
const PORT = 3000;

app.use(cors()); // Дозволяє CORS, якщо сервер і клієнт знаходяться на різних доменах

// Підключення до Redis
const client = new Redis({
  port: 6379, // Порт Redis
  host: "127.0.0.1", // Хост Redis
  family: 4, // 4 (IPv4) або 6 (IPv6)
  password: "auth", // Пароль (якщо встановлений)
  db: 0, // Номер бази даних
});

client.on("error", (err) => console.error("Redis error:", err));
client.on("connect", () => console.log("Connected to Redis"));

// Маршрут для SSE
app.get("/api/drones", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Функція для отримання даних з Redis
  const fetchDroneData = async () => {
    try {
      // Отримуємо всі ключі, що відповідають патерну 'drones:*'
      const keys = await client.keys("drones:*");

      console.log("keys", JSON.stringify(keys));

      if (keys.length === 0) {
        return [];
      }

      // Отримуємо значення для всіх ключів
      const values = await client.mget(keys);

      // Парсимо дані з JSON
      const drones = values.map((value) => JSON.parse(value));

      // Отримуємо всі ключі про небезпечні дрони
      const dangerKeys = await client.keys("danger:drone:*");
      const dangerIds = new Set(dangerKeys.map((key) => key.split(":").pop()));

      // Модифікуємо дані дронів на основі інформації про небезпечність
      // for (let drone of drones) {

      //   // drone.color = ;
      // }

      // console.log("drones", drones);

      // return drones;
      // #0030f4

      console.log("dangerIds", dangerIds);

      return drones.map((item) => ({
        ...item,
        color: dangerIds.has(item.droneId) ? "#f40000" : "#0030f4",
      }));
    } catch (error) {
      console.error("Помилка при отриманні даних з Redis:", error);
      return [];
    }
  };

  // Функція для періодичного надсилання даних
  const updateAndSendData = async () => {
    const drones = await fetchDroneData();
    sendEvent(drones);
  };

  // Надсилаємо перше повідомлення
  updateAndSendData();

  // Інтервал для надсилання оновлень кожну секунду
  const intervalId = setInterval(updateAndSendData, 1000);

  // Закриваємо з'єднання, якщо клієнт відключився
  req.on("close", () => {
    clearInterval(intervalId);
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`SSE сервер запущено на http://localhost:${PORT}`);
});
