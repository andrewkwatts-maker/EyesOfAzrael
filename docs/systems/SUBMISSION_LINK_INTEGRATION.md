# Submission Link Integration Examples

Quick examples showing how to integrate the Submission Link component into existing Eyes of Azrael pages.

## Quick Integration (Recommended)

Add these two lines to any page for instant FAB button:

```html
<!-- In <head> or before </head> -->
<link rel="stylesheet" href="../../css/submission-link.css">

<!-- Before </body> -->
<script src="../../js/components/submission-link.js"></script>
<script>SubmissionLink.autoInject();</script>
```

**Note**: Adjust the `../../` path based on your page depth.

## Integration by Page Type

### Mythology Index Pages (e.g., `mythos/christian/index.html`)

**Current structure:**
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="../../css/styles.css">
</head>
<body>
    <!-- Content -->
</body>
</html>
```

**Add Submission Link:**
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="../../css/styles.css">
    <link rel="stylesheet" href="../../css/submission-link.css">
</head>
<body>
    <!-- Content -->

    <script src="../../js/components/submission-link.js"></script>
    <script>SubmissionLink.autoInject();</script>
</body>
</html>
```

Result: FAB button with "Submit Content" label

---

### Deity Pages (e.g., `mythos/christian/deities/`)

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="../../../css/styles.css">
    <link rel="stylesheet" href="../../../css/submission-link.css">
</head>
<body>
    <!-- Content -->

    <script src="../../../js/components/submission-link.js"></script>
    <script>SubmissionLink.autoInject();</script>
</body>
</html>
```

Result: FAB button with "Add Deity" label (auto-detected from URL)

---

### Hero Pages (e.g., `mythos/christian/heroes/disciples/`)

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="../../../../css/styles.css">
    <link rel="stylesheet" href="../../../../css/submission-link.css">
</head>
<body>
    <!-- Content -->

    <script src="../../../../js/components/submission-link.js"></script>
    <script>SubmissionLink.autoInject();</script>
</body>
</html>
```

Result: FAB button with "Add Hero" label (auto-detected from URL)

---

### Theology Pages (e.g., `mythos/christian/theology/`)

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="../../../css/styles.css">
    <link rel="stylesheet" href="../../../css/submission-link.css">
</head>
<body>
    <!-- Content -->

    <script src="../../../js/components/submission-link.js"></script>
    <script>SubmissionLink.autoInject();</script>
</body>
</html>
```

Result: FAB button with "Add Theology" label (auto-detected from URL)

---

## Advanced Integration Examples

### Add Inline Button to Page Header

Perfect for category/section pages where you want an explicit "Add" button in the header.

```html
<header class="page-header">
    <h1>Christian Deities</h1>
    <div class="header-actions" id="header-actions"></div>
</header>

<script src="../../js/components/submission-link.js"></script>
<script>
    // Add inline button to header
    const headerActions = document.getElementById('header-actions');
    const addButton = SubmissionLink.createInline({
        label: 'Add Deity',
        icon: '➕'
    });
    headerActions.appendChild(addButton);
</script>
```

---

### Add to Navigation Menu

```html
<nav class="main-nav">
    <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/mythos/">Mythos</a></li>
        <li><a href="/theories/">Theories</a></li>
        <li id="nav-submit"></li>
    </ul>
</nav>

<script src="../../js/components/submission-link.js"></script>
<script>
    // Add to navigation
    const navSubmit = document.getElementById('nav-submit');
    const menuLink = SubmissionLink.createDropdownItem({
        label: 'Submit Content',
        icon: '➕'
    });
    navSubmit.appendChild(menuLink);
</script>
```

---

### Add to Card Grid

Perfect for browse pages showing multiple items.

```html
<div class="grid">
    <div class="card">
        <h3>Zeus</h3>
        <p>King of the Gods</p>
        <div class="card-footer">
            <a href="zeus.html">View Details</a>
        </div>
    </div>

    <!-- Add "Submit New" card -->
    <div class="card card-add" id="add-card">
        <h3>Add New Deity</h3>
        <p>Submit a deity to the collection</p>
        <div class="card-footer" id="add-button"></div>
    </div>
</div>

<script src="../../js/components/submission-link.js"></script>
<script>
    const addButton = SubmissionLink.createCardButton({
        label: 'Submit Deity',
        icon: '➕'
    });
    document.getElementById('add-button').appendChild(addButton);
</script>
```

---

### Conditional Integration

Only show on certain pages or for certain users.

```html
<script src="../../js/components/submission-link.js"></script>
<script>
    // Only inject on mythology pages
    if (window.location.pathname.includes('/mythos/')) {
        SubmissionLink.autoInject();
    }

    // Or check if user is logged in
    if (isUserLoggedIn()) {
        SubmissionLink.autoInject();
    }

    // Or only on specific pages
    const showOnPages = ['/heroes/', '/deities/', '/creatures/'];
    const currentPath = window.location.pathname;
    if (showOnPages.some(page => currentPath.includes(page))) {
        SubmissionLink.autoInject();
    }
</script>
```

---

### Multiple Buttons on Same Page

Use different styles for different contexts.

```html
<header>
    <h1>Christian Mythology</h1>
    <div id="header-button"></div>
</header>

<main>
    <!-- Content -->
</main>

<script src="../../js/components/submission-link.js"></script>
<script>
    // Inline button in header
    const headerButton = SubmissionLink.createInline({
        label: 'Submit Content',
        icon: '➕'
    });
    document.getElementById('header-button').appendChild(headerButton);

    // FAB button for mobile
    if (window.innerWidth < 768) {
        SubmissionLink.autoInject();
    }
</script>
```

---

## Path Calculation Guide

The component automatically calculates the correct path to the submission page based on page depth.

**Examples:**

| Page Location | Path Depth | Submission URL |
|--------------|------------|----------------|
| `/mythos/christian/index.html` | 2 | `../../theories/user-submissions/submit.html` |
| `/mythos/christian/deities/index.html` | 3 | `../../../theories/user-submissions/submit.html` |
| `/mythos/christian/heroes/disciples/index.html` | 4 | `../../../../theories/user-submissions/submit.html` |
| `/theories/index.html` | 1 | `../theories/user-submissions/submit.html` |

**Override if needed:**

```javascript
SubmissionLink.autoInject({
    url: '/theories/user-submissions/submit.html' // Absolute path
});
```

---

## Styling Integration

### Match Your Site Theme

Add custom CSS to match your existing design:

```css
/* Custom theme colors */
.submission-link--fab {
    background: linear-gradient(135deg, #your-primary-color, #your-secondary-color);
}

.submission-link--fab:hover {
    background: linear-gradient(135deg, #your-primary-hover, #your-secondary-hover);
}

/* Match your font */
.submission-link {
    font-family: 'Your Font', sans-serif;
}
```

---

### Position Adjustment

Move button to different location:

```css
/* Top-right instead of bottom-right */
.submission-link--fab {
    top: 2rem;
    bottom: auto;
    right: 2rem;
}

/* Left side */
.submission-link--fab {
    left: 2rem;
    right: auto;
}

/* Bottom-left */
.submission-link--fab {
    left: 2rem;
    right: auto;
}
```

---

## Testing Checklist

After integrating, verify:

- [ ] Button appears on page
- [ ] Correct label shows (based on page context)
- [ ] Button links to correct submission page
- [ ] Hover effects work
- [ ] Mobile responsive (check on phone/tablet)
- [ ] Button doesn't appear on submission pages
- [ ] No JavaScript errors in console
- [ ] Accessible (test with keyboard navigation)

---

## Common Integration Patterns

### Pattern 1: Global Integration (Recommended)

Add to your main template/layout file so all pages get the FAB:

```html
<!-- In your base template -->
<link rel="stylesheet" href="css/submission-link.css">
<script src="js/components/submission-link.js"></script>
<script>
    // Don't inject on submission pages
    if (!SubmissionLink.isSubmissionPage()) {
        SubmissionLink.autoInject();
    }
</script>
```

### Pattern 2: Page-Specific Integration

Add only to specific pages that need it:

```html
<!-- Only on this page -->
<link rel="stylesheet" href="../../css/submission-link.css">
<script src="../../js/components/submission-link.js"></script>
<script>SubmissionLink.autoInject();</script>
```

### Pattern 3: Mixed Approach

FAB for most pages, inline for headers:

```html
<!-- Template header -->
<header>
    <h1>Page Title</h1>
    <div class="header-actions" id="header-submit"></div>
</header>

<script src="js/components/submission-link.js"></script>
<script>
    // Inline in header on desktop
    if (window.innerWidth >= 768) {
        const button = SubmissionLink.createInline();
        document.getElementById('header-submit').appendChild(button);
    } else {
        // FAB on mobile
        SubmissionLink.autoInject();
    }
</script>
```

---

## Troubleshooting Integration

### Button not showing?

1. **Check file paths**: Ensure CSS and JS paths are correct
   ```html
   <!-- Wrong: relative to project root -->
   <link rel="stylesheet" href="css/submission-link.css">

   <!-- Right: relative to current page -->
   <link rel="stylesheet" href="../../css/submission-link.css">
   ```

2. **Check JavaScript errors**: Open browser console (F12)

3. **Verify auto-inject**: Make sure script runs after DOM ready
   ```javascript
   // Good: runs after DOM
   document.addEventListener('DOMContentLoaded', () => {
       SubmissionLink.autoInject();
   });

   // Better: component handles this automatically
   SubmissionLink.autoInject(); // Works anywhere
   ```

### Wrong label appearing?

The component detects context from URL. Check your URL pattern:

```javascript
// See what context is detected
const link = new SubmissionLink();
console.log(link.options.context);

// Override if needed
SubmissionLink.autoInject({
    label: 'Custom Label',
    icon: '➕'
});
```

### Conflicts with existing buttons?

Add custom class to distinguish:

```javascript
SubmissionLink.autoInject({
    className: 'my-custom-submit-button'
});
```

---

## Next Steps

1. Choose your integration approach (global vs page-specific)
2. Add CSS and JS files to your pages
3. Test on desktop and mobile
4. Customize styling to match your theme
5. Deploy and enjoy!

For more details, see `SUBMISSION_LINK_GUIDE.md`.
