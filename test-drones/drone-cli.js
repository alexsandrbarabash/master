const axios = require('axios');

// Перевірка та отримання аргументів командного рядка
const args = process.argv.slice(2);

if (args.length < 4) {
  console.error('Будь ласка, вкажіть початкові координати: longitude latitude altitude droneId');
  process.exit(1);
}

let [longitude, latitude, altitude, droneId] = args;

// Перетворення аргументів у числа, якщо необхідно
longitude = parseFloat(longitude);
latitude = parseFloat(latitude);
altitude = parseFloat(altitude);

// Перевірка, чи координати є числами
if (isNaN(longitude) || isNaN(latitude) || isNaN(altitude)) {
  console.error('Координати повинні бути числовими значеннями.');
  process.exit(1);
}

// Збереження початкових координат для визначення меж руху
const initialLongitude = longitude;
const initialLatitude = latitude;

// Напрямок руху дрона
let direction = 1;

// Функція для імітації руху дрона
function simulateDroneMovement() {
  // Оновлення координат
  longitude += 0.0001 * direction;
  latitude += 0.00005 * direction;

  // Зміна напрямку при досягненні меж (+/- 0.01 від початкових координат)
  if (longitude > initialLongitude + 0.01 || longitude < initialLongitude - 0.01) {
    direction *= -1;
  }

  const droneData = {
    longitude,
    latitude,
    altitude,
    droneId,
  };

  // Відправка POST-запиту на сервер
  axios.post('http://localhost:3001/api/drone', droneData)
    .then(response => {
      console.log('Дані дрона відправлено:', droneData);
    })
    .catch(error => {
      console.error('Помилка при відправці даних дрона:', error.message);
    });
}
// node droneClient.js <longitude> <latitude> <altitude> <droneId>

// Відправка даних дрона кожну секунду
setInterval(simulateDroneMovement, 1000);
