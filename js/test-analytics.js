/**
 * Analytics Testing & Validation Script
 * Run this in browser console to verify analytics integration
 */

(function() {
    'use strict';

    console.log('╔════════════════════════════════════════════╗');
    console.log('║   Analytics Integration Test Suite        ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');

    // Test 1: Check Analytics Manager
    console.log('Test 1: Analytics Manager Availability');
    if (typeof window.AnalyticsManager !== 'undefined') {
        console.log('✅ AnalyticsManager is loaded');
        const summary = window.AnalyticsManager.getSummary();
        console.log('   Summary:', summary);
    } else {
        console.error('❌ AnalyticsManager not found');
    }
    console.log('');

    // Test 2: Check Google Analytics
    console.log('Test 2: Google Analytics 4 Availability');
    if (typeof gtag !== 'undefined') {
        console.log('✅ gtag function is available');
    } else {
        console.error('❌ gtag function not found');
    }
    console.log('');

    // Test 3: Check Privacy Controls
    console.log('Test 3: Privacy Controls');
    if (typeof window.PrivacyControls !== 'undefined') {
        console.log('✅ PrivacyControls is loaded');
        const consent = localStorage.getItem('analytics_consent');
        console.log('   Consent status:', consent || 'not set (defaults to true)');
    } else {
        console.error('❌ PrivacyControls not found');
    }
    console.log('');

    // Test 4: Test Tracking Methods
    console.log('Test 4: Testing Tracking Methods');
    if (window.AnalyticsManager) {
        try {
            // Test page view
            window.AnalyticsManager.trackPageView('/test', 'Test Page');
            console.log('✅ trackPageView() works');

            // Test custom event
            window.AnalyticsManager.trackEvent('test_event', { test: true });
            console.log('✅ trackEvent() works');

            // Test entity view
            window.AnalyticsManager.trackEntityView({
                id: 'test-123',
                name: 'Test Entity',
                type: 'deity',
                mythology: 'test'
            });
            console.log('✅ trackEntityView() works');

            // Test search
            window.AnalyticsManager.trackSearch('test query', { mythology: 'greek' }, 5);
            console.log('✅ trackSearch() works');

            // Test comparison
            window.AnalyticsManager.trackEntityComparison(['id1', 'id2'], ['deity', 'deity']);
            console.log('✅ trackEntityComparison() works');

            // Test contribution
            window.AnalyticsManager.trackContributionAction('create', 'deities', 'test-123');
            console.log('✅ trackContributionAction() works');

            // Test timing
            window.AnalyticsManager.trackTiming('test', 'test_operation', 150);
            console.log('✅ trackTiming() works');

            // Test error
            window.AnalyticsManager.trackCustomError(new Error('Test error'), { fatal: false });
            console.log('✅ trackCustomError() works');

        } catch (error) {
            console.error('❌ Error testing methods:', error);
        }
    }
    console.log('');

    // Test 5: Check Integration Points
    console.log('Test 5: Integration Points');
    const integrations = {
        'SPA Navigation': typeof SPANavigation !== 'undefined',
        'Entity Loader': typeof EntityLoader !== 'undefined',
        'Search View': typeof SearchViewComplete !== 'undefined',
        'Compare View': typeof CompareView !== 'undefined',
        'CRUD Manager': typeof FirebaseCRUDManager !== 'undefined',
        'Home View': typeof HomeView !== 'undefined'
    };

    Object.entries(integrations).forEach(([name, available]) => {
        console.log(available ? `✅ ${name}` : `❌ ${name} not found`);
    });
    console.log('');

    // Test 6: Check Firebase
    console.log('Test 6: Firebase Integration');
    if (typeof firebase !== 'undefined') {
        console.log('✅ Firebase SDK loaded');
        if (firebase.analytics) {
            console.log('✅ Firebase Analytics available');
        } else {
            console.warn('⚠️  Firebase Analytics not initialized');
        }
    } else {
        console.error('❌ Firebase SDK not found');
    }
    console.log('');

    // Summary
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   Test Summary                             ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log('Check Google Analytics Real-Time view:');
    console.log('https://analytics.google.com/analytics/web/#/p440893033/reports/intelligenthome');
    console.log('');
    console.log('Expected events in last 30 minutes:');
    console.log('  • test_event');
    console.log('  • page_view');
    console.log('  • view_item');
    console.log('  • search');
    console.log('  • compare_entities');
    console.log('  • contribution_action');
    console.log('  • timing_complete');
    console.log('  • exception');
    console.log('');
    console.log('Run "window.AnalyticsManager.getSummary()" for detailed info');

})();
