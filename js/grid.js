// Farm Grid Logic

const FarmGrid = {
    gridElement: null,
    gameState: null,

    // Initialize the grid
    init(gameState) {
        this.gameState = gameState;
        this.gridElement = document.getElementById('farm-grid');
        this.render();
    },

    // Render the entire grid
    render() {
        this.gridElement.innerHTML = '';
        this.gridElement.style.gridTemplateColumns = `repeat(${this.gameState.gridSize}, ${CONFIG.TILE_SIZE}px)`;

        this.gameState.grid.forEach((tile, index) => {
            const tileElement = this.createTileElement(tile, index);
            this.gridElement.appendChild(tileElement);
        });
    },

    // Create a single tile element
    createTileElement(tile, index) {
        const tileEl = document.createElement('div');
        tileEl.className = `tile ${tile.state}`;
        tileEl.dataset.index = index;

        if (tile.state !== TILE_STATE.EMPTY && tile.cropType) {
            // Add crop visual
            const cropEl = document.createElement('div');
            cropEl.className = 'crop';

            const cropConfig = CONFIG.CROPS[tile.cropType];
            const stageIndex = this.getGrowthStage(tile);
            cropEl.style.backgroundColor = cropConfig.colors[stageIndex];

            // Scale based on growth
            const scale = 0.4 + (stageIndex * 0.2);
            cropEl.style.transform = `scale(${scale})`;

            tileEl.appendChild(cropEl);

            // Add progress bar if not mature
            if (tile.state !== TILE_STATE.MATURE) {
                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';

                const progress = document.createElement('div');
                progress.className = 'progress';
                progress.style.width = `${tile.growthProgress * 100}%`;

                progressBar.appendChild(progress);
                tileEl.appendChild(progressBar);
            }
        }

        // Click handler
        tileEl.addEventListener('click', () => this.handleTileClick(index));

        return tileEl;
    },

    // Get growth stage (0-3) based on progress
    getGrowthStage(tile) {
        if (tile.state === TILE_STATE.MATURE) return 3;
        if (tile.growthProgress < 0.33) return 0;
        if (tile.growthProgress < 0.66) return 1;
        return 2;
    },

    // Handle tile click
    handleTileClick(index) {
        const tile = this.gameState.grid[index];

        if (tile.state === TILE_STATE.EMPTY) {
            this.plantCrop(index);
        } else if (tile.state === TILE_STATE.MATURE) {
            this.harvestCrop(index);
        }
    },

    // Plant a crop on empty tile
    plantCrop(index) {
        if (this.gameState.seeds <= 0) {
            Game.notify('Not enough seeds!', 'error');
            return;
        }

        const cropType = this.gameState.selectedCrop;
        if (!this.gameState.upgrades.unlockedCrops.includes(cropType)) {
            Game.notify('This crop is not unlocked!', 'error');
            return;
        }

        const tile = this.gameState.grid[index];
        tile.state = TILE_STATE.PLANTED;
        tile.cropType = cropType;
        tile.plantedAt = Date.now();
        tile.growthProgress = 0;

        this.gameState.seeds--;
        Game.updateUI();
        this.updateTile(index);

        // Save on action
        SaveSystem.save(this.gameState);
    },

    // Harvest a mature crop
    harvestCrop(index) {
        const tile = this.gameState.grid[index];

        if (tile.state !== TILE_STATE.MATURE) {
            return;
        }

        const cropConfig = CONFIG.CROPS[tile.cropType];
        const coins = cropConfig.sellValue;

        // Add coins
        this.gameState.coins += coins;
        this.gameState.stats.totalHarvested++;
        this.gameState.stats.totalEarned += coins;

        // Show floating coin animation
        this.showFloatingCoins(index, coins);

        // Reset tile
        tile.state = TILE_STATE.EMPTY;
        tile.cropType = null;
        tile.plantedAt = null;
        tile.growthProgress = 0;

        Game.updateUI();
        this.updateTile(index);

        // Trigger harvest animation
        const tileEl = this.gridElement.children[index];
        tileEl.classList.add('harvesting');
        setTimeout(() => tileEl.classList.remove('harvesting'), 300);

        // Save on action
        SaveSystem.save(this.gameState);
    },

    // Show floating coins animation
    showFloatingCoins(index, amount) {
        const tileEl = this.gridElement.children[index];
        const rect = tileEl.getBoundingClientRect();

        const floatingCoin = document.createElement('div');
        floatingCoin.className = 'floating-coin';
        floatingCoin.textContent = `+${amount}`;
        floatingCoin.style.left = `${rect.left + rect.width / 2}px`;
        floatingCoin.style.top = `${rect.top}px`;

        document.body.appendChild(floatingCoin);

        setTimeout(() => floatingCoin.remove(), 1000);
    },

    // Update a single tile (for performance)
    updateTile(index) {
        const tile = this.gameState.grid[index];
        const oldTileEl = this.gridElement.children[index];
        const newTileEl = this.createTileElement(tile, index);
        this.gridElement.replaceChild(newTileEl, oldTileEl);
    },

    // Update all crop growth (called from game loop)
    updateGrowth(deltaTime) {
        let anyUpdates = false;

        this.gameState.grid.forEach((tile, index) => {
            if (tile.state === TILE_STATE.PLANTED || tile.state === TILE_STATE.GROWING) {
                const cropConfig = CONFIG.CROPS[tile.cropType];
                const growTime = cropConfig.growTime * this.gameState.upgrades.growthSpeed;

                // Calculate progress increment
                const increment = deltaTime / growTime;
                tile.growthProgress = Math.min(1, tile.growthProgress + increment);

                // Update state based on progress
                if (tile.growthProgress >= 1) {
                    tile.state = TILE_STATE.MATURE;
                } else if (tile.growthProgress > 0) {
                    tile.state = TILE_STATE.GROWING;
                }

                anyUpdates = true;
            }
        });

        // Only re-render tiles that changed
        if (anyUpdates) {
            this.gameState.grid.forEach((tile, index) => {
                if (tile.state !== TILE_STATE.EMPTY) {
                    this.updateTileProgress(index);
                }
            });
        }
    },

    // Update just the progress bar of a tile (more efficient than full re-render)
    updateTileProgress(index) {
        const tile = this.gameState.grid[index];
        const tileEl = this.gridElement.children[index];

        if (!tileEl) return;

        // Update tile state class
        tileEl.className = `tile ${tile.state}`;

        // Update progress bar if exists
        const progressBar = tileEl.querySelector('.progress');
        if (progressBar && tile.state !== TILE_STATE.MATURE) {
            progressBar.style.width = `${tile.growthProgress * 100}%`;
        }

        // Update crop visual
        const cropEl = tileEl.querySelector('.crop');
        if (cropEl && tile.cropType) {
            const cropConfig = CONFIG.CROPS[tile.cropType];
            const stageIndex = this.getGrowthStage(tile);
            cropEl.style.backgroundColor = cropConfig.colors[stageIndex];

            const scale = 0.4 + (stageIndex * 0.2);
            cropEl.style.transform = `scale(${scale})`;
        }

        // If became mature, re-render to remove progress bar
        if (tile.state === TILE_STATE.MATURE && tileEl.querySelector('.progress-bar')) {
            this.updateTile(index);
        }
    },

    // Add a new tile to the grid
    addTile() {
        const newTileCount = this.gameState.grid.length + 1;
        const newGridSize = Math.ceil(Math.sqrt(newTileCount));

        // If we need to expand grid dimensions
        if (newGridSize > this.gameState.gridSize) {
            this.gameState.gridSize = newGridSize;

            // Fill in missing tiles to make a square grid
            while (this.gameState.grid.length < newGridSize * newGridSize) {
                this.gameState.grid.push({
                    id: this.gameState.grid.length,
                    state: TILE_STATE.EMPTY,
                    cropType: null,
                    plantedAt: null,
                    growthProgress: 0
                });
            }
        } else {
            // Just add one tile if we're within current grid size
            this.gameState.grid.push({
                id: this.gameState.grid.length,
                state: TILE_STATE.EMPTY,
                cropType: null,
                plantedAt: null,
                growthProgress: 0
            });
        }

        this.gameState.stats.totalTilesPurchased++;
        this.render();
    }
};

// Export
window.FarmGrid = FarmGrid;
