/**
 * Supabase Data Loader
 * Handles loading game content from Supabase Storage
 */

// Configuration - check if import.meta.env exists (Vite)
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
const SUPABASE_BUCKET = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_BUCKET) || 'pm-sim-assets';
const SUPABASE_BASE_PATH = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_BASE_PATH) || 'game/';

// Flag to use local files for development
const USE_LOCAL = !SUPABASE_URL || !SUPABASE_ANON_KEY;

// Debug logging in development
if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.log('[Loader] Using local files:', USE_LOCAL);
}

/**
 * Load JSON file from Supabase or local filesystem
 */
async function loadJSON(filename) {
    try {
        if (USE_LOCAL) {
            // Load from local filesystem (development mode)
            const response = await fetch(`/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}: ${response.statusText}`);
            }
            return await response.json();
        } else {
            // Load from Supabase Storage
            const url = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${SUPABASE_BASE_PATH}${filename}`;
            const response = await fetch(url, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load ${filename} from Supabase: ${response.statusText}`);
            }
            
            return await response.json();
        }
    } catch (error) {
        throw new Error(`Error loading ${filename}: ${error.message}`);
    }
}

/**
 * Resolve asset URL (icon/image)
 */
function resolveAssetURL(path) {
    if (USE_LOCAL) {
        return `/${path}`;
    } else {
        return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${SUPABASE_BASE_PATH}${path}`;
    }
}

/**
 * Load all game data
 * Returns an object with all loaded content
 */
export async function loadGameData() {
    try {
        // Load all JSON files in parallel
        const [departments, config, taskAuthors, priorityComments] = await Promise.all([
            loadJSON('departments.json'),
            loadJSON('config.json'),
            loadJSON('task_authors.json'),
            loadJSON('priority_comments.json')
        ]);

        // Resolve asset URLs
        const gameData = {
            departments: {
                ...departments,
                departments: departments.departments.map(dept => ({
                    ...dept,
                    iconURL: resolveAssetURL(`dep-icons/${dept.iconFile}`)
                }))
            },
            config,
            taskAuthors: {
                ...taskAuthors,
                author: taskAuthors.author.map(author => ({
                    ...author,
                    avatarURL: resolveAssetURL(`authors-icons/${author.avatar}`)
                }))
            },
            priorityComments: {
                ...priorityComments,
                priority_commentary: Object.fromEntries(
                    Object.entries(priorityComments.priority_commentary).map(([key, value]) => [
                        key,
                        {
                            ...value,
                            iconURL: resolveAssetURL(`priority-icons/${value.icon}`)
                        }
                    ])
                )
            }
        };

        return gameData;
    } catch (error) {
        throw new Error(`Failed to load game data: ${error.message}`);
    }
}

/**
 * Preload images to avoid loading delays during gameplay
 */
export async function preloadImages(gameData) {
    const imageURLs = [];
    
    // Department icons
    gameData.departments.departments.forEach(dept => {
        imageURLs.push(dept.iconURL);
    });
    
    // Author avatars
    gameData.taskAuthors.author.forEach(author => {
        imageURLs.push(author.avatarURL);
    });
    
    // Priority icons
    Object.values(gameData.priorityComments.priority_commentary).forEach(priority => {
        imageURLs.push(priority.iconURL);
    });
    
    // Load all images
    const promises = imageURLs.map(url => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => {
                console.warn(`Failed to load image: ${url}`);
                resolve(url); // Don't reject, just warn
            };
            img.src = url;
        });
    });
    
    await Promise.all(promises);
}

