import sys

# Fix auth-guard-simple.js
with open('js/auth-guard-simple.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add auth-ready event after authenticated
if 'SPANavigation will handle routing' in content and 'auth-ready' not in content:
    content = content.replace(
        "console.log('[EOA Auth Guard] User authenticated, SPANavigation will handle routing');",
        """// Emit auth-ready event
    document.dispatchEvent(new CustomEvent('auth-ready', { detail: { user, authenticated: true } }));
    console.log('[EOA Auth Guard] User authenticated, SPANavigation will handle routing');"""
    )
    with open('js/auth-guard-simple.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated auth-guard-simple.js (authenticated)")

# Add event for not authenticated
with open('js/auth-guard-simple.js', 'r', encoding='utf-8') as f:
    content = f.read()

if 'handleNotAuthenticated' in content:
    content = content.replace(
        """// Clear user display
    updateUserDisplay(null);
}""",
        """// Clear user display
    updateUserDisplay(null);
    
    // Emit auth-ready event (not authenticated)
    document.dispatchEvent(new CustomEvent('auth-ready', { detail: { user: null, authenticated: false } }));
}"""
    )
    with open('js/auth-guard-simple.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated auth-guard-simple.js (not authenticated)")

# Fix app-init-simple.js
with open('js/app-init-simple.js', 'r', encoding='utf-8') as f:
    content = f.read()

if 'Initialization complete' in content and 'app-initialized' not in content:
    content = content.replace(
        "console.log('[App] ✅ Initialization complete');",
        """console.log('[App] Initialization complete');
        
        // Emit app-initialized event
        document.dispatchEvent(new CustomEvent('app-initialized'));"""
    )
    with open('js/app-init-simple.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated app-init-simple.js")

print("Done!")
