/**
 * Gesture Detection Module
 * Detects hand gestures from MediaPipe Hands landmarks
 * Game-agnostic: Returns pure gesture data without key mapping
 */

class GestureDetector {
  // IMMUTABLE CONSTANT: Direction detection threshold
  static ANGLE_THRESHOLD = 15;

  /**
   * Detect if hand is open (3+ fingers raised)
   * Based on finger tip vs base position
   */
  static isHandOpen(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;

    // Get finger tip and base positions
    const indexTip = landmarks[8];
    const indexBase = landmarks[5];
    const middleTip = landmarks[12];
    const middleBase = landmarks[9];
    const ringTip = landmarks[16];
    const ringBase = landmarks[13];
    const pinkyTip = landmarks[20];
    const pinkyBase = landmarks[17];

    // Check how many fingers are raised
    let raisedCount = 0;

    // Finger is raised if tip is above base by at least 0.04 in Y coordinate
    const threshold = 0.04;

    if (indexTip.y < indexBase.y - threshold) raisedCount++;
    if (middleTip.y < middleBase.y - threshold) raisedCount++;
    if (ringTip.y < ringBase.y - threshold) raisedCount++;
    if (pinkyTip.y < pinkyBase.y - threshold) raisedCount++;

    // Hand is open if 3 or more fingers are raised
    return raisedCount >= 3;
  }

  /**
   * Detect if hand is closed (fist)
   */
  static isHandClosed(landmarks) {
    return !this.isHandOpen(landmarks);
  }

  /**
   * Calculate angle between two hands (in degrees)
   * Returns angle in range [-180, 180]
   * Positive = right hand higher (turns left), Negative = left hand higher (turns right)
   */
  static calculateHandAngle(leftHandLandmarks, rightHandLandmarks) {
    if (!leftHandLandmarks || !rightHandLandmarks) return 0;

    // Use wrist position (landmark 0) for angle calculation
    const leftWrist = leftHandLandmarks[0];
    const rightWrist = rightHandLandmarks[0];

    const deltaY = rightWrist.y - leftWrist.y;
    const deltaX = rightWrist.x - leftWrist.x;

    // Avoid division by zero
    if (Math.abs(deltaX) < 0.001) {
      return deltaY > 0 ? 90 : -90;
    }

    const angleRad = Math.atan(deltaY / deltaX);
    const angleDeg = angleRad * (180 / Math.PI);

    return Math.round(angleDeg);
  }

  /**
   * Detect direction based on hand angle
   * IMMUTABLE: Uses ±15° threshold ALWAYS
   * Returns: "leftTurn", "rightTurn", or "center"
   */
  static detectDirection(angle) {
    const threshold = GestureDetector.ANGLE_THRESHOLD; // 15 degrees - CONSTANT

    if (angle >= threshold) {
      return "leftTurn";
    } else if (angle <= -threshold) {
      return "rightTurn";
    } else {
      return "center";
    }
  }

  /**
   * Detect composite gesture from both hands
   * Returns gesture object with detected states
   */
  static detectCompositeGesture(hands) {
    const gesture = {
      numHands: 0,
      direction: "center",
      angle: 0,
      hand0: { present: false, state: "unknown" },
      hand1: { present: false, state: "unknown" },
      gestureType: "none"
    };

    if (!hands || hands.length === 0) {
      return gesture;
    }

    gesture.numHands = hands.length;

    // Get hand states
    if (hands.length >= 1 && hands[0].landmarks) {
      gesture.hand0.present = true;
      gesture.hand0.state = this.isHandOpen(hands[0].landmarks) ? "open" : "closed";
    }

    if (hands.length >= 2 && hands[1].landmarks) {
      gesture.hand1.present = true;
      gesture.hand1.state = this.isHandOpen(hands[1].landmarks) ? "open" : "closed";

      // Calculate direction from both hands
      gesture.angle = this.calculateHandAngle(hands[0].landmarks, hands[1].landmarks);
      gesture.direction = this.detectDirection(gesture.angle);
    } else if (hands.length >= 1) {
      // Single hand detected - try to get some direction info
      gesture.direction = "center"; // Or could use hand position x-coordinate
    }

    // Determine composite gesture type
    if (gesture.hand0.present && gesture.hand1.present) {
      if (gesture.hand0.state === "open" && gesture.hand1.state === "open") {
        gesture.gestureType = "bothHandsOpen";
      } else if (gesture.hand0.state === "closed" && gesture.hand1.state === "closed") {
        gesture.gestureType = "bothHandsClosed";
      } else if (gesture.hand0.state === "open" && gesture.hand1.state === "closed") {
        gesture.gestureType = "mixedOpenClosed1";
      } else if (gesture.hand0.state === "closed" && gesture.hand1.state === "open") {
        gesture.gestureType = "mixedOpenClosed2";
      }
    } else if (gesture.hand0.present) {
      if (gesture.hand0.state === "open") {
        gesture.gestureType = "oneHandOpen";
      } else {
        gesture.gestureType = "oneHandClosed";
      }
    }

    return gesture;
  }

  /**
   * Get human-readable description of detected gesture
   */
  static getGestureDescription(gesture) {
    const parts = [];

    if (gesture.numHands === 0) {
      return "No hands detected";
    }

    if (gesture.direction !== "center") {
      parts.push(gesture.direction === "leftTurn" ? "Turning LEFT" : "Turning RIGHT");
      parts.push(`(Angle: ${gesture.angle}°)`);
    }

    if (gesture.hand0.present) {
      parts.push(`Hand 1: ${gesture.hand0.state}`);
    }
    if (gesture.hand1.present) {
      parts.push(`Hand 2: ${gesture.hand1.state}`);
    }

    return parts.join(" | ");
  }

  /**
   * Validate gesture data (for debugging)
   */
  static validateGesture(gesture) {
    const issues = [];

    if (gesture.numHands < 0 || gesture.numHands > 2) {
      issues.push("Invalid hand count");
    }

    if (!["leftTurn", "rightTurn", "center"].includes(gesture.direction)) {
      issues.push("Invalid direction");
    }

    if (gesture.angle < -180 || gesture.angle > 180) {
      issues.push("Invalid angle");
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}
