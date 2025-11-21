"""Quick analysis script for EBL API data"""
import json

# Load data
with open('H:/DaedalusSVN/PlayTow/EOAPlot/ebl-api/output.json', encoding='utf-8') as f:
    data = json.load(f)

print(f'Total fragments: {len(data)}')
print('\nSearching for fragments with text content...')
with_text = [f for f in data if f.get('text', {}).get('lines')]
print(f'Fragments with text lines: {len(with_text)}')

print('\nSearching for fragments with notes mentioning deities...')
deity_names = ['Inanna', 'Marduk', 'Ishtar', 'Nabu', 'Gilgamesh', 'Enuma Elish', 'Tiamat', 'Shamash']
for deity in deity_names:
    matches = [f for f in data if deity.lower() in f.get('notes', {}).get('text', '').lower()]
    print(f'{deity}: {len(matches)} matches')
    if matches:
        print(f'  Example: {matches[0]["_id"]} - {matches[0]["notes"]["text"][:100]}...')

print('\nSample fragment with deity mention:')
inanna_frags = [f for f in data if 'inanna' in f.get('notes', {}).get('text', '').lower()]
if inanna_frags:
    sample = inanna_frags[0]
    print(json.dumps(sample, indent=2)[:1000])
