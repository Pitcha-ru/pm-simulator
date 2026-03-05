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

// Supabase config for onboard_user_progress (separate project)
const ONBOARD_SUPABASE_URL =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ONBOARD_SUPABASE_URL) || '';
const ONBOARD_SUPABASE_ANON_KEY =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ONBOARD_SUPABASE_ANON_KEY) || '';

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
        this.chatIdFromUrl = null;
        this.leaderboardSessionId = null;
        
        this.init();
    }
    
    /**
     * Initialize the game
     */
    async init() {
        try {
            // Show loading screen
            this.uiManager.showLoading();
            
            // #region agent log
            fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '44a8e9'
                },
                body: JSON.stringify({
                    sessionId: '44a8e9',
                    runId: 'pre-fix',
                    hypothesisId: 'H1',
                    location: 'main.js:init:beforeLoad',
                    message: 'Init called before loading game data',
                    data: {},
                    timestamp: Date.now()
                })
            }).catch(() => {});
            // #endregion agent log

            // Load game data
            this.gameData = await loadGameData();
            
            // Preload images
            await preloadImages(this.gameData);

            // Setup base UI
            this.setupBaseUI();

            // Try to prefill player name from chat_id in URL / onboard_user_progress
            // #region agent log
            fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '44a8e9'
                },
                body: JSON.stringify({
                    sessionId: '44a8e9',
                    runId: 'pre-fix',
                    hypothesisId: 'H2',
                    location: 'main.js:init:beforePrefill',
                    message: 'Before tryPrefillNameFromOnboardChatId',
                    data: {},
                    timestamp: Date.now()
                })
            }).catch(() => {});
            // #endregion agent log
            
            // Try to prefill name field; always show start screen afterwards
            await this.tryPrefillNameFromOnboardChatId();
            
            // Show start screen (load leaderboard)
            await this.showStartScreen();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.uiManager.showError(error.message);
        }
    }

    /**
     * Extract chat_id from URL hash (e.g. .../#12345)
     */
    getChatIdFromURL() {
        if (typeof window === 'undefined') return null;
        const hash = window.location.hash || '';
        if (!hash || hash.length <= 1) return null;
        const raw = hash.substring(1).trim();

        // #region agent log
        fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Debug-Session-Id': '44a8e9'
            },
            body: JSON.stringify({
                sessionId: '44a8e9',
                runId: 'pre-fix',
                hypothesisId: 'H3',
                location: 'main.js:getChatIdFromURL',
                message: 'Parsed chatId from URL hash',
                data: { hash, raw },
                timestamp: Date.now()
            })
        }).catch(() => {});
        // #endregion agent log

        return raw || null;
    }

    /**
     * Load name from onboard_user_progress table in separate Supabase project
     * Returns display name string (firstName lastName or fallback) or null
     */
    async fetchOnboardChatId(chatId) {
        if (!ONBOARD_SUPABASE_URL || !ONBOARD_SUPABASE_ANON_KEY) {
            // #region agent log
            fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '44a8e9'
                },
                body: JSON.stringify({
                    sessionId: '44a8e9',
                    runId: 'pre-fix',
                    hypothesisId: 'H4',
                    location: 'main.js:fetchOnboardChatId:noEnv',
                    message: 'ONBOARD Supabase env vars are missing',
                    data: {
                        hasUrl: !!ONBOARD_SUPABASE_URL,
                        hasKey: !!ONBOARD_SUPABASE_ANON_KEY
                    },
                    timestamp: Date.now()
                })
            }).catch(() => {});
            // #endregion agent log
            return null;
        }

        try {
            const selectParam = encodeURIComponent('chat_id,"firstName","lastName"');
            const url = `${ONBOARD_SUPABASE_URL}/rest/v1/onboard_user_progress?chat_id=eq.${encodeURIComponent(
                chatId
            )}&select=${selectParam}&order=updated_at.desc&limit=1`;

            // #region agent log
            fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '44a8e9'
                },
                body: JSON.stringify({
                    sessionId: '44a8e9',
                    runId: 'pre-fix',
                    hypothesisId: 'H4',
                    location: 'main.js:fetchOnboardChatId:beforeFetch',
                    message: 'About to fetch onboard_user_progress',
                    data: { url, chatId },
                    timestamp: Date.now()
                })
            }).catch(() => {});
            // #endregion agent log

            const response = await fetch(url, {
                headers: {
                    apikey: ONBOARD_SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${ONBOARD_SUPABASE_ANON_KEY}`,
                    Accept: 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('Failed to fetch onboard_user_progress:', response.status, response.statusText);

                // #region agent log
                fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Debug-Session-Id': '44a8e9'
                    },
                    body: JSON.stringify({
                        sessionId: '44a8e9',
                        runId: 'pre-fix',
                        hypothesisId: 'H4',
                        location: 'main.js:fetchOnboardChatId:responseNotOk',
                        message: 'onboard_user_progress fetch failed',
                        data: {
                            status: response.status,
                            statusText: response.statusText
                        },
                        timestamp: Date.now()
                    })
                }).catch(() => {});
                // #endregion agent log
                return null;
            }

            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
                // #region agent log
                fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Debug-Session-Id': '44a8e9'
                    },
                    body: JSON.stringify({
                        sessionId: '44a8e9',
                        runId: 'pre-fix',
                        hypothesisId: 'H5',
                        location: 'main.js:fetchOnboardChatId:emptyData',
                        message: 'No rows returned from onboard_user_progress',
                        data: { length: Array.isArray(data) ? data.length : null },
                        timestamp: Date.now()
                    })
                }).catch(() => {});
                // #endregion agent log
                return null;
            }

            const row = data[0];
            if (!row || row.chat_id == null) {
                // #region agent log
                fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Debug-Session-Id': '44a8e9'
                    },
                    body: JSON.stringify({
                        sessionId: '44a8e9',
                        runId: 'pre-fix',
                        hypothesisId: 'H5',
                        location: 'main.js:fetchOnboardChatId:nullChatId',
                        message: 'Row found but chat_id is null/undefined',
                        data: { row },
                        timestamp: Date.now()
                    })
                }).catch(() => {});
                // #endregion agent log
                return null;
            }

            // #region agent log
            fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '44a8e9'
                },
                body: JSON.stringify({
                    sessionId: '44a8e9',
                    runId: 'pre-fix',
                    hypothesisId: 'H5',
                    location: 'main.js:fetchOnboardChatId:success',
                    message: 'Successfully fetched onboard user record',
                    data: {
                        chatIdFromTable: row.chat_id,
                        firstName: row.firstName ?? null,
                        lastName: row.lastName ?? null
                    },
                    timestamp: Date.now()
                })
            }).catch(() => {});
            // #endregion agent log
            
            // Prefer "firstName lastName" for display; fall back to firstName, then chat_id
            const rawFirstName = row.firstName;
            const rawLastName = row.lastName;
            
            if (rawFirstName != null && String(rawFirstName).trim() !== '') {
                const first = String(rawFirstName).trim();
                const last = rawLastName != null ? String(rawLastName).trim() : '';
                const full = last ? `${first} ${last}` : first;
                return full;
            }
            
            return String(row.chat_id);
        } catch (err) {
            console.warn('Error while fetching onboard_user_progress:', err);

            // #region agent log
            fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '44a8e9'
                },
                body: JSON.stringify({
                    sessionId: '44a8e9',
                    runId: 'pre-fix',
                    hypothesisId: 'H4',
                    location: 'main.js:fetchOnboardChatId:catch',
                    message: 'Exception while fetching onboard_user_progress',
                    data: { error: String(err && err.message ? err.message : err) },
                    timestamp: Date.now()
                })
            }).catch(() => {});
            // #endregion agent log
            return null;
        }
    }

    /**
     * Try to prefill player name using chat_id from URL and onboard_user_progress.
     * Returns true if name was prefilled, false otherwise.
     */
    async tryPrefillNameFromOnboardChatId() {
        const chatId = this.getChatIdFromURL();
        if (!chatId) {
            // #region agent log
            fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '44a8e9'
                },
                body: JSON.stringify({
                    sessionId: '44a8e9',
                    runId: 'pre-fix',
                    hypothesisId: 'H3',
                    location: 'main.js:tryPrefill:noChatId',
                    message: 'No chatId in URL, skipping prefill',
                    data: {},
                    timestamp: Date.now()
                })
            }).catch(() => {});
            // #endregion agent log
            return false;
        }

        this.chatIdFromUrl = chatId;

        const onboardName = await this.fetchOnboardChatId(chatId);
        if (!onboardName) {
            // No valid record in table → start as usual (with name input)
            // #region agent log
            fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Debug-Session-Id': '44a8e9'
                },
                body: JSON.stringify({
                    sessionId: '44a8e9',
                    runId: 'pre-fix',
                    hypothesisId: 'H5',
                    location: 'main.js:tryPrefill:noOnboardName',
                    message: 'fetchOnboardChatId returned null, leaving name input empty',
                    data: { chatIdFromUrl: chatId },
                    timestamp: Date.now()
                })
            }).catch(() => {});
            // #endregion agent log
            return false;
        }

        // Put value into input field, but do NOT auto-start the game
        if (this.uiManager?.elements?.playerNameInput) {
            this.uiManager.elements.playerNameInput.value = onboardName;
        }

        // #region agent log
        fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Debug-Session-Id': '44a8e9'
            },
            body: JSON.stringify({
                sessionId: '44a8e9',
                runId: 'pre-fix',
                hypothesisId: 'H6',
                location: 'main.js:tryPrefill:success',
                message: 'Prefilled player name from onboard_user_progress',
                data: { onboardName },
                timestamp: Date.now()
            })
        }).catch(() => {});
        // #endregion agent log
        return true;
    }
    
    /**
     * Show start screen with leaderboard
     */
    async showStartScreen() {
        // Load leaderboard from Supabase
        await this.leaderboard.loadScores();
        
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

        // Start persistent leaderboard session (async, без ожидания)
        // #region agent log
        fetch('http://127.0.0.1:7409/ingest/3429f9b2-993d-4811-8dfa-1256bffca5b6', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Debug-Session-Id': '44a8e9'
            },
            body: JSON.stringify({
                sessionId: '44a8e9',
                runId: 'pre-fix',
                hypothesisId: 'P1',
                location: 'main.js:startGameWithPlayer:beforeStartSession',
                message: 'Starting leaderboard session from startGameWithPlayer',
                data: {
                    playerName: this.playerName
                },
                timestamp: Date.now()
            })
        }).catch(() => {});
        // #endregion agent log

        this.startLeaderboardSession();
        
        // Setup game UI
        this.setupGameUI();
        
        // Show game screen
        this.uiManager.showGame();
        
        // Start game
        this.startGame();
    }

    /**
     * Create leaderboard session row when game starts
     */
    async startLeaderboardSession() {
        if (this.leaderboardSessionId !== null) {
            return;
        }

        try {
            const row = await this.leaderboard.createSession(
                this.playerName,
                this.gameState?.score ?? 0,
                this.gameState?.level ?? 1,
                this.gameState?.totalTasksCompleted ?? 0
            );

            if (row && typeof row.id !== 'undefined' && row.id !== null) {
                this.leaderboardSessionId = row.id;
            }
        } catch (error) {
            console.warn('Failed to start leaderboard session:', error);
        }
    }

    /**
     * Save current progress to leaderboard after each player action
     */
    async saveProgress() {
        try {
            if (!this.gameState) return;

            const score = this.gameState.score;
            const level = this.gameState.level;
            const tasksCompleted = this.gameState.totalTasksCompleted;

            // Просто создаём новую запись-снимок прогресса в leaderboard на каждом сохранении.
            // Это надёжнее, чем PATCH существующей строки, с учётом возможных RLS-политик.
            await this.leaderboard.addScore(
                this.playerName,
                score,
                level,
                tasksCompleted
            );
        } catch (error) {
            console.warn('Failed to save progress to leaderboard:', error);
        }
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
        
        // Persist progress after successful action
        this.saveProgress();
        
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
        
        // Persist progress after failed action (стрик/состояние изменились)
        this.saveProgress();
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
        
        // Persist progress after timeout (жизни/статус изменились)
        this.saveProgress();
        
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
    async onGameOver() {
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
        
        // Ensure latest progress is saved to leaderboard
        await this.saveProgress();
        
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
    async onGameComplete() {
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
        
        // Ensure latest progress is saved to leaderboard
        await this.saveProgress();
        
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
