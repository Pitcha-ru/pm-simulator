/**
 * Leaderboard Module
 * Manages high scores using Supabase Database (global leaderboard)
 */

// Supabase configuration
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
const USE_SUPABASE = SUPABASE_URL && SUPABASE_ANON_KEY;

const STORAGE_KEY = 'pm-simulator-leaderboard';
const MAX_ENTRIES = 100;

export class Leaderboard {
    constructor() {
        this.scores = [];
        this.loaded = false;
    }
    
    /**
     * Load scores from Supabase or localStorage fallback
     */
    async loadScores() {
        if (USE_SUPABASE) {
            try {
                // Загружаем топ-100 из Supabase
                const response = await fetch(
                    `${SUPABASE_URL}/rest/v1/leaderboard?select=*&order=score.desc&limit=${MAX_ENTRIES}`,
                    {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                        }
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`Failed to load leaderboard: ${response.statusText}`);
                }
                
                const data = await response.json();
                this.scores = data.map(row => ({
                    playerName: row.player_name,
                    score: row.score,
                    level: row.level,
                    tasksCompleted: row.tasks_completed,
                    timestamp: new Date(row.created_at).getTime(),
                    date: new Date(row.created_at).toLocaleDateString('ru-RU')
                }));
                this.loaded = true;
                return this.scores;
            } catch (error) {
                console.error('Failed to load from Supabase, using localStorage:', error);
                return this.loadFromLocalStorage();
            }
        } else {
            return this.loadFromLocalStorage();
        }
    }
    
    /**
     * Load scores from localStorage (fallback)
     */
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                this.scores = JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
        this.loaded = true;
        return this.scores;
    }
    
    /**
     * Save scores to localStorage (fallback)
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scores));
        } catch (error) {
            console.error('Failed to save leaderboard:', error);
        }
    }
    
    /**
     * Add a new score to Supabase
     */
    async addScore(playerName, score, level, tasksCompleted) {
        const name = (playerName || 'Аноним').trim();
        
        if (USE_SUPABASE) {
            try {
                // Добавляем в Supabase
                const response = await fetch(
                    `${SUPABASE_URL}/rest/v1/leaderboard`,
                    {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            player_name: name,
                            score: score,
                            level: level,
                            tasks_completed: tasksCompleted
                        })
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`Failed to save score: ${response.statusText}`);
                }
                
                // Перезагружаем лидерборд
                await this.loadScores();
                
                return {
                    playerName: name,
                    score,
                    level,
                    tasksCompleted,
                    timestamp: Date.now(),
                    date: new Date().toLocaleDateString('ru-RU')
                };
            } catch (error) {
                console.error('Failed to save to Supabase, using localStorage:', error);
                return this.addScoreLocal(name, score, level, tasksCompleted);
            }
        } else {
            return this.addScoreLocal(name, score, level, tasksCompleted);
        }
    }
    
    /**
     * Add score locally (fallback)
     */
    addScoreLocal(name, score, level, tasksCompleted) {
        const normalizedName = name.toLowerCase();
        
        const entry = {
            playerName: name,
            score: score,
            level: level,
            tasksCompleted: tasksCompleted,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('ru-RU')
        };
        
        // Find existing entry for this player
        const existingIndex = this.scores.findIndex(s => 
            s.playerName.toLowerCase().trim() === normalizedName
        );
        
        if (existingIndex !== -1) {
            this.scores.splice(existingIndex, 1);
        }
        
        this.scores.push(entry);
        this.scores.sort((a, b) => b.score - a.score);
        
        if (this.scores.length > MAX_ENTRIES) {
            this.scores = this.scores.slice(0, MAX_ENTRIES);
        }
        
        this.saveToLocalStorage();
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
     * Clear all scores (admin only, use with caution!)
     */
    clearScores() {
        this.scores = [];
        this.saveToLocalStorage();
    }
}

