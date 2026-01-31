// Main Game Controller

const Game = {
    state: null,
    lastTick: null,
    tickInterval: null,
    autoSaveInterval: null,

    // Initialize the game
    init() {
        // Load or create game state
        this.state = SaveSystem.load();

        // Initialize subsystems
        FarmGrid.init(this.state);
        Shop.init(this.state);

        // Update UI
        this.updateUI();

        // Start game loop
        this.startGameLoop();

        // Start auto-save
        this.startAutoSave();

        // Handle offline progress
        this.calculateOfflineProgress();

        console.log('Idle Farm initialized!');
    },

    // Main game loop
    startGameLoop() {
        this.lastTick = Date.now();

        this.tickInterval = setInterval(() => {
            const now = Date.now();
            const deltaTime = now - this.lastTick;
            this.lastTick = now;

            this.tick(deltaTime);
        }, CONFIG.TICK_INTERVAL);
    },

    // Single game tick
    tick(deltaTime) {
        // Update crop growth
        FarmGrid.updateGrowth(deltaTime);

        // Update shop button states periodically
        Shop.updateButtonStates();
    },

    // Start auto-save interval
    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            SaveSystem.save(this.state);
            Shop.updateSaveStatus();
        }, CONFIG.AUTO_SAVE_INTERVAL);
    },

    // Calculate progress while offline
    calculateOfflineProgress() {
        if (!this.state.lastSaved) return;

        const offlineTime = Date.now() - this.state.lastSaved;
        if (offlineTime < 1000) return; // Less than 1 second, ignore

        // Cap offline progress at 24 hours
        const maxOfflineTime = 24 * 60 * 60 * 1000;
        const effectiveOfflineTime = Math.min(offlineTime, maxOfflineTime);

        // Calculate how much crops would have grown
        let totalHarvested = 0;
        let totalEarned = 0;

        this.state.grid.forEach(tile => {
            if (tile.state === TILE_STATE.PLANTED || tile.state === TILE_STATE.GROWING) {
                const cropConfig = CONFIG.CROPS[tile.cropType];
                const growTime = cropConfig.growTime * this.state.upgrades.growthSpeed;

                // Calculate remaining time needed
                const remainingProgress = 1 - tile.growthProgress;
                const remainingTime = remainingProgress * growTime;

                if (effectiveOfflineTime >= remainingTime) {
                    // Crop would have matured
                    tile.state = TILE_STATE.MATURE;
                    tile.growthProgress = 1;
                } else {
                    // Partial growth
                    const progressGained = effectiveOfflineTime / growTime;
                    tile.growthProgress = Math.min(1, tile.growthProgress + progressGained);

                    if (tile.growthProgress >= 1) {
                        tile.state = TILE_STATE.MATURE;
                    } else {
                        tile.state = TILE_STATE.GROWING;
                    }
                }
            }
        });

        // Re-render the grid to show updated states
        FarmGrid.render();

        // Notify player if significant time passed
        if (offlineTime > 60000) { // More than 1 minute
            const minutes = Math.floor(offlineTime / 60000);
            const hours = Math.floor(minutes / 60);

            if (hours > 0) {
                this.notify(`Welcome back! ${hours}h ${minutes % 60}m of progress applied.`);
            } else {
                this.notify(`Welcome back! ${minutes}m of progress applied.`);
            }
        }
    },

    // Update all UI elements
    updateUI() {
        // Update resource display
        document.getElementById('coin-display').textContent = this.formatNumber(this.state.coins);
        document.getElementById('seed-display').textContent = this.formatNumber(this.state.seeds);

        // Update stats
        document.getElementById('total-harvested').textContent = this.formatNumber(this.state.stats.totalHarvested);
        document.getElementById('total-earned').textContent = this.formatNumber(this.state.stats.totalEarned);

        // Update shop
        Shop.updateUI();
    },

    // Format large numbers
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return Math.floor(num).toString();
    },

    // Show notification
    notify(message, type = 'success') {
        const notifications = document.getElementById('notifications');

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notifications.appendChild(notification);

        // Remove after animation
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    // Stop the game (cleanup)
    stop() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
        }
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        SaveSystem.save(this.state);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

// Save on page unload
window.addEventListener('beforeunload', () => {
    Game.stop();
});

// Export
window.Game = Game;
