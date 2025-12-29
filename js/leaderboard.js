/**
 * Leaderboard Module
 * Manages high scores using localStorage
 */

const STORAGE_KEY = 'pm-simulator-leaderboard';
const MAX_ENTRIES = 100; // Store more, show top 5

export class Leaderboard {
    constructor() {
        this.scores = this.loadScores();
    }
    
    /**
     * Load scores from localStorage
     */
    loadScores() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
        return [];
    }
    
    /**
     * Save scores to localStorage
     */
    saveScores() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scores));
        } catch (error) {
            console.error('Failed to save leaderboard:', error);
        }
    }
    
    /**
     * Add a new score (keeps only best score per player)
     */
    addScore(playerName, score, level, tasksCompleted) {
        // Нормализуем имя игрока
        const name = (playerName || 'Аноним').trim();
        const normalizedName = name.toLowerCase();
        
        const entry = {
            playerName: name,
            score: score,
            level: level,
            tasksCompleted: tasksCompleted,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('ru-RU')
        };
        
        // Find existing entry for this player (case-insensitive)
        const existingIndex = this.scores.findIndex(s => 
            s.playerName.toLowerCase().trim() === normalizedName
        );
        
        if (existingIndex !== -1) {
            // Player exists - ВСЕГДА обновляем его запись новым результатом
            // Удаляем старую запись
            this.scores.splice(existingIndex, 1);
        }
        
        // Добавляем новую запись (или обновленную)
        this.scores.push(entry);
        
        // Sort by score (descending)
        this.scores.sort((a, b) => b.score - a.score);
        
        // Keep only top MAX_ENTRIES
        if (this.scores.length > MAX_ENTRIES) {
            this.scores = this.scores.slice(0, MAX_ENTRIES);
        }
        
        this.saveScores();
        
        return entry;
    }
    
    /**
     * Get player's rank (1-based) by name
     */
    getPlayerRank(playerName) {
        const normalizedName = (playerName || 'Аноним').trim().toLowerCase();
        const rank = this.scores.findIndex(entry => 
            entry.playerName.toLowerCase().trim() === normalizedName
        ) + 1;
        return rank > 0 ? rank : this.scores.length + 1;
    }
    
    /**
     * Get top N scores
     */
    getTopScores(n = 5) {
        return this.scores.slice(0, n);
    }
    
    /**
     * Get total number of scores
     */
    getTotalScores() {
        return this.scores.length;
    }
    
    /**
     * Check if score makes it to top N
     */
    isTopScore(score, n = 5) {
        if (this.scores.length < n) return true;
        return score > this.scores[n - 1].score;
    }
    
    /**
     * Clear all scores
     */
    clearScores() {
        this.scores = [];
        this.saveScores();
    }
}

