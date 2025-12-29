import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  // Base public path when served in production
  base: './',
  
  // Build options
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild', // Use esbuild instead of terser (faster, no extra deps)
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  
  // Server options for development
  server: {
    port: 3000,
    open: true
  },
  
  // Preview options
  preview: {
    port: 4173
  },
  
  // Public directory containing static assets
  publicDir: 'public'
});

// Custom plugin to copy game data files to dist
function copyGameData() {
  return {
    name: 'copy-game-data',
    closeBundle() {
      const files = [
        'departments.json',
        'config.json',
        'task_authors.json',
        'priority_comments.json'
      ];
      
      const folders = [
        'dep-icons',
        'priority-icons',
        'authors-icons'
      ];
      
      // Copy JSON files
      files.forEach(file => {
        try {
          copyFileSync(file, join('dist', file));
          console.log(`Copied ${file} to dist/`);
        } catch (err) {
          console.warn(`Could not copy ${file}:`, err.message);
        }
      });
      
      // Copy icon folders
      folders.forEach(folder => {
        try {
          mkdirSync(join('dist', folder), { recursive: true });
          const files = readdirSync(folder);
          files.forEach(file => {
            copyFileSync(join(folder, file), join('dist', folder, file));
          });
          console.log(`Copied ${folder}/ to dist/`);
        } catch (err) {
          console.warn(`Could not copy ${folder}:`, err.message);
        }
      });
    }
  };
}

// Add the plugin (commented out by default, uncomment if needed)
// Vite automatically copies files from the root or you can use the plugin
// export default defineConfig({
//   plugins: [copyGameData()],
//   ...rest of config
// });

