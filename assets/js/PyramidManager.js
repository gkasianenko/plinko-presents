import Matter from 'matter-js';
import {baseConfig, config} from './config.js';

const { Bodies, World, Events } = Matter;

/**
 * Класс для управления пирамидой гвоздиков в игре Plinko
 */
class PyramidManager {
    /**
     * Конструктор класса PyramidManager
     * @param {Object} gameInstance - Экземпляр основного класса игры
     * @param {Object} engineWorld - Мир физического движка Matter.js
     */
    constructor(gameInstance, engineWorld) {
        this.game = gameInstance;
        this.world = engineWorld;
        this.dropArea = { left: 0, right: 0 };
        this.pegs = [];
        this.topRowY = 0;
        this.topRowPegs = []; 

        
        this.pegAnimations = {};

        
        this.auras = {};
        this.brightnessAnimation = null;
        this.isBallRolling = false;
    }

    /**
     * Инициализирует обработчики событий
     */
    initialize() {
        console.debug('PyramidManager: initialized');
    }

    /**
     * Анимирует вспышку гвоздика, создавая ореол и меняя цвет самого гвоздика
     * @param {string} pegLabel - Метка гвоздика
     */
    animatePegFlash(pegLabel) {
        const pegInfo = this.pegAnimations[pegLabel];

        
        if (!pegInfo || pegInfo.isAnimating) return;

        
        const peg = this.pegs.find(p => p.label === pegLabel);
        if (!peg) return;

        
        pegInfo.isAnimating = true;

        
        const originalColor = pegInfo.originalColor;

        
        const flashColor = '#FFFFFF';

        
        peg.render.fillStyle = flashColor;

        
        if (this.auras[pegLabel]) {
            
            World.remove(this.world, this.auras[pegLabel]);
            this.auras[pegLabel] = null;
        }

        
        const aura = this.createAura(peg.position.x, peg.position.y, pegLabel);
        World.add(this.world, aura);
        this.auras[pegLabel] = aura;

        
        setTimeout(() => {
            
            peg.render.fillStyle = originalColor;

            
            setTimeout(() => {
                if (this.auras[pegLabel]) {
                    World.remove(this.world, this.auras[pegLabel]);
                    this.auras[pegLabel] = null;
                }

                
                pegInfo.isAnimating = false;
            }, config.pegAura.duration);
        }, 100);
    }

    /**
     * Создает пирамиду гвоздиков
     * @returns {Object} Объект с информацией о созданной пирамиде
     */
    createPyramid() {
        console.debug(`Creating pyramid: rows=${config.rows}, pegRadius=${config.pegRadius}, ballRadius=${config.ballRadius}`);
        
        this.pegs = [];
        this.topRowPegs = [];
        this.pegAnimations = {};
        this.auras = {};
        this.clearPegs();

        
        const gameWidth = this.game.width;
        const gameHeight = this.game.height;

        
        const pyramidBaseWidth = gameWidth - config.pegRadius*2.2;
        const lastRowPegCount = config.topPegs + config.rows - 1;
        const baseHorizontalSpacing = pyramidBaseWidth / (lastRowPegCount - 1);

        
        const topOffset = config.ballRadius * 4;

        
        const bottomOffset = config.ballRadius * 2;

        
        const availablePyramidHeight = gameHeight - topOffset - bottomOffset;

        
        const verticalSpacing = availablePyramidHeight / (config.rows - 1);

        
        config.verticalSpacing = verticalSpacing;

        
        const topRowY = topOffset;

        
        const bottomRowY = gameHeight - bottomOffset - config.pegRadius;

        
        this.topRowY = topRowY;

        
        let leftmostPegX = 0;
        let rightmostPegX = 0;

        
        for (let row = 0; row < config.rows; row++) {
            
            const pegsInRow = config.topPegs + row;

            
            const rowWidth = baseHorizontalSpacing * (pegsInRow - 1);

            
            const startX = (gameWidth - rowWidth) / 2;

            
            const progress = row / (config.rows - 1);
            const y = topRowY + progress * (bottomRowY - topRowY);

            for (let col = 0; col < pegsInRow; col++) {
                const x = startX + baseHorizontalSpacing * col;

                
                const pegLabel = `peg_${row}_${col}`;

                const peg = this.createPeg(x, y, pegLabel);
                this.pegs.push(peg);
                World.add(this.world, peg);

                
                this.pegAnimations[pegLabel] = {
                    originalColor: config.colors.peg,
                    isAnimating: false
                };

                
                if (row === 0) {
                    if (col === 0) {
                        leftmostPegX = x;
                    }
                    if (col === pegsInRow - 1) {
                        rightmostPegX = x;
                    }

                    
                    this.topRowPegs.push(peg);
                }
            }
        }

        
        this.dropArea = {
            left: leftmostPegX,
            right: rightmostPegX
        };

        console.debug(`Pyramid created: top row at Y=${this.topRowY}, bottom row at Y=${bottomRowY}, verticalSpacing=${verticalSpacing}`);
        console.debug(`Bottom offset: ${bottomOffset}px, full game height: ${gameHeight}px`);

        if (config.debug) {
            console.debug('🧱 Canvas dimensions:', { width: gameWidth, height: gameHeight });
            console.debug('📐 Pyramid dimensions:', {
                rows: config.rows,
                topRowY,
                bottomRowY,
                pyramidHeight: bottomRowY - topRowY,
                verticalSpacing,
                baseWidth: pyramidBaseWidth,
                lastRowPegCount,
                baseHorizontalSpacing
            });
        }

        this.animatePyramidReveal();

        return {
            topRowY: this.topRowY,
            dropArea: this.dropArea,
            pyramidHeight: bottomRowY - topRowY
        };
    }

    /**
     * Создает один гвоздик с заданными параметрами
     * @param {number} x - Координата X
     * @param {number} y - Координата Y
     * @param {string} label - Метка гвоздика
     * @returns {Object} Объект гвоздика Matter.js
     */
    createPeg(x, y, label = 'peg') {
        return Bodies.circle(x, y, config.pegRadius, {
            isStatic: true,
            render: {
                fillStyle: config.colors.peg,
                visible: false
            },
            friction: config.pegFriction,          
            restitution: config.pegRestitution,    
            label: label,
            collisionFilter: {
                category: 0x0002, 
                mask: 0xFFFFFFFF  
            }
        });
    }

    /**
     * Создает визуальный ореол вокруг гвоздика
     * @param {number} x - Координата X гвоздика
     * @param {number} y - Координата Y гвоздика
     * @param {string} label - Метка гвоздика
     * @returns {Object} Объект ореола Matter.js
     */
    createAura(x, y, label) {
        
        const auraParams = config.pegAura;

        
        const auraRadius = config.pegRadius * auraParams.radiusMultiplier;

        
        const aura = Bodies.circle(x, y, auraRadius, {
            isStatic: true,
            isSensor: true, 
            render: {
                fillStyle: `rgba(255, 255, 255, ${auraParams.opacity})`, 
                opacity: 1, 
                lineWidth: 0 
            },
            label: `aura_${label}`,
            collisionFilter: {
                category: 0x0002,
                mask: 0x0000 
            }
        });

        return aura;
    }

    /**
     * Получает информацию о последнем ряде гвоздиков
     * @returns {Object} Объект с информацией о позициях гвоздиков в последнем ряде
     */
    getLastRowInfo() {
        
        const rows = config.rows;

        
        const lastRowPegCount = config.topPegs + rows - 1;
     
        const lastRowPositions = [];

        
        const lastRowStartIndex = this.pegs.length - lastRowPegCount;

        for (let i = lastRowStartIndex; i < this.pegs.length; i++) {
            lastRowPositions.push(this.pegs[i].position.x);
        }

        return {
            pegCount: lastRowPegCount,
            positions: lastRowPositions,
            
            depth: this.pegs[this.pegs.length - 1].position.y + config.pegRadius
        };
    }

    /**
     * Получает информацию о пирамиде, включая позиции гвоздиков верхнего ряда
     * @returns {Object} Объект с информацией о пирамиде
     */
    getPyramidInfo() {
        
        if (!this.pegs || this.pegs.length === 0) {
            return null;
        }

        
        const topRow = [];

        
        for (const peg of this.topRowPegs) {
            if (peg && peg.position) {
                topRow.push(peg.position.x);
            }
        }

        return {
            topRow: topRow,
            topRowY: this.topRowY,
            dropArea: this.dropArea
        };
    }

    /**
     * Очищает все гвоздики и их ореолы из мира
     */
    clearPegs() {
        
        for (const pegLabel in this.auras) {
            if (this.auras[pegLabel]) {
                World.remove(this.world, this.auras[pegLabel]);
            }
        }
        this.auras = {};

        
        for (const peg of this.pegs) {
            World.remove(this.world, peg);
        }
        this.pegs = [];
        this.topRowPegs = [];
        this.pegAnimations = {};
    }

    /**
     * Обновляет настройки пирамиды при изменении размеров игры
     * @param {number} width - Новая ширина игрового поля
     * @param {number} height - Новая высота игрового поля
     */
    updateDimensions(width, height) {
        
        return this.createPyramid();
    }

    /**
     * Получает информацию о дропзоне и верхнем ряде гвоздиков
     * @returns {Object} Объект с информацией о дропзоне
     */
    getDropInfo() {
        return {
            dropArea: this.dropArea,
            topRowY: this.topRowY
        };
    }

    /**
     * Анимирует появление пирамиды от центра к краям
     */
    animatePyramidReveal() {
        const pegsByDistance = this.calculatePegsByDistance();
        
        pegsByDistance.forEach((pegInfo, index) => {
            setTimeout(() => {
                pegInfo.peg.render.visible = true;
            }, index * 8);
        });
        
        const totalAppearTime = pegsByDistance.length * 8;

        //Анимация постоянного волнообразного свечения пирамиды
        //Pyramid brightness wave glow animation

        // setTimeout(() => {
        //     this.startBrightnessWave(pegsByDistance);
        // }, totalAppearTime + 200);
    }

    /**
     * Запускает волну яркости от центра к краям
     */
    startBrightnessWave(pegsByDistance = null) {
        if (this.isBallRolling) return;
        
        if (!pegsByDistance) {
            pegsByDistance = this.calculatePegsByDistance();
        }
        
        const animateCycle = () => {
            if (this.isBallRolling) return;
            
            pegsByDistance.forEach((pegInfo, index) => {
                setTimeout(() => {
                    if (this.isBallRolling) return;
                    
                    const originalColor = config.colors.peg;
                    const brightColor = '#FFFFFF';
                    
                    pegInfo.peg.render.fillStyle = brightColor;
                    
                    setTimeout(() => {
                        if (!this.isBallRolling) {
                            pegInfo.peg.render.fillStyle = originalColor;
                        }
                    }, 150);
                }, index * 12);
            });
            
            const nextCycleDelay = pegsByDistance.length * 12 + 500;
            this.brightnessAnimation = setTimeout(() => {
                if (!this.isBallRolling) {
                    animateCycle();
                }
            }, nextCycleDelay);
        };
        
        animateCycle();
    }
    
    /**
     * Радостное мигание колышков разными цветами
     */
    celebrateWin() {
        setTimeout(() => {
            this.resetForNewGame();
            // this.startBrightnessWave();
        }, 1500);
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    /**
     * Вычисляет порядок колышков от центра к краям
     */
    calculatePegsByDistance() {
        const pegsByDistance = [];
        
        for (let row = 0; row < config.rows; row++) {
            const pegsInRow = config.topPegs + row;
            const rowPegs = [];
            
            const startIndex = pegsByDistance.length;
            for (let col = 0; col < pegsInRow; col++) {
                const pegIndex = startIndex + col;
                if (pegIndex < this.pegs.length) {
                    rowPegs.push({
                        peg: this.pegs[pegIndex],
                        colIndex: col,
                        distanceFromCenter: Math.abs(col - (pegsInRow - 1) / 2)
                    });
                }
            }
            
            rowPegs.sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);
            pegsByDistance.push(...rowPegs);
        }
        
        return pegsByDistance;
    }

    /**
     * Останавливает анимацию яркости при запуске шарика
     */
    stopBrightnessWave() {
        this.isBallRolling = true;
        if (this.brightnessAnimation) {
            clearTimeout(this.brightnessAnimation);
            this.brightnessAnimation = null;
        }
        
        this.pegs.forEach(peg => {
            peg.render.fillStyle = config.colors.peg;
        });
    }
    
    /**
     * Сбрасывает состояние для новой игры
     */
    resetForNewGame() {
        this.isBallRolling = false;
    }

    /**
     * Очищает ресурсы класса при уничтожении
     */
    cleanup() {
        
        for (const pegLabel in this.auras) {
            if (this.auras[pegLabel]) {
                World.remove(this.world, this.auras[pegLabel]);
            }
        }
        this.auras = {};
        
        if (this.brightnessAnimation) {
            clearTimeout(this.brightnessAnimation);
            this.brightnessAnimation = null;
        }

        
        this.clearPegs();
    }
}

export default PyramidManager;
