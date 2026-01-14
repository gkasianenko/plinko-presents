/**
 * Упрощенный генератор пути для balls в игре Plinko
 * Генерирует более случайные пути с гарантией попадания в целевую лунку
 */
export default class SimplePathGenerator {
    /**
     * Генерирует путь к указанной лунке
     * @param {Object} startPoint - Начальная точка пути
     * @param {Object} targetBin - Целевая лунка
     * @param {Array} pathPoints - Двумерный массив точек пути
     * @param {number} totalBins - Общее количество лунок
     * @returns {Array} - Сгенерированный путь
     */
    static generatePath(startPoint, targetBin, pathPoints, totalBins) {
        
        const path = [];

        
        path.push({...startPoint, type: 'start'});
        console.debug(`Path generation: start point ${startPoint.number}`);

        
        const binIndex = targetBin.binIndex !== undefined
            ? targetBin.binIndex
            : parseInt(targetBin.number.substring(1)) - 1;

        
        
        if (binIndex === 0 && startPoint.number !== 'S1') {
            console.debug('Bin E1 requires start point S1');
            return [];
        }

        
        if (binIndex === totalBins - 1 && startPoint.number !== 'S2') {
            console.debug(`Last bin E${totalBins} requires start point S2`);
            return [];
        }

        //Здесь обозначается первая кегля, на которую упадет шарик
        //настраивается индекс - какой ряд кеглей и какая колонка, начиная слева
        const secondRowIndex = 0;
        let secondRowColumnIndex;

        if (startPoint.number === 'S1') {
            secondRowColumnIndex = 1; 
        } else {
            secondRowColumnIndex = 1; 
        }

        
        const secondRowPoint = pathPoints[secondRowIndex][secondRowColumnIndex];

        path.push({...secondRowPoint, type: 'path'});       

        
        let currentColIndex = secondRowColumnIndex;

        
        for (let rowIndex = secondRowIndex + 1; rowIndex < pathPoints.length; rowIndex++) {
            const row = pathPoints[rowIndex];

            
            if (binIndex === 0) {
                
                currentColIndex = 1; 
                if (currentColIndex >= row.length) {
                    
                    currentColIndex = Math.min(row.length - 1, 1);
                }
                console.debug(`Bin 0: selected point with index ${currentColIndex} (number ${currentColIndex+1})`);
            }
            
            else if (binIndex === totalBins - 1) {
                
                currentColIndex = Math.min(row.length - 1, currentColIndex + 1);
            }
            else {
                
                const possibleIndices = [];

                
                if (currentColIndex < row.length) {
                    possibleIndices.push(currentColIndex);
                }

                
                if (currentColIndex + 1 < row.length) {
                    possibleIndices.push(currentColIndex + 1);
                }

                
                if (possibleIndices.length === 0) {
                    currentColIndex = Math.min(row.length - 1, currentColIndex);
                }
                
                else if (possibleIndices.length === 1) {
                    currentColIndex = possibleIndices[0];
                }
                
                else {
                    
                    const remainingRows = pathPoints.length - rowIndex - 1;

                    
                    const randomChoice = Math.random() < 0.5 ? 0 : 1;
                    const nextColIndex = possibleIndices[randomChoice];

                    
                    if (this.isValidMove(nextColIndex, rowIndex, remainingRows, binIndex, totalBins)) {
                        currentColIndex = nextColIndex;
                    } else {
                        
                        const alternativeIndex = possibleIndices[1 - randomChoice];

                        
                        if (this.isValidMove(alternativeIndex, rowIndex, remainingRows, binIndex, totalBins)) {
                            currentColIndex = alternativeIndex;
                        } else {
                            
                            
                            const dist1 = Math.abs(possibleIndices[0] - binIndex);
                            const dist2 = Math.abs(possibleIndices[1] - binIndex);
                            currentColIndex = dist1 <= dist2 ? possibleIndices[0] : possibleIndices[1];
                        }
                    }
                }
            }

            
            const selectedPoint = row[currentColIndex];
            const nextPoint = {...selectedPoint, type: 'path'};
            path.push(nextPoint);
            
        }

        
        path.push({...targetBin, type: 'end'});
        console.debug(`Added end point ${targetBin.number}`);

        
        const pathNumbers = path.map(p => p.number || '?').join(' -> ');
        console.debug(`Generated path: ${pathNumbers}`);

        return path;
    }

    /**
     * Проверяет, является ли движение к следующей точке валидным
     * для достижения целевой лунки
     * @param {number} colIndex - Индекс колонки точки
     * @param {number} rowIndex - Индекс ряда точки
     * @param {number} remainingRows - Оставшееся количество рядов до конца
     * @param {number} targetBinIndex - Индекс целевой лунки
     * @param {number} totalBins - Общее количество лунок
     * @returns {boolean} - true если движение валидно
     */
    static isValidMove(colIndex, rowIndex, remainingRows, targetBinIndex, totalBins) {
        
        if (targetBinIndex === 0 || targetBinIndex === totalBins - 1) {
            return true;
        }

        
        
        if (targetBinIndex === 0 && colIndex > 0) {
            return false;
        }

        
        const maxReachableIndex = colIndex + remainingRows;

        
        
        const targetBinNumber = targetBinIndex + 1; 

        
        if (colIndex > targetBinNumber) {
            return false;
        }

        
        
        if (colIndex + remainingRows < targetBinIndex) {
            return false;
        }

        return true;
    }

    /**
     * Создает случайный путь (без указания целевой лунки)
     * @param {Object} startPoint - Начальная точка пути
     * @param {Array} pathPoints - Двумерный массив точек пути
     * @param {Array} endPoints - Массив конечных точек (лунок)
     * @returns {Array} - Сгенерированный случайный путь
     */
    static generateRandomPath(startPoint, pathPoints, endPoints) {
        
        const path = [];

        
        path.push({...startPoint, type: 'start'});
        console.debug(`Random path: start point ${startPoint.number}`);

        
        const secondRowIndex = 1;
        let secondRowColumnIndex;

        if (startPoint.number === 'S1') {
            secondRowColumnIndex = 1; 
        } else {
            secondRowColumnIndex = 2; 
        }

        
        const secondRowPoint = pathPoints[secondRowIndex][secondRowColumnIndex];
        path.push({...secondRowPoint, type: 'path'});
        

        
        let currentColIndex = secondRowColumnIndex;

        
        for (let rowIndex = secondRowIndex + 1; rowIndex < pathPoints.length - 1; rowIndex++) {
            const row = pathPoints[rowIndex];

            
            const possibleIndices = [];

            
            if (currentColIndex < row.length) {
                possibleIndices.push(currentColIndex);
            }

            
            if (currentColIndex + 1 < row.length) {
                possibleIndices.push(currentColIndex + 1);
            }

            
            if (possibleIndices.length === 0) {
                currentColIndex = Math.min(row.length - 1, currentColIndex);
            }
            
            else if (possibleIndices.length === 1) {
                currentColIndex = possibleIndices[0];
            }
            
            else {
                currentColIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
            }

            
            const selectedPoint = row[currentColIndex];
            const nextPoint = {...selectedPoint, type: 'path'};
            path.push(nextPoint);
            
        }

        
        const lastRowIndex = pathPoints.length - 1;
        if (lastRowIndex >= 0) {
            const lastRow = pathPoints[lastRowIndex];

            
            const possibleIndices = [];

            
            if (currentColIndex < lastRow.length) {
                possibleIndices.push(currentColIndex);
            }

            
            if (currentColIndex + 1 < lastRow.length) {
                possibleIndices.push(currentColIndex + 1);
            }

            
            const validBinIndices = possibleIndices.filter(colIndex => {
                
                return this.hasValidBin(colIndex, endPoints);
            });

            
            if (validBinIndices.length > 0) {
                currentColIndex = validBinIndices[Math.floor(Math.random() * validBinIndices.length)];
            }
            
            else if (possibleIndices.length > 0) {
                currentColIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
            }
            else {
                currentColIndex = Math.min(lastRow.length - 1, currentColIndex);
            }

            
            const lastPathPoint = lastRow[currentColIndex];
            path.push({...lastPathPoint, type: 'path'});
            console.debug(`Added last path point ${lastPathPoint.number}`);
        }

        
        const lastPoint = path[path.length - 1];
        const nearestBin = this.findNearestBin(lastPoint, endPoints);

        if (nearestBin) {
            path.push({...nearestBin, type: 'end'});
            console.debug(`Added end point ${nearestBin.number}`);
        } else {
            console.warn('Could not find suitable bin for random path');

            
            const virtualBin = {
                x: lastPoint.x,
                y: lastPoint.y + 30,
                binIndex: 0, 
                number: 'E?',
                type: 'end'
            };

            path.push(virtualBin);
        }

        
        const pathNumbers = path.map(p => p.number || '?').join(' -> ');
        console.debug(`Generated random path: ${pathNumbers}`);

        return path;
    }

    /**
     * Проверяет, есть ли валидная лунка для указанного индекса колонки
     * @param {number} colIndex - Индекс колонки
     * @param {Array} endPoints - Массив конечных точек (лунок)
     * @returns {boolean} - true если есть валидная лунка
     */
    static hasValidBin(colIndex, endPoints) {
        
        const possibleBinIndices = [colIndex - 1, colIndex];

        for (const binIndex of possibleBinIndices) {
            if (binIndex >= 0 && binIndex < endPoints.length) {
                return true;
            }
        }

        return false;
    }

    /**
     * Находит ближайшую доступную лунку к указанной точке
     * @param {Object} point - Точка, для которой ищем ближайшую лунку
     * @param {Array} endPoints - Массив конечных точек (лунок)
     * @returns {Object|null} - Ближайшая лунка или null
     */
    static findNearestBin(point, endPoints) {
        if (!endPoints || endPoints.length === 0) {
            return null;
        }

        let nearestBin = null;
        let minDistance = Infinity;

        for (const bin of endPoints) {
            
            
            if (bin.x >= point.x - 10) { 
                const distance = Math.abs(bin.x - point.x);

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestBin = bin;
                }
            }
        }

        return nearestBin;
    }
}
