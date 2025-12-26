with open('js/auth-guard-simple.js', 'r', encoding='utf-8') as f:
    content = f.read()

old = """    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
    }"""

new = """    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'block';

        // Hide the initial loading container immediately (Agent 6 fix)
        const loadingContainer = mainContent.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
            console.log('[EOA Auth Guard] Initial loading spinner hidden');
        }
    }"""

content = content.replace(old, new)

with open('js/auth-guard-simple.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Spinner fix applied!")
