/**
 * Рассчитывает множитель выигрыша для корзины
 * @param {number} binIndex - Индекс корзины
 * @param {number} totalBins - Общее количество корзин
 * @returns {number} - Множитель выигрыша
 */
function calculateMultiplier(binIndex, totalBins) {
    
    const middle = (totalBins - 1) / 2;
    const distance = Math.abs(binIndex - middle);

    
    const normalizedDistance = distance / middle;

    
    
    const multiplier = 1 + Math.floor(15 * normalizedDistance * normalizedDistance);

    return Math.max(1, multiplier);
}

const CURRENCY = "€";

//Объект аниматора для анимации цифр, чтобы сделать их все внутри одного RAF
  const animationManager = {
    animations: new Map(),
    isAnimating: false,

    // Функция для добавления анимации
    addAnimation: function (id, animateFunction) {
      this.animations.set(id, animateFunction);
      if (!this.isAnimating) {
        this.startAnimations();
      }
    },

    // Функция для запуска анимаций
    startAnimations: function () {
      if (this.animations.size === 0) {
        this.isAnimating = false;
        return;
      }

      this.isAnimating = true;
      requestAnimationFrame(this.updateAnimations.bind(this));
    },

    // Функция обновления всех анимаций
    updateAnimations: function (currentTime) {
      const completedAnimations = [];

      // Обновляем все анимации
      this.animations.forEach((animateFunction, id) => {
        const isComplete = animateFunction(currentTime);
        if (isComplete) {
          completedAnimations.push(id);
        }
      });

      // Удаляем завершенные анимации
      completedAnimations.forEach((id) => {
        this.animations.delete(id);
      });

      // Продолжаем анимацию, если есть активные анимации
      if (this.animations.size > 0) {
        requestAnimationFrame(this.updateAnimations.bind(this));
      } else {
        this.isAnimating = false;
      }
    },
  };

  const animateNumber = (options) => {
    const {
      element,
      targetValue,
      startValue,
      duration = 2000,
      easing = "easeOutCubic",
      direction = "auto",
      onUpdate = null,
      onComplete = null,
    } = options;

    const startTime = performance.now();
    const id = Symbol("animation"); // Уникальный идентификатор для анимации

    // Автоматическое определение направления
    const actualDirection =
      direction === "auto"
        ? targetValue >= startValue
          ? "asc"
          : "desc"
        : direction;

    // Функции easing
    const easingFunctions = {
      easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
    };

    const ease = easingFunctions[easing] || easingFunctions.easeOutCubic;

    // Функция анимации, возвращает true если анимация завершена
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = ease(progress);

      let currentNumber;

      // Расчет значения в зависимости от направления
      if (actualDirection === "desc") {
        currentNumber = Math.floor(
          startValue - (startValue - targetValue) * easedProgress
        );
      } else {
        currentNumber = Math.floor(
          startValue + (targetValue - startValue) * easedProgress
        );
      }

      element.textContent = `${CURRENCY}${currentNumber}`;

      // Callback обновления
      if (onUpdate) {
        onUpdate(currentNumber, progress);
      }

      if (progress < 1) {
        return false; // Анимация продолжается
      } else {
        // Callback завершения
        if (onComplete) {
          onComplete();
        }
        return true; // Анимация завершена
      }
    }

    // Добавляем анимацию в менеджер
    animationManager.addAnimation(id, animate);
  };



export { calculateMultiplier, animateNumber, CURRENCY};



