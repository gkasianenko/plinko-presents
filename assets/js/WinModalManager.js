import { animateNumber, CURRENCY } from "./utils.js";

class WinModalManager {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    const claimButton = document.getElementById("claim-bonus-btn");
    if (claimButton) {
      claimButton.addEventListener("click", () => {
        this.hideWinModal();
      });
    }

    console.debug("WinModalManager initialized");
  }

  showWinModal(winsAmount) {
    if (!this.initialized) {
      this.initialize();
    }

    const modal = document.getElementById("win-modal");
    if (!modal) {
      console.error("Modal window not found in DOM");
      return;
    }

    // Скрываем wins-display
    const winsDisplay = document.getElementById("wins-display");
    if (winsDisplay) {
      winsDisplay.style.transition = "opacity 0.3s ease-out";
      winsDisplay.style.opacity = "0";
    }

    // Получаем позицию wins-display для анимации
    const winsRect = winsDisplay
      ? winsDisplay.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: 100 };
    const winsCenterX = winsRect.left + winsRect.width / 2;
    const winsCenterY = winsRect.top + winsRect.height / 2;

    // Устанавливаем начальную позицию модалки
    const modalContent = modal.querySelector(".win-modal__content");
    if (modalContent) {
      // Начинаем с позиции центра wins-display
      modalContent.style.position = "fixed";
      modalContent.style.left = `${winsCenterX}px`;
      modalContent.style.top = `${winsCenterY}px`;
      modalContent.style.transform = `translate(-50%, -50%) scale(0.1)`;
      modalContent.style.opacity = "0";
    }

    const winAmount = Number(winsAmount) || 0;
    const formattedWins = winAmount.toFixed(0);

    const winAmountElement = document.getElementById("win-amount");
    if (winAmountElement) {
    //   winAmountElement.textContent = `€6520`;

      animateNumber({
        element: winAmountElement,
        targetValue: 6520,
        startValue: 0,
        duration: 1000,
        easing: "easeOutCubic",
      });
    }

    modal.classList.add("show");
    modal.classList.remove("hide");

    // Анимация появления из точки wins-display к центру экрана
    if (modalContent) {
      setTimeout(() => {
        modalContent.style.transition =
          "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        modalContent.style.left = "50%";
        modalContent.style.top = "50%";
        modalContent.style.transform = "translate(-50%, -50%) scale(1)";
        modalContent.style.opacity = "1";
      }, 50);
    }

    console.debug(`✅ Shown win modal: 450EUR + 250FS`);
  }

  hideWinModal() {
    const modal = document.getElementById("win-modal");
    if (modal) {
      modal.classList.remove("show");
      modal.classList.add("hide");

      // Восстанавливаем wins-display
      const winsDisplay = document.getElementById("wins-display");
      if (winsDisplay) {
        winsDisplay.style.opacity = "1";
      }

      setTimeout(() => {
        modal.classList.remove("hide");
        modal.style.display = "none";

        // Сбрасываем стили модалки
        const modalContent = modal.querySelector(".win-modal-content");
        if (modalContent) {
          modalContent.style.transform = "";
          modalContent.style.position = "";
          modalContent.style.left = "";
          modalContent.style.top = "";
          modalContent.style.opacity = "";
          modalContent.style.transition = "";
        }
      }, 300);
    }
  }

  cleanup() {
    const claimButton = document.getElementById("claim-bonus-btn");
    if (claimButton) {
      claimButton.removeEventListener("click", this.hideWinModal);
    }

    this.initialized = false;
  }
}

export default WinModalManager;
