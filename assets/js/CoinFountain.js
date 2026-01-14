import base64coins from "./base64coins.js";

const CONFIG = {
  //Массив монеток в формате base64
  coinImages: [
    base64coins[3],
    base64coins[4],
    base64coins[5],
    base64coins[6],
    base64coins[7],
    base64coins[8],
    base64coins[9],
    base64coins[10],
    base64coins[11],
  ],
  coinsPerBatch: 15, // Уменьшил количество монет в партии
  batchDelay: 400, // Увеличил задержку между партиями
  coinDelay: 100, // Увеличил задержку между монетами
  maxCoins: 50, // Максимальное количество монет одновременно
  desktopSize: {
    min: 40,
    max: 60,
  },
  mobileSize: {
    min: 25,
    max: 40,
  },
};

// Глобальные переменные
let isFountainActive = false;
let fountainInterval = null;
let activeCoins = 0;
let animationFrameId = null;

// Элементы DOM
const container = document.getElementById("win-modal-content");

// Получаем центр КОНТЕЙНЕРА
function getContainerCenter() {
  const rect = container.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function isDesktop() {
  return window.innerWidth >= 768;
}

// Получаем размер монетки в зависимости от устройства
function getCoinSize() {
  if (isDesktop()) {
    return (
      CONFIG.desktopSize.min +
      Math.random() * (CONFIG.desktopSize.max - CONFIG.desktopSize.min)
    );
  } else {
    return (
      CONFIG.mobileSize.min +
      Math.random() * (CONFIG.mobileSize.max - CONFIG.mobileSize.min)
    );
  }
}

function startFountain() {
  if (isFountainActive) return;

  isFountainActive = true;
  clearCoins();
  activeCoins = 0;

  createCoinBatch();
  fountainInterval = setInterval(createCoinBatch, CONFIG.batchDelay);
}

function stopFountain() {
  isFountainActive = false;
  if (fountainInterval) {
    clearInterval(fountainInterval);
    fountainInterval = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function clearCoins() {
  const coins = document.querySelectorAll(".coin");
  coins.forEach((coin) => {
    coin.remove();
  });
  activeCoins = 0;
}

function createCoinBatch() {
  if (!isFountainActive || activeCoins >= CONFIG.maxCoins) return;

  const coinsToCreate = Math.min(
    CONFIG.coinsPerBatch,
    CONFIG.maxCoins - activeCoins
  );

  for (let i = 0; i < coinsToCreate; i++) {
    setTimeout(() => {
      if (isFountainActive && activeCoins < CONFIG.maxCoins) {
        createCoin();
      }
    }, i * CONFIG.coinDelay);
  }
}

// Создание одной монетки
function createCoin() {
  if (activeCoins >= CONFIG.maxCoins) return;

  const coin = document.createElement("div");
  coin.className = "coin";

  const randomImage =
    CONFIG.coinImages[Math.floor(Math.random() * CONFIG.coinImages.length)];
  coin.style.backgroundImage = `url(${randomImage})`;

  const size = getCoinSize();
  coin.style.width = `${size}px`;
  coin.style.height = `${size}px`;

  container.appendChild(coin);
  activeCoins++;

  animateCoin(coin);
}

// Анимация монетки
function animateCoin(coin) {
  const center = getContainerCenter();

  const angle = (Math.random() * 60 - 30) * (Math.PI / 180);
  const initialVelocity = 10 + Math.random() * 10;
  const rotationSpeed = 2 + Math.random() * 3;
  const rotationDirection = Math.random() > 0.5 ? 1 : -1;

  const gravity = 0.4;

  let velocityX = Math.sin(angle) * initialVelocity;
  let velocityY = -Math.cos(angle) * initialVelocity;
  let rotation = 0;
  let time = 0;

  function animate() {
    if (!coin.parentNode) return; // Если монетка уже удалена

    time += 0.5;

    // Движение по параболе относительно центра контейнера
    const x = center.x + velocityX * time;
    const y = center.y + velocityY * time + 0.5 * gravity * time * time;

    rotation += rotationSpeed * rotationDirection;

    // Обновляем позицию и вращение
    coin.style.left = `${x - container.getBoundingClientRect().left}px`;
    coin.style.top = `${y - container.getBoundingClientRect().top}px`;
    coin.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;

    // Проверяем, вышла ли монетка за пределы контейнера
    if (
      y > container.getBoundingClientRect().bottom + 300 ||
      x < container.getBoundingClientRect().left - 100 ||
      x > container.getBoundingClientRect().right + 100
    ) {
      if (coin.parentNode) {
        coin.remove();
        activeCoins--;
      }
      return;
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  animate();
}

window.addEventListener("resize", function () {
  if (isFountainActive) {
    stopFountain();
    setTimeout(startFountain, 100);
  }
});

// Очистка при закрытии вкладки
window.addEventListener("beforeunload", function () {
  stopFountain();
  clearCoins();
});

export { startFountain, stopFountain };
