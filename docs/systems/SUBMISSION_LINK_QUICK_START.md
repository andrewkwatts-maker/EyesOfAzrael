# Submission Link - Quick Start

> 30 seconds to add beautiful submission buttons to your page

## 1. Add Files (Copy & Paste)

Add to your HTML file:

```html
<!-- In <head> section -->
<link rel="stylesheet" href="css/submission-link.css">

<!-- Before </body> -->
<script src="js/components/submission-link.js"></script>
<script>SubmissionLink.autoInject();</script>
```

**Done!** A floating button will appear in the bottom-right corner.

## 2. Adjust Path Depth

Based on where your HTML file is located:

| File Location | Path |
|--------------|------|
| Root (`/index.html`) | `css/submission-link.css` |
| 1 level deep (`/mythos/index.html`) | `../css/submission-link.css` |
| 2 levels deep (`/mythos/christian/index.html`) | `../../css/submission-link.css` |
| 3 levels deep (`/mythos/christian/deities/index.html`) | `../../../css/submission-link.css` |

**Example for** `/mythos/christian/index.html`:

```html
<link rel="stylesheet" href="../../css/submission-link.css">
<script src="../../js/components/submission-link.js"></script>
<script>SubmissionLink.autoInject();</script>
```

## 3. That's It!

The component will:
- ✅ Detect your page type (deities, heroes, etc.)
- ✅ Show appropriate label ("Add Deity", "Add Hero", etc.)
- ✅ Link to submission page
- ✅ Work on mobile and desktop

## Common Use Cases

### Use Case 1: Default FAB Button

```html
<script>
    SubmissionLink.autoInject();
</script>
```

### Use Case 2: Custom Label

```html
<script>
    SubmissionLink.autoInject({
        label: 'Submit Your Content',
        icon: '📝'
    });
</script>
```

### Use Case 3: Inline Button in Header

```html
<header>
    <h1>Page Title</h1>
    <div id="header-actions"></div>
</header>

<script>
    const button = SubmissionLink.createInline({ label: 'Add Hero' });
    document.getElementById('header-actions').appendChild(button);
</script>
```

### Use Case 4: Card Button

```html
<div class="card">
    <h3>Card Title</h3>
    <p>Card content...</p>
    <div id="card-footer"></div>
</div>

<script>
    const button = SubmissionLink.createCardButton({ label: 'Submit' });
    document.getElementById('card-footer').appendChild(button);
</script>
```

## Button Styles

| Style | Use When | Method |
|-------|----------|--------|
| **FAB** | Global action, any page | `autoInject()` |
| **Inline** | Header, toolbar, content | `createInline()` |
| **Dropdown** | Navigation menu | `createDropdownItem()` |
| **Card** | Grid cards, previews | `createCardButton()` |

## Detected Labels

The component automatically shows the right label:

| Page URL Contains | Label Shown |
|------------------|-------------|
| `/deities/` | Add Deity |
| `/heroes/` | Add Hero |
| `/creatures/` | Add Creature |
| `/texts/` | Add Text |
| `/teachings/` | Add Teaching |
| `/theology/` | Add Theology |
| `/theories/` | Submit Theory |
| Other | Contribute |

## Troubleshooting

**Button not showing?**
- Check file paths (count the `../`)
- Open browser console (F12) for errors
- Verify files exist in `css/` and `js/components/`

**Wrong label?**
- Labels are auto-detected from URL
- Override: `SubmissionLink.autoInject({ label: 'Your Label' })`

**Want to hide on certain pages?**
```html
<script>
    if (!window.location.pathname.includes('/admin/')) {
        SubmissionLink.autoInject();
    }
</script>
```

## Full Documentation

- **Quick Start**: `SUBMISSION_LINK_QUICK_START.md` (this file)
- **Complete Guide**: `SUBMISSION_LINK_GUIDE.md`
- **Integration Examples**: `SUBMISSION_LINK_INTEGRATION.md`
- **Full Demo**: Open `submission-link-demo.html` in browser
- **Test Suite**: Open `test-submission-link.html` in browser

## Need Help?

1. Check the demo: `submission-link-demo.html`
2. Read the guide: `SUBMISSION_LINK_GUIDE.md`
3. View examples: `SUBMISSION_LINK_INTEGRATION.md`

---

**That's all you need!** 3 lines of code = beautiful submission buttons 🚀
