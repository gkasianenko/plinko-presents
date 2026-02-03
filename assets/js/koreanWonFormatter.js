export default function formatKoreanWon(
  amount,
  config = { useSymbol: false, compact: false, forAdvertising: true },
) {
  const { useSymbol, compact, forAdvertising } = config;

  // Конвертируем в число
  const num =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^\d.-]/g, ""))
      : Number(amount);

  // Проверка на валидность
  if (isNaN(num) || !isFinite(num)) {
    return config.useSymbol ? "₩0" : "0원";
  }

  // Отрицательные числа
  const isNegative = num < 0;
  const absoluteNum = Math.abs(num);

  // Определяем формат на основе величины числа
  let formatted = "";

  // 1억 (100,000,000) и больше
  if (absoluteNum >= 100000000) {
    const eok = Math.floor(absoluteNum / 100000000);
    const remainder = absoluteNum % 100000000;

    if (config.compact || remainder === 0) {
      formatted = `${eok}억`;
    } else {
      const man = Math.floor(remainder / 10000);
      if (man === 0) {
        formatted = `${eok}억`;
      } else {
        formatted = `${eok}억 ${man}만`;
      }
    }
  }
  // 10,000 (1만) до 99,999,999
  else if (absoluteNum >= 10000) {
    const man = Math.floor(absoluteNum / 10000);
    const remainder = absoluteNum % 10000;

    if (config.compact || remainder === 0) {
      formatted = `${man}만`;
    } else {
      const cheon = Math.floor(remainder / 1000);
      if (cheon === 0) {
        formatted = `${man}만`;
      } else {
        formatted = `${man}만 ${cheon}천`;
      }
    }
  }
  // 1,000 (1천) до 9,999
  else if (absoluteNum >= 1000) {
    const cheon = Math.floor(absoluteNum / 1000);
    const remainder = absoluteNum % 1000;

    if (config.compact || remainder === 0) {
      formatted = `${cheon}천`;
    } else {
      formatted = `${cheon}천`;
      // Можно добавить остаток, но обычно для тысяч округляют
    }
  }
  // Меньше 1,000
  else {
    formatted = Math.floor(absoluteNum).toString();
  }

  // Добавляем знак минус если нужно
  if (isNegative) {
    formatted = `-${formatted}`;
  }

  // Форматируем вывод в зависимости от опций
  if (config.forAdvertising) {
    // Для рекламы: ₩ + сокращения без '원'
    return `₩${formatted}`;
  } else if (config.useSymbol) {
    // С символом ₩ для интерфейса
    return `₩${formatted}`;
  } else {
    // Стандартный банковский формат
    return `${formatted}원`;
  }
}
