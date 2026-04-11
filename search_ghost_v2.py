import os

search_string = "Almacenamiento Cloud"
encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252', 'ascii']

print(f"Searching for '{search_string}' in current directory...")

for root, dirs, files in os.walk('.'):
    # Exclude heavy folders
    if any(d in root for d in ['node_modules', '.git', 'dist', '.gemini']):
        continue
        
    for file in files:
        file_path = os.path.join(root, file)
        found = False
        for enc in encodings:
            try:
                with open(file_path, 'r', encoding=enc) as f:
                    content = f.read()
                    if search_string in content:
                        print(f"FOUND in {file_path} (encoding: {enc})")
                        found = True
                        break
            except Exception:
                continue
