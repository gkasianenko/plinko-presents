
import { config, updateSizesBasedOnRows } from './config.js';
import PyramidManager from './PyramidManager.js';
import BinsManager from './BinsManager.js';
import UIManager from './UIManager.js';
import PhysicsManager from './PhysicsManager.js';
import PathManager from './PathManager.js';
import PathRenderer from './PathRenderer.js';
import GameLogic from './GameLogic.js';
import AutoModeManager from './AutoModeManager.js';

const { Engine, Render, World, Runner } = Matter;

class PlinkoGame {
    constructor(elementId) {
        this.containerId = elementId;
        this.container = document.getElementById(elementId);
        this.initialized = false;
        this.initAttempts = 0;
        this.maxInitAttempts = 5;
        this.ballPaths = {};
        this.resizeObserverEnabled = true;
        this.setupEvents(); 
        this.hasHandledInitialResize = false;
        
        this.safeInitialize();
    }

    safeInitialize() {
        console.debug(`🔄 Initialization attempt #${this.initAttempts + 1}`);

        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`❌ Container ${this.containerId} not found`);
            this.scheduleRetry();
            return;
        }

        const rect = this.container.getBoundingClientRect();
        console.debug(`📦 Container size at initialization: ${rect.width}x${rect.height}`);

        if (rect.width <= 10 || rect.height <= 10) {
            console.warn(`⏳ Container too small (${rect.width}x${rect.height}), waiting...`);
            this.scheduleRetry();
            return;
        }

        this.setupMutationObserver();
        updateSizesBasedOnRows();
        this.updateContainerDimensions();
        this.initialize();
    }

    scheduleRetry() {
        this.initAttempts++;
        if (this.initAttempts >= this.maxInitAttempts) {
            console.error('💥 Exceeded initialization attempts');
            return;
        }

        const delay = 200 * this.initAttempts;
        console.debug(`⏱️ Retry in ${delay} ms`);
        setTimeout(() => this.safeInitialize(), delay);
    }

    setupMutationObserver() {
        if (this.resizeObserver) return;

        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => {
                if (!this.resizeObserverEnabled) {
                    console.debug('🚫 ResizeObserver temporarily disabled');
                    return;
                }

                if (this.initialized) {
                    console.debug('👁️ Detected size change (ResizeObserver)');
                    this.handleResize();
                }
            });

            this.resizeObserver.observe(this.container);
        }
    }


    initialize() {
        console.debug('🚀 Game initialization');

        

        if (this.width <= 0 || this.height <= 0) {
            console.error(`❌ Invalid sizes: ${this.width}x${this.height}`);
            this.scheduleRetry();
            return;
        }

        setTimeout(() => {
            try {
                this.setupEngine();
                this.setupRenderer();
                this.initializeManagers();
                this.initialized = true;
                console.debug('✅ Game initialized');
            } catch (error) {
                console.error('🛑 Initialization error:', error);
                this.scheduleRetry();
            }
        }, 50);
    }

    updateContainerDimensions() {
        const rect = this.container.getBoundingClientRect();
        const availableWidth = rect.width;
        const availableHeight = rect.height;

        if (availableWidth < 100 || availableHeight < 100) {
            console.warn("⚠️ Sizes too small, skipping update");
            return;
        }

        this.width = availableWidth;
        this.height = availableHeight;
        this.calculateOptimalDimensions();
        this.updateConfigBasedOnSize();

        console.debug(`📐 Container sizes: ${this.width}x${this.height}`);
    }

    calculateOptimalDimensions() {
        const basePegRadius = 5;
        const baseBallRadius = 7;

        const pegSize = basePegRadius * 2;
        const bottomOffset = config.binHeight + config.binDistanceFromLastRow + pegSize;
        const topOffset = baseBallRadius * 4;

        const availableHeight = this.height - topOffset - bottomOffset;
        const availableWidth = this.width - basePegRadius * 2.2;

        const gapCount = config.rows - 1;
        const lastRowPegCount = config.topPegs + config.rows - 1;

        const theoreticalWidth = lastRowPegCount * (pegSize * 1.2);
        const theoreticalHeight = gapCount * (pegSize * 1.5);

        const heightRatio = availableHeight / theoreticalHeight;
        const widthRatio = availableWidth / theoreticalWidth;

        const scaleFactor = Math.min(heightRatio, widthRatio);
        config.verticalSpacing = Math.max(15, Math.floor(scaleFactor * (pegSize * 1.5)));

        console.debug(`📏 scaleFactor=${scaleFactor}, verticalSpacing=${config.verticalSpacing}`);
    }

    updateConfigBasedOnSize() {
        config.wallThickness = Math.max(10, Math.min(
            Math.floor(this.width * 0.02),
            Math.floor(this.height * 0.02)
        ));
    }

    setupEngine() {
        this.engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.001 } });
        this.engine.timing.timeScale = 1;
        this.engine.enableSleeping = false;

        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);
    }

    setupRenderer() {
        this.render = Render.create({
            element: this.container,
            engine: this.engine,
            options: {
                width: this.width,
                height: this.height,
                wireframes: false,
                background: 'transparent',
                pixelRatio: 1
            }
        });

        const canvas = this.render.canvas;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.position = 'relative';
        canvas.style.zIndex = '1';

        Render.run(this.render);
    }

    initializeManagers() {
        this.pyramidManager = new PyramidManager(this, this.engine.world);

        this.binsManager = new BinsManager(this, this.engine.world);

        this.createWorld();

        this.pathManager = new PathManager(this, this.pyramidManager, this.binsManager);
        this.pathRenderer = new PathRenderer(this, this.engine.world, this.pathManager);
        this.pathRenderer.initialize();

        this.physicsManager = new PhysicsManager(this, this.engine.world, this.pyramidManager, this.pathManager);
        this.physicsManager.setBinsManager(this.binsManager);

        if (!this.uiManager) {
            this.uiManager = new UIManager(this);
            this.uiManager.initialize();
        } else {
            
        }

        this.gameLogic = new GameLogic(this, this.engine, this.pyramidManager, this.physicsManager, this.binsManager, this.pathManager, this.uiManager);
        this.autoModeManager = new AutoModeManager(this);

        this.pyramidManager.initialize();
        this.physicsManager.initialize();
        this.gameLogic.initialize();
        
        setTimeout(() => {
            this.autoModeManager.initialize();
        }, 1000);

        this.updateBinsContainer();
    }

    createWorld() {
        World.clear(this.engine.world);
        this.pyramidManager.createPyramid();
        this.binsManager.createBins();
    }

    updateBinsContainer() {
        const binsContainer = document.getElementById('bins-container');
        if (binsContainer) {
            binsContainer.style.height = `${config.binHeight}px`;
        }
    }

    setupEvents() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 500);
        });

        window.addEventListener('resize', () => {
            if (this.resizeTimer) clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => this.handleResize(), 250);
        });
    }

    handleOrientationChange() {
        console.debug("🔁 Orientation changed");
        this.destroyGame();

        setTimeout(() => {
            console.debug("📲 Recreating game after orientation change");

            this.container = document.getElementById(this.containerId);
            updateSizesBasedOnRows(); // ВАЖНО: сначала
            this.updateContainerDimensions(); // потом

            this.initialized = false;
            this.initAttempts = 0;
            this.safeInitialize();
        }, 500);
    }



    handleResize() {
        if (!this.initialized) return;

        if (!this.hasHandledInitialResize) {
            console.debug('🛑 Skipping first handleResize after F5');
            this.hasHandledInitialResize = true;
            return;
        }

        const oldWidth = this.width;
        const oldHeight = this.height;
        const oldSpacing = config.verticalSpacing;

        updateSizesBasedOnRows(); 
        this.updateContainerDimensions(); 

        console.debug(`📐 Resize: ${oldWidth}x${oldHeight} → ${this.width}x${this.height}`);
        console.debug(`Spacing: ${oldSpacing} → ${config.verticalSpacing}`);

        this.updateGame();
    }


    updateGame() {
        Render.stop(this.render);
        Runner.stop(this.runner);

        this.updateContainerDimensions();

        this.render.options.width = this.width;
        this.render.options.height = this.height;
        this.render.canvas.width = this.width;
        this.render.canvas.height = this.height;

        this.render.canvas.style.width = '100%';
        this.render.canvas.style.height = '100%';

        World.clear(this.engine.world);
        this.createWorld();

        this.pathManager?.updateDimensions();
        this.pathRenderer?.updateDimensions();
        this.physicsManager?.updateDimensions();
        
        this.updateBinsContainer();

        Render.run(this.render);
        Runner.run(this.runner, this.engine);
    }

    placeBet(ballCount) {
        if (!ballCount) ballCount = this.uiManager.getBallCount();
        console.debug(`🎯 Bet: ${ballCount} balls`);
        if (this.gameLogic) this.gameLogic.resetGame(false);
        this.pyramidManager.stopBrightnessWave();
        this.physicsManager.createBalls(ballCount);
    }

    destroyGame() {
        this.runner && Runner.stop(this.runner);
        this.render && Render.stop(this.render);

        this.uiManager?.cleanup();
        this.physicsManager?.cleanup();
        this.pathManager?.cleanup();
        this.pathRenderer?.cleanup();
        this.pyramidManager?.cleanup();
        this.autoModeManager?.cleanup();

        if (this.render?.canvas?.parentNode) {
            this.render.canvas.parentNode.removeChild(this.render.canvas);
        }

        this.resizeObserver?.disconnect();
        this.resizeObserver = null;

        this.engine = null;
        this.render = null;
        this.runner = null;
        this.pyramidManager = null;
        this.binsManager = null;
        this.pathManager = null;
        this.physicsManager = null;
        this.uiManager = null;
        this.pathRenderer = null;
        this.ballPaths = {};
        this.initialized = false;
    }

    cleanup() {
        this.destroyGame();
    }
}

export default PlinkoGame;
