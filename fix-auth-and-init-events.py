#!/usr/bin/env python3
"""Add events to auth-guard and app-init to coordinate initialization"""

# Fix auth-guard-simple.js - add event after showing content
with open('js/auth-guard-simple.js', 'r', encoding='utf-8') as f:
    auth_content = f.read()

# Add event dispatch after handleAuthenticated shows content
old_auth = '''    // Update user info display in header
    updateUserDisplay(user);

    // Let SPANavigation handle initial routing - no need for delay or manual trigger
    console.log('[EOA Auth Guard] User authenticated, SPANavigation will handle routing');
}'''

new_auth = '''    // Update user info display in header
    updateUserDisplay(user);

    // Emit auth-ready event for app coordinator
    document.dispatchEvent(new CustomEvent('auth-ready', {
        detail: { user, authenticated: true }
    }));

    // Let SPANavigation handle initial routing - no need for delay or manual trigger
    console.log('[EOA Auth Guard] User authenticated, SPANavigation will handle routing');
}'''

if old_auth in auth_content:
    auth_content = auth_content.replace(old_auth, new_auth)
    with open('js/auth-guard-simple.js', 'w', encoding='utf-8') as f:
        f.write(auth_content)
    print("✅ Updated auth-guard-simple.js")
else:
    print("⚠️ Could not find auth pattern in auth-guard-simple.js")

# Also add event for NOT authenticated
old_not_auth = '''    // Clear user display
    updateUserDisplay(null);
}'''

new_not_auth = '''    // Clear user display
    updateUserDisplay(null);

    // Emit auth-ready event (not authenticated)
    document.dispatchEvent(new CustomEvent('auth-ready', {
        detail: { user: null, authenticated: false }
    }));
}'''

auth_content = open('js/auth-guard-simple.js', 'r', encoding='utf-8').read()
if old_not_auth in auth_content:
    auth_content = auth_content.replace(old_not_auth, new_not_auth)
    with open('js/auth-guard-simple.js', 'w', encoding='utf-8') as f:
        f.write(auth_content)
    print("✅ Added event for not-authenticated case")

# Fix app-init-simple.js - add event after initialization
with open('js/app-init-simple.js', 'r', encoding='utf-8') as f:
    app_content = f.read()

old_app = '''        console.log('[App] ✅ Initialization complete');

        // Hide loading spinner
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }'''

new_app = '''        console.log('[App] ✅ Initialization complete');

        // Emit app-initialized event
        document.dispatchEvent(new CustomEvent('app-initialized'));

        // Hide loading spinner
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }'''

if old_app in app_content:
    app_content = app_content.replace(old_app, new_app)
    with open('js/app-init-simple.js', 'w', encoding='utf-8') as f:
        f.write(app_content)
    print("✅ Updated app-init-simple.js")
else:
    print("⚠️  Could not find app pattern in app-init-simple.js")

print("\n✅ All events added successfully!")
