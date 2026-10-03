/**
 * Game Configuration Manager
 * Loads and manages game profiles from gameProfiles.json
 * Handles game switching and profile customization via localStorage
 */

class GameConfigManager {
  constructor() {
    this.profiles = null;
    this.currentGameId = localStorage.getItem("currentGame") || "marioKart";
    this.initialized = false;
  }

  /**
   * Load game profiles from gameProfiles.json
   */
  async loadProfiles() {
    if (this.profiles) return this.profiles;

    try {
      const response = await fetch("/gameProfiles.json");
      if (!response.ok) {
        throw new Error(`Failed to load gameProfiles.json: ${response.statusText}`);
      }
      this.profiles = await response.json();
      this.initialized = true;
      console.log("✓ Game profiles loaded successfully", Object.keys(this.profiles));
      return this.profiles;
    } catch (error) {
      console.error("✗ Error loading game profiles:", error);
      throw error;
    }
  }

  /**
   * Ensure profiles are loaded
   */
  async ensureLoaded() {
    if (!this.initialized) {
      await this.loadProfiles();
    }
  }

  /**
   * Get current active game ID
   */
  getCurrentGameId() {
    return this.currentGameId;
  }

  /**
   * Get current active game profile (with customizations if any)
   */
  async getCurrentProfile() {
    await this.ensureLoaded();
    const gameId = this.currentGameId;
    const defaultProfile = this.profiles[gameId];

    if (!defaultProfile) {
      console.error(`Game profile not found: ${gameId}`);
      return null;
    }

    // Merge default profile with user customizations
    const customizations = this.loadCustomizations(gameId);
    return {
      ...defaultProfile,
      gestures: {
        ...defaultProfile.gestures,
        ...customizations
      }
    };
  }

  /**
   * Get default (unmodified) profile for a game
   */
  async getDefaultProfile(gameId) {
    await this.ensureLoaded();
    return this.profiles[gameId] || null;
  }

  /**
   * Get all available games list
   */
  async getAvailableGames() {
    await this.ensureLoaded();
    return Object.entries(this.profiles).map(([id, profile]) => ({
      id,
      name: profile.name,
      description: profile.description
    }));
  }

  /**
   * Switch to a different game
   */
  async switchGame(gameId) {
    await this.ensureLoaded();

    if (!this.profiles[gameId]) {
      console.error(`Game not found: ${gameId}`);
      return false;
    }

    this.currentGameId = gameId;
    localStorage.setItem("currentGame", gameId);
    console.log(`✓ Switched to game: ${gameId}`);
    return true;
  }

  /**
   * Get gesture-to-key mapping for a specific gesture type
   * Returns the customized key if available, otherwise the default
   */
  async getGestureMapping(gestureType) {
    const profile = await this.getCurrentProfile();
    if (!profile || !profile.gestures) return null;

    return profile.gestures[gestureType] || null;
  }

  /**
   * Load user customizations from localStorage for a game
   */
  loadCustomizations(gameId) {
    const key = `customMap_${gameId}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(`Error parsing customizations for ${gameId}:`, e);
        return {};
      }
    }

    return {};
  }

  /**
   * Save customization for a gesture in the current game
   * Auto-saves to localStorage
   */
  async updateGestureMapping(gestureType, newKey) {
    const gameId = this.currentGameId;
    const customizations = this.loadCustomizations(gameId);

    // Get the default gesture to preserve metadata
    const defaultProfile = await this.getDefaultProfile(gameId);
    const defaultGesture = defaultProfile.gestures[gestureType];

    if (!defaultGesture) {
      console.error(`Gesture type not found: ${gestureType}`);
      return false;
    }

    // Cannot customize direction mappings (A/D keys)
    if (!defaultGesture.customizable) {
      console.error(`Cannot customize gesture: ${gestureType} (direction mapping)`);
      return false;
    }

    // Update customization
    customizations[gestureType] = {
      ...defaultGesture,
      key: newKey
    };

    // Auto-save to localStorage
    const key = `customMap_${gameId}`;
    localStorage.setItem(key, JSON.stringify(customizations));

    console.log(`✓ Updated ${gestureType} -> ${newKey} for ${gameId}`);
    return true;
  }

  /**
   * Reset all customizations for a game to defaults
   */
  resetToDefaults(gameId = null) {
    gameId = gameId || this.currentGameId;
    const key = `customMap_${gameId}`;
    localStorage.removeItem(key);
    console.log(`✓ Reset customizations for ${gameId}`);
    return true;
  }

  /**
   * Get all customizations for current game
   */
  getAllCustomizations() {
    return this.loadCustomizations(this.currentGameId);
  }

  /**
   * Check if a gesture is customizable (not a direction mapping)
   */
  async isCustomizable(gestureType) {
    const profile = await this.getDefaultProfile(this.currentGameId);
    if (!profile) return false;

    const gesture = profile.gestures[gestureType];
    return gesture ? gesture.customizable === true : false;
  }

  /**
   * Get list of available keys that can be assigned to gestures
   */
  getAvailableKeys() {
    // Matches the keys in VirtualKeyShort enum in C#
    return [
      { key: "A", label: "A (Left)" },
      { key: "D", label: "D (Right)" },
      { key: "C", label: "C (Accelerate)" },
      { key: "X", label: "X (Launch/Jump)" },
      { key: "Space", label: "Space" },
      { key: "W", label: "W" },
      { key: "E", label: "E" },
      { key: "Q", label: "Q" },
      { key: "Z", label: "Z" },
      { key: "S", label: "S" },
      { key: "Enter", label: "Enter" }
    ];
  }

  /**
   * Export current game customizations as JSON
   */
  async exportCustomizations() {
    const gameId = this.currentGameId;
    const customizations = this.getAllCustomizations();
    const profile = await this.getCurrentProfile();

    return {
      gameId,
      gameName: profile.name,
      customizations,
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Import customizations from JSON
   */
  importCustomizations(data) {
    if (!data.gameId || !data.customizations) {
      console.error("Invalid customizations format");
      return false;
    }

    const key = `customMap_${data.gameId}`;
    localStorage.setItem(key, JSON.stringify(data.customizations));
    console.log(`✓ Imported customizations for ${data.gameId}`);
    return true;
  }
}

// Initialize on page load
let configManager = new GameConfigManager();
