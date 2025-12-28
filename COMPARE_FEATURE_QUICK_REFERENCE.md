# Compare Feature - Quick Reference

## 🚀 Quick Start

### Navigate to Compare Page
```
URL: https://eyesofazrael.com/#/compare
```

### Share a Comparison
```
Format: #/compare?entities=collection:id,collection:id
Example: #/compare?entities=deities:zeus,deities:odin,deities:ra
```

---

## 🎯 Key Features

### 1. Entity Selection
- **Search**: Type entity name (300ms debounce)
- **Filter by Mythology**: Dropdown with 20 options
- **Filter by Type**: Deities, Heroes, Creatures, etc.
- **Limit**: 2-6 entities

### 2. Comparison Table
- **Columns**: One per selected entity
- **Rows**: 24 common attributes
- **Highlighting**:
  - 🟢 Green = All values match
  - 🟡 Yellow = Some values match
  - 🔵 Blue = All values differ
  - ⚪ Faded = All values empty

### 3. Actions
- **Share**: Copy URL to clipboard
- **Export**: Print/save as PDF
- **Clear All**: Remove all entities
- **Remove**: Individual remove buttons

---

## 📊 Supported Attributes

1. Name
2. Mythology
3. Type
4. Title
5. Description
6. Domain
7. Domains (array)
8. Symbols
9. Attributes
10. Powers
11. Epithets
12. Family
13. Parents
14. Children
15. Consort
16. Siblings
17. Sacred Animals
18. Sacred Plants
19. Festivals
20. Temples
21. Weapons
22. Associated Myths
23. Cultural Significance
24. Modern Influence

---

## 🗂️ Supported Collections

1. **deities** - Gods and goddesses
2. **heroes** - Legendary heroes
3. **creatures** - Mythological creatures
4. **cosmology** - Creation myths
5. **rituals** - Religious ceremonies
6. **herbs** - Sacred plants
7. **texts** - Sacred writings
8. **symbols** - Religious symbols
9. **items** - Mythological artifacts
10. **places** - Sacred locations
11. **magic** - Magic systems
12. **concepts** - Philosophical concepts

---

## 🌍 Supported Mythologies

1. Egyptian 🔺
2. Greek 🏛️
3. Norse ⚔️
4. Celtic 🍀
5. Hindu 🕉️
6. Buddhist ☸️
7. Chinese 🐉
8. Japanese ⛩️
9. Aztec ☀️
10. Mayan 🗿
11. Babylonian 🏺
12. Sumerian 📜
13. Persian 🦁
14. Roman 🏛️
15. Christian ✝️
16. Islamic ☪️
17. Jewish ✡️
18. Yoruba 👑
19. Native American
20. Apocryphal

---

## 📱 Responsive Design

### Desktop (> 1024px)
- Full grid layout
- Horizontal scrolling table
- 3-column controls

### Tablet (768px - 1024px)
- Simplified controls
- 1-column filters
- Horizontal scrolling table

### Mobile (< 768px)
- Stacked controls
- Single-column results
- Vertical scrolling
- Touch-friendly buttons

---

## 🎨 Color Scheme

### Mythology Colors
- **Greek**: #4A90E2 (Blue)
- **Norse**: #7C4DFF (Purple)
- **Egyptian**: #FFB300 (Gold)
- **Hindu**: #E91E63 (Pink)
- **Chinese**: #F44336 (Red)
- **Japanese**: #FF5722 (Orange)
- **Celtic**: #4CAF50 (Green)
- **Babylonian**: #795548 (Brown)
- **Sumerian**: #9E9E9E (Grey)
- **Persian**: #00BCD4 (Cyan)

### Highlighting
- **All Match**: rgba(76, 175, 80, 0.1) - Light green
- **Some Match**: rgba(255, 193, 7, 0.05) - Light yellow
- **All Differ**: rgba(33, 150, 243, 0.05) - Light blue

---

## 🔧 Technical Details

### Files
- **Component**: `js/components/compare-view.js`
- **Styles**: `css/compare-view.css`
- **Route**: `#/compare` in `js/spa-navigation.js`

### Dependencies
- Firebase Firestore
- SPA Navigation System
- Toast notification system (optional)

### Performance
- Debounced search: 300ms
- Search result limit: 50 entities
- Per-collection limit: 20 entities
- Max entities in comparison: 6

---

## 🐛 Troubleshooting

### "Compare component not loaded"
- Check `index.html` includes `<script src="js/components/compare-view.js"></script>`
- Check browser console for JS errors
- Clear cache and reload

### No search results
- Check Firestore rules allow read access
- Verify entities exist in database
- Check mythology/type filters aren't too restrictive
- Open browser console for error messages

### Table not displaying
- Check that 2+ entities are selected
- Verify entities have data in common attributes
- Check browser console for errors

### Share link not copying
- Grant clipboard permissions when prompted
- Use manual copy from URL bar if clipboard fails
- Check browser supports Clipboard API

### Export not working
- Check browser allows print dialog
- Use Ctrl+P / Cmd+P as alternative
- Check popup blocker isn't blocking print

---

## 💡 Pro Tips

1. **Pre-select entities**: Share URLs with entity params to skip search
2. **Compare archetypes**: Select entities from different mythologies with similar roles
3. **Export for research**: Use print-to-PDF for academic papers
4. **Mobile usage**: Rotate phone to landscape for better table view
5. **Keyboard shortcuts**: Tab through controls, Enter to search

---

## 🎓 Example Comparisons

### Sky Gods
```
#/compare?entities=deities:zeus,deities:jupiter,deities:odin
```

### Tricksters
```
#/compare?entities=deities:loki,deities:anansi,deities:hermes
```

### Creation Myths
```
#/compare?entities=cosmology:greek-creation,cosmology:norse-creation,cosmology:egyptian-creation
```

### Underworld Rulers
```
#/compare?entities=deities:hades,deities:osiris,deities:hel
```

---

## 📞 Support

For issues or feature requests, see:
- GitHub Issues: [github.com/yourusername/eyesofazrael/issues]
- Documentation: `AGENT_1_COMPARE_FUNCTIONALITY_COMPLETE.md`
- Main README: `README.md`

---

**Last Updated:** 2025-12-28
**Version:** 1.0.0
**Status:** Production Ready ✅
