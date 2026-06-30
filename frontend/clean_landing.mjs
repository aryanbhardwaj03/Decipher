import fs from 'fs';
import path from 'path';

function processLandingPage(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');
    
    // Replace background
    content = content.replace(/bg-\[\#F8F9FA\]/g, 'bg-background');
    content = content.replace(/bg-\[\#161616\]/g, 'bg-foreground');
    content = content.replace(/bg-\[\#f97316\]/g, 'bg-primary');
    content = content.replace(/hover\:bg-\[\#ea580c\]/g, 'hover:opacity-90');
    
    // Replace text colors
    content = content.replace(/text-\[\#161616\]/g, 'text-foreground');
    content = content.replace(/text-\[\#4D4D4D\]/g, 'text-muted-foreground');
    content = content.replace(/text-\[\#f97316\]/g, 'text-primary');
    content = content.replace(/hover\:text-\[\#f97316\]/g, 'hover:text-primary');

    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`Updated ${filepath}`);
}

processLandingPage('src/app/page.tsx');
