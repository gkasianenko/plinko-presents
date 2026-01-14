import { playBigWinSound } from './base64sounds.js';
import { dropCoins } from './CoinDrop.js';
import { config } from './config.js';

const { Events } = Matter;

class GameLogic {
    constructor(gameInstance, engine, pyramidManager, physicsManager, binsManager, pathManager, uiManager) {
        this.game = gameInstance;
        this.engine = engine;
        this.pyramidManager = pyramidManager;
        this.physicsManager = physicsManager;
        this.binsManager = binsManager;
        this.pathManager = pathManager;
        this.uiManager = uiManager;

        this.score = 0;
        this.betAmount = 10;
        this.ballCost = config.ballCost || 10;
        this.gameState = 'idle';
        this.lastBallId = 0;

        this.lastResult = {
            binIndex: -1,
            multiplier: 0,
            win: 0,
        };

        this.gameHistory = [];
        this.eventListeners = [];
        this.processedBalls = new Set();
    }

    initialize() {
        const afterUpdateHandler = () => {
            this.physicsManager.checkBallsOutOfBounds();
            this.checkBallsInBins();
        };

        Events.on(this.engine, 'afterUpdate', afterUpdateHandler);
        this.eventListeners.push({ event: 'afterUpdate', handler: afterUpdateHandler });

        this.physicsManager.onBallInBin = (ballId, binIndex) => {
            this.processBallInBin(ballId, binIndex);
        };
    }

    placeBet(amount = this.betAmount, ballCount = config.defaultBallCount, targetBinIndex = null) {
        
        
        
        

        this.betAmount = amount;
        this.gameState = 'playing';

        
        
        
        
        
        
        
        
        

        
        this.lastBallId = this.physicsManager.currentBallId; 

        this.lastResult = {
            binIndex: -1,
            multiplier: 0,
            win: 0,
        };

        this.game.placeBet(ballCount, targetBinIndex);

        this.triggerEvent('betPlaced', {
            amount: this.betAmount,
            ballCount: ballCount,
            targetBinIndex: targetBinIndex
        });

        return true;
    }

    checkBallsInBins() {
        const activeBallsCount = this.physicsManager.getActiveBallsCount();

        
        
        
        
        if (activeBallsCount === 0 && this.gameState !== 'finished') {
            this.gameState = 'finished';

            this.triggerEvent('gameFinished', {
                result: this.lastResult,
                history: this.gameHistory
            });

            console.debug("Before modal check");
            if (this.uiManager) {
                const wins = this.uiManager.winsAmount;
                const target = config.targetWins || 0;

                
                
                
                
                const noMoreThrows = this.uiManager.throwsLeft <= 0;

                console.debug("🎯 Final modal show check:", {
                    wins,
                    target,
                    throwsLeft: this.uiManager.throwsLeft,
                    activeBalls: activeBallsCount,
                    noMoreThrows
                });

                if (noMoreThrows) {
                    
                    //Проигрываем звук победы после финального броска
                    playBigWinSound();

                    dropCoins();
                    setTimeout(() => {
                        console.debug("✅ Starting modal window (check in checkBallsInBins)");
                        this.uiManager.showAfterThrowsSection(wins);
                    }, 2000);
                }
            }
        }
    }
    processBallInBin(ballId, binIndex) {
        if (this.processedBalls.has(ballId)) {
            return;
        }

        this.processedBalls.add(ballId);

        const multiplier = this.binsManager.getMultiplier(binIndex);

        if (this.uiManager) {
            
            const ballCost = this.ballCost;
            const win = ballCost * multiplier;

            console.debug(`🎯 DETAILED DEBUG:`);
            console.debug(`  Ball ${ballId} landed in bin ${binIndex}`);
            console.debug(`  this.ballCost = ${this.ballCost}`);
            console.debug(`  ballCost = ${ballCost}`);
            console.debug(`  multiplier = ${multiplier}`);
            console.debug(`  win = ${ballCost} * ${multiplier} = ${win}`);
            console.debug(`  config.ballCost from import = ${config.ballCost}`);
            

            console.debug(`Ball ${ballId} landed in bin ${binIndex} with multiplier ${multiplier}.`);
            console.debug(`Ball cost: ${ballCost}, Win: ${win}`);
        }

        this.lastResult = {
            binIndex: binIndex,
            multiplier: multiplier,
            win: this.ballCost * multiplier
        };

        
        if (multiplier > 0) {
            this.pyramidManager.celebrateWin();
        } else {
            setTimeout(() => {
                this.pyramidManager.resetForNewGame();
                // this.pyramidManager.startBrightnessWave();
            }, 1000);
        }

        if (this.uiManager) {
            this.gameHistory.push({
                time: new Date(),
                binIndex: binIndex,
                multiplier: multiplier,
                win: this.lastResult.win,
                betAmount: this.betAmount,
                ballId: ballId  
            });
        }

        if (this.gameHistory.length > 50) {
            this.gameHistory.shift();
        }

        this.triggerEvent('ballInBin', {
            ballId: ballId,
            binIndex: binIndex,
            multiplier: multiplier,
            win: this.lastResult.win
        });

        // Trigger logo layers flash animation
        // if (window.logoAnimationManager) {
        //     window.logoAnimationManager.flashLayers();
        // }
    }

    resetGame(clearBalls = true) {
        
        if (clearBalls) {
            this.physicsManager.clearBalls();
            this.pyramidManager.resetForNewGame();
        }

        this.gameState = 'idle';
        this.score = 0;
        this.lastResult = {
            binIndex: -1,
            multiplier: 0,
            win: 0,
        };

        
        if (clearBalls) {
            this.processedBalls.clear();
        }

        this.triggerEvent('gameReset', {
            clearBalls: clearBalls
        });
    }

    setBetAmount(amount) {
        this.betAmount = amount;
    }

    on(eventName, callback) {
        if (!this.events) {
            this.events = {};
        }

        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }

        this.events[eventName].push(callback);
    }

    off(eventName, callback) {
        if (!this.events || !this.events[eventName]) {
            return;
        }

        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }

    triggerEvent(eventName, data) {
        if (!this.events || !this.events[eventName]) {
            return;
        }

        this.events[eventName].forEach(callback => {
            callback(data);
        });
    }

    cleanup() {
        this.eventListeners.forEach(({ event, handler }) => {
            Events.off(this.engine, event, handler);
        });

        this.eventListeners = [];
        this.events = {};
    }

    getGameState() {
        return {
            state: this.gameState,
            score: this.score,
            betAmount: this.betAmount,
            lastResult: this.lastResult,
            history: this.gameHistory
        };
    }
}

export default GameLogic;
