import { config } from './config.js';

/**
 * Класс для расчета целевого распределения balls по лункам
 * для достижения заданной суммы выигрыша
 */
class TargetWinsCalculator {
    constructor(gameInstance, binsManager) {
        this.game = gameInstance;
        this.binsManager = binsManager;
        this.availableMultipliers = [];
    }

    /**
     * Обновляет доступные множители на основе текущего количества лунок
     */
    updateAvailableMultipliers() {
        
        const binCount = config.binCount;

        if (!binCount) {
            console.error('Could not determine number of bins');
            return [];
        }

        
        this.availableMultipliers = this.binsManager.getDistributedValues(binCount);
        console.debug('Available multipliers:', this.availableMultipliers);

        return this.availableMultipliers;
    }

    /**
     * Рассчитывает распределение balls по лункам для достижения целевого выигрыша
     * @returns {Array} Массив индексов лунок для каждого шарика
     */
    calculateTargetDistribution() {
        
        this.updateAvailableMultipliers();

        
        const maxBalls = config.maxBalls || 5;
        const targetWins = config.targetWins || 1000;
        const ballCost = config.ballCost || 10;

        console.debug(`Calculating balls distribution:`);
        console.debug(`- Number of balls: ${maxBalls}`);
        console.debug(`- Target wins: ${targetWins}`);
        console.debug(`- Ball cost: ${ballCost}`);
        console.debug(`- Available multipliers:`, this.availableMultipliers);
        console.debug(`- Number of bins: ${config.binCount}`);

        
        if (!this.availableMultipliers.length) {
            console.error('No available multipliers for calculation');
            return [];
        }

        
        const maxPossibleWin = Math.max(...this.availableMultipliers) * ballCost * maxBalls;
        if (targetWins > maxPossibleWin) {
            console.warn(`Cannot achieve win of ${targetWins} with current multipliers. Maximum possible win: ${maxPossibleWin}`);
        }

        
        const bestDistribution = this.findBestDistribution(maxBalls, targetWins, ballCost);

        
        if (bestDistribution && bestDistribution.length > 0) {
            const expectedWin = bestDistribution.reduce((sum, binIndex) => {
                return sum + this.availableMultipliers[binIndex] * ballCost;
            }, 0);

            console.debug(`Final distribution (bin indices):`, bestDistribution);
            console.debug(`Expected win: ${expectedWin} (target: ${targetWins}), difference: ${expectedWin - targetWins}`);

            
            if (Math.abs(expectedWin - targetWins) > targetWins * 0.05) {
                console.warn(`Warning: Large difference between expected and target win!`);
            }

            return bestDistribution;
        }

        
        console.error('Could not find distribution for target win');
        return [];
    }

    /**
     * Находит наилучшее распределение balls для точного попадания в целевую сумму
     * с условием минимизации повторов одинаковых лунок
     * @param {number} maxBalls - Максимальное количество balls
     * @param {number} targetWins - Целевая сумма выигрыша
     * @param {number} ballCost - Стоимость одного шарика
     * @returns {Array} - Массив индексов лунок для каждого шарика
     */
    findBestDistribution(maxBalls, targetWins, ballCost) {
        
        const multipliers = [...this.availableMultipliers];
        const multiplierIndices = multipliers.map((_, index) => index);

        
        const targetMultiplierSum = targetWins / ballCost;

        console.debug(`Searching for distribution for target multiplier sum: ${targetMultiplierSum}`);
        console.debug(`Available multipliers:`, multipliers);

        
        let bestDistribution = [];
        let bestDifference = Infinity;
        let bestUniqueCount = 0; 

        
        
        const sortedIndices = multiplierIndices.sort((a, b) =>
            multipliers[b] - multipliers[a]);

        
        const countUniqueBins = (distribution) => {
            return new Set(distribution).size;
        };

        
        const generateCombinations = (currentIndex, currentSum, combination, usedBins) => {
            
            if (combination.length === maxBalls) {
                const diff = Math.abs(currentSum - targetMultiplierSum);
                const uniqueCount = countUniqueBins(combination);

                
                if (diff === 0 && uniqueCount > bestUniqueCount) {
                    console.debug('Found exact hit with more unique bins!');
                    bestDistribution = [...combination];
                    bestDifference = 0;
                    bestUniqueCount = uniqueCount;
                    return true;
                }

                
                if (diff === 0 && bestDifference !== 0) {
                    bestDistribution = [...combination];
                    bestDifference = 0;
                    bestUniqueCount = uniqueCount;
                    return false;
                }

                
                if (diff < bestDifference || (diff === bestDifference && uniqueCount > bestUniqueCount)) {
                    bestDifference = diff;
                    bestDistribution = [...combination];
                    bestUniqueCount = uniqueCount;
                }

                return false;
            }

            
            if (currentSum > targetMultiplierSum) {
                return false;
            }

            
            const checkedMultipliers = new Set();

            
            for (let i = 0; i < multipliers.length; i++) {
                const multiplierIndex = sortedIndices[i];
                const multiplier = multipliers[multiplierIndex];

                
                if (checkedMultipliers.has(multiplier)) continue;
                checkedMultipliers.add(multiplier);

                
                const newUsedBins = new Map(usedBins);
                const usedCount = newUsedBins.get(multiplierIndex) || 0;
                newUsedBins.set(multiplierIndex, usedCount + 1);

                
                
                const maxRepeats = Math.max(1, Math.ceil(maxBalls / multipliers.length));
                if (usedCount >= maxRepeats) continue;

                
                combination.push(multiplierIndex);

                
                const found = generateCombinations(i, currentSum + multiplier, combination, newUsedBins);

                
                if (found) return true;

                
                combination.pop();
            }

            return false;
        };

        
        if (maxBalls <= 3) {
            generateCombinations(0, 0, [], new Map());
        } else {
            
            

            
            for (let startIdx = 0; startIdx < Math.min(5, multipliers.length); startIdx++) {
                const combination = [];
                const usedBins = new Map();
                let currentSum = 0;

                
                for (let i = 0; i < maxBalls; i++) {
                    const remainingAmount = targetMultiplierSum - currentSum;
                    const neededPerBall = remainingAmount / (maxBalls - i);

                    
                    let bestIdx = -1;
                    let bestScore = Infinity; 

                    for (let j = 0; j < multipliers.length; j++) {
                        const multiplier = multipliers[j];
                        const usageCount = usedBins.get(j) || 0;

                        
                        const usagePenalty = usageCount * 10;

                        
                        const score = Math.abs(multiplier - neededPerBall) + usagePenalty;

                        if (score < bestScore) {
                            bestScore = score;
                            bestIdx = j;
                        }
                    }

                    if (bestIdx >= 0) {
                        combination.push(bestIdx);
                        currentSum += multipliers[bestIdx];
                        const usageCount = usedBins.get(bestIdx) || 0;
                        usedBins.set(bestIdx, usageCount + 1);
                    }
                }

                
                const diff = Math.abs(currentSum - targetMultiplierSum);
                const uniqueCount = countUniqueBins(combination);

                if (diff < bestDifference || (diff === bestDifference && uniqueCount > bestUniqueCount)) {
                    bestDifference = diff;
                    bestDistribution = [...combination];
                    bestUniqueCount = uniqueCount;
                }
            }

            
            if (bestDifference > 0) {
                console.debug('Trying to improve found distribution');

                
                const distribution = [...bestDistribution];
                const currentSum = distribution.reduce((sum, idx) => sum + multipliers[idx], 0);
                const diff = targetMultiplierSum - currentSum;

                
                if (Math.abs(diff) < Math.max(...multipliers)) {
                    for (let i = 0; i < distribution.length; i++) {
                        const oldIdx = distribution[i];
                        const oldMultiplier = multipliers[oldIdx];

                        for (let j = 0; j < multipliers.length; j++) {
                            if (j === oldIdx) continue;

                            const newMultiplier = multipliers[j];
                            const newDiff = Math.abs(targetMultiplierSum - (currentSum - oldMultiplier + newMultiplier));

                            if (newDiff < bestDifference) {
                                distribution[i] = j;
                                bestDifference = newDiff;
                                bestDistribution = [...distribution];
                                bestUniqueCount = countUniqueBins(distribution);

                                
                                if (newDiff === 0) break;
                            }
                        }

                        
                        if (bestDifference === 0) break;

                        
                        distribution[i] = oldIdx;
                    }
                }
            }
        }

        
        const finalSum = bestDistribution.reduce((sum, idx) => sum + multipliers[idx], 0);
        const expectedWin = finalSum * ballCost;
        const uniqueCount = countUniqueBins(bestDistribution);

        console.debug(`Found distribution: ${bestDistribution.map(idx => idx + 1).join(', ')}`);
        console.debug(`Multipliers: ${bestDistribution.map(idx => multipliers[idx]).join(', ')}`);
        console.debug(`Expected win: ${expectedWin} (target: ${targetWins}), difference: ${expectedWin - targetWins}`);
        console.debug(`Number of unique bins: ${uniqueCount} out of ${maxBalls}`);

        return bestDistribution;
    }

    /**
     * Применяет рассчитанное распределение balls, устанавливая целевые лунки
     */
    applyTargetDistribution() {
        const distribution = this.calculateTargetDistribution();

        if (distribution && distribution.length > 0) {
            console.debug('Applying distribution:', distribution);

            
            if (typeof window.setTargetBins === 'function') {
                window.setTargetBins(distribution);
                return true;
            } else {
                console.error('Function setTargetBins is not available');
            }
        }

        return false;
    }
}

export default TargetWinsCalculator;
