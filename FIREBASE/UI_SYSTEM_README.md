# Eyes of Azrael - Firebase UI System

## Modern Glassmorphism Theme System

This UI system provides a modern, production-ready interface with 8 mythology-themed color schemes, glassmorphism effects, and responsive design.

---

## 📁 File Structure

```
FIREBASE/
├── css/
│   └── firebase-themes.css          # Complete theme system with glassmorphism
├── js/
│   ├── theme-manager.js             # Dynamic theme switching & persistence
│   └── firebase-content-loader.js   # Universal content loader
├── content-viewer.html              # Updated with theme integration
└── UI_SYSTEM_README.md             # This file
```

---

## 🎨 Features

### 1. **8 Mythology Themes**

Each theme has a unique color palette:

| Mythology | Primary Color | RGB Values      | Use Case |
|-----------|---------------|-----------------|----------|
| Greek     | `#9370DB`     | 147, 112, 219  | Purple tones, wisdom |
| Egyptian  | `#DAA520`     | 218, 165, 32   | Golden, sun worship |
| Norse     | `#4682B4`     | 70, 130, 180   | Steel blue, ice |
| Hindu     | `#FF6347`     | 255, 99, 71    | Orange-red, fire |
| Buddhist  | `#FF8C00`     | 255, 140, 0    | Saffron, enlightenment |
| Christian | `#DC143C`     | 220, 20, 60    | Crimson, passion |
| Islamic   | `#228B22`     | 34, 139, 34    | Forest green, paradise |
| Celtic    | `#2E8B57`     | 46, 139, 87    | Sea green, nature |

### 2. **Glassmorphism Design**

Modern frosted-glass effects using:
- `backdrop-filter: blur(10px)` for blur effect
- Semi-transparent backgrounds (`rgba` with 0.1-0.2 opacity)
- Subtle borders with `rgba(255, 255, 255, 0.1)`
- Elegant shadows: `0 8px 32px rgba(0, 0, 0, 0.1)`

### 3. **Responsive Grid Layouts**

- Auto-fit grid columns: `minmax(300px, 1fr)`
- Mobile-first breakpoints
- Flexible card layouts
- Adaptive controls and filters

### 4. **Smooth Animations**

- CSS transitions: `all 0.3s ease`
- Card hover effects with `transform: translateY(-4px)`
- Fade-in animations with staggered delays
- Loading skeleton screens

---

## 🚀 Quick Start

### Basic HTML Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Page - Eyes of Azrael</title>

    <!-- Theme System CSS -->
    <link rel="stylesheet" href="css/firebase-themes.css">

    <!-- Theme Manager JS -->
    <script src="js/theme-manager.js"></script>
</head>
<body>
    <div class="page-container">
        <header class="page-header">
            <h1 class="page-title">My Page</h1>
            <p class="page-subtitle">Subtitle text here</p>

            <!-- Theme Selector -->
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
        </header>

        <main>
            <!-- Your content here -->
        </main>
    </div>
</body>
</html>
```

---

## 📦 Component Library

### Glass Container

```html
<div class="glass-container">
    <h2>Container Title</h2>
    <p>Container content with frosted glass effect</p>
</div>
```

### Glass Card

```html
<div class="glass-card">
    <h3>Card Title</h3>
    <p>Card content</p>
</div>
```

### Content Card (Advanced)

```html
<div class="content-card">
    <div class="card-header">
        <h3 class="card-title">Title</h3>
        <span class="card-badge">Badge</span>
    </div>
    <div class="card-body">
        <p>Card description text...</p>
    </div>
    <div class="card-footer">
        <span class="card-tag">Tag 1</span>
        <span class="card-tag">Tag 2</span>
    </div>
</div>
```

### Buttons

```html
<!-- Basic glass button -->
<button class="glass-btn">Click Me</button>

<!-- Primary button -->
<button class="glass-btn glass-btn-primary">Primary Action</button>
```

### Form Controls

```html
<!-- Text Input -->
<input type="text" class="glass-input" placeholder="Enter text...">

<!-- Select Dropdown -->
<select class="glass-select">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
</select>
```

### Content Grid

```html
<div class="content-grid">
    <div class="content-card">Card 1</div>
    <div class="content-card">Card 2</div>
    <div class="content-card">Card 3</div>
</div>
```

---

## 🎯 Theme Manager API

### Initialization

The theme manager initializes automatically on page load.

```javascript
// Access global theme manager
console.log(themeManager.getCurrentTheme()); // 'greek'
```

### Methods

#### Change Theme

```javascript
// Change to a different theme
themeManager.changeTheme('egyptian');
```

#### Detect Theme from Content

```javascript
// Auto-detect theme from mythology type
const content = { mythology: 'norse', title: 'Odin' };
themeManager.setThemeFromContent(content);
```

#### Listen to Theme Changes

```javascript
// Add listener for theme changes
const unsubscribe = themeManager.onThemeChange((theme, colors) => {
    console.log('Theme changed to:', theme);
    console.log('Primary color:', colors.primary);
});

// Unsubscribe when done
unsubscribe();
```

#### Get Theme Config

```javascript
// Get current theme configuration
const config = themeManager.getThemeConfig();
console.log(config.primary);  // '#9370DB'
console.log(config.rgb);      // '147, 112, 219'
console.log(config.name);     // 'Greek Mythology'
```

#### Get All Themes

```javascript
// Get list of all available themes
const themes = themeManager.getAvailableThemes();
/*
[
    { name: 'greek', primary: '#9370DB', rgb: '147, 112, 219', ... },
    { name: 'egyptian', primary: '#DAA520', rgb: '218, 165, 32', ... },
    ...
]
*/
```

#### Apply Theme with Animation

```javascript
// Smooth animated transition
themeManager.applyThemeWithAnimation('hindu', 500);
```

#### Reset Theme

```javascript
// Reset to default (Greek)
themeManager.resetTheme();
```

### Events

Listen for theme changes with custom events:

```javascript
document.addEventListener('themeChanged', (event) => {
    const { theme, colors } = event.detail;
    console.log('New theme:', theme, colors);
});
```

---

## 📚 Content Loader API

### Initialization

```javascript
// Create content loader instance
const contentLoader = new FirebaseContentLoader(firebaseApp);

// Or initialize Firestore separately
const loader = new FirebaseContentLoader();
loader.initFirestore(firebaseApp);
```

### Loading Content

#### Load from Collection

```javascript
// Load all deities
await contentLoader.loadContent('deities');

// Load with filters
await contentLoader.loadContent('heroes', {
    mythology: 'greek',
    limit: 50
});
```

#### Render Content

```javascript
// Render to container
contentLoader.renderContent('myContainer', 'deities');
```

#### Setup Filters

```javascript
contentLoader.setupFilters({
    containerId: 'content',
    contentType: 'deities',
    searchInputId: 'search',
    mythologySelectId: 'mythology-filter',
    sortSelectId: 'sort-filter'
});
```

### Content Types

The content loader supports:

- `deities` - Gods and goddesses
- `heroes` - Legendary heroes
- `creatures` - Mythical creatures
- `cosmology` - Cosmological concepts
- `herbs` - Sacred herbs and plants
- `rituals` - Religious rituals
- `texts` - Sacred texts
- `myths` - Myths and legends
- `concepts` - Mystical concepts
- `symbols` - Sacred symbols

### Filtering

```javascript
// Set search filter
contentLoader.setSearchFilter('zeus');

// Set mythology filter
contentLoader.setMythologyFilter('greek');

// Set sort order
contentLoader.setSortOrder('name');

// Apply all filters
contentLoader.applyFilters();

// Re-render with new filters
contentLoader.renderContent('container', 'deities');
```

### Data Access

```javascript
// Get filtered data
const data = contentLoader.getData();

// Get counts
const counts = contentLoader.getCount();
console.log(counts.total);     // Total items loaded
console.log(counts.filtered);  // Items after filtering
```

### States

#### Loading State

```javascript
contentLoader.showLoadingState();
```

#### Error State

```javascript
contentLoader.showErrorState('Failed to load content');
```

#### Empty State

```javascript
const container = document.getElementById('myContainer');
contentLoader.showEmptyState(container);
```

#### Skeleton Loading

```javascript
const container = document.getElementById('myContainer');
contentLoader.showSkeletonCards(container, 6);
```

### Events

Listen for card clicks:

```javascript
document.addEventListener('contentItemClicked', (event) => {
    const { item, config } = event.detail;
    console.log('Clicked:', item.name);
    console.log('Type:', config.title);
});
```

---

## 🎨 CSS Custom Properties

### Theme Colors

```css
--theme-primary          /* Current theme's primary color */
--theme-primary-rgb      /* RGB values for alpha transparency */
--theme-gradient         /* Theme gradient background */
```

### Glassmorphism

```css
--glass-bg              /* rgba(255, 255, 255, 0.1) */
--glass-bg-hover        /* rgba(255, 255, 255, 0.15) */
--glass-border          /* rgba(255, 255, 255, 0.1) */
--glass-shadow          /* 0 8px 32px rgba(0, 0, 0, 0.1) */
--glass-shadow-hover    /* 0 12px 48px rgba(0, 0, 0, 0.15) */
--glass-blur            /* 10px */
```

### Spacing

```css
--spacing-xs    /* 0.25rem */
--spacing-sm    /* 0.5rem */
--spacing-md    /* 1rem */
--spacing-lg    /* 1.5rem */
--spacing-xl    /* 2rem */
--spacing-2xl   /* 3rem */
```

### Border Radius

```css
--radius-sm     /* 8px */
--radius-md     /* 12px */
--radius-lg     /* 16px */
--radius-xl     /* 20px */
```

### Transitions

```css
--transition-fast     /* all 0.2s ease */
--transition-normal   /* all 0.3s ease */
--transition-slow     /* all 0.5s ease */
```

---

## 🎭 Animation Classes

### Fade In

```html
<div class="fade-in">
    Content fades in on load
</div>
```

### Slide Up

```html
<div class="slide-up">
    Content slides up on load
</div>
```

### Staggered Cards

Cards automatically animate with staggered delays (0.1s increments).

---

## 📱 Responsive Design

### Breakpoints

- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: Below 768px

### Mobile Optimizations

- Single column grid on mobile
- Stacked filter controls
- Centered theme selector
- Reduced padding and font sizes

---

## ♿ Accessibility

### Features

- Focus visible indicators
- ARIA labels on interactive elements
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- Reduced motion support

### Prefers Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
    /* Animations disabled for accessibility */
}
```

---

## 🎨 Utility Classes

### Display

```css
.d-none      /* display: none */
.d-block     /* display: block */
.d-flex      /* display: flex */
.d-grid      /* display: grid */
```

### Text Alignment

```css
.text-center
.text-left
.text-right
```

### Spacing

```css
.mt-0, .mt-1, .mt-2, .mt-3, .mt-4    /* Margin top */
.mb-0, .mb-1, .mb-2, .mb-3, .mb-4    /* Margin bottom */
.p-1, .p-2, .p-3, .p-4               /* Padding */
```

### Gaps

```css
.gap-sm      /* gap: var(--spacing-sm) */
.gap-md      /* gap: var(--spacing-md) */
.gap-lg      /* gap: var(--spacing-lg) */
```

---

## 🔧 Advanced Usage

### Custom Theme Implementation

```javascript
// Create custom theme programmatically
document.documentElement.style.setProperty('--theme-primary', '#FF1493');
document.documentElement.style.setProperty('--theme-primary-rgb', '255, 20, 147');
```

### Dynamic Background Pattern

The theme system includes animated background patterns that respond to theme changes:

```css
body::before {
    /* Radial gradients using theme colors */
    background: radial-gradient(circle at 20% 50%,
        rgba(var(--theme-primary-rgb), 0.1) 0%,
        transparent 50%);
}
```

### Loading States Pattern

```javascript
// Show loading
contentLoader.showLoadingState();

try {
    // Load data
    await contentLoader.loadContent('deities');

    // Render on success
    contentLoader.renderContent('container', 'deities');
} catch (error) {
    // Show error
    contentLoader.showErrorState(error.message);
}
```

---

## 🐛 Troubleshooting

### Theme Not Loading

**Issue**: Theme colors not applying

**Solution**:
```javascript
// Ensure theme manager initialized
if (typeof themeManager !== 'undefined') {
    themeManager.init();
}
```

### Firestore Not Connected

**Issue**: Content loader fails to load

**Solution**:
```javascript
// Initialize Firestore first
const loader = new FirebaseContentLoader();
loader.initFirestore(firebaseApp);
```

### Cards Not Rendering

**Issue**: Content cards not appearing

**Solution**:
```html
<!-- Ensure container has correct ID -->
<div id="content-container"></div>

<script>
    // Use correct container ID
    contentLoader.renderContent('content-container', 'deities');
</script>
```

---

## 📄 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Note**: `backdrop-filter` requires modern browser support. Falls back gracefully on older browsers.

---

## 🚀 Performance Tips

1. **Lazy Load Images**: Use `loading="lazy"` on images
2. **Limit Initial Load**: Start with 24-50 items, add pagination
3. **Debounce Search**: Already implemented in content loader
4. **Use Skeleton Screens**: Better UX than spinners
5. **Minimize Reflows**: Batch DOM updates

---

## 📝 Example: Complete Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deities - Eyes of Azrael</title>
    <link rel="stylesheet" href="css/firebase-themes.css">
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
    <script src="js/theme-manager.js"></script>
    <script src="js/firebase-content-loader.js"></script>
</head>
<body>
    <div class="page-container">
        <!-- Header with theme selector -->
        <header class="page-header">
            <h1 class="page-title">Deities</h1>
            <p class="page-subtitle">Explore gods and goddesses from world mythologies</p>
            <div id="theme-selector"></div>
        </header>

        <!-- Filters -->
        <div id="filters"></div>

        <!-- Content -->
        <div id="content" data-content-container></div>
    </div>

    <script>
        // Firebase config
        const firebaseConfig = { /* your config */ };
        const app = firebase.initializeApp(firebaseConfig);

        // Initialize
        const loader = new FirebaseContentLoader(app);

        // Add theme selector
        document.getElementById('theme-selector')
            .appendChild(themeManager.createThemeSelector());

        // Add filters
        document.getElementById('filters')
            .appendChild(loader.createFilterControls('deities'));

        // Load and render
        (async () => {
            try {
                await loader.loadContent('deities');
                loader.setupFilters({
                    containerId: 'content',
                    contentType: 'deities',
                    searchInputId: 'search-input',
                    mythologySelectId: 'mythology-select',
                    sortSelectId: 'sort-select'
                });
                loader.renderContent('content', 'deities');
            } catch (error) {
                console.error('Error:', error);
            }
        })();
    </script>
</body>
</html>
```

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review the source code comments
3. Test in browser console with `themeManager` and `contentLoader` objects

---

## 📜 License

Part of the Eyes of Azrael project. See main project LICENSE for details.

---

**Version**: 1.0.0
**Last Updated**: December 2025
**Author**: Eyes of Azrael Development Team
