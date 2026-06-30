import fs from 'fs';
import path from 'path';

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');
    
    // Matches: [hsl(var(--card))] -> card
    // Matches: bg-[hsl(var(--card))] -> bg-card
    // Matches: text-[hsl(var(--muted-foreground))] -> text-muted-foreground
    const newContent = content.replace(/\[hsl\(var\(--([a-zA-Z0-9-]+)\)\)\]/g, '$1');
    
    if (newContent !== content) {
        fs.writeFileSync(filepath, newContent, 'utf-8');
        console.log(`Updated ${filepath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            processFile(fullPath);
        }
    }
}

walkDir('src');
