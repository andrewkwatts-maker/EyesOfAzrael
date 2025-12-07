# Icon Picker & SVG Editor - Integration Quick Reference

## For Agent Building IconPicker Component

### Required API

Your IconPicker class must be available at `window.IconPicker` and support this API:

```javascript
// Constructor
const picker = new window.IconPicker({
  currentIcon: '👑',           // Current icon (if any)
  allowCustomClass: true,      // Allow custom classes/text
  onSelect: (selectedIcon) => { // Callback when icon selected
    // selectedIcon will be the emoji or text selected
    console.log('Selected:', selectedIcon);
  }
});

// Show method
picker.show();
```

### Integration Points

**Where it's called**: `H:\Github\EyesOfAzrael\js\components\grid-panel-editor.js` (line 658-678)

**Method**: `pickIcon(index)`

**Fallback**: If your component isn't loaded, the grid panel editor will use `prompt()` as a fallback.

### User Experience

1. User clicks 📌 button next to panel title
2. If icon already exists, confirm dialog asks to clear or change
3. Icon picker modal opens
4. User selects icon (emoji, symbol, or custom text)
5. Modal closes
6. Icon appears before panel title

### CSS Hook

You can style your picker modal. The grid panel editor has these classes:
- `.btn-icon-picker` - The trigger button
- `.panel-title-icon` - The displayed icon

### Testing

Test that your component:
- Exports to `window.IconPicker`
- Accepts constructor options as shown
- Calls `onSelect` callback when icon selected
- Handles empty `currentIcon` (new icon)
- Handles existing `currentIcon` (changing icon)

---

## For Agent Building SVGEditorModal Component

### Required API

Your SVGEditorModal must be available at `window.SVGEditorModal` and support this API:

```javascript
// Static method on class
window.SVGEditorModal.open({
  initialPrompt: 'Zeus hurling lightning',  // Previous prompt (if any)
  initialSvg: '<svg>...</svg>',             // Previous SVG code (if any)
  onSave: (svgData) => {                    // Callback when saved
    // svgData should have this structure:
    {
      svgCode: '<svg>...</svg>',            // Generated SVG markup
      prompt: 'Zeus hurling lightning',      // User's prompt
      generatedBy: 'gemini-ai'               // Which AI generated it
    }
  }
});
```

### Integration Points

**Where it's called**:
- `H:\Github\EyesOfAzrael\js\components\grid-panel-editor.js` (lines 683-707, 851-875)

**Methods**:
- `editSVG(index)` - For root-level SVG panels
- `editChildSVG(parentIndex, childIndex)` - For grid SVG items

**Fallback**: If your component isn't loaded, SVG buttons are disabled and alert is shown.

### User Experience

#### Creating New SVG Panel:
1. User clicks "Add SVG Panel" button
2. Empty SVG panel is created
3. Your modal opens automatically with empty prompt/svg
4. User enters prompt and generates SVG
5. User clicks save
6. Modal closes
7. SVG appears in panel with preview

#### Editing Existing SVG:
1. User clicks "Edit SVG" button on existing SVG panel
2. Your modal opens with existing prompt and SVG
3. User can regenerate or modify
4. User clicks save
5. Modal closes
6. Updated SVG displays in panel

### Display Requirements

The grid panel editor will display your SVG with these constraints:
- **Root SVG panels**: max 400x400px, centered
- **Grid SVG items**: max 180px height, centered
- SVG is displayed as raw HTML (ensure it's safe!)
- Prompt is shown below SVG in italic text
- Generator name shown in small text at bottom

### CSS Hooks

The grid panel editor has these classes for SVG content:
- `.svg-panel` - SVG panel container
- `.svg-preview-container` - Preview area for root panels
- `.svg-prompt` - Prompt display
- `.svg-metadata` - Generator metadata
- `.grid-item-svg` - SVG grid item
- `.grid-item-svg-preview` - Preview area for grid items
- `.btn-edit-svg` - Edit button

### Security Notes

⚠️ **Important**: Your component should sanitize SVG code:
- Remove `<script>` tags
- Remove event handlers (onclick, onload, etc.)
- Validate SVG structure
- Warn if size > 50KB

The grid panel editor will render whatever SVG code you provide, so sanitization is your responsibility!

### Testing

Test that your component:
- Exports to `window.SVGEditorModal`
- Has static `open()` method
- Accepts options as shown
- Calls `onSave` callback with correct structure
- Handles empty `initialPrompt` and `initialSvg`
- Handles existing `initialPrompt` and `initialSvg`
- Sanitizes generated SVG code
- Works when opened multiple times (for editing)

---

## Script Load Order

In `H:\Github\EyesOfAzrael\theories\user-submissions\submit.html`, scripts must load in this order:

```html
<!-- 1. Firebase (if used) -->
<script src="firebase-app.js"></script>
<script src="firebase-auth.js"></script>

<!-- 2. Your components -->
<script src="../../js/components/icon-picker.js"></script>
<script src="../../js/components/svg-editor-modal.js"></script>

<!-- 3. Grid panel editor (depends on your components) -->
<script src="../../js/components/grid-panel-editor.js"></script>

<!-- 4. Theory editor (depends on grid panel editor) -->
<script src="../../js/components/theory-editor.js"></script>
```

**Currently loaded**: icon-picker.js is at line 707, ready for your implementation!

---

## Data Structure Reference

### Panel with Icon
```javascript
{
  type: 'panel',
  title: 'Divine Hierarchy',
  titleIcon: '👑',           // ← Your IconPicker sets this
  content: 'Content here...',
  order: 0
}
```

### SVG Panel
```javascript
{
  type: 'svg',
  title: 'Zeus Symbol',
  titleIcon: '⚡',           // ← Optional icon from IconPicker
  svgCode: '<svg>...</svg>', // ← Your SVGEditor sets this
  svgPrompt: 'Zeus hurling lightning', // ← Your SVGEditor sets this
  svgGeneratedBy: 'gemini-ai',         // ← Your SVGEditor sets this
  order: 1
}
```

### Grid Panel with SVG Child
```javascript
{
  type: 'grid',
  title: 'Divine Symbols',
  titleIcon: '📊',
  gridWidth: 4,
  order: 2,
  children: [
    {
      type: 'svg',
      svgCode: '<svg>...</svg>',      // ← From SVGEditor
      svgPrompt: 'Lightning bolt',     // ← From SVGEditor
      svgGeneratedBy: 'gemini-ai',     // ← From SVGEditor
      order: 0
    },
    {
      type: 'panel',
      title: 'Description',
      content: '...',
      order: 1
    }
  ]
}
```

---

## Testing Checklist

### IconPicker Component
- [ ] Exports to `window.IconPicker`
- [ ] Constructor accepts options
- [ ] `show()` method works
- [ ] `onSelect` callback fires with selected icon
- [ ] Can handle emoji, symbols, text
- [ ] Modal is visually appealing
- [ ] Closes properly after selection
- [ ] Works when opened multiple times

### SVGEditorModal Component
- [ ] Exports to `window.SVGEditorModal`
- [ ] Static `open()` method works
- [ ] Accepts `initialPrompt` and `initialSvg`
- [ ] Generates SVG (integration with AI)
- [ ] `onSave` callback fires with correct data structure
- [ ] SVG is sanitized (no scripts)
- [ ] Size warning for large SVGs
- [ ] Preview before save
- [ ] Can regenerate/modify existing SVG
- [ ] Modal closes properly

### Integration
- [ ] Both components work together
- [ ] Icons display in SVG panel headers
- [ ] Grid panel editor doesn't crash if components missing
- [ ] Warning messages appear when components disabled
- [ ] Data persists through save/load
- [ ] Form submission includes all icon and SVG data

---

## Quick Start Commands

### Check if components are loaded
```javascript
// In browser console
console.log('IconPicker available:', !!window.IconPicker);
console.log('SVGEditorModal available:', !!window.SVGEditorModal);
```

### Test IconPicker directly
```javascript
if (window.IconPicker) {
  const picker = new window.IconPicker({
    currentIcon: '🎨',
    allowCustomClass: true,
    onSelect: (icon) => console.log('Selected:', icon)
  });
  picker.show();
}
```

### Test SVGEditorModal directly
```javascript
if (window.SVGEditorModal) {
  window.SVGEditorModal.open({
    initialPrompt: 'test prompt',
    initialSvg: '',
    onSave: (data) => console.log('SVG Data:', data)
  });
}
```

### Get current grid panel data
```javascript
// Assuming editor is initialized
const data = editor.getData();
console.log('All panels:', data.panels);
console.log('Panels with icons:', data.panels.filter(p => p.titleIcon));
console.log('SVG panels:', data.panels.filter(p => p.type === 'svg'));
```

---

## Contact / Questions

If you have questions about the integration:
1. Read `GRID_PANEL_EDITOR_INTEGRATION_SUMMARY.md` for full details
2. Check `H:\Github\EyesOfAzrael\js\components\grid-panel-editor.js` for implementation
3. Check `H:\Github\EyesOfAzrael\css\grid-panel-editor-v2.css` for styling hooks

The grid panel editor is ready and waiting for your components!
