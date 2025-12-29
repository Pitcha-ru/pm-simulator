/**
 * Game Logic Module
 * Handles scoring, timers, levels, and priority calculations
 */

import { clamp, easeInCurve, normalizeProbabilities, sampleFromDistribution } from './utils.js';

/**
 * Calculate active departments count for current level
 */
export function calculateActiveDepartmentsCount(level, config, totalActiveDepartments) {
    const { startActive, growth, maxActiveFromDepartmentsJson, fallbackMaxActive } = config.departments;
    
    let count = startActive;
    
    // Apply growth model
    if (growth.mode === 'linearStep') {
        const levelsProgressed = level - 1;
        const increments = Math.floor(levelsProgressed / growth.everyLevels);
        count = startActive + (increments * growth.addCount);
    }
    
    // Determine max
    const max = maxActiveFromDepartmentsJson ? totalActiveDepartments : fallbackMaxActive;
    
    // Apply cap
    if (growth.capToMax || config.validation.clampDepartmentsActive) {
        count = clamp(count, startActive, max);
    }
    
    return count;
}

/**
 * Calculate priority probabilities for current level
 */
export function calculatePriorityProbabilities(level, config) {
    const { curves, constraints } = config.taskSpawn.priorityChances;
    
    // Calculate serious and critical probabilities using easeIn curves
    let pSerious = easeInCurve(level, curves.serious);
    let pCritical = easeInCurve(level, curves.critical);
    
    // Clamp to range
    if (constraints.clampEachToRange) {
        const [min, max] = constraints.clampEachToRange;
        pSerious = clamp(pSerious, min, max);
        pCritical = clamp(pCritical, min, max);
    }
    
    // Calculate regular (derived)
    let pRegular = 1 - pSerious - pCritical;
    
    // Handle negative regular
    if (pRegular < 0 && constraints.ifRegularNegative === 'renormalizeSeriousCritical') {
        // Renormalize serious and critical
        const sum = pSerious + pCritical;
        if (sum > 0) {
            pSerious = pSerious / sum;
            pCritical = pCritical / sum;
        }
        pRegular = 0;
    } else {
        pRegular = Math.max(0, pRegular);
    }
    
    // Ensure sum to one
    let probs = { regular: pRegular, serious: pSerious, critical: pCritical };
    if (constraints.ensureSumToOne) {
        probs = normalizeProbabilities(probs);
    }
    
    return probs;
}

/**
 * Select random priority based on probabilities
 */
export function selectPriority(level, config) {
    const probs = calculatePriorityProbabilities(level, config);
    return sampleFromDistribution(probs);
}

/**
 * Calculate timer duration for a task
 */
export function calculateTimerDuration(level, priority, config) {
    const { regular, priorityTimeMultipliers } = config.timers;
    const { baseSeconds, perLevelScaling } = regular;
    
    // Calculate scaled base time
    let scaled = baseSeconds;
    
    if (perLevelScaling.mode === 'exponential') {
        const multiplier = perLevelScaling.multiplierEachLevel;
        scaled = baseSeconds * Math.pow(multiplier, level - 1);
        scaled = Math.max(perLevelScaling.minSeconds, scaled);
    } else if (perLevelScaling.mode === 'constant' && perLevelScaling.keepConstant) {
        // Constant time - doesn't change with level
        scaled = baseSeconds;
    }
    
    // Apply priority multiplier
    const priorityMult = priorityTimeMultipliers[priority] || 1.0;
    let finalSeconds = scaled * priorityMult;
    
    // Apply validation floor
    if (config.validation.minSecondsFloor) {
        finalSeconds = Math.max(config.validation.minSecondsFloor, finalSeconds);
    }
    
    return finalSeconds;
}

/**
 * Calculate spawn interval for new tasks
 */
export function calculateSpawnInterval(level, config) {
    const { baseSeconds, perLevelScaling } = config.spawnInterval;
    
    let interval = baseSeconds;
    
    if (perLevelScaling.mode === 'exponential') {
        const multiplier = perLevelScaling.multiplierEachLevel;
        interval = baseSeconds * Math.pow(multiplier, level - 1);
        interval = Math.max(perLevelScaling.minSeconds, interval);
    }
    
    // Apply validation floor
    if (config.validation.minSecondsFloor) {
        interval = Math.max(config.validation.minSecondsFloor, interval);
    }
    
    return interval;
}

/**
 * Calculate score for a completed task
 */
export function calculateScore(taskData, elapsedTime, totalTime, streakMultiplier, config) {
    const { basePoints, priorityScoreMultipliers, timeBonus, streak } = config.scoring;
    
    // Base points with priority multiplier
    const priorityMult = priorityScoreMultipliers[taskData.priority] || 1.0;
    let points = basePoints * priorityMult;
    
    // Calculate time bonus
    let bonusPoints = 0;
    if (timeBonus.enabled) {
        const progress = elapsedTime / totalTime;
        const { maxBonusPoints, bonusIfFinishedInFirstPercent, bonusFallsToZeroAtPercent } = timeBonus;
        
        if (progress <= bonusIfFinishedInFirstPercent) {
            bonusPoints = maxBonusPoints;
        } else if (progress >= bonusFallsToZeroAtPercent) {
            bonusPoints = 0;
        } else {
            // Linear interpolation
            const range = bonusFallsToZeroAtPercent - bonusIfFinishedInFirstPercent;
            const progressInRange = (progress - bonusIfFinishedInFirstPercent) / range;
            bonusPoints = maxBonusPoints * (1 - progressInRange);
        }
    }
    
    // Apply streak multiplier
    let finalStreakMult = 1.0;
    if (streak.enabled) {
        finalStreakMult = streakMultiplier;
    }
    
    // Calculate final score
    const finalScore = (points + bonusPoints) * finalStreakMult;
    
    return {
        basePoints: Math.round(points),
        bonusPoints: Math.round(bonusPoints),
        streakMultiplier: finalStreakMult,
        totalPoints: Math.round(finalScore)
    };
}

/**
 * Update streak multiplier
 */
export function updateStreakMultiplier(currentStreak, isSuccess, config) {
    const { enabled, maxMultiplier, gainPerSuccess, resetOnFail } = config.scoring.streak;
    
    if (!enabled) return 1.0;
    
    if (isSuccess) {
        const newStreak = Math.min(currentStreak + gainPerSuccess, maxMultiplier);
        return newStreak;
    } else {
        // Failed or timeout
        if (resetOnFail) {
            return 1.0;
        }
        return currentStreak;
    }
}

/**
 * Check if level up should occur
 * Uses fixed tasks per level (8 tasks)
 */
export function shouldLevelUp(tasksCompletedThisLevel, config) {
    const TASKS_PER_LEVEL = 8;
    return tasksCompletedThisLevel >= TASKS_PER_LEVEL;
}

/**
 * Check if max level reached
 */
export function isMaxLevelReached(level, config) {
    return level >= config.levels.maxLevels;
}

