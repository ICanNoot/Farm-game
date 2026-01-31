// Shop System

const Shop = {
    gameState: null,

    // Initialize shop
    init(gameState) {
        this.gameState = gameState;
        this.bindEvents();
        this.updateUI();
    },

    // Bind shop button events
    bindEvents() {
        // Buy buttons
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handlePurchase(action);
            });
        });

        // Crop selector buttons
        document.querySelectorAll('.crop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cropType = e.target.closest('.crop-btn').dataset.crop;
                this.handleCropSelect(cropType);
            });
        });

        // Save button
        document.getElementById('save-btn').addEventListener('click', () => {
            SaveSystem.save(this.gameState);
            Game.notify('Game saved!');
            this.updateSaveStatus();
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            const newState = SaveSystem.reset();
            if (newState) {
                window.location.reload();
            }
        });
    },

    // Handle purchase actions
    handlePurchase(action) {
        switch (action) {
            case 'buy-seeds':
                this.buySeeds();
                break;
            case 'upgrade-speed':
                this.upgradeSpeed();
                break;
            case 'buy-tile':
                this.buyTile();
                break;
        }
    },

    // Buy seeds (5 seeds for 10 coins)
    buySeeds() {
        const cost = CONFIG.SHOP.seedPrice * 5; // 10 coins for 5 seeds

        if (this.gameState.coins < cost) {
            Game.notify('Not enough coins!', 'error');
            return;
        }

        this.gameState.coins -= cost;
        this.gameState.seeds += 5;

        Game.notify('+5 seeds purchased!');
        Game.updateUI();
        SaveSystem.save(this.gameState);
    },

    // Upgrade growth speed
    upgradeSpeed() {
        const cost = this.getSpeedUpgradeCost();

        if (this.gameState.coins < cost) {
            Game.notify('Not enough coins!', 'error');
            return;
        }

        this.gameState.coins -= cost;
        this.gameState.upgrades.growthSpeed *= CONFIG.SHOP.growthSpeedMultiplier;
        this.gameState.stats.speedUpgradesPurchased++;

        Game.notify('Growth speed upgraded!');
        Game.updateUI();
        this.updateUI();
        SaveSystem.save(this.gameState);
    },

    // Get current speed upgrade cost
    getSpeedUpgradeCost() {
        const basePrice = CONFIG.SHOP.growthSpeedUpgradeCost;
        const purchased = this.gameState.stats.speedUpgradesPurchased;
        return Math.floor(basePrice * Math.pow(1.5, purchased));
    },

    // Buy additional tile
    buyTile() {
        const cost = this.getTileCost();
        const maxTiles = CONFIG.MAX_GRID_SIZE * CONFIG.MAX_GRID_SIZE;

        if (this.gameState.grid.length >= maxTiles) {
            Game.notify('Maximum farm size reached!', 'warning');
            return;
        }

        if (this.gameState.coins < cost) {
            Game.notify('Not enough coins!', 'error');
            return;
        }

        this.gameState.coins -= cost;
        FarmGrid.addTile();

        Game.notify('Farm expanded!');
        Game.updateUI();
        this.updateUI();
        SaveSystem.save(this.gameState);
    },

    // Get current tile cost
    getTileCost() {
        const baseCost = CONFIG.SHOP.tileBaseCost;
        const purchased = this.gameState.stats.totalTilesPurchased;
        return Math.floor(baseCost * Math.pow(CONFIG.SHOP.tileCostMultiplier, purchased));
    },

    // Handle crop selection
    handleCropSelect(cropType) {
        const cropConfig = CONFIG.CROPS[cropType];

        // Check if crop is unlocked
        if (!this.gameState.upgrades.unlockedCrops.includes(cropType)) {
            // Try to unlock it
            if (this.gameState.coins >= cropConfig.unlockCost) {
                if (confirm(`Unlock ${cropConfig.name} for ${cropConfig.unlockCost} coins?`)) {
                    this.gameState.coins -= cropConfig.unlockCost;
                    this.gameState.upgrades.unlockedCrops.push(cropType);
                    Game.notify(`${cropConfig.name} unlocked!`);
                    Game.updateUI();
                    this.updateCropSelector();
                    SaveSystem.save(this.gameState);
                }
            } else {
                Game.notify(`Need ${cropConfig.unlockCost} coins to unlock ${cropConfig.name}!`, 'error');
            }
            return;
        }

        // Select the crop
        this.gameState.selectedCrop = cropType;
        this.updateCropSelector();
    },

    // Update crop selector UI
    updateCropSelector() {
        document.querySelectorAll('.crop-btn').forEach(btn => {
            const cropType = btn.dataset.crop;
            const isUnlocked = this.gameState.upgrades.unlockedCrops.includes(cropType);
            const isSelected = this.gameState.selectedCrop === cropType;

            btn.classList.toggle('locked', !isUnlocked);
            btn.classList.toggle('selected', isSelected);

            // Hide unlock cost if unlocked
            const unlockCost = btn.querySelector('.unlock-cost');
            if (unlockCost) {
                unlockCost.style.display = isUnlocked ? 'none' : 'block';
            }
        });
    },

    // Update shop UI (prices, availability)
    updateUI() {
        // Update speed upgrade cost
        const speedCost = this.getSpeedUpgradeCost();
        document.getElementById('speed-cost').textContent = `${speedCost} coins`;

        // Update tile cost
        const tileCost = this.getTileCost();
        document.getElementById('tile-cost').textContent = `${tileCost} coins`;

        // Update button states
        this.updateButtonStates();

        // Update crop selector
        this.updateCropSelector();
    },

    // Update button enabled/disabled states
    updateButtonStates() {
        const seedCost = CONFIG.SHOP.seedPrice * 5;
        const speedCost = this.getSpeedUpgradeCost();
        const tileCost = this.getTileCost();
        const maxTiles = CONFIG.MAX_GRID_SIZE * CONFIG.MAX_GRID_SIZE;

        document.querySelectorAll('.buy-btn').forEach(btn => {
            const action = btn.dataset.action;
            let canAfford = false;

            switch (action) {
                case 'buy-seeds':
                    canAfford = this.gameState.coins >= seedCost;
                    break;
                case 'upgrade-speed':
                    canAfford = this.gameState.coins >= speedCost;
                    break;
                case 'buy-tile':
                    canAfford = this.gameState.coins >= tileCost &&
                               this.gameState.grid.length < maxTiles;
                    break;
            }

            btn.disabled = !canAfford;
        });
    },

    // Update save status display
    updateSaveStatus() {
        const statusEl = document.getElementById('save-status');
        if (this.gameState.lastSaved) {
            statusEl.textContent = 'Saved just now';
            setTimeout(() => {
                statusEl.textContent = 'Auto-saves every 30s';
            }, 3000);
        }
    }
};

// Export
window.Shop = Shop;
