// Save and Load System

const SAVE_KEY = 'idleFarmSave';

// Create default game state
function createDefaultGameState() {
    const gridSize = CONFIG.STARTING_GRID_SIZE;
    const grid = [];

    for (let i = 0; i < gridSize * gridSize; i++) {
        grid.push({
            id: i,
            state: TILE_STATE.EMPTY,
            cropType: null,
            plantedAt: null,
            growthProgress: 0
        });
    }

    return {
        coins: CONFIG.STARTING_COINS,
        seeds: CONFIG.STARTING_SEEDS,
        grid: grid,
        gridSize: gridSize,
        upgrades: {
            growthSpeed: 1, // Multiplier (lower = faster)
            unlockedCrops: ['wheat']
        },
        stats: {
            totalHarvested: 0,
            totalEarned: 0,
            totalTilesPurchased: 0,
            speedUpgradesPurchased: 0
        },
        selectedCrop: 'wheat',
        lastSaved: null
    };
}

// Save game to localStorage
function saveGame(gameState) {
    try {
        gameState.lastSaved = Date.now();
        const saveData = JSON.stringify(gameState);
        localStorage.setItem(SAVE_KEY, saveData);
        return true;
    } catch (error) {
        console.error('Failed to save game:', error);
        return false;
    }
}

// Load game from localStorage
function loadGame() {
    try {
        const saveData = localStorage.getItem(SAVE_KEY);
        if (!saveData) {
            return createDefaultGameState();
        }

        const loadedState = JSON.parse(saveData);

        // Validate and migrate save data if needed
        const validatedState = validateAndMigrateSave(loadedState);

        return validatedState;
    } catch (error) {
        console.error('Failed to load game:', error);
        return createDefaultGameState();
    }
}

// Validate save data and add any missing fields
function validateAndMigrateSave(loadedState) {
    const defaultState = createDefaultGameState();

    // Ensure all top-level properties exist
    const state = {
        coins: loadedState.coins ?? defaultState.coins,
        seeds: loadedState.seeds ?? defaultState.seeds,
        grid: loadedState.grid ?? defaultState.grid,
        gridSize: loadedState.gridSize ?? defaultState.gridSize,
        upgrades: {
            growthSpeed: loadedState.upgrades?.growthSpeed ?? defaultState.upgrades.growthSpeed,
            unlockedCrops: loadedState.upgrades?.unlockedCrops ?? defaultState.upgrades.unlockedCrops
        },
        stats: {
            totalHarvested: loadedState.stats?.totalHarvested ?? defaultState.stats.totalHarvested,
            totalEarned: loadedState.stats?.totalEarned ?? defaultState.stats.totalEarned,
            totalTilesPurchased: loadedState.stats?.totalTilesPurchased ?? defaultState.stats.totalTilesPurchased,
            speedUpgradesPurchased: loadedState.stats?.speedUpgradesPurchased ?? defaultState.stats.speedUpgradesPurchased
        },
        selectedCrop: loadedState.selectedCrop ?? defaultState.selectedCrop,
        lastSaved: loadedState.lastSaved ?? null
    };

    // Ensure grid size matches the actual grid length
    const expectedTiles = state.gridSize * state.gridSize;
    if (state.grid.length !== expectedTiles) {
        // Rebuild grid to match gridSize
        const newGrid = [];
        for (let i = 0; i < expectedTiles; i++) {
            if (i < state.grid.length) {
                newGrid.push(state.grid[i]);
            } else {
                newGrid.push({
                    id: i,
                    state: TILE_STATE.EMPTY,
                    cropType: null,
                    plantedAt: null,
                    growthProgress: 0
                });
            }
        }
        state.grid = newGrid;
    }

    // Validate each tile
    state.grid = state.grid.map((tile, index) => ({
        id: index,
        state: tile.state ?? TILE_STATE.EMPTY,
        cropType: tile.cropType ?? null,
        plantedAt: tile.plantedAt ?? null,
        growthProgress: tile.growthProgress ?? 0
    }));

    return state;
}

// Reset game (with confirmation)
function resetGame() {
    if (confirm('Are you sure you want to reset your game? All progress will be lost!')) {
        localStorage.removeItem(SAVE_KEY);
        return createDefaultGameState();
    }
    return null;
}

// Check if save exists
function hasSaveData() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

// Export save functions
window.SaveSystem = {
    save: saveGame,
    load: loadGame,
    reset: resetGame,
    hasSave: hasSaveData,
    createDefault: createDefaultGameState
};
