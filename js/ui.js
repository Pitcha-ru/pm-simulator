/**
 * UI Module (Multi-Card Mode)
 * Handles UI updates and rendering for multiple simultaneous tasks
 */

import { formatNumber, formatTime } from './utils.js';

export class UIManager {
    constructor() {
        // Cache DOM elements
        this.elements = {
            // Screens
            loadingScreen: document.getElementById('loading-screen'),
            startScreen: document.getElementById('start-screen'),
            errorScreen: document.getElementById('error-screen'),
            errorMessage: document.getElementById('error-message'),
            retryButton: document.getElementById('retry-button'),
            gameoverScreen: document.getElementById('gameover-screen'),
            gameContainer: document.getElementById('game-container'),
            
            // Start screen
            playerNameInput: document.getElementById('player-name-input'),
            startGameButton: document.getElementById('start-game-button'),
            startLeaderboardList: document.getElementById('start-leaderboard-list'),
            
            // Header
            authorAvatar: document.getElementById('author-avatar'),
            authorName: document.getElementById('author-name'),
            authorMessage: document.getElementById('author-message'),
            scoreValue: document.getElementById('score-value'),
            levelValue: document.getElementById('level-value'),
            streakValue: document.getElementById('streak-value'),
            livesValue: document.getElementById('lives-value'),
            
            // Tasks
            tasksContainer: document.getElementById('tasks-container'),
            
            // Departments
            departmentsContainer: document.getElementById('departments-container'),
            
            // Feedback
            feedbackMessage: document.getElementById('feedback-message'),
            scoreFeedback: document.getElementById('score-feedback'),
            
            // Game Over
            finalScore: document.getElementById('final-score'),
            finalLevel: document.getElementById('final-level'),
            finalTasks: document.getElementById('final-tasks'),
            restartButton: document.getElementById('restart-button'),
            playerNameDisplay: document.getElementById('player-name-display'),
            playerRankDisplay: document.getElementById('player-rank-display'),
            gameoverLeaderboardList: document.getElementById('gameover-leaderboard-list')
        };
    }
    
    /**
     * Show loading screen
     */
    showLoading() {
        this.elements.loadingScreen.classList.remove('hidden');
        this.elements.startScreen.classList.add('hidden');
        this.elements.errorScreen.classList.add('hidden');
        this.elements.gameoverScreen.classList.add('hidden');
        this.elements.gameContainer.classList.add('hidden');
    }
    
    /**
     * Show start screen
     */
    showStart() {
        this.elements.loadingScreen.classList.add('hidden');
        this.elements.startScreen.classList.remove('hidden');
        this.elements.errorScreen.classList.add('hidden');
        this.elements.gameoverScreen.classList.add('hidden');
        this.elements.gameContainer.classList.add('hidden');
        
        // Focus on input
        setTimeout(() => {
            this.elements.playerNameInput.focus();
        }, 100);
    }
    
    /**
     * Show error screen
     */
    showError(message) {
        this.elements.loadingScreen.classList.add('hidden');
        this.elements.startScreen.classList.add('hidden');
        this.elements.errorScreen.classList.remove('hidden');
        this.elements.gameoverScreen.classList.add('hidden');
        this.elements.gameContainer.classList.add('hidden');
        this.elements.errorMessage.textContent = message;
    }
    
    /**
     * Show game screen
     */
    showGame() {
        this.elements.loadingScreen.classList.add('hidden');
        this.elements.startScreen.classList.add('hidden');
        this.elements.errorScreen.classList.add('hidden');
        this.elements.gameoverScreen.classList.add('hidden');
        this.elements.gameContainer.classList.remove('hidden');
    }
    
    /**
     * Show game over screen
     */
    showGameOver(stats, playerName, rank, leaderboard) {
        this.elements.gameoverScreen.classList.remove('hidden');
        this.elements.finalScore.textContent = formatNumber(stats.score);
        this.elements.finalLevel.textContent = stats.level;
        this.elements.finalTasks.textContent = stats.totalTasksCompleted;
        this.elements.playerNameDisplay.textContent = playerName;
        this.elements.playerRankDisplay.textContent = `Место: #${rank}`;
        
        // Render leaderboard
        this.renderLeaderboard(this.elements.gameoverLeaderboardList, leaderboard, stats.score);
    }
    
    /**
     * Render leaderboard on start screen
     */
    renderStartLeaderboard(topScores) {
        if (!topScores || topScores.length === 0) {
            this.elements.startLeaderboardList.innerHTML = '<p class="empty-leaderboard">Пока нет результатов</p>';
            return;
        }
        
        this.renderLeaderboard(this.elements.startLeaderboardList, topScores);
    }
    
    /**
     * Render leaderboard list
     */
    renderLeaderboard(container, scores, highlightScore = null) {
        if (!scores || scores.length === 0) {
            container.innerHTML = '<p class="empty-leaderboard">Пока нет результатов</p>';
            return;
        }
        
        let html = '';
        scores.forEach((entry, index) => {
            const isHighlight = highlightScore !== null && entry.score === highlightScore;
            const highlightClass = isHighlight ? ' highlight' : '';
            
            html += `
                <div class="leaderboard-item${highlightClass}">
                    <span class="leaderboard-rank">#${index + 1}</span>
                    <span class="leaderboard-name">${entry.playerName}</span>
                    <span class="leaderboard-score">${formatNumber(entry.score)}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    /**
     * Render departments dock
     */
    renderDepartments(departments) {
        this.elements.departmentsContainer.innerHTML = '';
        
        departments.forEach(dept => {
            const block = document.createElement('div');
            block.className = 'department-block';
            block.dataset.departmentId = dept.id;
            
            const icon = document.createElement('img');
            icon.className = 'department-icon';
            icon.src = dept.iconURL;
            icon.alt = dept.name;
            
            const name = document.createElement('div');
            name.className = 'department-name';
            name.textContent = dept.name;
            
            block.appendChild(icon);
            block.appendChild(name);
            
            this.elements.departmentsContainer.appendChild(block);
        });
    }
    
    /**
     * Update scoreboard
     */
    updateScoreboard(state) {
        this.elements.scoreValue.textContent = formatNumber(state.score);
        this.elements.levelValue.textContent = state.level;
        this.elements.streakValue.textContent = 'x' + state.streakMultiplier.toFixed(2);
        this.elements.livesValue.textContent = '❤️ ' + state.lives;
    }
    
    /**
     * Update author panel for latest task
     */
    updateAuthorPanel(task) {
        this.elements.authorAvatar.src = task.author.avatarURL;
        this.elements.authorAvatar.alt = task.author.name;
        this.elements.authorName.textContent = task.author.name;
        this.elements.authorMessage.textContent = task.message;
    }
    
    /**
     * Create task card element
     */
    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.dataset.taskId = task.id;
        
        card.innerHTML = `
            <div class="task-priority-icon">
                <img src="${task.priorityIcon}" alt="${task.priority}">
            </div>
            <div class="task-content">
                <h3 class="task-title">${task.title}</h3>
            </div>
            <div class="timer-bar-container">
                <div class="timer-bar" data-task-id="${task.id}"></div>
            </div>
            <div class="task-timer-text">
                <span class="timer-text" data-task-id="${task.id}">${formatTime(task.timerDuration)}</span>
            </div>
        `;
        
        return card;
    }
    
    /**
     * Add task card to board
     */
    addTaskCard(task) {
        const card = this.createTaskCard(task);
        this.elements.tasksContainer.appendChild(card);
        return card;
    }
    
    /**
     * Remove task card from board
     */
    removeTaskCard(taskId) {
        const card = this.elements.tasksContainer.querySelector(`[data-task-id="${taskId}"]`);
        if (card) {
            card.remove();
        }
    }
    
    /**
     * Update timer display for a task
     */
    updateTaskTimer(task, remainingTime, progress) {
        const timerBar = this.elements.tasksContainer.querySelector(`.timer-bar[data-task-id="${task.id}"]`);
        const timerText = this.elements.tasksContainer.querySelector(`.timer-text[data-task-id="${task.id}"]`);
        
        if (timerBar) {
            const percentage = (1 - progress) * 100;
            timerBar.style.width = percentage + '%';
            
            // Update timer bar color based on progress
            timerBar.className = 'timer-bar';
            if (progress > 0.75) {
                timerBar.classList.add('critical');
            } else if (progress > 0.5) {
                timerBar.classList.add('warning');
            }
        }
        
        if (timerText) {
            timerText.textContent = formatTime(remainingTime);
        }
    }
    
    /**
     * Show task success animation
     */
    showTaskSuccess(taskId) {
        const card = this.elements.tasksContainer.querySelector(`[data-task-id="${taskId}"]`);
        if (card) {
            card.classList.add('success');
        }
    }
    
    /**
     * Show task fail animation
     */
    showTaskFail(taskId) {
        const card = this.elements.tasksContainer.querySelector(`[data-task-id="${taskId}"]`);
        if (card) {
            card.classList.add('fail');
        }
    }
    
    /**
     * Show task timeout animation
     */
    showTaskTimeout(taskId) {
        const card = this.elements.tasksContainer.querySelector(`[data-task-id="${taskId}"]`);
        if (card) {
            card.classList.add('timeout');
        }
    }
    
    /**
     * Show feedback message
     */
    showFeedback(message, type = 'success') {
        // Если это баллы (+XXX очков!), показываем в header
        if (message.includes('очков') && message.startsWith('+')) {
            this.elements.scoreFeedback.textContent = message;
            this.elements.scoreFeedback.className = `score-feedback ${type}`;
            this.elements.scoreFeedback.classList.remove('hidden');
            
            // Auto-hide after animation
            setTimeout(() => {
                this.elements.scoreFeedback.classList.add('hidden');
            }, 1500);
        } else {
            // Остальные сообщения показываем по центру
            this.elements.feedbackMessage.textContent = message;
            this.elements.feedbackMessage.className = `feedback-message ${type}`;
            this.elements.feedbackMessage.classList.remove('hidden');
            
            // Auto-hide after delay
            setTimeout(() => {
                this.elements.feedbackMessage.classList.add('hidden');
            }, 1500);
        }
    }
    
    /**
     * Highlight department (drag over)
     */
    highlightDepartment(departmentId) {
        const blocks = this.elements.departmentsContainer.querySelectorAll('.department-block');
        blocks.forEach(block => {
            if (block.dataset.departmentId === departmentId) {
                block.classList.add('drag-over');
            } else {
                block.classList.remove('drag-over');
            }
        });
    }
    
    /**
     * Clear department highlights
     */
    clearDepartmentHighlights() {
        const blocks = this.elements.departmentsContainer.querySelectorAll('.department-block');
        blocks.forEach(block => {
            block.classList.remove('drag-over');
        });
    }
    
    /**
     * Get department ID at position
     */
    getDepartmentAtPosition(x, y) {
        const element = document.elementFromPoint(x, y);
        if (!element) return null;
        
        const block = element.closest('.department-block');
        if (!block) return null;
        
        return block.dataset.departmentId;
    }
}
