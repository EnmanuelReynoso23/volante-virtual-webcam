/**
 * Control Mapper Module
 * Maps detected gestures to keyboard actions based on current game profile
 * Handles user customizations from localStorage
 */

class ControlMapper {
  constructor(configManager) {
    this.configManager = configManager;
  }

  /**
   * Map a detected gesture to control actions
   * Returns object with action names and their assigned keys
   */
  async mapGestureToActions(gesture) {
    const profile = await this.configManager.getCurrentProfile();

    if (!profile) {
      console.error("No active game profile");
      return {};
    }

    const actions = {};

    // Always map direction (immutable)
    if (gesture.direction && gesture.direction !== "center") {
      actions.direction = gesture.direction;
    }

    // Map gesture type to action based on profile
    if (gesture.gestureType && profile.gestures[gesture.gestureType]) {
      const gestureMapping = profile.gestures[gesture.gestureType];
      actions.action = gesture.gestureType;
      actions.key = gestureMapping.key;
      actions.label = gestureMapping.label;
    }

    return actions;
  }

  /**
   * Convert mapped actions to keyboard keys
   * Returns object with keys that need to be pressed/released
   */
  async mapActionsToKeys(actions) {
    const keys = {
      direction: null,
      action: null,
      directional: null
    };

    // Direction keys are IMMUTABLE
    if (actions.direction === "leftTurn") {
      keys.direction = "A";
      keys.directional = -1; // For command format
    } else if (actions.direction === "rightTurn") {
      keys.direction = "D";
      keys.directional = 1; // For command format
    } else {
      keys.directional = 0; // Center/no movement
    }

    // Action key comes from customized profile
    if (actions.key) {
      keys.action = actions.key;
    }

    return keys;
  }

  /**
   * Generate HTTP command string for Node.js server
   * Format: ?movimiento=X&brincar=Y&acelerar=Z&gameId=ABC
   */
  async generateHTTPCommand(gesture) {
    const gameId = this.configManager.getCurrentGameId();
    const actions = await this.mapGestureToActions(gesture);
    const keys = await this.mapActionsToKeys(actions);

    // Build command following existing protocol
    const params = {
      movimiento: keys.directional || 0,
      brincar: 0, // Not used in current implementation
      acelerar: 0, // Not used in current implementation
      gameId: gameId,
      action: actions.action || "none",
      actionKey: actions.key || "none"
    };

    // Build query string
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    return queryString;
  }

  /**
   * Generate stdin command for C# backend
   * Format: "movimiento,brincar,acelerar,actionKey:actionName"
   */
  async generateStdinCommand(gesture) {
    const gameId = this.configManager.getCurrentGameId();
    const actions = await this.mapGestureToActions(gesture);
    const keys = await this.mapActionsToKeys(actions);

    // Build stdin format
    const parts = [
      keys.directional || 0, // movimiento
      0, // brincar (placeholder)
      0 // acelerar (placeholder)
    ];

    // Add action if present
    if (actions.key) {
      parts.push(`${actions.key}:${actions.action}`);
    }

    return parts.join(",");
  }

  /**
   * Get the key that will be pressed for a given gesture
   */
  async getKeyForGesture(gestureType) {
    const profile = await this.configManager.getCurrentProfile();

    if (!profile || !profile.gestures[gestureType]) {
      return null;
    }

    return profile.gestures[gestureType].key;
  }

  /**
   * Get all current gesture-to-key mappings
   */
  async getAllMappings() {
    const profile = await this.configManager.getCurrentProfile();

    if (!profile) {
      return {};
    }

    const mappings = {};

    Object.entries(profile.gestures).forEach(([gestureType, gestureData]) => {
      mappings[gestureType] = {
        key: gestureData.key,
        label: gestureData.label,
        customizable: gestureData.customizable
      };
    });

    return mappings;
  }

  /**
   * Check if direction detection is working correctly
   * Direction should ALWAYS use ±15° threshold
   */
  validateDirectionThreshold(angle) {
    const THRESHOLD = 15; // IMMUTABLE
    const direction = GestureDetector.detectDirection(angle);

    if (angle >= THRESHOLD && direction !== "leftTurn") {
      return { valid: false, error: "Direction mapping broken for left turn" };
    }
    if (angle <= -THRESHOLD && direction !== "rightTurn") {
      return { valid: false, error: "Direction mapping broken for right turn" };
    }
    if (Math.abs(angle) < THRESHOLD && direction !== "center") {
      return { valid: false, error: "Direction mapping broken for center" };
    }

    return { valid: true };
  }

  /**
   * Get a summary of current control setup
   */
  async getControlSummary() {
    const profile = await this.configManager.getCurrentProfile();
    const gameId = this.configManager.getCurrentGameId();

    return {
      gameId,
      gameName: profile.name,
      gameDescription: profile.description,
      angleThreshold: profile.constants.angleThreshold,
      mappings: await this.getAllMappings()
    };
  }
}
