/**
 * Game State Management (Multi-Card Mode)
 * Manages the current state of the game with multiple simultaneous tasks
 */

import { randomChoice } from './utils.js';
import { 
    calculateActiveDepartmentsCount, 
    selectPriority, 
    calculateTimerDuration,
    calculateSpawnInterval 
} from './gameLogic.js';

export class GameState {
    constructor(gameData) {
        this.gameData = gameData;
        this.config = gameData.config;
        
        // Game state
        this.level = 1;
        this.score = 0;
        this.streakMultiplier = 1.0;
        this.tasksCompletedThisLevel = 0;
        this.totalTasksCompleted = 0;
        
        // Lives system
        this.lives = this.config.lives.startLives;
        this.maxLives = this.config.lives.maxLives;
        
        // Multi-card mode
        this.activeTasks = []; // Array of active tasks
        this.nextTaskId = 1;
        this.maxSimultaneousCards = this.config.multiCard.maxSimultaneousCards;
        
        // Active departments
        this.activeDepartments = [];
        this.updateActiveDepartments();
        
        // Spawn interval
        this.currentSpawnInterval = calculateSpawnInterval(this.level, this.config);
    }
    
    /**
     * Update which departments are active for current level
     * Existing departments stay, new ones are only added
     */
    updateActiveDepartments() {
        const allActiveDepts = this.gameData.departments.departments.filter(d => d.active);
        const count = calculateActiveDepartmentsCount(
            this.level, 
            this.config, 
            allActiveDepts.length
        );
        
        // First time (game start) - randomly select initial departments
        if (this.activeDepartments.length === 0) {
            const shuffled = this.shuffleArray([...allActiveDepts]);
            this.activeDepartments = shuffled.slice(0, count);
            return;
        }
        
        // Level up - only ADD new departments, don't remove existing ones
        const currentCount = this.activeDepartments.length;
        const needToAdd = count - currentCount;
        
        if (needToAdd > 0) {
            // Get departments that are not yet active
            const activeDeptIds = new Set(this.activeDepartments.map(d => d.id));
            const availableDepts = allActiveDepts.filter(d => !activeDeptIds.has(d.id));
            
            if (availableDepts.length > 0) {
                // Randomly select from available departments
                const shuffled = this.shuffleArray([...availableDepts]);
                const toAdd = shuffled.slice(0, Math.min(needToAdd, shuffled.length));
                
                // Add to active departments
                this.activeDepartments = [...this.activeDepartments, ...toAdd];
            }
        }
        
        // Never remove departments (even if count decreases)
    }
    
    /**
     * Shuffle array (Fisher-Yates algorithm)
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    /**
     * Create a new task
     */
    createTask() {
        // Check if we can spawn more tasks
        if (this.activeTasks.length >= this.maxSimultaneousCards) {
            return null;
        }
        
        // Select random department from active departments
        const department = randomChoice(this.activeDepartments);
        
        // Select random task from department
        const taskTitle = randomChoice(department.tasks);
        
        // Determine priority
        const priority = selectPriority(this.level, this.config);
        
        // Select random author
        const author = randomChoice(this.gameData.taskAuthors.author);
        
        // Get priority commentary
        const priorityData = this.gameData.priorityComments.priority_commentary[priority];
        const message = randomChoice(priorityData.messages);
        
        // Calculate timer duration
        const timerDuration = calculateTimerDuration(this.level, priority, this.config);
        
        // Create task object
        const task = {
            id: this.nextTaskId++,
            title: taskTitle,
            priority: priority,
            priorityIcon: priorityData.iconURL,
            backgroundColor: priorityData.backgroundColor,
            textColor: priorityData.textColor,
            departmentId: department.id,
            departmentName: department.name,
            author: {
                name: author.name,
                avatarURL: author.avatarURL
            },
            message: message,
            timerDuration: timerDuration,
            startTime: Date.now(),
            totalTime: timerDuration * 1000
        };
        
        // Add to active tasks
        this.activeTasks.push(task);
        
        return task;
    }
    
    /**
     * Get task by ID
     */
    getTask(taskId) {
        return this.activeTasks.find(t => t.id === taskId);
    }
    
    /**
     * Remove task by ID
     */
    removeTask(taskId) {
        this.activeTasks = this.activeTasks.filter(t => t.id !== taskId);
    }
    
    /**
     * Get elapsed time for a task (in seconds)
     */
    getTaskElapsedTime(task) {
        if (!task || !task.startTime) return 0;
        return (Date.now() - task.startTime) / 1000;
    }
    
    /**
     * Get remaining time for a task (in seconds)
     */
    getTaskRemainingTime(task) {
        const elapsed = this.getTaskElapsedTime(task);
        return Math.max(0, task.timerDuration - elapsed);
    }
    
    /**
     * Get timer progress for a task (0 to 1)
     */
    getTaskTimerProgress(task) {
        const elapsed = this.getTaskElapsedTime(task);
        return Math.min(1, elapsed / task.timerDuration);
    }
    
    /**
     * Check if task timer has expired
     */
    isTaskTimedOut(task) {
        return this.getTaskRemainingTime(task) <= 0;
    }
    
    /**
     * Get all timed out tasks
     */
    getTimedOutTasks() {
        return this.activeTasks.filter(task => this.isTaskTimedOut(task));
    }
    
    /**
     * Lose a life
     */
    loseLife() {
        this.lives = Math.max(0, this.lives - 1);
        return this.lives;
    }
    
    /**
     * Check if game over
     */
    isGameOver() {
        return this.lives <= 0;
    }
    
    /**
     * Level up
     */
    levelUp() {
        if (this.level < this.config.levels.maxLevels) {
            this.level++;
            this.tasksCompletedThisLevel = 0;
            this.updateActiveDepartments();
            this.currentSpawnInterval = calculateSpawnInterval(this.level, this.config);
            return true;
        }
        return false;
    }
    
    /**
     * Add score
     */
    addScore(points) {
        this.score += points;
    }
    
    /**
     * Update streak multiplier
     */
    setStreakMultiplier(multiplier) {
        this.streakMultiplier = multiplier;
    }
    
    /**
     * Increment tasks completed
     */
    incrementTasksCompleted() {
        this.tasksCompletedThisLevel++;
        this.totalTasksCompleted++;
    }
    
    /**
     * Get current spawn interval
     */
    getSpawnInterval() {
        return this.currentSpawnInterval;
    }
    
    /**
     * Can spawn new task
     */
    canSpawnTask() {
        return this.activeTasks.length < this.maxSimultaneousCards && !this.isGameOver();
    }
    
    /**
     * Get current state as object
     */
    getState() {
        return {
            level: this.level,
            score: this.score,
            streakMultiplier: this.streakMultiplier,
            tasksCompletedThisLevel: this.tasksCompletedThisLevel,
            totalTasksCompleted: this.totalTasksCompleted,
            lives: this.lives,
            maxLives: this.maxLives,
            activeDepartments: this.activeDepartments,
            activeTasks: this.activeTasks,
            activeTasksCount: this.activeTasks.length,
            spawnInterval: this.currentSpawnInterval
        };
    }
}
