/**
 * Main Game Controller (Multi-Card Mode)
 * Orchestrates all game modules with multiple simultaneous tasks
 */

import { loadGameData, preloadImages } from './supabaseLoader.js';
import { GameState } from './gameState.js';
import { UIManager } from './ui.js';
import { DragDropManager } from './dragDrop.js';
import { Leaderboard } from './leaderboard.js';
import { calculateScore, updateStreakMultiplier, shouldLevelUp } from './gameLogic.js';

class PMSimulator {
    constructor() {
        this.gameData = null;
        this.gameState = null;
        this.uiManager = new UIManager();
        this.dragDropManager = null;
        this.leaderboard = new Leaderboard();
        
        this.timerInterval = null;
        this.spawnInterval = null;
        this.isProcessingDrop = false;
        this.isProcessingTimeout = false;  // Флаг обработки timeout
        
        this.playerName = '';
        
        this.init();
    }
    
    /**
     * Initialize the game
     */
    async init() {
        try {
            // Show loading screen
            this.uiManager.showLoading();
            
            // Load game data
            this.gameData = await loadGameData();
            
            // Preload images
            await preloadImages(this.gameData);
            
            // Setup base UI
            this.setupBaseUI();
            
            // Show start screen
            this.showStartScreen();
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.uiManager.showError(error.message);
        }
    }
    
    /**
     * Show start screen with leaderboard
     */
    showStartScreen() {
        // Render leaderboard on start screen
        const topScores = this.leaderboard.getTopScores(5);
        this.uiManager.renderStartLeaderboard(topScores);
        
        // Show start screen
        this.uiManager.showStart();
    }
    
    /**
     * Start game after player enters name
     */
    startGameWithPlayer() {
        // Get player name
        const input = this.uiManager.elements.playerNameInput.value.trim();
        this.playerName = input || 'Аноним';
        
        // Initialize game state
        this.gameState = new GameState(this.gameData);
        
        // Setup game UI
        this.setupGameUI();
        
        // Show game screen
        this.uiManager.showGame();
        
        // Start game
        this.startGame();
    }
    
    /**
     * Setup base UI (before game starts)
     */
    setupBaseUI() {
        // Setup retry button
        this.uiManager.elements.retryButton.addEventListener('click', () => {
            location.reload();
        });
        
        // Setup restart button
        this.uiManager.elements.restartButton.addEventListener('click', () => {
            location.reload();
        });
        
        // Setup start game button
        this.uiManager.elements.startGameButton.addEventListener('click', () => {
            this.startGameWithPlayer();
        });
        
        // Setup Enter key on input
        this.uiManager.elements.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startGameWithPlayer();
            }
        });
    }
    
    /**
     * Setup game UI (after game starts)
     */
    setupGameUI() {
        // Render departments
        this.uiManager.renderDepartments(this.gameState.activeDepartments);
        
        // Update scoreboard
        this.uiManager.updateScoreboard(this.gameState.getState());
        
        // Setup drag and drop
        const tasksContainer = document.getElementById('tasks-container');
        this.dragDropManager = new DragDropManager(
            tasksContainer,
            this.uiManager,
            this.onTaskDrop.bind(this)
        );
    }
    
    /**
     * Start the game
     */
    startGame() {
        // Spawn first task
        this.spawnNewTask();
        
        // Start spawn loop
        this.startSpawnLoop();
        
        // Start timer loop
        this.startTimerLoop();
    }
    
    /**
     * Spawn a new task
     */
    spawnNewTask() {
        if (!this.gameState.canSpawnTask()) {
            return;
        }
        
        const task = this.gameState.createTask();
        if (task) {
            // Add to UI
            this.uiManager.addTaskCard(task);
            
            // Update author panel with latest task
            this.uiManager.updateAuthorPanel(task);
        }
    }
    
    /**
     * Start spawn loop (creates new tasks at intervals)
     */
    startSpawnLoop() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
        }
        
        const spawnIntervalMs = this.gameState.getSpawnInterval() * 1000;
        
        this.spawnInterval = setInterval(() => {
            if (!this.gameState.isGameOver()) {
                this.spawnNewTask();
            }
        }, spawnIntervalMs);
    }
    
    /**
     * Start timer update loop
     */
    startTimerLoop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.updateAllTimers();
            this.checkTimeouts();
        }, 50); // Update every 50ms for smooth animation
    }
    
    /**
     * Update all task timers
     */
    updateAllTimers() {
        this.gameState.activeTasks.forEach(task => {
            const remainingTime = this.gameState.getTaskRemainingTime(task);
            const progress = this.gameState.getTaskTimerProgress(task);
            this.uiManager.updateTaskTimer(task, remainingTime, progress);
        });
    }
    
    /**
     * Check for timed out tasks
     */
    checkTimeouts() {
        const timedOutTasks = this.gameState.getTimedOutTasks();
        
        // Process only one timeout at a time to prevent losing all lives at once
        if (timedOutTasks.length > 0 && !this.isProcessingTimeout) {
            const task = timedOutTasks[0];
            this.isProcessingTimeout = true;
            this.onTaskTimeout(task);
        }
    }
    
    /**
     * Handle task drop on department
     */
    onTaskDrop(taskId, departmentId) {
        if (this.isProcessingDrop) return;
        this.isProcessingDrop = true;
        
        const task = this.gameState.getTask(taskId);
        if (!task) {
            this.isProcessingDrop = false;
            return;
        }
        
        // Check if correct
        const isCorrect = departmentId === task.departmentId;
        
        if (isCorrect) {
            this.onTaskSuccess(task);
        } else {
            this.onTaskFail(task);
        }
        
        setTimeout(() => {
            this.isProcessingDrop = false;
        }, 100);
    }
    
    /**
     * Handle successful task completion
     */
    onTaskSuccess(task) {
        // Calculate score
        const elapsedTime = this.gameState.getTaskElapsedTime(task);
        const totalTime = task.timerDuration;
        const scoreResult = calculateScore(
            task,
            elapsedTime,
            totalTime,
            this.gameState.streakMultiplier,
            this.gameState.config
        );
        
        // Update game state
        this.gameState.addScore(scoreResult.totalPoints);
        this.gameState.incrementTasksCompleted();
        
        // Update streak
        const newStreak = updateStreakMultiplier(
            this.gameState.streakMultiplier,
            true,
            this.gameState.config
        );
        this.gameState.setStreakMultiplier(newStreak);
        
        // Show success animation
        this.uiManager.showTaskSuccess(task.id);
        this.uiManager.showFeedback(`+${scoreResult.totalPoints} очков!`, 'success');
        
        // Update scoreboard
        this.uiManager.updateScoreboard(this.gameState.getState());
        
        // Remove task after animation
        setTimeout(() => {
            this.gameState.removeTask(task.id);
            this.uiManager.removeTaskCard(task.id);
            
            // СПАВНИМ НОВУЮ КАРТОЧКУ СРАЗУ ПОСЛЕ УСПЕШНОГО DROP
            if (this.gameState.canSpawnTask() && !this.gameState.isGameOver()) {
                this.spawnNewTask();
            }
        }, 400);
        
        // Check for level up
        const shouldLevel = shouldLevelUp(
            this.gameState.tasksCompletedThisLevel,
            this.gameState.config
        );
        
        if (shouldLevel) {
            setTimeout(() => {
                this.onLevelUp();
            }, 600);
        }
    }
    
    /**
     * Handle task failure (wrong department)
     */
    onTaskFail(task) {
        // Show fail animation
        this.uiManager.showTaskFail(task.id);
        this.uiManager.showFeedback('Неверный отдел!', 'fail');
        
        // Update streak (reset)
        const newStreak = updateStreakMultiplier(
            this.gameState.streakMultiplier,
            false,
            this.gameState.config
        );
        this.gameState.setStreakMultiplier(newStreak);
        
        // Update scoreboard
        this.uiManager.updateScoreboard(this.gameState.getState());
        
        // Card stays on board, player can try again
        setTimeout(() => {
            const cardElement = document.querySelector(`[data-task-id="${task.id}"]`);
            if (cardElement) {
                cardElement.classList.remove('fail');
            }
        }, 400);
    }
    
    /**
     * Handle task timeout
     */
    onTaskTimeout(task) {
        // Lose a life
        const remainingLives = this.gameState.loseLife();
        
        // Update streak (reset)
        const newStreak = updateStreakMultiplier(
            this.gameState.streakMultiplier,
            false,
            this.gameState.config
        );
        this.gameState.setStreakMultiplier(newStreak);
        
        // Show timeout animation
        this.uiManager.showTaskTimeout(task.id);
        this.uiManager.showFeedback(`Время истекло! Жизни: ${remainingLives}`, 'fail');
        
        // Update scoreboard
        this.uiManager.updateScoreboard(this.gameState.getState());
        
        // Remove task СРАЗУ из списка активных (чтобы не обрабатывалась повторно)
        this.gameState.removeTask(task.id);
        
        // Check for game over BEFORE resetting processing flag
        const gameOver = this.gameState.isGameOver();
        
        // Remove card from UI after animation
        setTimeout(() => {
            this.uiManager.removeTaskCard(task.id);
            
            // Разрешаем обработку следующего timeout ТОЛЬКО если игра НЕ окончена
            if (!gameOver) {
                this.isProcessingTimeout = false;
            }
        }, 500);
        
        // Trigger game over if needed
        if (gameOver) {
            // Останавливаем таймеры чтобы не обрабатывать больше timeout'ов
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
            if (this.spawnInterval) {
                clearInterval(this.spawnInterval);
                this.spawnInterval = null;
            }
            
            setTimeout(() => {
                this.onGameOver();
            }, 800);
        }
    }
    
    /**
     * Handle level up
     */
    onLevelUp() {
        const didLevelUp = this.gameState.levelUp();
        
        if (didLevelUp) {
            // Show level up message
            this.uiManager.showFeedback(`Уровень ${this.gameState.level}!`, 'success');
            
            // Update departments for new level
            this.uiManager.renderDepartments(this.gameState.activeDepartments);
            
            // Update scoreboard
            this.uiManager.updateScoreboard(this.gameState.getState());
            
            // Restart spawn loop with new interval
            this.startSpawnLoop();
        } else {
            // Max level reached
            this.onGameComplete();
        }
    }
    
    /**
     * Handle game over (no more lives)
     */
    onGameOver() {
        // Stop all intervals
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
        
        // Cancel any ongoing drag
        if (this.dragDropManager) {
            this.dragDropManager.cancelDrag();
        }
        
        // Save score to leaderboard
        this.leaderboard.addScore(
            this.playerName,
            this.gameState.score,
            this.gameState.level,
            this.gameState.totalTasksCompleted
        );
        
        // Get player rank
        const rank = this.leaderboard.getPlayerRank(this.playerName);
        
        // Get top 5 for display
        const topScores = this.leaderboard.getTopScores(5);
        
        // Show game over screen with leaderboard
        const stats = {
            score: this.gameState.score,
            level: this.gameState.level,
            totalTasksCompleted: this.gameState.totalTasksCompleted
        };
        
        this.uiManager.showGameOver(stats, this.playerName, rank, topScores);
    }
    
    /**
     * Handle game completion (max level reached)
     */
    onGameComplete() {
        // Stop all intervals
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
        
        // Show completion message
        this.uiManager.showFeedback(
            `Поздравляем! Максимальный уровень достигнут!`,
            'success'
        );
        
        // Save score to leaderboard
        this.leaderboard.addScore(
            this.playerName,
            this.gameState.score,
            this.gameState.level,
            this.gameState.totalTasksCompleted
        );
        
        // Get player rank
        const rank = this.leaderboard.getPlayerRank(this.playerName);
        
        // Get top 5 for display
        const topScores = this.leaderboard.getTopScores(5);
        
        // Show game over screen with stats and leaderboard
        const stats = {
            score: this.gameState.score,
            level: this.gameState.level,
            totalTasksCompleted: this.gameState.totalTasksCompleted
        };
        
        setTimeout(() => {
            this.uiManager.showGameOver(stats, this.playerName, rank, topScores);
        }, 2000);
    }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PMSimulator();
    });
} else {
    new PMSimulator();
}
