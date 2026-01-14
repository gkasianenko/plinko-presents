


const baseConfig = {
    containerWidth: 800,  
    containerHeight: 800, 
    aspectRatio: 0.5,     
    rows: 8,             
    topPegs: 3,           
    pegRadius: 5,        
    ballRadius: 7,       
    wallThicknessRatio: 0.025, 
    binDistanceFromLastRow: 5, 
    binHeight: 30,        
    topPaddingRatio: 0.1, 

    
    bounceFactor: 3, 

    
    pegRestitution: 0.5,   

    
    showDebugInput: false,

    //отображение цифр над кеглями
    showPathNumbers: false,

    
    pegFriction: 0,        
    blockFriction: 0.1,    

    debug: true,          
    
    defaultBallCount: 1,   
    maxBallCount: 2,      
    ballDropDelay: 100,
    
    autoMode: false,
    autoModeStartDelay: 500,
    autoModeInterval: 300,     


    bounceHeightRatio: 0.7,     
    extraBounceChance: 0.2,            
    extraBounceHeightMultiplier: 0.7,  
    extraBounceFactor: 0.7,              
    extraBounceSpeed: 0.03,     
    extraBounceWaitTime: 100,   

    
    pathPointOffsetY: 6,   
    ballMovementSpeed: 2,   

    
    colors: {
        peg: '#a7a6a6',    
        wall: '#444444',   
        floor: '#444444',  
        ball: '#ffbd26',    
        ballOutline: '#5f025f'
    },

    pegAura: {
        radiusMultiplier: 2.5,  
        color: '#FFFFFF',       
        opacity: 0.2,           
        duration: 100           
    },

    
    
    

    
    initialBalance: 20,      
    ballCost: 50,            

    
    verticalSpacing: 60,  
    wallThickness: 10,    

    
    targetBins: [],
    planTargetsBins: [3,0],
    targetWins: 1000,
    maxBalls: 2,
    costedBins: [0,1,4,4,10,25,50,1000],
    
    binCount: 0
};


const config = { ...baseConfig };

if (typeof process !== 'undefined' && process.env && process.env.GAME_MODE === 'auto') {
    config.autoMode = true;
} else if (typeof window !== 'undefined' && window.location.hostname.includes('game-plinko-auto')) {
    config.autoMode = true;
}


function updateSizesBasedOnRows() {
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const minScreenSize = Math.min(screenWidth, screenHeight);

    
    
    const adaptivePegCoefficient = minScreenSize / 700;
    const adaptiveBallCoefficient = minScreenSize / 600;
    const adaptivSpeedCoefficient = minScreenSize / 700;

    console.debug(`Adaptive coefficients: peg=${adaptivePegCoefficient.toFixed(2)}, ball=${adaptiveBallCoefficient.toFixed(2)}, for screen ${screenWidth}x${screenHeight}`);

    
    const sizeTable = {
        8:  [7.5 * adaptivePegCoefficient, 11 * adaptiveBallCoefficient, 2.2 * adaptivSpeedCoefficient],
        9:  [7.0 * adaptivePegCoefficient, 9.5 * adaptiveBallCoefficient, 2.0 * adaptivSpeedCoefficient],
        10: [6.5 * adaptivePegCoefficient, 9.0 * adaptiveBallCoefficient, 1.8 * adaptivSpeedCoefficient],
        11: [6.0 * adaptivePegCoefficient, 8.5 * adaptiveBallCoefficient, 1.6 * adaptivSpeedCoefficient],
        12: [5.5 * adaptivePegCoefficient, 8.0 * adaptiveBallCoefficient, 1.4 * adaptivSpeedCoefficient],
        13: [5.2 * adaptivePegCoefficient, 7.5 * adaptiveBallCoefficient, 1.3 * adaptivSpeedCoefficient],
        14: [5.0 * adaptivePegCoefficient, 7.2 * adaptiveBallCoefficient, 1.2 * adaptivSpeedCoefficient],
        15: [4.8 * adaptivePegCoefficient, 7.0 * adaptiveBallCoefficient, 1.1 * adaptivSpeedCoefficient],
        16: [4.5 * adaptivePegCoefficient, 6.5 * adaptiveBallCoefficient, 1.0 * adaptivSpeedCoefficient]
    };

    
    if (sizeTable[config.rows]) {
        const [pegRadius, ballRadius, speedMultiplier] = sizeTable[config.rows];
        config.pegRadius = pegRadius;
        config.ballRadius = ballRadius;
        config.ballMovementSpeed = baseConfig.ballMovementSpeed * speedMultiplier;
    }
    
    else {
        const minRows = 9;
        const maxRows = 16;
        const rows = Math.max(minRows, Math.min(maxRows, config.rows));

        
        const lowerRow = Math.floor(rows);
        const upperRow = Math.ceil(rows);

        if (lowerRow === upperRow) {
            
            const [pegRadius, ballRadius, speedMultiplier] = sizeTable[rows];
            config.pegRadius = pegRadius;
            config.ballRadius = ballRadius;
            config.ballMovementSpeed = baseConfig.ballMovementSpeed * speedMultiplier;
        } else {
            
            const lowerValues = sizeTable[lowerRow];
            const upperValues = sizeTable[upperRow];
            const fraction = rows - lowerRow;

            config.pegRadius = lowerValues[0] + (upperValues[0] - lowerValues[0]) * fraction;
            config.ballRadius = lowerValues[1] + (upperValues[1] - lowerValues[1]) * fraction;
            config.ballMovementSpeed = baseConfig.ballMovementSpeed *
                (lowerValues[2] + (upperValues[2] - lowerValues[2]) * fraction);
        }

        
        config.pegRadius = Math.round(config.pegRadius * 10) / 10;
        config.ballRadius = Math.round(config.ballRadius * 10) / 10;
        config.ballMovementSpeed = Math.round(config.ballMovementSpeed * 100) / 100;


    }


    console.debug(`Updated sizes: rows=${config.rows}, pegRadius=${config.pegRadius}, ballRadius=${config.ballRadius}, ballSpeed=${config.ballMovementSpeed}`);
}


updateSizesBasedOnRows();


window.setTargetBins = function(bins) {
    if (Array.isArray(bins)) {
        config.targetBins = [...bins];
        console.debug('Target bins array updated:', config.targetBins);
        return true;
    }
    return false;
};

export { baseConfig, config, updateSizesBasedOnRows };

