import { config } from './config.js';
import PathPointsGenerator from './PathPointsGenerator.js';
import SimplePathGenerator from './SimplePathGenerator.js';

class PathManager {
    constructor(gameInstance, pyramidManager, binsManager) {
        this.game = gameInstance;
        this.pyramidManager = pyramidManager;
        this.binsManager = binsManager;

        this.startPoints = [];
        this.pathPoints = [];
        this.endPoints = [];

        this.pathPointOffsetY = config.pathPointOffsetY || 6;

        this.generatePathPoints();
    }

    generatePathPoints() {
        this.startPoints = PathPointsGenerator.generateStartPoints(this.pyramidManager);
        this.pathPoints = PathPointsGenerator.generatePathPointsFromPegs(this.pyramidManager, this.pathPointOffsetY);
        this.endPoints = PathPointsGenerator.generateEndPoints(this.pyramidManager);

        console.debug('Generated path points:');
        console.debug(`- Start points: ${this.startPoints.length}`);
        console.debug(`- Path point rows: ${this.pathPoints.length}`);
        console.debug(`- End points (bins): ${this.endPoints.length}`);
    }

    
    addBouncePointsToPath(path) {
        if (!path || path.length < 3) {
            return path;
        }

        const enhancedPath = [];
        enhancedPath.push(path[0]);

        
        const bounceChance = config.extraBounceChance || 0.3;

        for (let i = 1; i < path.length - 1; i++) {
            const prevPoint = path[i - 1];
            const currentPoint = path[i];
            const nextPoint = path[i + 1];

            const isSpecialPoint = currentPoint.number && (
                currentPoint.number.startsWith('S') ||
                currentPoint.number.startsWith('E')
            );

            const isTooCloseToEnds = i <= 1 || i >= path.length - 2;

            
            const isDirectionChange =
                (prevPoint.x !== undefined && nextPoint.x !== undefined) &&
                (Math.sign(nextPoint.x - currentPoint.x) !== Math.sign(currentPoint.x - prevPoint.x)) &&
                (Math.abs(nextPoint.x - currentPoint.x) > 1); 

            
            const shouldBounce = !isSpecialPoint && !isTooCloseToEnds &&
                (isDirectionChange ? Math.random() < bounceChance : false);

            enhancedPath.push(Object.assign({}, currentPoint));

            if (shouldBounce) {
                
                const returnPoint = {
                    x: currentPoint.x,
                    y: currentPoint.y,
                    pegLabel: currentPoint.pegLabel,
                    number: currentPoint.number ? `${currentPoint.number}-return` : 'return',
                    type: currentPoint.type,
                    isReturnPoint: true,
                    
                    extraBounceInfo: {
                        extraMultiplier: config.extraBounceHeightMultiplier,
                        minFactor: config.extraBounceRandomFactorMin,
                        maxFactor: config.extraBounceRandomFactorMax
                    }
                };

                enhancedPath.push(returnPoint);
                
            }
        }

        enhancedPath.push(Object.assign({}, path[path.length - 1]));

        return enhancedPath;
    }

    generatePath(targetBinIndex = null) {
        const pathId = Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
        console.debug(`[Path ${pathId}] Starting path generation`);

        if (this.startPoints.length === 0 || this.pathPoints.length === 0 || this.endPoints.length === 0) {
            console.error(`[Path ${pathId}] Cannot create path: missing required points`);
            return [];
        }

        if (targetBinIndex !== null && (targetBinIndex < 0 || targetBinIndex >= this.endPoints.length)) {
            console.warn(`[Path ${pathId}] Invalid bin index ${targetBinIndex} specified, choosing random bin`);
            targetBinIndex = null;
        }

        let path = [];
        if (targetBinIndex !== null) {
            const endPoint = this.endPoints[targetBinIndex];
            console.debug(`[Path ${pathId}] Generating path to target bin ${targetBinIndex}: x=${endPoint.x}, y=${endPoint.y}, number=${endPoint.number}`);

            let startPointIndex;
            const totalBins = this.endPoints.length;

            if (targetBinIndex === 0) {
                startPointIndex = 0;
                console.debug(`[Path ${pathId}] Using start point S1 for bin E1`);
            } else if (targetBinIndex === totalBins - 1) {
                startPointIndex = 1;
                console.debug(`[Path ${pathId}] Using start point S2 for last bin E${totalBins}`);
            } else {
                startPointIndex = Math.floor(Math.random() * this.startPoints.length);
                console.debug(`[Path ${pathId}] Selected random start point with index ${startPointIndex}`);
            }

            const startPoint = this.startPoints[startPointIndex];
            console.debug(`[Path ${pathId}] Selected start point: x=${startPoint.x}, y=${startPoint.y}, number=${startPoint.number}`);

            path = SimplePathGenerator.generatePath(
                startPoint,
                endPoint,
                this.pathPoints,
                this.endPoints.length
            );
        } else {
            const randomStartIndex = Math.floor(Math.random() * this.startPoints.length);
            const startPoint = this.startPoints[randomStartIndex];
            console.debug(`[Path ${pathId}] Selected start point for random path: ${startPoint.number}`);

            path = SimplePathGenerator.generateRandomPath(startPoint, this.pathPoints, this.endPoints);
        }

        if (!path || path.length === 0) {
            console.error(`[Path ${pathId}] Generated empty path!`);
            return [];
        }

        path = this.addBouncePointsToPath(path);

        console.debug(`[Path ${pathId}] Created path with ${path.length} points`);
        const pathNumbers = path.map(p => p.number || '?').join(' -> ');
        console.debug(`[Path ${pathId}] Point sequence: ${pathNumbers}`);

        return path;
    }

    updateDimensions() {
        this.generatePathPoints();
    }

    cleanup() {
        this.startPoints = [];
        this.pathPoints = [];
        this.endPoints = [];
    }
}

export default PathManager;
