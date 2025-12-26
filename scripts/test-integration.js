/**
 * Integration Test Script
 * Tests key components of the new SPA system
 *
 * Run from browser console at http://localhost:5003
 */

(async function testIntegration() {
    'use strict';

    console.log('🧪 Starting Integration Tests...\n');

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    function test(name, condition, details = '') {
        const passed = Boolean(condition);
        results.tests.push({ name, passed, details });

        if (passed) {
            results.passed++;
            console.log(`✅ ${name}`);
        } else {
            results.failed++;
            console.error(`❌ ${name}`);
            if (details) console.error(`   ${details}`);
        }
    }

    // Test 1: Firebase loaded
    test(
        'Firebase SDK loaded',
        typeof firebase !== 'undefined',
        'firebase object not found'
    );

    // Test 2: Firebase initialized
    test(
        'Firebase app initialized',
        firebase.apps.length > 0,
        'No Firebase apps initialized'
    );

    // Test 3: Firestore available
    const db = firebase.firestore();
    test(
        'Firestore instance created',
        db !== null,
        'Failed to get Firestore instance'
    );

    // Test 4: Auth available
    test(
        'Firebase Auth available',
        typeof firebase.auth === 'function',
        'firebase.auth not found'
    );

    // Test 5: EyesOfAzrael namespace
    test(
        'EyesOfAzrael namespace exists',
        typeof window.EyesOfAzrael === 'object',
        'window.EyesOfAzrael not found'
    );

    // Test 6: AuthManager initialized
    test(
        'AuthManager initialized',
        window.EyesOfAzrael && window.EyesOfAzrael.auth,
        'window.EyesOfAzrael.auth not found'
    );

    // Test 7: SPANavigation initialized
    test(
        'SPANavigation initialized',
        window.EyesOfAzrael && window.EyesOfAzrael.navigation,
        'window.EyesOfAzrael.navigation not found'
    );

    // Test 8: ShaderThemeManager initialized
    test(
        'ShaderThemeManager initialized',
        window.EyesOfAzrael && window.EyesOfAzrael.shaders,
        'window.EyesOfAzrael.shaders not found'
    );

    // Test 9: Search system initialized
    test(
        'EnhancedCorpusSearch initialized',
        window.EyesOfAzrael && window.EyesOfAzrael.search,
        'window.EyesOfAzrael.search not found'
    );

    // Test 10: Shader canvas exists
    const canvas = document.getElementById('shader-canvas');
    test(
        'Shader canvas element exists',
        canvas !== null,
        'canvas#shader-canvas not found'
    );

    // Test 11: Canvas has WebGL context
    if (canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        test(
            'WebGL context available',
            gl !== null,
            'Failed to get WebGL context'
        );
    }

    // Test 12: Can query Firebase
    console.log('\n📊 Testing Firebase queries...');
    try {
        const deitySnapshot = await db.collection('deities').limit(1).get();
        test(
            'Can query deities collection',
            !deitySnapshot.empty,
            'deities collection is empty'
        );

        if (!deitySnapshot.empty) {
            const deity = deitySnapshot.docs[0].data();
            console.log(`   Sample deity: ${deity.name || deity.displayName}`);

            test(
                'Deity has required fields',
                deity.id && deity.name && deity.type,
                'Missing required fields: id, name, or type'
            );
        }
    } catch (error) {
        test(
            'Can query deities collection',
            false,
            error.message
        );
    }

    // Test 13: Can navigate
    console.log('\n🔀 Testing navigation...');
    if (window.EyesOfAzrael && window.EyesOfAzrael.navigation) {
        test(
            'Navigation has navigate method',
            typeof window.EyesOfAzrael.navigation.navigate === 'function',
            'navigate method not found'
        );

        test(
            'Navigation has parseRoute method',
            typeof window.EyesOfAzrael.navigation.parseRoute === 'function',
            'parseRoute method not found'
        );
    }

    // Test 14: Search functionality
    console.log('\n🔍 Testing search system...');
    if (window.EyesOfAzrael && window.EyesOfAzrael.search) {
        test(
            'Search has search method',
            typeof window.EyesOfAzrael.search.search === 'function',
            'search method not found'
        );

        try {
            const searchResults = await window.EyesOfAzrael.search.search('zeus', {
                mode: 'generic',
                limit: 5
            });

            test(
                'Generic search returns results',
                searchResults && searchResults.length > 0,
                'No results for "zeus"'
            );

            if (searchResults && searchResults.length > 0) {
                console.log(`   Found ${searchResults.length} results for "zeus"`);
            }
        } catch (error) {
            test(
                'Generic search works',
                false,
                error.message
            );
        }
    }

    // Test 15: Shader system
    console.log('\n🎨 Testing shader system...');
    if (window.EyesOfAzrael && window.EyesOfAzrael.shaders) {
        test(
            'Shader system has activateTheme method',
            typeof window.EyesOfAzrael.shaders.activateTheme === 'function',
            'activateTheme method not found'
        );

        test(
            'Shader system has themes defined',
            window.EyesOfAzrael.shaders.themes && Object.keys(window.EyesOfAzrael.shaders.themes).length > 0,
            'No themes defined'
        );

        if (window.EyesOfAzrael.shaders.themes) {
            const themeCount = Object.keys(window.EyesOfAzrael.shaders.themes).length;
            console.log(`   ${themeCount} themes available`);

            test(
                'Has all 10 required themes',
                themeCount >= 10,
                `Only ${themeCount} themes found, expected 10+`
            );
        }
    }

    // Test 16: Renderer system
    console.log('\n📄 Testing renderer system...');
    if (window.EyesOfAzrael && window.EyesOfAzrael.renderer) {
        test(
            'Renderer has renderEntity method',
            typeof window.EyesOfAzrael.renderer.renderEntity === 'function',
            'renderEntity method not found'
        );
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
    console.log('='.repeat(60));

    if (results.failed === 0) {
        console.log('\n🎉 All tests passed! System is ready.');
    } else {
        console.log('\n⚠️  Some tests failed. Review errors above.');
    }

    // Return results for programmatic access
    return results;
})();
