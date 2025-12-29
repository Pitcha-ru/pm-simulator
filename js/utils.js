/**
 * Utility Functions
 * Mathematical and helper functions for game logic
 */

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Calculate easeIn curve value
 * Used for priority chance calculations
 */
export function easeInCurve(level, config) {
    const { startAtLevel, endAtLevel, startValue, endValue, exponent } = config;
    
    // Calculate t (normalized position in curve)
    let t = (level - startAtLevel) / (endAtLevel - startAtLevel);
    t = clamp(t, 0, 1);
    
    // Apply easeIn formula
    const value = startValue + (endValue - startValue) * Math.pow(t, exponent);
    
    return value;
}

/**
 * Normalize probabilities to sum to 1
 */
export function normalizeProbabilities(probs) {
    const sum = Object.values(probs).reduce((a, b) => a + b, 0);
    if (sum === 0) return probs;
    
    const normalized = {};
    for (const key in probs) {
        normalized[key] = probs[key] / sum;
    }
    return normalized;
}

/**
 * Sample from a probability distribution
 * Returns the key selected based on probabilities
 */
export function sampleFromDistribution(distribution) {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [key, probability] of Object.entries(distribution)) {
        cumulative += probability;
        if (rand < cumulative) {
            return key;
        }
    }
    
    // Fallback to last key
    return Object.keys(distribution)[Object.keys(distribution).length - 1];
}

/**
 * Get random item from array
 */
export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num) {
    return Math.floor(num).toLocaleString('ru-RU');
}

/**
 * Format time in seconds to display string
 */
export function formatTime(seconds) {
    return seconds.toFixed(1) + 's';
}

