// Game configuration and constants

const CONFIG = {
    // Initial game state
    STARTING_COINS: 0,
    STARTING_SEEDS: 10,
    STARTING_GRID_SIZE: 3,

    // Crop configuration
    CROPS: {
        wheat: {
            name: 'Wheat',
            growTime: 10000, // 10 seconds in ms
            sellValue: 5,
            unlockCost: 0, // Free
            stages: 4, // seed, sprout, growing, mature
            colors: ['#8B4513', '#90EE90', '#228B22', '#FFD700'] // brown, light green, green, gold
        },
        carrot: {
            name: 'Carrot',
            growTime: 30000,
            sellValue: 15,
            unlockCost: 100,
            stages: 4,
            colors: ['#8B4513', '#90EE90', '#228B22', '#FFA500']
        },
        tomato: {
            name: 'Tomato',
            growTime: 60000,
            sellValue: 40,
            unlockCost: 500,
            stages: 4,
            colors: ['#8B4513', '#90EE90', '#228B22', '#FF6347']
        },
        pumpkin: {
            name: 'Pumpkin',
            growTime: 120000,
            sellValue: 100,
            unlockCost: 2000,
            stages: 4,
            colors: ['#8B4513', '#90EE90', '#228B22', '#FF8C00']
        }
    },

    // Shop prices
    SHOP: {
        seedPrice: 2,
        growthSpeedUpgradeCost: 50,
        growthSpeedMultiplier: 0.9, // Each upgrade reduces grow time by 10%
        tileBaseCost: 25,
        tileCostMultiplier: 1.5 // Each tile costs 1.5x the previous
    },

    // Game loop
    TICK_INTERVAL: 100, // ms between game ticks
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds

    // Grid settings
    MAX_GRID_SIZE: 10,

    // Visual settings
    TILE_SIZE: 80, // pixels
    TILE_GAP: 8 // pixels
};

// Tile states
const TILE_STATE = {
    EMPTY: 'empty',
    PLANTED: 'planted',
    GROWING: 'growing',
    MATURE: 'mature'
};

// Make config immutable
Object.freeze(CONFIG);
Object.freeze(TILE_STATE);
