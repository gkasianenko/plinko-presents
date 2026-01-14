import Matter from 'matter-js';
import { config } from './config.js';

const { Bodies, World, Body, Events } = Matter;

class PhysicsManager {
    constructor(gameInstance, engineWorld, pyramidManager, pathManager) {
        this.game = gameInstance;
        this.world = engineWorld;
        this.pyramidManager = pyramidManager;
        this.pathManager = pathManager;
        this.balls = [];
        this.currentBallId = 0;

        this.ballPaths = new Map();
        this.ballStates = new Map();
        this.ballTrails = new Map();

        this.boundUpdateBalls = this.updateBalls.bind(this);

        this.ballSpeed = config.ballMovementSpeed || 3;

        
        const bounceFactor = config.bounceFactor || 3;
        this.bounceHeight = config.ballRadius * 2 * bounceFactor;

        console.debug(`PhysicsManager initialized with bounce height: ${this.bounceHeight}px (ball diameter × ${bounceFactor})`);
    }

    initialize() {
        Events.on(this.game.engine, 'afterUpdate', this.boundUpdateBalls);
    }

    createBall(path) {
        if (!path || path.length === 0) {
            console.error('Cannot create ball: path is empty');
            return null;
        }

        const startPoint = path[0];
        const ballId = `ball_${this.currentBallId++}`;

        

        const ball = Bodies.circle(startPoint.x, startPoint.y, config.ballRadius, {
            isStatic: true,
            angle: 0,
            render: {
                fillStyle: config.colors.ball,
                strokeStyle: config.colors.ballOutline,
                lineWidth: 1,
                shadowColor: 'rgba(0,0,0,0.4)',
                shadowBlur: 5,
                shadowOffsetX: 2,
                shadowOffsetY: 2,
                sprite: {
                    texture: null,
                    xScale: 1,
                    yScale: 1
                }
            },
            label: ballId,
            collisionFilter: {
                category: 0x0001,
                mask: 0x0000
            }
        });

        this.balls.push(ball);
        World.add(this.world, ball);

        this.ballPaths.set(ball.id, path);
        this.ballStates.set(ball.id, {
            currentPathIndex: 0,
            isMoving: true,
            targetPoint: path[1] || null,
            progress: 0,
            controlPoint: null,
            isExtraBouncing: false,
            extraBounceProgress: 0,
            extraBounceHeight: 0,
            extraBounceStartY: 0,
            waitingAfterExtraBounce: false
        });

        
        
        

        return ball;
    }

    createTrail(ballId) {
    }

    createBallsWithDelay(paths) {
        if (!paths || paths.length === 0) return;

        const baseDelay = config.ballDropDelay || 150;
        const variancePercent = 0.4; 

        let cumulativeDelay = 0; 

        
        const firstPath = paths[0];
        this.createBall(firstPath);
        

        
        for (let i = 1; i < paths.length; i++) {
            ((index) => {
                
                const randomFactor = 1 - variancePercent + Math.random() * (variancePercent * 2);
                const thisDelay = Math.floor(baseDelay * randomFactor);

                
                cumulativeDelay += thisDelay;

                setTimeout(() => {
                    const path = paths[index];
                    this.createBall(path);
                    
                }, cumulativeDelay);
            })(i);
        }
    }

    createBalls(count) {
        console.debug(`Creating ${count} balls`);

        const targetBins = Array.isArray(config.targetBins) ? config.targetBins : [];

        if (targetBins.length > 0) {
            console.debug(`Using target bins array: ${targetBins.join(', ')}`);

            const targetBallsCount = Math.min(count, targetBins.length);
            const remainingBalls = count - targetBallsCount;

            
            const paths = [];

            
            for (let i = 0; i < targetBallsCount; i++) {
                const path = this.pathManager.generatePath(targetBins[i]);
                paths.push(path);
                console.debug(`Prepared path for ball ${i+1} targeting bin ${targetBins[i]}`);
            }

            
            for (let i = 0; i < remainingBalls; i++) {
                const path = this.pathManager.generatePath(null);
                paths.push(path);
                console.debug(`Prepared path for ball ${targetBallsCount+i+1} with random trajectory`);
            }

            
            this.createBallsWithDelay(paths);
        } else {
            console.debug(`Target bins array is empty, using random targets`);

            const paths = [];
            for (let i = 0; i < count; i++) {
                const path = this.pathManager.generatePath(null);
                paths.push(path);
            }

            
            this.createBallsWithDelay(paths);
        }
    }

    calculateBezierPoint(start, end, control, t) {
        if (!start || !end || !control) {
            console.error('Error: one of points is undefined in calculateBezierPoint', { start, end, control });
            return start || end || { x: 0, y: 0 };
        }

        const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * control.x + t * t * end.x;
        const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * control.y + t * t * end.y;
        return { x, y };
    }

    calculateControlPoint(current, target) {
        if (!current || !target) {
            console.error('Error: points are undefined in calculateControlPoint', { current, target });
            return { x: 0, y: 0 };
        }

        if (current.number && (current.number === 'S1' || current.number === 'S2')) {
            return {
                x: (current.x + target.x) / 2,
                y: current.y + (target.y - current.y) * 0.3
            };
        }

        if (target.isReturnPoint) {
            
            const bounceFactor = config.bounceFactor || 3;
            const ballDiameter = config.ballRadius * 2;
            const baseHeight = ballDiameter * bounceFactor;

            
            const extraMultiplier = config.extraBounceHeightMultiplier || 0.5;

            
            const fixedFactor = config.extraBounceFactor || 0.7;

            
            const bounceHeight = baseHeight * extraMultiplier * fixedFactor;

            

            return {
                x: current.x,
                y: current.y - bounceHeight
            };
        }

        const midX = (current.x + target.x) / 2;

        
        const bounceFactor = config.bounceFactor || 3;
        const ballDiameter = config.ballRadius * 2;
        const bounceHeightRatio = config.bounceHeightRatio || 1;
        const bounceHeight = ballDiameter * bounceFactor * bounceHeightRatio;

        const yDistance = Math.abs(target.y - current.y);
        const maxBounceHeight = yDistance * 0.7;
        const actualBounceHeight = Math.min(bounceHeight, maxBounceHeight);
        const minY = Math.min(current.y, target.y);

        return {
            x: midX,
            y: minY - actualBounceHeight
        };
    }

    updateBalls() {
        for (const ball of this.balls) {
            const state = this.ballStates.get(ball.id);
            const path = this.ballPaths.get(ball.id);

            if (!state || !path || !state.isMoving) continue;

            const currentPoint = path[state.currentPathIndex];

            if (!state.targetPoint && state.currentPathIndex < path.length - 1) {
                state.targetPoint = path[state.currentPathIndex + 1];
                state.progress = 0;

                
                if (!state.speedMultiplier) {
                    
                    state.speedMultiplier = 0.8 + Math.random() * 0.4;
                    
                }

                if (state.targetPoint.isReturnPoint) {
                    
                    state.isBouncing = true;

                    
                    const bounceFactor = config.bounceFactor || 3;
                    const ballDiameter = config.ballRadius * 2;
                    const bounceHeightRatio = config.bounceHeightRatio || 1;
                    state.bounceHeight = ballDiameter * bounceFactor * bounceHeightRatio;

                    state.bounceStartPosition = { ...currentPoint };

                    
                    if (state.targetPoint.extraBounceInfo) {
                        state.extraBounceInfo = state.targetPoint.extraBounceInfo;
                    }
                } else {
                    state.controlPoint = this.calculateControlPoint(currentPoint, state.targetPoint);
                    state.isBouncing = false;
                }
            }

            if (state.targetPoint) {
                if (state.isBouncing) {
                    const verticalSpacing = config.verticalSpacing || 60;
                    const standardDistance = verticalSpacing;
                    
                    state.progress += (this.ballSpeed * (state.speedMultiplier || 1)) / standardDistance;
                } else {
                    const dx = state.targetPoint.x - currentPoint.x;
                    const dy = state.targetPoint.y - currentPoint.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    const isStartPoint = currentPoint.number && (currentPoint.number === 'S1' || currentPoint.number === 'S2');
                    const speedMultiplier = isStartPoint ? 1.8 : 1.0;

                    
                    state.progress += (this.ballSpeed * speedMultiplier * (state.speedMultiplier || 1)) / Math.max(distance, 10);
                }

                if (state.progress >= 1) {
                    Body.setPosition(ball, {
                        x: state.targetPoint.x,
                        y: state.targetPoint.y
                    });

                    if (ball.marker) {
                        Body.setPosition(ball.marker, {
                            x: state.targetPoint.x,
                            y: state.targetPoint.y
                        });
                    }

                    state.currentPathIndex++;

                    if (state.currentPathIndex < path.length - 1) {
                        const currentPoint = path[state.currentPathIndex];
                        if (currentPoint && currentPoint.pegLabel) {
                            this.pyramidManager.animatePegFlash(currentPoint.pegLabel);
                            
                            // Flash logo ball when hitting a peg
                            if (window.logoAnimationManager) {
                                window.logoAnimationManager.flashBall();
                            }
                        }

                        state.targetPoint = null;
                        state.progress = 0;
                        state.isBouncing = false;
                        
                        state.extraBounceMultiplier = null;
                    }
                    else if (state.currentPathIndex === path.length - 1) {
                        state.targetPoint = null;
                        state.isMoving = false;

                        const lastPoint = path[state.currentPathIndex];
                        const binIndex = lastPoint.binIndex;

                        if (binIndex !== undefined) {
                            

                            if (this.binsManager) {
                                this.binsManager.animateBlockFlash(binIndex);
                            }

                            if (typeof this.onBallInBin === 'function') {
                                this.onBallInBin(ball.id, binIndex);
                            }
                        }

                        setTimeout(() => {
                            this.removeBall(ball.id);
                        }, 0);
                    }
                }
                else {
                    let newPosition;

                    if (state.isBouncing) {
                        const t = state.progress;

                        
                        if (state.targetPoint && state.targetPoint.isReturnPoint) {
                            
                            const extraMultiplier = config.extraBounceHeightMultiplier || 0.5;

                            
                            const fixedFactor = config.extraBounceFactor || 0.7;

                            
                            if (!state.extraBounceMultiplier) {
                                state.extraBounceMultiplier = extraMultiplier * fixedFactor;
                                
                            }

                            
                            newPosition = {
                                x: currentPoint.x,
                                y: currentPoint.y - state.bounceHeight * state.extraBounceMultiplier * 4 * t * (1 - t)
                            };
                        } else {
                            
                            newPosition = {
                                x: currentPoint.x,
                                y: currentPoint.y - state.bounceHeight * 4 * t * (1 - t)
                            };
                        }

                        if (Math.random() < 0.05) {
                            const heightMultiplier = state.extraBounceMultiplier || 1;
                            const actualHeight = state.bounceHeight * heightMultiplier * 4 * t * (1 - t);
                            
                        }
                    }
                    else {
                        if (!state.controlPoint) {
                            state.controlPoint = this.calculateControlPoint(currentPoint, state.targetPoint);
                        }

                        newPosition = this.calculateBezierPoint(
                            currentPoint,
                            state.targetPoint,
                            state.controlPoint,
                            state.progress
                        );
                    }

                    const dx = newPosition.x - ball.position.x;
                    const dy = newPosition.y - ball.position.y;
                    const speed = Math.sqrt(dx * dx + dy * dy);

                    const ballLabel = ball.label || '';
                    const lastChar = ballLabel.charAt(ballLabel.length - 1) || '0';
                    const charCode = lastChar.charCodeAt(0) || 0;
                    const rotationDirection = charCode % 2 === 0 ? 1 : -1;
                    const rotationAmount = 0.05 * speed * rotationDirection;

                    Body.setAngle(ball, ball.angle + rotationAmount);
                    Body.setPosition(ball, newPosition);

                    if (ball.marker) {
                        const markerOffsetDistance = config.ballRadius * 0.5;
                        const markerOffsetX = Math.cos(ball.angle) * markerOffsetDistance;
                        const markerOffsetY = Math.sin(ball.angle) * markerOffsetDistance;

                        Body.setPosition(ball.marker, {
                            x: newPosition.x + markerOffsetX,
                            y: newPosition.y + markerOffsetY
                        });
                    }

                    
                    
                    
                }
            }
        }
    }

    updateTrail(ballId, position) {
    }

    removeBall(ballId) {
        const ball = this.balls.find(b => b.id === ballId);

        if (ball) {
            if (ball.marker) {
                World.remove(this.world, ball.marker);
            }

            World.remove(this.world, ball);
            this.ballPaths.delete(ballId);
            this.ballStates.delete(ballId);
            this.ballTrails.delete(ballId);
            this.balls = this.balls.filter(b => b.id !== ballId);
        }
    }

    clearBalls() {
        for (const ball of this.balls) {
            if (ball.marker) {
                World.remove(this.world, ball.marker);
            }
            World.remove(this.world, ball);
        }
        this.balls = [];
        this.ballPaths.clear();
        this.ballStates.clear();
        this.ballTrails.clear();
    }

    checkBallsOutOfBounds() {
        const ballsToRemove = [];

        for (const ball of this.balls) {
            if (ball.position.y > this.game.height + 100) {
                ballsToRemove.push(ball);
            }
        }

        for (const ball of ballsToRemove) {
            this.removeBall(ball.id);
        }
    }

    getActiveBallsCount() {
        return this.balls.length;
    }

    setBinsManager(binsManager) {
        this.binsManager = binsManager;
    }

    updateDimensions() {
        
        const bounceFactor = config.bounceFactor || 3;
        this.bounceHeight = config.ballRadius * 2 * bounceFactor;
        this.ballSpeed = config.ballMovementSpeed || 3;
        console.debug(`PhysicsManager updated with bounce height: ${this.bounceHeight}px (ball diameter × ${bounceFactor}) and speed: ${this.ballSpeed}`);
    }

    cleanup() {
        Events.off(this.game.engine, 'afterUpdate', this.boundUpdateBalls);
        this.clearBalls();
    }
}

export default PhysicsManager;
