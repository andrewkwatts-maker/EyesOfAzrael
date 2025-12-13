# Quick Start Guide - Eyes of Azrael UI System

## 🚀 Get Started in 5 Minutes

### 1. Include CSS and JS

```html
<link rel="stylesheet" href="css/firebase-themes.css">
<script src="js/theme-manager.js"></script>
```

### 2. Add Theme Selector

```html
<div class="theme-selector">
    <button class="theme-btn active" data-theme="greek"></button>
    <button class="theme-btn" data-theme="egyptian"></button>
    <button class="theme-btn" data-theme="norse"></button>
    <button class="theme-btn" data-theme="hindu"></button>
    <button class="theme-btn" data-theme="buddhist"></button>
    <button class="theme-btn" data-theme="christian"></button>
    <button class="theme-btn" data-theme="islamic"></button>
    <button class="theme-btn" data-theme="celtic"></button>
</div>
```

### 3. Use Components

```html
<!-- Glass Container -->
<div class="glass-container">
    <h2>Your Content Here</h2>
</div>

<!-- Content Cards -->
<div class="content-grid">
    <div class="content-card">
        <div class="card-header">
            <h3 class="card-title">Card Title</h3>
            <span class="card-badge">Badge</span>
        </div>
        <div class="card-body">
            <p>Card content...</p>
        </div>
        <div class="card-footer">
            <span class="card-tag">Tag 1</span>
        </div>
    </div>
</div>

<!-- Buttons -->
<button class="glass-btn">Default</button>
<button class="glass-btn glass-btn-primary">Primary</button>

<!-- Inputs -->
<input class="glass-input" placeholder="Enter text...">
<select class="glass-select">
    <option>Option 1</option>
</select>
```

---

## 📦 Using the Content Loader

### 1. Include Dependencies

```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="js/firebase-content-loader.js"></script>
```

### 2. Initialize

```javascript
// Initialize Firebase
const firebaseConfig = { /* your config */ };
const app = firebase.initializeApp(firebaseConfig);

// Create content loader
const loader = new FirebaseContentLoader(app);
```

### 3. Load and Display Content

```javascript
// Load deities
await loader.loadContent('deities');

// Render to container
loader.renderContent('myContainer', 'deities');
```

### 4. Add Filters (Optional)

```javascript
loader.setupFilters({
    containerId: 'myContainer',
    contentType: 'deities',
    searchInputId: 'search',
    mythologySelectId: 'mythology',
    sortSelectId: 'sort'
});
```

---

## 🎨 Theme Management

### Change Theme Programmatically

```javascript
themeManager.changeTheme('egyptian');
```

### Auto-detect from Content

```javascript
const content = { mythology: 'norse' };
themeManager.setThemeFromContent(content);
```

### Listen for Changes

```javascript
themeManager.onThemeChange((theme, colors) => {
    console.log('New theme:', theme);
    console.log('Primary color:', colors.primary);
});
```

---

## 🎯 Common Patterns

### Loading State

```javascript
loader.showLoadingState();

try {
    await loader.loadContent('deities');
    loader.renderContent('container', 'deities');
} catch (error) {
    loader.showErrorState(error.message);
}
```

### Search and Filter

```javascript
// Set filters
loader.setSearchFilter('zeus');
loader.setMythologyFilter('greek');
loader.setSortOrder('name');

// Apply and render
loader.applyFilters();
loader.renderContent('container', 'deities');
```

### Handle Card Clicks

```javascript
document.addEventListener('contentItemClicked', (event) => {
    const { item } = event.detail;
    console.log('Clicked:', item.name);
    // Auto-switch theme
    themeManager.setThemeFromContent(item);
});
```

---

## 📱 Responsive Classes

```html
<!-- Content grid auto-adjusts -->
<div class="content-grid">
    <!-- Cards stack on mobile -->
</div>

<!-- Controls stack on mobile -->
<div class="controls-bar">
    <div class="filter-group">...</div>
    <div class="filter-group">...</div>
</div>
```

---

## 🎨 Color Themes

| Theme     | Color Code | RGB           |
|-----------|-----------|---------------|
| Greek     | `#9370DB` | 147, 112, 219 |
| Egyptian  | `#DAA520` | 218, 165, 32  |
| Norse     | `#4682B4` | 70, 130, 180  |
| Hindu     | `#FF6347` | 255, 99, 71   |
| Buddhist  | `#FF8C00` | 255, 140, 0   |
| Christian | `#DC143C` | 220, 20, 60   |
| Islamic   | `#228B22` | 34, 139, 34   |
| Celtic    | `#2E8B57` | 46, 139, 87   |

---

## ⚡ Pro Tips

1. **Theme Persistence**: Theme automatically saves to localStorage
2. **URL Detection**: Add `?mythology=norse` to auto-set theme
3. **Data Attribute**: Use `data-mythology="egyptian"` on body
4. **Staggered Animation**: Cards automatically animate on load
5. **Skeleton Loading**: Better UX than spinners

---

## 🔍 Demo Files

- `theme-demo.html` - See all components in action
- `content-viewer.html` - Full Firebase integration example
- `UI_SYSTEM_README.md` - Complete documentation

---

## 📚 Content Types Supported

- `deities` - Gods and goddesses
- `heroes` - Legendary heroes
- `creatures` - Mythical creatures
- `cosmology` - Cosmological concepts
- `herbs` - Sacred herbs
- `rituals` - Religious rituals
- `texts` - Sacred texts
- `myths` - Myths and legends
- `concepts` - Mystical concepts
- `symbols` - Sacred symbols

---

## 🐛 Debug Tips

```javascript
// Check current theme
console.log(themeManager.getCurrentTheme());

// Get all themes
console.log(themeManager.getAvailableThemes());

// Check loaded data
console.log(loader.getData());

// Get counts
console.log(loader.getCount());
```

---

## 📖 Full Documentation

See `UI_SYSTEM_README.md` for complete API reference and advanced usage.

---

**Happy Coding!** 🎨✨
