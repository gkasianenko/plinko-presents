// Массив с base64 монетками разных типов

import base64coins from "./base64coins.js";
const coinImgs = [
  base64coins[3],
  base64coins[4],
  base64coins[5],
  base64coins[6],
  base64coins[7],
  base64coins[8],
  base64coins[9],
  base64coins[10],
  base64coins[11],
];

const coinsContainer = document.getElementById("coinsContainer");

let coinsDropped = 0;
let animationActive = false;

// Функция для создания монетки
function createCoin() {
  const coin = document.createElement("div");
  coin.className = "win-coin";

  // Случайный выбор монетки
  const randomIndex = Math.floor(Math.random() * coinImgs.length);
  const coinImg = coinImgs[randomIndex];

  // Устанавливаем SVG как фон
  coin.style.backgroundImage = `url('${coinImg}')`;

  // Случайная позиция по горизонтали
  const leftPosition = Math.random() * (window.innerWidth - 40);
  coin.style.left = `${leftPosition}px`;

  // Случайная продолжительность анимации (быстрая)
  const duration = 0.8 + Math.random() * 0.7; // от 0.8 до 1.5 секунд
  coin.style.animationDuration = `${duration}s`;

  // Случайный размер монетки
  const size = 25 + Math.random() * 25;
  coin.style.width = `${size}px`;
  coin.style.height = `${size}px`;

  coinsContainer.appendChild(coin);
  coinsDropped++;

  // Удаляем монетку после завершения анимации
  setTimeout(() => {
    if (coin.parentNode) {
      coin.parentNode.removeChild(coin);
    }
  }, duration * 1000);
}

// Функция для запуска падения монет
function dropCoins() {
  if (animationActive) return;

  animationActive = true;
  coinsDropped = 0;

  coinsContainer.classList.remove("hide");

  // Создаем 50 монеток с небольшими задержками для эффекта "дождя"
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      createCoin();
    }, i * 30); // Задержка между созданием монеток
  }

  setTimeout(() => {
    coinsContainer.classList.add("hide");
    animationActive = false;
  }, 2000);
}

export { dropCoins };
