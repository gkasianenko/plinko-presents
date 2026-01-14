import { config } from './config.js';

class AutoModeManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.autoModeActive = false;
        this.autoModeInterval = null;
        this.ballsDropped = 0;
        this.maxBalls = config.maxBalls || 5;
        this.isStarted = false;
    }

    initialize() {
        if (!config.autoMode) {
            return;
        }

        console.debug('AutoMode: Initializing auto mode');
        this.autoModeActive = true;
        
        // Reset plan targets index for consistent behavior
        if (this.game.uiManager && this.game.uiManager.resetPlanTargetBinsIndex) {
            this.game.uiManager.resetPlanTargetBinsIndex();
        }
        
        setTimeout(() => {
            this.startAutoMode();
        }, config.autoModeStartDelay);
    }

    startAutoMode() {
        if (!config.autoMode || this.isStarted) {
            return;
        }

        console.debug('AutoMode: Starting automatic ball dropping');
        this.isStarted = true;
        this.ballsDropped = 0;
        
        // Ensure plan targets index is reset
        if (this.game.uiManager && this.game.uiManager.resetPlanTargetBinsIndex) {
            this.game.uiManager.resetPlanTargetBinsIndex();
        }
        
        // Генерируем случайные интервалы, которые в сумме дают 2 секунды
        this.generateRandomIntervals();
        
        this.dropNextBall();
    }

    generateRandomIntervals() {
        const totalTime = 2000; // 2 секунды
        const ballCount = this.maxBalls;
        
        // Генерируем случайные числа для разделения времени между всеми шариками кроме первого
        const randomValues = [];
        for (let i = 0; i < ballCount - 1; i++) {
            randomValues.push(Math.random());
        }
        
        // Нормализуем так, чтобы сумма была равна totalTime
        const sum = randomValues.reduce((a, b) => a + b, 0);
        this.intervals = randomValues.map(val => (val / sum) * totalTime);
        
        // Первый шарик падает сразу, поэтому добавляем 0 в начало
        this.intervals.unshift(0);
        
        console.debug('AutoMode: Generated intervals:', this.intervals.map(i => Math.round(i) + 'ms'));
        console.debug(`AutoMode: Total intervals generated: ${this.intervals.length} for ${ballCount} balls`);
    }

    dropNextBall() {
        if (!this.autoModeActive || this.ballsDropped >= this.maxBalls) {
            console.debug('AutoMode: Stopping - balls dropped:', this.ballsDropped);
            return;
        }

        console.debug(`AutoMode: Dropping ball ${this.ballsDropped + 1}/${this.maxBalls}`);
        
        if (this.game && this.game.uiManager) {
            // Программно "нажимаем" кнопку
            this.game.uiManager.programmaticBetClick();
            this.ballsDropped++;

            if (this.ballsDropped < this.maxBalls) {
                const delay = this.intervals[this.ballsDropped] || 100;
                console.debug(`AutoMode: Next ball delay: ${Math.round(delay)}ms`);
                setTimeout(() => {
                    this.dropNextBall();
                }, delay);
            } else {
                console.debug('AutoMode: All balls dropped successfully');
            }
        }
    }

    stop() {
        console.debug('AutoMode: Stopping auto mode');
        this.autoModeActive = false;
        this.isStarted = false;
        if (this.autoModeInterval) {
            clearInterval(this.autoModeInterval);
            this.autoModeInterval = null;
        }
    }

    cleanup() {
        this.stop();
        this.ballsDropped = 0;
    }
}

export default AutoModeManager;