# Voting System Quick Start Guide

Get the voting system up and running in 5 minutes!

## 1. Include Required Files

Add these scripts to your HTML page:

```html
<!-- Firebase SDK (if not already included) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

<!-- Firebase Configuration -->
<script src="firebase-config.js"></script>
<script src="js/firebase-init.js"></script>

<!-- Voting System -->
<script src="js/services/vote-service.js"></script>
<script src="js/components/vote-buttons.js"></script>
<link rel="stylesheet" href="css/vote-buttons.css">
```

## 2. Add Vote Buttons to Your HTML

### Option A: Default (Full Size)

```html
<div class="vote-buttons" data-item-id="asset_123" data-item-type="assets"></div>
```

### Option B: Compact (For Cards)

```html
<div class="vote-buttons compact" data-item-id="note_456" data-item-type="notes"></div>
```

### Option C: Inline (For Lists)

```html
<div class="vote-buttons inline" data-item-id="asset_789" data-item-type="assets"></div>
```

## 3. Vote Buttons Auto-Initialize!

That's it! The vote buttons will automatically:
- ✅ Initialize when the page loads
- ✅ Load the user's current vote
- ✅ Display current vote counts
- ✅ Handle vote clicks
- ✅ Update in real-time

## 4. Dynamic Content (Optional)

If you're adding content dynamically, vote buttons still auto-initialize:

```javascript
// Create a new asset card
const card = document.createElement('div');
card.className = 'asset-card';
card.innerHTML = `
  <h3>${asset.name}</h3>
  <p>${asset.description}</p>
  <div class="vote-buttons compact"
       data-item-id="${asset.id}"
       data-item-type="assets"></div>
`;

// Just add it to the DOM - vote buttons will initialize automatically!
container.appendChild(card);
```

## 5. Manual Initialization (Advanced)

If you need more control:

```javascript
const container = document.getElementById('my-vote-buttons');
const voteButtons = new VoteButtonsComponent(container);

// Later, clean up
voteButtons.destroy();
```

## 6. Listen for Vote Events (Optional)

```javascript
window.addEventListener('voteUpdated', (event) => {
  const { itemId, itemType, newVotes, userVote } = event.detail;
  console.log(`Item ${itemId} now has ${newVotes} votes`);
});
```

## Common Use Cases

### Use Case 1: User Asset Gallery

```html
<!-- In your asset card template -->
<div class="asset-card">
  <img src="${asset.imageUrl}" alt="${asset.name}">
  <h3>${asset.name}</h3>
  <p>${asset.description}</p>

  <!-- Add vote buttons -->
  <div class="vote-buttons compact"
       data-item-id="${asset.id}"
       data-item-type="assets"></div>
</div>
```

### Use Case 2: User Notes/Comments

```html
<!-- In your note template -->
<div class="note-card">
  <div class="note-header">
    <span class="author">${note.authorName}</span>
    <span class="date">${note.createdAt}</span>

    <!-- Add inline vote buttons -->
    <div class="vote-buttons inline"
         data-item-id="${note.id}"
         data-item-type="notes"></div>
  </div>
  <div class="note-content">${note.content}</div>
</div>
```

### Use Case 3: Grid with Sorting

```javascript
// Sort assets by votes
const sortByVotes = (items) => {
  return items.sort((a, b) => (b.votes || 0) - (a.votes || 0));
};

// Sort by most controversial
const sortByControversial = (items) => {
  return items.sort((a, b) => (b.contestedScore || 0) - (a.contestedScore || 0));
};

// Render sorted grid
const renderGrid = (items) => {
  items.forEach(item => {
    const card = createCard(item);
    grid.appendChild(card);
  });
};
```

## Customization

### Custom Colors

```css
.vote-buttons-container {
  --vote-upvote-color: #10b981;
  --vote-downvote-color: #ef4444;
  --vote-neutral-color: #6b7280;
}
```

### Custom Themes

```html
<div class="vote-buttons"
     data-item-id="asset_123"
     data-item-type="assets"
     data-theme="success"></div>
```

Available themes: `success`, `danger`

## Troubleshooting

### Problem: Vote buttons don't appear

**Solution:** Check that:
1. All required scripts are loaded (check browser console)
2. The container has `data-item-id` and `data-item-type` attributes
3. Firebase is initialized

### Problem: Votes don't save

**Solution:** Check that:
1. User is authenticated (login required to vote)
2. Firestore rules are deployed
3. Network connection is active

### Problem: Vote counts don't update

**Solution:** Check that:
1. Firestore snapshot listeners are working
2. Browser console for errors
3. Firebase connection status

## Next Steps

- 📖 Read the full [Voting System Documentation](./VOTING_SYSTEM_DOCUMENTATION.md)
- 🔧 Customize the vote button styles in `css/vote-buttons.css`
- 📊 Add analytics tracking (see documentation)
- 🎨 Create custom vote button variants

## Support

- **Documentation:** [VOTING_SYSTEM_DOCUMENTATION.md](./VOTING_SYSTEM_DOCUMENTATION.md)
- **Report:** [AGENT_8_VOTING_SYSTEM_REPORT.md](./AGENT_8_VOTING_SYSTEM_REPORT.md)
- **Tests:** [tests/vote-system-tests.js](./tests/vote-system-tests.js)

---

**Quick Start Complete!** Your voting system is now ready to use. 🎉
