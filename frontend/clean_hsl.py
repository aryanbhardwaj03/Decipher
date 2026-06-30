import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Matches: [hsl(var(--card))] -> card
    # Matches: bg-[hsl(var(--card))] -> bg-card
    # Matches: text-[hsl(var(--muted-foreground))] -> text-muted-foreground
    
    new_content = re.sub(r'\[hsl\(var\(--([a-zA-Z0-9-]+)\)\)\]', r'\1', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

def main():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css')):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
