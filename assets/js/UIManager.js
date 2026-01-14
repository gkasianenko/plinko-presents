import { baseConfig, config, updateSizesBasedOnRows } from "./config.js";
import WinModalManager from "./WinModalManager.js";
import TargetWinsCalculator from "./TargetWinsCalculator.js";
import { animateNumber, CURRENCY } from "./utils.js";
import { startFountain, stopFountain } from "./CoinFountain.js";
import { playCountSound, playPushAppSound, playPushMessageSound, playBigWinSound } from "./base64sounds.js";

class UIManager {
  constructor(gameInstance) {
    this.game = gameInstance;

    this.ballCount = 1;
    this.maxBallCount = 1;

    this.balance = Math.max(0, config.initialBalance || 50);
    this.previousBalance = this.balance;

    this.ballCost = config.ballCost || 10;

    this.throwsLeft = config.maxBalls || 5;
    this.currentThrowGoing = false;
    this.winsAmount = 0;
    this.winsEUR = 0;
    this.winsFS = 0;

    this.firstWin = 2173.33;
    this.secondWin = 2173.33;
    this.thirdWin = 2173.34;

    this.ballsInBinsCount = 0;

    this.isFirstBetPlaced = false;
    this.isGameActive = false;
    this.winModalManager = null;
    this.rowsSlider = null;
    this.ballsSlider = null;
    this.sliders = [];
    this.planTargetBinsIndex = 0;
  }

  updateRemainingBalls() {
    const balanceDisplay = document.getElementById("balance-display");
    if (balanceDisplay) {
      const remainingAfterBet = Math.max(0, this.throwsLeft - this.ballCount);
      balanceDisplay.textContent = `Balls remaining: ${remainingAfterBet}`;
    }
  }

  initialize() {
    this.cleanup();

    this.ballCount = 1;
    this.ballsInBinsCount = 0;
    this.throwsLeft = config.maxBalls || 5;

    this.createMoneyBetUI();
    this.updateThrowsAndWins();

    this.createDebugInput();
    this.setupBetButton();
    this.setupRecieveButton();

    this.winModalManager = new WinModalManager(this.game);
    this.winModalManager.initialize();

    this.updateRemainingBalls();
    this.initializeTargetBins();
  }

  showAfterThrowsSection(winsAmount) {
    //Вызываем победную модалку и скрываем саму игру
    this.showWinModal(winsAmount);
    this.startCoinFountain();
    this.hidePlinkoGame();

    //Вызываем пуш уведомление поcле победной модалки  (всего 2000ms)
    setTimeout(() => {
      this.showGamePush();
    }, 2000);

    //Вызываем имитацию приложенияб скрываем победную модалку и пуш уведомление  (всего 4000ms)
    setTimeout(() => {
      this.hideWinModal();
      this.clearGamePush();
      this.showGameApp();

      //выключаем фонтан монет, чтобы не грузил вкладку
      this.stopCoinFountain();
    }, 4000);

    //Вызываем отработку приложения банкинга, увеличение счета + морганиче счета в конце (всего 8000ms (7000ms анимация + 1000ms моргание счета))
    setTimeout(() => {
      this.startGameApp();
    }, 5000);

    //Закрываем приложение банкинга и вызываем финальное окно 
    setTimeout(() => {
      this.hideGameApp();
    }, 9000);

    setTimeout(() => {
      this.showGameFinale();
    }, 9300);
  }

  showWinModal(winsAmount) {
    if (this.winModalManager) {
      this.winModalManager.showWinModal(winsAmount);
    }
  }

  hideWinModal() {
    if (this.winModalManager) {
      this.winModalManager.hideWinModal();
    }
  }

  showClaimBonusModal() {}

  hidePlinkoGame() {
    const gameField = document.getElementById("plinko-field");
    const gameScore = document.getElementById("wins-container");
    gameField.classList.add("hide-game");
    gameScore.classList.add("hide");
  }

  showPlinkoGame() {
    const gameField = document.getElementById("plinko-field");
    const gameScore = document.getElementById("wins-container");
    gameField.classList.remove("hide-game");
    gameScore.classList.remove("hide");
  }

  hideAllUi() {
    const gameField = document.getElementById("plinko-field");
    gameField.classList.add("hide-all");
  }

  showAllUi() {
    const gameField = document.getElementById("plinko-field");
    gameField.classList.remove("hide-all");
  }

  showGameApp() {
    const gameApp = document.getElementById("game-app");
    gameApp.classList.remove("hide");
  }

  startGameApp() {
    const gameApp = document.getElementById("game-app");
    const gameAppNotifications = document.getElementById("app-notifications");
    const gameAppAmount = document.getElementById("app-amount");

    gameAppNotifications.classList.add("show-all");

    //Тайминги показа нотификаций банкинга из верстки show-all
    //0ms Первая нотификация
    //1000ms Вторая нотификация
    //2000ms Третья нотификация

    //Анимация прибавления цифр к общему счету банкинга, засинхронена с анимациями появления нотификаций в верстке выше
    //поэтому, если изменили тайминги в вертске, тут тоже надо менять
    setTimeout(() => {

      //проигрываем звук пуша банкинга
      playPushAppSound();

      animateNumber({
        element: gameAppAmount,
        targetValue: this.firstWin,
        startValue: 0,
        duration: 1000,
        easing: "easeOutCubic",
      });
    }, 0);

    setTimeout(() => {
      playPushAppSound();
      animateNumber({
        element: gameAppAmount,
        targetValue: this.firstWin + this.secondWin,
        startValue: this.firstWin,
        duration: 1000,
        easing: "easeOutCubic",
      });
    }, 1000);

    setTimeout(() => {
      playPushAppSound();
      animateNumber({
        element: gameAppAmount,
        targetValue: this.firstWin + this.secondWin + this.thirdWin,
        startValue: this.firstWin + this.secondWin,
        duration: 1000,
        easing: "easeOutCubic",
        onComplete: () => {
          //Проигрываем звук победного дропа при выделении баланса
          playBigWinSound();
          gameApp.classList.add("balance");
        },
      });
    }, 2000);
  }

  hideGameApp() {
    const gameApp = document.getElementById("game-app");
    gameApp.classList.add("hide");
  }

  showGameFinale() {
    const finale = document.getElementById("game-finale");
    finale.classList.remove("hide");
  }

  hideGameFinale() {
    const finale = document.getElementById("game-finale");
    finale.classList.add("hide");
  }

  showGamePush() {
    //Проигрываем звук появления пуша
    playPushMessageSound();

    const push = document.getElementById("game-push");
    push.classList.add("show");
  }

  clearGamePush() {
    const push = document.getElementById("game-push");
    push.remove();
  }

  startCoinFountain() {
    startFountain();
  }

  stopCoinFountain() {
    stopFountain();
  }

  createMoneyBetUI() {
    const existingContainer = document.querySelector(".money-bet-container");
    if (existingContainer) {
      existingContainer.style.display = "none";
      return;
    }

    const moneyBetContainer = document.createElement("div");
    moneyBetContainer.className = "money-bet-container";
    moneyBetContainer.style.display = "none";

    const balanceDisplay = document.createElement("div");
    balanceDisplay.id = "balance-display";
    balanceDisplay.className = "balance-display";
    balanceDisplay.textContent = `Balls: ${this.throwsLeft}`;

    moneyBetContainer.appendChild(balanceDisplay);
    this.game.container.appendChild(moneyBetContainer);
  }

  initializeTargetBins() {
    if (
      config.planTargetsBins?.length > 0 &&
      this.planTargetBinsIndex < config.planTargetsBins.length
    ) {
      console.debug("✅ Target bins plan already exists, not recreating");
      return;
    }

    if (config.targetWins > 0 && this.game.binsManager) {
      console.debug(
        "🧠 Initializing target bins array for win target:",
        config.targetWins
      );

      setTimeout(() => {
        const targetWinsCalculator = new TargetWinsCalculator(
          this.game,
          this.game.binsManager
        );
        const success = targetWinsCalculator.applyTargetDistribution();

        if (success) {
          config.planTargetsBins = [...config.targetBins];
          this.planTargetBinsIndex = 0;
          console.debug("✅ Target bins set in plan:", config.planTargetsBins);
        } else {
          console.warn("❌ Failed to set planned bins");
        }
      }, 300);
    } else {
      console.debug("⏩ Skipped target bins initialization:", {
        "config.targetWins": config.targetWins,
        "binsManager available": !!this.game.binsManager,
      });
    }
  }

  updateThrowsAndWins(from = this.previousBalance, to = this.balance) {
    const balanceDisplay = document.getElementById("balance-display");
    if (balanceDisplay) {
      balanceDisplay.textContent = `Balls: ${this.throwsLeft}`;
    }

    const winsDisplay = document.getElementById("wins-display");
    if (winsDisplay) {
      animateNumber({
        element: winsDisplay,
        targetValue: to,
        startValue: from,
        duration: 1500,
        easing: "easeOutCubic",

        onComplete: () => {},
      });
    }
  }

  createSliders() {
    const slidersContainer = document.getElementById("sliders-container");
    if (!slidersContainer) {
      console.error("Sliders container not found, cannot create sliders");
      return;
    }

    slidersContainer.innerHTML = "";

    this.ballCount = 1;

    this.rowsSlider = null;
    this.ballsSlider = null;
    this.sliders = [];

    slidersContainer.style.display = "none";

    const betButton = document.getElementById("bet-button");
    if (betButton) {
      betButton.textContent = "PLAY";
    }
  }

  createDebugInput() {
    if (!config.showDebugInput) return;

    const existingContainer = document.querySelector(".debug-input-container");
    if (existingContainer) {
      console.debug("Debug input container already exists, skipping creation");
      return;
    }

    const debugContainer = document.createElement("div");
    debugContainer.className = "debug-input-container";

    const debugInput = document.createElement("input");
    debugInput.type = "text";
    debugInput.id = "debug-target-bins";
    debugInput.className = "debug-input";
    debugInput.placeholder = "Bin numbers separated by comma (1,2,3...)";

    debugContainer.appendChild(debugInput);

    const betButton = document.getElementById("bet-button");
    if (betButton && betButton.parentNode) {
      betButton.parentNode.insertBefore(debugContainer, betButton);
    }
  }

  setupBetButton() {
    const betButton = document.getElementById("bet-button");
    if (!betButton) {
      console.error("Bet button not found, cannot setup");
      return;
    }

    const newButton = betButton.cloneNode(true);
    betButton.parentNode.replaceChild(newButton, betButton);

    newButton.className = "bet-button";

    // newButton.textContent = `Bet (${this.throwsLeft})`;
    newButton.textContent = `PLAY`;

    if (this.throwsLeft <= 0 || config.autoMode || this.isLogoAnimating()) {
      newButton.disabled = true;
      newButton.style.opacity = "0.5";
      newButton.style.cursor = "not-allowed";
    }

    const self = this;

    function handleBetClick(event) {
      event.preventDefault(); // Предотвращаем дублирование событий
      console.debug("====== BET BUTTON PRESSED ======");
      console.debug("Press time:", new Date().toISOString());
      console.debug("Event type:", event.type);
      console.debug("Selected balls:", self.ballCount);

      if (self.isLogoAnimating()) {
        console.debug("Logo animation still running, bet blocked");
        return;
      }

      if (self.throwsLeft <= 0) {
        console.debug(
          "🚫 User ran out of balls - throwsLeft:",
          self.throwsLeft
        );
        return;
      }

      const betCost = self.ballCount * self.ballCost;
      if (self.balance < betCost) {
        console.debug(
          `Insufficient funds for bet: required ${betCost}, available ${self.balance}`
        );
        return;
      }

      if (!self.isFirstBetPlaced) {
        self.isFirstBetPlaced = true;
        if (self.rowsSlider) {
          self.rowsSlider.disabled = true;
          self.rowsSlider.style.opacity = "0.5";
          self.rowsSlider.style.cursor = "not-allowed";
          console.debug("Rows slider blocked after first throw");
        }
      }

      self.isGameActive = true;
      self.disableAllSliders();

      let checkInterval = setInterval(() => {
        if (
          self.game.physicsManager &&
          self.game.physicsManager.getActiveBallsCount() === 0
        ) {
          self.isGameActive = false;
          console.debug("Game finished, sliders updated (interval)");
          clearInterval(checkInterval);
          checkInterval = null;
        }
      }, 500);

      if (self.game.gameLogic) {
        self.game.gameLogic.on("gameFinished", function handleGameFinished() {
          self.isGameActive = false;
          console.debug("Game finished, sliders updated (event)");
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }
          self.game.gameLogic.off("gameFinished", handleGameFinished);
        });
      }

      self.currentThrowGoing = true;

      self.throwsLeft -= self.ballCount;
      self.throwsLeft = Math.max(0, self.throwsLeft);

      self.previousBalance = self.balance;
      self.balance -= betCost;

      self.updateThrowsAndWins();

      // Обновляем текст кнопки
      const betButton = document.getElementById("bet-button");
      if (betButton) {
        // betButton.textContent = `Bet (${self.throwsLeft})`;
        betButton.textContent = `PLAY`;
      }

      console.debug(
        `Bet placed: ${betCost} (${self.ballCount} balls at ${self.ballCost})`
      );
      console.debug(`New balance (under the hood): ${self.balance}`);
      console.debug(`Balls remaining: ${self.throwsLeft}`);

      let targetBins = null;
      if (config.showDebugInput) {
        const debugInput = document.getElementById("debug-target-bins");
        if (debugInput && debugInput.value.trim()) {
          const inputValues = debugInput.value
            .split(",")
            .map((num) => {
              return parseInt(num.trim(), 10) - 1;
            })
            .filter((num) => {
              return !isNaN(num) && num >= 0 && num < config.binCount;
            });

          if (inputValues.length > 0) {
            targetBins = inputValues;
            console.debug(
              "Using target bins from debug input:",
              targetBins.map((i) => i + 1).join(", ")
            );
          }
        }
      }

      if (
        !targetBins &&
        config.planTargetsBins &&
        config.planTargetsBins.length > 0
      ) {
        targetBins = [];
        for (let i = 0; i < self.ballCount; i++) {
          if (self.planTargetBinsIndex < config.planTargetsBins.length) {
            const next = config.planTargetsBins[self.planTargetBinsIndex++];
            console.debug(
              `Taking target bin at index ${
                self.planTargetBinsIndex - 1
              }: ${next}`
            );
            if (typeof next === "number") {
              targetBins.push(next);
            }
          } else {
            console.debug(
              `⚠️ planTargetBinsIndex ${self.planTargetBinsIndex} exceeds array length ${config.planTargetsBins.length}`
            );
            break;
          }
        }

        console.debug(
          "Using planned bins from planTargetsBins:",
          targetBins.map((i) => i + 1).join(", ")
        );
        console.debug("Current planTargetBinsIndex:", self.planTargetBinsIndex);
      }

      if (targetBins) {
        const originalTargetBins = config.targetBins;
        config.targetBins = targetBins;
        self.game.placeBet(self.ballCount);
        config.targetBins = originalTargetBins;
      } else {
        self.game.placeBet(self.ballCount);
      }

      if (self.throwsLeft <= 0 || self.currentThrowGoing) {
        const betButton = document.getElementById("bet-button");
        if (betButton) {
          betButton.disabled = true;
          betButton.style.opacity = "0.5";
          betButton.style.cursor = "not-allowed";
          betButton.style.pointerEvents = "none";
        }
      }

      self.updateRemainingBalls();
    }

    // Сохраняем функцию для программного вызова
    this.betClickHandler = handleBetClick;

    // Добавляем обработчики для touch и click событий только в обычном режиме
    if (!config.autoMode) {
      newButton.addEventListener("click", handleBetClick);
      newButton.addEventListener("touchend", handleBetClick);
    }
  }

  setupRecieveButton() {
    const recieveButton = document.getElementById("recieve-button");

    if (!recieveButton) {
      console.error("Recieve button not found, cannot setup");
      return;
    }

    const newButton = recieveButton.cloneNode(true);
    recieveButton.parentNode.replaceChild(newButton, recieveButton);

    newButton.className = "plinko-recieve__btn";

    // newButton.textContent = `Bet (${this.throwsLeft})`;
    newButton.textContent = `RECIEVE`;

    if (this.throwsLeft <= 0 || config.autoMode || this.isLogoAnimating()) {
      newButton.disabled = true;
      newButton.style.opacity = "0.5";
      newButton.style.cursor = "not-allowed";
    }

    const self = this;

    function handleRecieveClick() {
      const recieveElement = document.getElementById("plinko-recieve");

      const recieveAmount = 1500;

      self.addWin(recieveAmount);
      self.previousBalance = self.balance;

      recieveElement.classList.add("hide");
      self.showPlinkoGame();
    }

    // Добавляем обработчики для touch и click событий только в обычном режиме
    if (!config.autoMode) {
      newButton.addEventListener("click", handleRecieveClick);
      // newButton.addEventListener("touchend", handleRecieveClick);
    }
  }

  getBallCount() {
    return this.ballCount;
  }

  programmaticBetClick() {
    if (this.betClickHandler && config.autoMode) {
      console.debug("🤖 Auto mode: programmatic bet click");

      // Создаем фейковый event
      const fakeEvent = {
        preventDefault: () => {},
        type: "programmatic",
      };

      this.betClickHandler(fakeEvent);
    }
  }

  isLogoAnimating() {
    // Check if logo animation manager exists and intro animation is not cleared
    if (window.logoAnimationManager) {
      return (
        window.logoAnimationManager.isAnimated &&
        !window.logoAnimationManager.introCleared
      );
    }
    return false;
  }

  updateDimensions() {
    this.updateThrowsAndWins();
    this.updateRemainingBalls();
  }

  hasActiveBalls() {
    const active =
      this.game &&
      this.game.physicsManager &&
      this.game.physicsManager.getActiveBallsCount();
    console.debug("✅ Active balls count:", active);
    return active > 0;
  }

  addWin(amount) {
    // Определяем валюту по размеру бонуса
    if (amount >= 100) {
      this.winsEUR += amount;
    }

    this.winsAmount += amount;

    this.balance += amount;

    // this.updateThrowsAndWins();
    this.updateRemainingBalls();

    this.ballsInBinsCount++;

    console.debug(
      `🔢 Ball in bin! Current counter: ${this.ballsInBinsCount}, throws left: ${this.throwsLeft}`
    );

    const winTextElement = document.getElementById("wins-display");
    if (!winTextElement) return;

    // Формируем текст с раздельными валютами
    let newText = CURRENCY;

    if (this.winsEUR > 0) {
      playCountSound();
      animateNumber({
        element: winTextElement,
        targetValue: this.balance,
        startValue: this.previousBalance,
        duration: 1500,
        easing: "easeOutCubic",

        onComplete: () => {
          this.currentThrowGoing = false;

          const betButton = document.getElementById("bet-button");

          if (betButton && this.throwsLeft > 0) {
            betButton.disabled = false;
            betButton.style.opacity = "1";
            betButton.style.cursor = "pointer";
            betButton.style.pointerEvents = "auto";
          }
        },
      });
    }
    // } else if (this.winsEUR > 0) {
    //     newText += `${this.winsEUR}EUR`;
    // } else if (this.winsFS > 0) {
    //     newText += `${this.winsFS}FS`;
    // } else {
    //     newText += "0";
    // }

    console.debug(
      `🎯 WINS-DISPLAY UPDATE: winsEUR=${this.winsEUR}, winsFS=${this.winsFS}, newText="${newText}"`
    );

    if (winTextElement.textContent !== newText) {
      // winTextElement.classList.remove("wins-display-flash");

      winTextElement.textContent = newText;
    }

    const totalBalls = config.maxBalls || 5;
    if (this.ballsInBinsCount === totalBalls && !this.hasActiveBalls()) {
      console.debug("✅ All conditions for modal window met!");

      // Двойное мигание wins-display перед модалкой
      const winsDisplay = document.getElementById("wins-display");
      if (winsDisplay) {
        setTimeout(() => {
          // Первое мигание
          // winsDisplay.style.transition = "all 0.2s ease-out";
          // winsDisplay.style.boxShadow =
          //   "0 0 30px rgba(0, 255, 0, 1), 0 0 60px rgba(0, 255, 0, 0.7)";
          // winsDisplay.style.transform = "scale(1.15)";

          setTimeout(() => {
            // winsDisplay.style.boxShadow = "";
            // winsDisplay.style.transform = "";

            // Второе мигание
            setTimeout(() => {
              // winsDisplay.style.boxShadow =
              //   "0 0 30px rgba(0, 255, 0, 1), 0 0 60px rgba(0, 255, 0, 0.7)";
              // winsDisplay.style.transform = "scale(1.15)";

              setTimeout(() => {
                // winsDisplay.style.boxShadow = "";
                // winsDisplay.style.transform = "";
                // Показываем модалку после мигания
                // setTimeout(() => {
                //   this.showWinModal(this.winsAmount);
                //   console.debug("🎉 Win modal shown after double flash");
                // }, 300);
              }, 200);
            }, 300);
          }, 200);
        }, 1500);
      } else {
        setTimeout(() => {
          console.debug("🎉 Win modal shown after last ball");

          this.showWinModal(this.winsAmount);
          this.hidePlinkoGame();
        }, 2000);
      }
    }
  }

  disableAllSliders() {
    this.sliders.forEach((slider) => {
      if (slider) {
        if (slider === this.rowsSlider && this.isFirstBetPlaced) {
          return;
        }

        slider.disabled = true;
        slider.style.opacity = "0.5";
        slider.style.cursor = "not-allowed";
      }
    });
    console.debug("All sliders blocked during game");
  }

  enableSlidersAfterGame() {
    this.sliders.forEach((slider) => {
      if (!slider) return;

      if (slider === this.rowsSlider && this.isFirstBetPlaced) {
        return;
      }

      if (slider === this.ballsSlider) {
        const maxBalls = Math.max(1, this.throwsLeft);
        slider.max = maxBalls.toString();

        if (this.ballCount > this.throwsLeft) {
          this.ballCount = this.throwsLeft;
          slider.value = this.ballCount.toString();
        }

        if (this.throwsLeft <= 0) {
          slider.disabled = true;
          slider.style.opacity = "0.5";
          slider.style.cursor = "not-allowed";
          return;
        }
      }

      slider.disabled = false;
      slider.style.opacity = "1";
      slider.style.cursor = "pointer";
    });

    const betButton = document.getElementById("bet-button");
    if (betButton) {
      // betButton.textContent = `Bet (${this.throwsLeft})`;
      betButton.textContent = `PLAY`;
    }

    console.debug("Sliders updated after game finished");
  }

  resetPlanTargetBinsIndex() {
    this.planTargetBinsIndex = 0;
    console.debug("planTargetsBins index reset");
  }

  cleanup() {
    this.ballsInBinsCount = 0;

    const containers = [
      ".controls-container",
      ".sliders-container",
      ".money-bet-container",
      ".debug-input-container",
    ];

    containers.forEach((selector) => {
      const elements = this.game.container.querySelectorAll(selector);
      elements.forEach((element) => {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    });

    const winsDisplay = document.getElementById("wins-display");
    if (winsDisplay) {
      winsDisplay.textContent = `${CURRENCY}${this.balance}`;
    }

    if (this.winModalManager) {
      this.winModalManager.cleanup();
      this.winModalManager = null;
    }

    const betButton = document.getElementById("bet-button");
    if (betButton) {
      const newButton = betButton.cloneNode(false);
      newButton.textContent = "PLAY";
      if (betButton.parentNode) {
        betButton.parentNode.replaceChild(newButton, betButton);
      }
    }

    this.rowsSlider = null;
    this.ballsSlider = null;
    this.sliders = [];
    this.planTargetBinsIndex = 0;
  }
}

export default UIManager;
