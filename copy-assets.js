/**
 * Script to copy game data assets to dist folder
 * Run this after `npm run build` or add to build process
 */

import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const distDir = 'dist';

// Check if dist exists
if (!existsSync(distDir)) {
  console.error('Error: dist/ folder does not exist. Run `npm run build` first.');
  process.exit(1);
}

// JSON files to copy
const jsonFiles = [
  'departments.json',
  'config.json',
  'task_authors.json',
  'priority_comments.json'
];

// Icon folders to copy
const iconFolders = [
  'dep-icons',
  'priority-icons',
  'authors-icons'
];

console.log('Copying game data assets to dist/...\n');

// Copy JSON files
jsonFiles.forEach(file => {
  try {
    copyFileSync(file, join(distDir, file));
    console.log(`✓ Copied ${file}`);
  } catch (err) {
    console.error(`✗ Failed to copy ${file}:`, err.message);
  }
});

// Copy icon folders
iconFolders.forEach(folder => {
  try {
    const destFolder = join(distDir, folder);
    mkdirSync(destFolder, { recursive: true });
    
    const files = readdirSync(folder);
    files.forEach(file => {
      copyFileSync(join(folder, file), join(destFolder, file));
    });
    
    console.log(`✓ Copied ${folder}/ (${files.length} files)`);
  } catch (err) {
    console.error(`✗ Failed to copy ${folder}/:`, err.message);
  }
});

console.log('\n✨ Done! Game data assets copied to dist/');

