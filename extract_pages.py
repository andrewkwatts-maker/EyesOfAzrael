import json

# Read the JSON file
with open('H:/Github/EyesOfAzrael/DYNAMIC_SYSTEM_VALIDATION.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extract page paths from validationErrors
pages = [error['path'] for error in data.get('validationErrors', [])]

# Save first 100 to a file
with open('H:/Github/EyesOfAzrael/first_100_pages.txt', 'w') as f:
    for page in pages[:100]:
        f.write(f'{page}\n')

print(f'Total pages in validationErrors: {len(pages)}')
print(f'First 100 pages saved to first_100_pages.txt')
