
import { config } from "./config.js";
import { calculateMultiplier } from "./utils.js";
import { playBinDropSound } from "./base64sounds.js";

const { Bodies, World } = Matter;

class BinsManager {
  constructor(gameInstance, engineWorld) {
    this.game = gameInstance;
    this.world = engineWorld;
    this.bins = [];
    this.dividers = [];
    this.binWidth = 0;
    this.binNumbers = [];
    this.binLabels = [];
    this.blockAnimations = {};
    this.binHits = {};
    this.htmlBins = [];
  }

  getBinColor(index, total) {
    const middle = (total - 1) / 2;
    const distance = Math.abs(index - middle) / middle;

    if (distance < 0.3) {
      return `rgb(255, 255, 0)`;
    }

    const red = Math.round(255);
    const green = Math.round(6 * (1 - distance));
    const blue = 0;

    return `rgb(${red}, ${green}, ${blue})`;
  }

  getDistributedValues(logicalBinCount) {
    const costedBins = config.costedBins || [];

    console.debug(`📊 getDistributedValues DEBUG:`);
    console.debug(`  logicalBinCount = ${logicalBinCount}`);
    console.debug(`  costedBins = [${costedBins.join(", ")}]`);

    if (!costedBins.length) {
      const result = [];
      for (let i = 0; i < logicalBinCount; i++) {
        result.push(calculateMultiplier(i, logicalBinCount));
      }
      console.debug(
        `  Using calculateMultiplier, result = [${result.join(", ")}]`
      );
      return result;
    }

    const distributedValues = new Array(logicalBinCount);

    const isEven = logicalBinCount % 2 === 0;
    const middle = Math.floor(logicalBinCount / 2);

    console.debug(`  isEven = ${isEven}, middle = ${middle}`);

    for (let i = 0; i < logicalBinCount; i++) {
      let valueIndex;

      if (isEven) {
        if (i < middle) {
          valueIndex = middle - i - 1;
        } else {
          valueIndex = i - middle;
        }
      } else {
        if (i === middle) {
          valueIndex = 0;
        } else if (i < middle) {
          valueIndex = middle - i;
        } else {
          valueIndex = i - middle;
        }
      }

      if (valueIndex >= costedBins.length) {
        valueIndex = costedBins.length - 1;
      }

      distributedValues[i] = costedBins[valueIndex];

      if (i === 2 || i === logicalBinCount - 3) {
        console.debug(
          `  ⭐ 200FS bin: i=${i}, valueIndex=${valueIndex}, multiplier=${costedBins[valueIndex]}`
        );
      }
    }

    console.debug(
      `  Final distributedValues = [${distributedValues.join(", ")}]`
    );
    return distributedValues;
  }

  createBins() {
    this.clearBins();

    const lastRowInfo = this.game.pyramidManager.getLastRowInfo();
    const logicalBinCount = lastRowInfo.pegCount - 1;
    const actualBinCount = logicalBinCount - 0;
    config.binCount = logicalBinCount;

    console.debug(
      `Creating bins: logical count = ${logicalBinCount}, actual count = ${actualBinCount}`
    );
    console.debug(`Last row positions:`, lastRowInfo.positions);

    const distributedValues = this.getDistributedValues(logicalBinCount);
    console.debug(`Distributed values for bins:`, distributedValues);

    this.binHits = {};
    for (let i = 0; i < logicalBinCount; i++) {
      this.binHits[i] = 0;
    }

    const binTopY = lastRowInfo.depth + config.binDistanceFromLastRow;
    const blockHeight = config.binHeight;
    const gapBetweenBlocks = 4;

    const physicalBins = [];

    const binsContainer = document.getElementById("bins-container");
    if (!binsContainer) {
      console.error('Bins container with id="bins-container" not found');
      return;
    }

    binsContainer.innerHTML = "";
    this.htmlBins = [];

    const leftX1 = lastRowInfo.positions[0];
    const rightX1 = lastRowInfo.positions[1];
    const width1 = rightX1 - leftX1 - gapBetweenBlocks * 2;
    const centerX1 = (leftX1 + rightX1) / 2;
    const binColor1 = this.getBinColor(0, logicalBinCount);
    const multiplier1 = distributedValues[0];

    const leftBlock = Bodies.rectangle(
      centerX1,
      binTopY + blockHeight / 2,
      width1,
      blockHeight,
      {
        isStatic: true,
        render: {
          fillStyle: "transparent",
          lineWidth: 0,
          strokeStyle: "transparent",
        },
        label: `bin_0`,
        isSensor: false,
        chamfer: { radius: 4 },
        friction: config.blockFriction,
        multiplier: multiplier1,
        logicalBinIndex: 0,
        collisionFilter: {
          category: 0x0008,
          mask: 0xffffffff,
        },
      }
    );

    physicalBins.push(leftBlock);
    World.add(this.world, leftBlock);
    this.blockAnimations[`bin_0`] = {
      originalColor: binColor1,
      isAnimating: false,
    };

    const leftBinElement = document.createElement("div");
    leftBinElement.className = "bin";
    leftBinElement.dataset.binIndex = "0";
    // leftBinElement.style.backgroundColor = binColor1;
    // leftBinElement.style.backgroundImage = binBackground1;

    leftBinElement.innerHTML = `<span class="bin-label-new">x100</span>`;
    leftBinElement.classList.add("bin-slide-from-left");
    leftBinElement.classList.add("bin-slide-from-left--1");
    binsContainer.appendChild(leftBinElement);
    this.htmlBins.push(leftBinElement);

    for (let i = 1; i < actualBinCount - 1; i++) {
      const adjustedIndex = i + 0;

      const leftX = lastRowInfo.positions[adjustedIndex];
      const rightX = lastRowInfo.positions[adjustedIndex + 1];
      const width = rightX - leftX - gapBetweenBlocks;
      const centerX = (leftX + rightX) / 2;
      const binColor = this.getBinColor(adjustedIndex, logicalBinCount);

      const multiplier = distributedValues[adjustedIndex];

      const block = Bodies.rectangle(
        centerX,
        binTopY + blockHeight / 2,
        width,
        blockHeight,
        {
          isStatic: true,
          render: {
            fillStyle: "transparent",
            lineWidth: 0,
            strokeStyle: "transparent",
          },
          label: `bin_${i}`,
          isSensor: false,
          chamfer: { radius: 4 },
          friction: config.blockFriction,
          multiplier: multiplier,
          logicalBinIndex: adjustedIndex,
          collisionFilter: {
            category: 0x0008,
            mask: 0xffffffff,
          },
        }
      );

      physicalBins.push(block);
      World.add(this.world, block);
      this.blockAnimations[`bin_${i}`] = {
        originalColor: binColor,
        isAnimating: false,
      };

      const binElement = document.createElement("div");
      binElement.className = "bin";
      binElement.dataset.binIndex = adjustedIndex.toString();
      // binElement.style.backgroundColor = binColor;

      let labelText;

      if (adjustedIndex <= 1) {
        labelText = "x10";
      } else if (adjustedIndex >= logicalBinCount - 2) {
        labelText = "x5";
      } else if (adjustedIndex === 2) {
        labelText = "x3";
      } else if (adjustedIndex === logicalBinCount - 3) {
        labelText = "x3";
      } else if (adjustedIndex === 3) {
        labelText = "x2";
      } else if (adjustedIndex === logicalBinCount - 4) {
        labelText = "x2";
      } else {
        labelText = "x1";
      }

      // if (adjustedIndex <= 1) {

      //     labelText = adjustedIndex;
      // } else if (adjustedIndex >= logicalBinCount - 2) {

      //     labelText = adjustedIndex;
      // } else if (adjustedIndex === 2) {

      //     labelText = adjustedIndex;
      // } else if (adjustedIndex === logicalBinCount - 3) {

      //     labelText = adjustedIndex;
      // } else if (adjustedIndex === 3) {

      //     labelText = adjustedIndex;
      // } else if (adjustedIndex === logicalBinCount - 4) {

      //     labelText = adjustedIndex;
      // } else {

      //     labelText = adjustedIndex;
      // }

      binElement.innerHTML = `<span class="bin-label-new">${labelText}</span>`;

      // Определяем направление слайда
      const isEven = logicalBinCount % 2 === 0;
      const middle = Math.floor(logicalBinCount / 2);

      if (isEven) {
        // При четном количестве нет центральной корзины
        if (adjustedIndex < middle) {

          binElement.classList.add("bin-slide-from-left");
          binElement.classList.add(`bin-slide-from-left--${adjustedIndex - 1}`);
        } else {
          binElement.classList.add("bin-slide-from-right");
          binElement.classList.add(
            `bin-slide-from-right--${adjustedIndex - 1}`
          );
        }
      } else {
        // При нечетном количестве есть центральная корзина
        if (adjustedIndex < middle) {
          binElement.classList.add("bin-slide-from-left");
          binElement.classList.add(`bin-slide-from-left--${adjustedIndex + 1}`);
        } else if (adjustedIndex > middle) {
          binElement.classList.add("bin-slide-from-right");
          binElement.classList.add(
            `bin-slide-from-right--${adjustedIndex + 1}`
          );
        } else {
          binElement.classList.add("bin-scale-center");
          binElement.classList.add("bin-scale-center");
        }
      }

      binsContainer.appendChild(binElement);
      this.htmlBins.push(binElement);
    }

    const posLength = lastRowInfo.positions.length;
    const rightBinIdx = Math.min(logicalBinCount, posLength - 1);
    const leftX2 =
      lastRowInfo.positions[rightBinIdx - 2] ||
      lastRowInfo.positions[posLength - 3];
    const rightX2 =
      lastRowInfo.positions[rightBinIdx] ||
      lastRowInfo.positions[posLength - 1];

    console.debug(
      `Right bin positions: leftX2=${leftX2}, rightX2=${rightX2}, rightBinIdx=${rightBinIdx}, logicalBinCount=${logicalBinCount}`
    );

    const width2 = rightX2 - leftX2 - gapBetweenBlocks;
    const centerX2 = (leftX2 + rightX2) / 2;
    const binColor2 = this.getBinColor(logicalBinCount - 2, logicalBinCount);

    const multiplier2 = distributedValues[logicalBinCount - 1];

    const rightBlock = Bodies.rectangle(
      centerX2,
      binTopY + blockHeight / 2,
      width2,
      blockHeight,
      {
        isStatic: true,
        render: {
          fillStyle: "transparent",
          lineWidth: 0,
          strokeStyle: "transparent",
        },
        label: `bin_${actualBinCount - 1}`,
        isSensor: false,
        chamfer: { radius: 4 },
        friction: config.blockFriction,
        multiplier: multiplier2,
        logicalBinIndex: logicalBinCount - 1,
        collisionFilter: {
          category: 0x0008,
          mask: 0xffffffff,
        },
      }
    );

    physicalBins.push(rightBlock);
    World.add(this.world, rightBlock);
    this.blockAnimations[`bin_${actualBinCount - 1}`] = {
      originalColor: binColor2,
      isAnimating: false,
    };

    const rightBinElement = document.createElement("div");
    rightBinElement.className = "bin";
    rightBinElement.dataset.binIndex = (logicalBinCount - 1).toString();
    // rightBinElement.style.backgroundColor = binColor2;

    rightBinElement.innerHTML = `<span class="bin-label-new">x100</span>`;
    rightBinElement.classList.add(`bin-slide-from-right`);
    rightBinElement.classList.add(
      `bin-slide-from-right--${logicalBinCount}`
    );
    binsContainer.appendChild(rightBinElement);
    this.htmlBins.push(rightBinElement);

    const floor = Bodies.rectangle(
      this.game.width / 2,
      this.game.height + config.wallThickness / 2,
      this.game.width,
      config.wallThickness,
      {
        isStatic: true,
        render: {
          fillStyle: config.colors.floor || "#444444",
        },
        label: "floor",
        collisionFilter: {
          category: 0x0004,
          mask: 0xffffffff,
        },
      }
    );

    physicalBins.push(floor);
    World.add(this.world, floor);

    this.bins = physicalBins;

    // Запускаем анимацию появления корзин
    this.animateBinsAppearance();
  }

  animateBinsAppearance() {
    // Небольшая задержка для начала анимации
    setTimeout(() => {
      // Сортируем корзины по их индексам
      const sortedBins = [...this.htmlBins].sort((a, b) => {
        return parseInt(a.dataset.binIndex) - parseInt(b.dataset.binIndex);
      });

      const logicalBinCount = config.binCount;
      const isEven = logicalBinCount % 2 === 0;
      const animationOrder = [];

      if (isEven) {
        // Четное количество - начинаем с двух центральных корзин
        const leftCenter = Math.floor(logicalBinCount / 2) - 1;
        const rightCenter = Math.floor(logicalBinCount / 2);

        const leftCenterBin = sortedBins.find(
          (bin) => parseInt(bin.dataset.binIndex) === leftCenter
        );
        const rightCenterBin = sortedBins.find(
          (bin) => parseInt(bin.dataset.binIndex) === rightCenter
        );

        if (leftCenterBin) animationOrder.push(leftCenterBin);
        if (rightCenterBin) animationOrder.push(rightCenterBin);

        // Затем расходимся от центра к краям
        for (let distance = 1; distance < logicalBinCount / 2; distance++) {
          const leftIndex = leftCenter - distance;
          const rightIndex = rightCenter + distance;

          const leftBin = sortedBins.find(
            (bin) => parseInt(bin.dataset.binIndex) === leftIndex
          );
          const rightBin = sortedBins.find(
            (bin) => parseInt(bin.dataset.binIndex) === rightIndex
          );

          if (leftBin) animationOrder.push(leftBin);
          if (rightBin) animationOrder.push(rightBin);
        }
      } else {
        // Нечетное количество - начинаем с центральной корзины
        const middle = Math.floor(logicalBinCount / 2);

        for (
          let distance = 0;
          distance < Math.ceil(logicalBinCount / 2);
          distance++
        ) {
          if (distance === 0) {
            const centerBin = sortedBins.find(
              (bin) => parseInt(bin.dataset.binIndex) === middle
            );
            if (centerBin) animationOrder.push(centerBin);
          } else {
            const leftIndex = middle - distance;
            const rightIndex = middle + distance;

            const leftBin = sortedBins.find(
              (bin) => parseInt(bin.dataset.binIndex) === leftIndex
            );
            const rightBin = sortedBins.find(
              (bin) => parseInt(bin.dataset.binIndex) === rightIndex
            );

            if (leftBin) animationOrder.push(leftBin);
            if (rightBin) animationOrder.push(rightBin);
          }
        }
      }

      // Запускаем анимацию в нужном порядке
      console.debug(
        "Animation order:",
        animationOrder.map((bin) => parseInt(bin.dataset.binIndex))
      );
      animationOrder.forEach((bin, index) => {
        setTimeout(() => {
          const binIndex = parseInt(bin.dataset.binIndex);
          // console.log(`Animating bin ${binIndex}, has classes:`, bin.classList.toString());
          if (
            bin.classList.contains("bin-slide-from-left") ||
            bin.classList.contains("bin-slide-from-right")
          ) {
            bin.classList.add("bin-slide-animate");
          } else if (bin.classList.contains("bin-scale-center")) {
            bin.classList.add("bin-scale-animate");
          }
        }, index * 80); // Задержка между корзинами
      });
    }, 200);
  }

  logBinHit(binIndex) {
    if (this.binHits.hasOwnProperty(binIndex)) {
      this.binHits[binIndex]++;
    }
  }

  animateBlockFlash(binIndex) {
    this.logBinHit(binIndex);

    let blockId;
    const logicalBinCount = config.binCount;

    if (binIndex <= 1) {
      blockId = `bin_0`;
    } else if (binIndex >= logicalBinCount - 2) {
      const actualBinCount = logicalBinCount - 2;
      blockId = `bin_${actualBinCount - 1}`;
    } else {
      blockId = `bin_${binIndex - 1}`;
    }

    let htmlBin = null;
    for (const bin of this.htmlBins) {
      const binIndexFromDataset = parseInt(bin.dataset.binIndex);
      if (
        binIndexFromDataset === binIndex ||
        // (binIndex === 1 && binIndexFromDataset === 0) ||
        (binIndex === logicalBinCount - 2 &&
          binIndexFromDataset === logicalBinCount - 1)
      ) {
        htmlBin = bin;
        break;
      }
    }

    if (htmlBin) {
      const originalBackgroundColor =
        window.getComputedStyle(htmlBin).backgroundColor;
      const originalPosition = parseInt(htmlBin.style.top || "0");

      // htmlBin.classList.add("bin-flash");

      // Принудительно задаем transition и transform с !important
      htmlBin.style.setProperty(
        "transition",
        "transform 0.1s ease-out",
        "important"
      );
      htmlBin.style.setProperty("transform", "translateY(8px)", "important");
      // htmlBin.style.boxShadow =
      //   "0 0 30px rgba(0, 255, 0, 0.9), 0 0 60px rgba(0, 255, 0, 0.6), 0 0 90px rgba(0, 255, 0, 0.3)";

      const multiplier = this.getMultiplier(binIndex);
      const labelElement = htmlBin.querySelector(".bin-label-new");
      const labelText = labelElement
        ? labelElement.textContent
        : `x${multiplier}`;

      // Вычисляем выигрыш из лейбла для всех лунок
      let winAmount = 0;
      console.debug(`🏷️ LABEL DEBUG: labelText="${labelText}"`);
      if (labelText.includes("x100")) {
        winAmount = 2030;

        console.debug(`🏷️ Detected x100, winAmount=${winAmount}`);

      } else if (labelText.includes("x2")) {
        winAmount = 50;

        console.debug(`🏷️ Detected x2, winAmount=${winAmount}`);
      } else if (labelText.includes("x3")) {
        winAmount = 90;

        console.debug(`🏷️ Detected x3, winAmount=${winAmount}`);
      } else if (labelText.includes("x5")) {
        winAmount = 130;

        console.debug(`🏷️ Detected x5, winAmount=${winAmount}`);
      } else if (labelText.includes("x10")) {
        winAmount = 250;

        console.debug(`🏷️ Detected x10, winAmount=${winAmount}`);
      }

      if (multiplier > 0) {
        const labelElement = htmlBin.querySelector(".bin-label-new");
        const labelText = labelElement
          ? labelElement.textContent
          : `x${multiplier}`;

        this.createFlyingText(htmlBin, labelText, winAmount);
      }

      setTimeout(() => {
        htmlBin.style.transition =
          "transform 0.2s ease-back, box-shadow 0.4s ease-out";
        htmlBin.style.transform = "";
        htmlBin.style.boxShadow = "";

        setTimeout(() => {
          // htmlBin.classList.remove("bin-flash");
          htmlBin.style.transition = "";
        }, 400);
      }, 150);
    }

    const blockInfo = this.blockAnimations[blockId];

    if (!blockInfo || blockInfo.isAnimating) return;

    const block = this.bins.find((bin) => bin.label === blockId);
    if (!block) return;

    blockInfo.isAnimating = true;
    const originalPosition = { ...block.position };

    const moveDownDistance = 5;
    Matter.Body.translate(block, { x: 0, y: moveDownDistance });

    setTimeout(() => {
      if (block.position) {
        Matter.Body.setPosition(block, originalPosition);
      }

      setTimeout(() => {
        blockInfo.isAnimating = false;
      }, 150);
    }, 150);
  }

  createFlyingText(htmlBin, labelText, winAmount) {
    const flyingText = document.createElement("div");
    flyingText.textContent = labelText;

    // Размер текста: меньше на мобильных в 1.5 раза
    const isMobile = window.innerWidth <= 767;
    const fontSize = isMobile ? Math.round(16 / 1.5) : 16;

    flyingText.style.cssText = `
            position: absolute;
            color: #00FF00;
            font-size: ${fontSize}px;
            font-weight: bold;
            pointer-events: none;
            z-index: 10000;
            text-shadow: none;
            transition: none;
            transform: scale(1);
            opacity: 1;
        `;

    const binRect = htmlBin.getBoundingClientRect();

    document.body.appendChild(flyingText);
    const textRect = flyingText.getBoundingClientRect();

    flyingText.style.left = `${
      binRect.left + binRect.width / 2 - textRect.width / 2
    }px`;
    flyingText.style.top = `${
      binRect.top + binRect.height / 2 - textRect.height / 2
    }px`;

    // Текст сразу скрываем и показываем после возвращения лунки
    flyingText.style.opacity = "0";

    //Проигрываем звук падения мяча в корзину
    playBinDropSound();

    setTimeout(() => {
      // flyingText.style.opacity = "1";

      // Скрываем лейбл лунки как только появился текст для полета
      // const labelElement = htmlBin.querySelector(".bin-label-new");
      // if (labelElement) {
      //   labelElement.style.opacity = "0";
      //   setTimeout(() => {
      //     labelElement.style.transition = "opacity 0.5s ease-in-out";
      //     labelElement.style.opacity = "1";
      //   }, 1200);
      // }

      setTimeout(() => {
        // flyingText.style.transition =
        //   "all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        // flyingText.style.color = "#00FF00";
        // flyingText.style.textShadow = "0 0 10px rgba(0, 255, 0, 0.8)";

        const winsDisplay = document.getElementById("wins-display");
        if (winsDisplay) {
          // const targetRect = winsDisplay.getBoundingClientRect();
          // const targetStyle = window.getComputedStyle(winsDisplay);
          // const targetFontSize = parseInt(targetStyle.fontSize) || 18;

          // flyingText.style.fontSize = `${targetFontSize}px`;

          // const updatedTextRect = flyingText.getBoundingClientRect();
          // flyingText.style.left = `${
          //   targetRect.left + targetRect.width / 2 - updatedTextRect.width / 2
          // }px`;
          // flyingText.style.top = `${
          //   targetRect.top + targetRect.height / 2 - updatedTextRect.height / 2
          // }px`;
          // flyingText.style.transform = "scale(1.2)";

          setTimeout(() => {
            if (this.game && this.game.gameLogic && this.game.uiManager) {
              //Срабатывание добавления к балансу после падения в лунку
              this.game.uiManager.addWin(winAmount);
            }

            // winsDisplay.style.transition = "all 0.15s ease-out";
            // winsDisplay.style.boxShadow =
            //   "0 0 20px rgba(0, 255, 0, 0.8), 0 0 40px rgba(0, 255, 0, 0.5)";
            // winsDisplay.style.transform = "scale(1.08)";

            // setTimeout(() => {
            //   winsDisplay.style.boxShadow = "";
            //   winsDisplay.style.transform = "";
            // }, 150);
          }, 0);

          // setTimeout(() => {
          //   flyingText.style.opacity = "0";
          // }, 800);
        }
      }, 100);
    }, 350);

    // setTimeout(() => {
    //   if (document.body.contains(flyingText)) {
    //     document.body.removeChild(flyingText);
    //   }
    // }, 2000);
  }

  getMultiplier(binIndex) {
    // Прямая связь между лунками и бонусами без всяких коэффициентов
    const logicalBinCount = config.binCount;

    console.debug(
      `🔍 getMultiplier SIMPLE: binIndex=${binIndex}, logicalBinCount=${logicalBinCount}`
    );

    // Найти соответствующий HTML элемент лунки
    let htmlBin = null;
    for (const bin of this.htmlBins) {
      const binIndexFromDataset = parseInt(bin.dataset.binIndex);
      if (
        binIndexFromDataset === binIndex ||
        // (binIndex === 1 && binIndexFromDataset === 0) ||
        (binIndex === logicalBinCount - 2 &&
          binIndexFromDataset === logicalBinCount - 1)
      ) {
        htmlBin = bin;
        break;
      }
    }

    if (!htmlBin) {
      console.debug(
        `  No HTML bin found for binIndex ${binIndex}, returning 0`
      );
      return 0;
    }

    // Получить лейбл из HTML элемента
    const labelElement = htmlBin.querySelector(".bin-label-new");
    const labelText = labelElement ? labelElement.textContent : "";

    console.debug(`  Found label: "${labelText}"`);

    // Преобразовать лейбл в бонус (не множитель!)
    let bonus = 0;
    if (labelText.includes("x100")) {
      bonus = 2030; // 2030 EUR
    } else if (labelText.includes("x2")) {
      bonus = 50; // 50 EUR
    } else if (labelText.includes("x3")) {
      bonus = 90; // 90 EUR
    } else if (labelText.includes("x5")) {
      bonus = 130; // 130 EUR
    } else if (labelText.includes("x10")) {
      bonus = 250; // 250 EUR
    } 

    // Возвращаем множитель для совместимости с существующим кодом
    const multiplier = bonus / 50;

    console.debug(
      `  FINAL MULTIPLIER = ${multiplier} (from label "${labelText}")`
    );
    return multiplier;
  }

  clearBins() {
    for (const bin of this.bins) {
      World.remove(this.world, bin);
    }

    for (const divider of this.dividers) {
      World.remove(this.world, divider);
    }

    const binsContainer = document.getElementById("bins-container");
    if (binsContainer) {
      binsContainer.innerHTML = "";
    }

    this.bins = [];
    this.dividers = [];
    this.binNumbers = [];
    this.binLabels = [];
    this.blockAnimations = {};
    this.binHits = {};
    this.htmlBins = [];
  }

  getBinHitsStatistics() {
    return {
      binHits: { ...this.binHits },
      totalHits: Object.values(this.binHits).reduce((a, b) => a + b, 0),
    };
  }

  updateDimensions() {
    this.createBins();

    if (this.game && typeof this.game.updateBinsContainer === "function") {
      this.game.updateBinsContainer();
    }
  }
}

export default BinsManager;
