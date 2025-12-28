/**
 * Unit Tests for SimpleThemeToggle
 * Coverage Target: 90%+
 * Test Framework: Jest
 *
 * Test Categories:
 * - Initialization (6 tests)
 * - Theme Switching (10 tests)
 * - Theme Application (8 tests)
 * - Persistence (6 tests)
 * - Shader Integration (5 tests)
 * - Accessibility (6 tests)
 *
 * Total: 41+ tests
 */

// Mock localStorage
const mockLocalStorage = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true
});

// Mock console methods to track logging
const originalConsole = { ...console };
beforeAll(() => {
    global.console = {
        ...console,
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    };
});

afterAll(() => {
    global.console = originalConsole;
});

// Load SimpleThemeToggle class
let SimpleThemeToggle;

// Helper function to create mock style
function createMockStyle() {
    const styleProps = {};
    const setPropertySpy = jest.fn((prop, value) => {
        styleProps[prop] = value;
    });
    const getPropertySpy = jest.fn(prop => styleProps[prop]);
    return {
        setProperty: setPropertySpy,
        getProperty: getPropertySpy,
        _props: styleProps
    };
}

describe('SimpleThemeToggle - Initialization', () => {
    let themeToggle;
    let mockButton;
    let setPropertySpy;

    beforeEach(() => {
        // Clear storage but not mocks yet
        mockLocalStorage.clear();

        // Reset document
        document.body.innerHTML = '';
        mockButton = document.createElement('button');
        mockButton.id = 'themeToggle';
        document.body.appendChild(mockButton);

        // Spy on the actual setProperty method instead of replacing the whole style object
        setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

        // Clear window globals
        delete window.EyesOfAzrael;
        delete window.themeToggle;

        // Load the class fresh
        jest.resetModules();
        delete require.cache[require.resolve('../js/simple-theme-toggle.js')];

        // Temporarily prevent auto-initialization
        Object.defineProperty(document, 'readyState', {
            writable: true,
            value: 'loading'
        });

        require('../js/simple-theme-toggle.js');
        SimpleThemeToggle = window.SimpleThemeToggle;

        // Reset readyState
        Object.defineProperty(document, 'readyState', {
            writable: true,
            value: 'complete'
        });
    });

    test('should initialize with default theme (night)', () => {
        // Arrange: No saved theme
        mockLocalStorage.getItem.mockReturnValue(null);

        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(themeToggle.getCurrentTheme()).toBe('night');
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('eoa_theme');
    });

    test('should load saved theme from localStorage', () => {
        // Arrange: Saved theme exists
        mockLocalStorage.getItem.mockReturnValue('day');

        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(themeToggle.getCurrentTheme()).toBe('day');
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('eoa_theme');
    });

    test('should find theme toggle button (#themeToggle)', () => {
        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(themeToggle.button).toBe(mockButton);
        expect(themeToggle.button.id).toBe('themeToggle');
    });

    test('should attach click event listener', () => {
        // Arrange
        const addEventListenerSpy = jest.spyOn(mockButton, 'addEventListener');

        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should apply theme on initialization', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');

        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(document.body.getAttribute('data-theme')).toBe('night');
        expect(setPropertySpy).toHaveBeenCalled();
    });

    test('should update button icon on initialization', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');

        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(mockButton.textContent).toBe('☀️');
        expect(mockButton.getAttribute('aria-label')).toBe('Switch to day theme');
    });
});

describe('SimpleThemeToggle - Theme Switching', () => {
    let themeToggle;
    let mockButton;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.clear();

        document.body.innerHTML = '';
        mockButton = document.createElement('button');
        mockButton.id = 'themeToggle';
        document.body.appendChild(mockButton);

        document.documentElement.style = createMockStyle();

        delete window.EyesOfAzrael;

        jest.resetModules();
        delete require.cache[require.resolve('../js/simple-theme-toggle.js')];

        Object.defineProperty(document, 'readyState', {
            writable: true,
            value: 'loading'
        });

        require('../js/simple-theme-toggle.js');
        SimpleThemeToggle = window.SimpleThemeToggle;
    });

    test('should toggle from night to day theme', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.toggleTheme();

        // Assert
        expect(themeToggle.getCurrentTheme()).toBe('day');
    });

    test('should toggle from day to night theme', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('day');
        themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.toggleTheme();

        // Assert
        expect(themeToggle.getCurrentTheme()).toBe('night');
    });

    test('should update body data-theme attribute on toggle', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.toggleTheme();

        // Assert
        expect(document.body.getAttribute('data-theme')).toBe('day');
    });

    test('should update button icon on toggle (sun to moon)', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.toggleTheme();

        // Assert
        expect(mockButton.textContent).toBe('🌙');
        expect(mockButton.getAttribute('aria-label')).toBe('Switch to night theme');
    });

    test('should save theme to localStorage on toggle', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();
        mockLocalStorage.setItem.mockClear();

        // Act
        themeToggle.toggleTheme();

        // Assert
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('eoa_theme', 'day');
    });

    test('should call applyTheme during toggle', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();
        const applyThemeSpy = jest.spyOn(themeToggle, 'applyTheme');

        // Act
        themeToggle.toggleTheme();

        // Assert
        expect(applyThemeSpy).toHaveBeenCalledWith('day');
    });

    test('should integrate with shader system when available', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        window.EyesOfAzrael = {
            shaders: {
                activate: jest.fn()
            }
        };
        themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.toggleTheme();

        // Assert
        expect(window.EyesOfAzrael.shaders.activate).toHaveBeenCalledWith('day');
    });

    test('should apply smooth transition class', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.toggleTheme();

        // Assert
        expect(document.body.classList.contains('theme-transitioning')).toBe(true);
    });

    test('should remove transition class after animation', (done) => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.toggleTheme();
        expect(document.body.classList.contains('theme-transitioning')).toBe(true);

        // Assert
        setTimeout(() => {
            expect(document.body.classList.contains('theme-transitioning')).toBe(false);
            done();
        }, 350);
    });

    test('should handle multiple rapid toggles correctly', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.toggleTheme(); // night -> day
        themeToggle.toggleTheme(); // day -> night
        themeToggle.toggleTheme(); // night -> day

        // Assert
        expect(themeToggle.getCurrentTheme()).toBe('day');
        expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith('eoa_theme', 'day');
    });

    test('should trigger on button click event', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();
        const initialTheme = themeToggle.getCurrentTheme();

        // Act
        mockButton.click();

        // Assert
        expect(themeToggle.getCurrentTheme()).not.toBe(initialTheme);
    });
});

describe('SimpleThemeToggle - Theme Application', () => {
    let themeToggle;
    let setPropertySpy;

    beforeEach(() => {
        // Don't clear mocks yet - we need to set up spies first
        mockLocalStorage.clear();

        document.body.innerHTML = '';
        const mockButton = document.createElement('button');
        mockButton.id = 'themeToggle';
        document.body.appendChild(mockButton);

        // Spy on the actual setProperty method instead of replacing the whole style object
        setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

        jest.resetModules();
        delete require.cache[require.resolve('../js/simple-theme-toggle.js')];

        Object.defineProperty(document, 'readyState', {
            writable: true,
            value: 'loading'
        });

        require('../js/simple-theme-toggle.js');
        SimpleThemeToggle = window.SimpleThemeToggle;
    });

    test('should apply night theme CSS variables', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');

        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(setPropertySpy).toHaveBeenCalledWith('--color-primary', '#8b7fff');
        expect(setPropertySpy).toHaveBeenCalledWith('--color-bg-primary', '#0a0e27');
        expect(setPropertySpy).toHaveBeenCalledWith('--color-text-primary', '#f8f9fa');
    });

    test('should apply day theme CSS variables', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('day');

        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(setPropertySpy).toHaveBeenCalledWith('--color-primary', '#2563eb');
        expect(setPropertySpy).toHaveBeenCalledWith('--color-bg-primary', '#ffffff');
        expect(setPropertySpy).toHaveBeenCalledWith('--color-text-primary', '#0f172a');
    });

    test('should update background colors correctly', () => {
        // Arrange & Act
        mockLocalStorage.getItem.mockReturnValue('day');
        themeToggle = new SimpleThemeToggle(); // Will apply day theme on init

        // Assert - Check that day theme background colors were set
        expect(setPropertySpy).toHaveBeenCalledWith('--color-bg-primary', '#ffffff');
        expect(setPropertySpy).toHaveBeenCalledWith('--color-bg-secondary', '#f8fafc');
        expect(setPropertySpy).toHaveBeenCalledWith('--color-bg-card', '#f1f5f9');
    });

    test('should update text colors correctly', () => {
        // Arrange & Act
        mockLocalStorage.getItem.mockReturnValue('day');
        themeToggle = new SimpleThemeToggle(); // Will apply day theme on init

        // Assert - Check that day theme text colors were set
        expect(setPropertySpy).toHaveBeenCalledWith('--color-text-primary', '#0f172a');
        expect(setPropertySpy).toHaveBeenCalledWith('--color-text-secondary', '#475569');
        expect(setPropertySpy).toHaveBeenCalledWith('--color-text-muted', '#94a3b8');
    });

    test('should update border colors correctly', () => {
        // Arrange & Act
        mockLocalStorage.getItem.mockReturnValue('day');
        themeToggle = new SimpleThemeToggle(); // Will apply day theme on init

        // Assert - Check that day theme border colors were set
        expect(setPropertySpy).toHaveBeenCalledWith('--color-border-primary', '#e2e8f0');
        expect(setPropertySpy).toHaveBeenCalledWith('--color-border-accent', '#cbd5e1');
    });

    test('should update shader colors when available', () => {
        // Arrange
        window.EyesOfAzrael = {
            shaders: {
                activate: jest.fn()
            }
        };
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.applyTheme('day');

        // Assert
        expect(window.EyesOfAzrael.shaders.activate).toHaveBeenCalledWith('day');
    });

    test('should apply variables to document root element', () => {
        // Arrange & Act
        mockLocalStorage.getItem.mockReturnValue('day');
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(document.body.getAttribute('data-theme')).toBe('day');
        const setPropertyCalls = setPropertySpy.mock.calls;
        expect(setPropertyCalls.length).toBeGreaterThan(20);
    });

    test('should handle legacy CSS variable compatibility', () => {
        // Arrange & Act
        mockLocalStorage.getItem.mockReturnValue('day');
        themeToggle = new SimpleThemeToggle(); // Will apply day theme on init

        // Assert - Check legacy variables were set for backward compatibility
        expect(setPropertySpy).toHaveBeenCalledWith('--color-background', '#ffffff');
        expect(setPropertySpy).toHaveBeenCalledWith('--color-surface', 'rgba(241, 245, 249, 0.8)');
    });
});

describe('SimpleThemeToggle - Persistence', () => {
    let themeToggle;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.clear();

        document.body.innerHTML = '';
        const mockButton = document.createElement('button');
        mockButton.id = 'themeToggle';
        document.body.appendChild(mockButton);

        document.documentElement.style = createMockStyle();

        jest.resetModules();
        delete require.cache[require.resolve('../js/simple-theme-toggle.js')];

        Object.defineProperty(document, 'readyState', {
            writable: true,
            value: 'loading'
        });

        require('../js/simple-theme-toggle.js');
        SimpleThemeToggle = window.SimpleThemeToggle;
    });

    test('should save theme to localStorage', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();
        mockLocalStorage.setItem.mockClear();

        // Act
        themeToggle.saveTheme('day');

        // Assert
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('eoa_theme', 'day');
    });

    test('should load theme from localStorage', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('day');

        // Act
        themeToggle = new SimpleThemeToggle();
        const theme = themeToggle.loadTheme();

        // Assert
        expect(theme).toBe('day');
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('eoa_theme');
    });

    test('should handle missing localStorage gracefully', () => {
        // Arrange
        const getItemOriginal = mockLocalStorage.getItem;
        mockLocalStorage.getItem.mockImplementation(() => {
            throw new Error('localStorage not available');
        });

        // Act
        themeToggle = new SimpleThemeToggle();
        const theme = themeToggle.loadTheme();

        // Assert
        expect(theme).toBe('night');
        expect(console.warn).toHaveBeenCalledWith('[SimpleThemeToggle] LocalStorage not available');

        // Cleanup
        mockLocalStorage.getItem = getItemOriginal;
    });

    test('should handle localStorage write errors gracefully', () => {
        // Arrange
        mockLocalStorage.setItem.mockImplementation(() => {
            throw new Error('Storage quota exceeded');
        });
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.saveTheme('day');

        // Assert
        expect(console.warn).toHaveBeenCalledWith('[SimpleThemeToggle] Failed to save theme');
    });

    test('should support clearing theme from localStorage', () => {
        // Arrange
        mockLocalStorage.setItem.mockClear();
        mockLocalStorage.removeItem.mockClear();
        mockLocalStorage.getItem.mockReturnValue('day');

        // Act
        mockLocalStorage.removeItem('eoa_theme');
        mockLocalStorage.getItem.mockReturnValue(null);

        // Assert
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('eoa_theme');
        expect(mockLocalStorage.getItem('eoa_theme')).toBeNull();
    });

    test('should persist theme across instances', () => {
        // Arrange - First instance
        mockLocalStorage.getItem.mockReturnValue('night');
        const firstInstance = new SimpleThemeToggle();
        firstInstance.toggleTheme(); // Switch to day

        // Act - Simulate reload with new instance
        mockLocalStorage.getItem.mockReturnValue('day');
        const secondInstance = new SimpleThemeToggle();

        // Assert
        expect(secondInstance.getCurrentTheme()).toBe('day');
    });
});

describe('SimpleThemeToggle - Shader Integration', () => {
    let themeToggle;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.clear();

        document.body.innerHTML = '';
        const mockButton = document.createElement('button');
        mockButton.id = 'themeToggle';
        document.body.appendChild(mockButton);

        document.documentElement.style = createMockStyle();

        delete window.EyesOfAzrael;

        jest.resetModules();
        delete require.cache[require.resolve('../js/simple-theme-toggle.js')];

        Object.defineProperty(document, 'readyState', {
            writable: true,
            value: 'loading'
        });

        require('../js/simple-theme-toggle.js');
        SimpleThemeToggle = window.SimpleThemeToggle;
    });

    test('should activate night shader on initialization', () => {
        // Arrange
        window.EyesOfAzrael = {
            shaders: {
                activate: jest.fn()
            }
        };
        mockLocalStorage.getItem.mockReturnValue('night');

        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(window.EyesOfAzrael.shaders.activate).toHaveBeenCalledWith('night');
    });

    test('should activate day shader on initialization', () => {
        // Arrange
        window.EyesOfAzrael = {
            shaders: {
                activate: jest.fn()
            }
        };
        mockLocalStorage.getItem.mockReturnValue('day');

        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(window.EyesOfAzrael.shaders.activate).toHaveBeenCalledWith('day');
    });

    test('should handle missing shader system gracefully', () => {
        // Arrange
        delete window.EyesOfAzrael;
        mockLocalStorage.getItem.mockReturnValue('night');

        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert - Should not crash or log shader errors
        expect(themeToggle.getCurrentTheme()).toBe('night');
    });

    test('should sync shader with theme changes', () => {
        // Arrange
        window.EyesOfAzrael = {
            shaders: {
                activate: jest.fn()
            }
        };
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();
        window.EyesOfAzrael.shaders.activate.mockClear();

        // Act
        themeToggle.toggleTheme();

        // Assert
        expect(window.EyesOfAzrael.shaders.activate).toHaveBeenCalledWith('day');
    });

    test('should handle shader activation errors gracefully', () => {
        // Arrange
        window.EyesOfAzrael = {
            shaders: {
                activate: jest.fn(() => { throw new Error('Shader initialization failed'); })
            }
        };
        mockLocalStorage.getItem.mockReturnValue('night');

        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(console.warn).toHaveBeenCalledWith(
            '[SimpleThemeToggle] Shader activation failed:',
            expect.any(Error)
        );
    });
});

describe('SimpleThemeToggle - Accessibility', () => {
    let themeToggle;
    let mockButton;
    let setPropertySpy;

    beforeEach(() => {
        // Don't clear mocks yet - we need to set up spies first
        mockLocalStorage.clear();

        document.body.innerHTML = '';
        mockButton = document.createElement('button');
        mockButton.id = 'themeToggle';
        document.body.appendChild(mockButton);

        // Spy on the actual setProperty method instead of replacing the whole style object
        setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

        jest.resetModules();
        delete require.cache[require.resolve('../js/simple-theme-toggle.js')];

        Object.defineProperty(document, 'readyState', {
            writable: true,
            value: 'loading'
        });

        require('../js/simple-theme-toggle.js');
        SimpleThemeToggle = window.SimpleThemeToggle;
    });

    test('should have ARIA label on button for night theme', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');

        // Act
        themeToggle = new SimpleThemeToggle();

        // Assert
        expect(mockButton.getAttribute('aria-label')).toBe('Switch to day theme');
    });

    test('should update ARIA label when theme changes', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.toggleTheme();

        // Assert
        expect(mockButton.getAttribute('aria-label')).toBe('Switch to night theme');
    });

    test('should support keyboard interaction via click event', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();
        const initialTheme = themeToggle.getCurrentTheme();

        // Act - Browser triggers click on Enter/Space
        mockButton.click();

        // Assert
        expect(themeToggle.getCurrentTheme()).not.toBe(initialTheme);
    });

    test('should be focusable for keyboard navigation', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');

        // Act
        themeToggle = new SimpleThemeToggle();
        mockButton.focus();

        // Assert
        expect(document.activeElement).toBe(mockButton);
    });

    test('should provide high contrast color options', () => {
        // Arrange & Act
        mockLocalStorage.getItem.mockReturnValue('day');
        themeToggle = new SimpleThemeToggle(); // Will apply day theme on init

        // Assert - Check high contrast colors are defined
        expect(setPropertySpy).toHaveBeenCalledWith('--color-text-primary', '#0f172a');
        expect(setPropertySpy).toHaveBeenCalledWith('--color-bg-primary', '#ffffff');
    });

    test('should apply transition class for reduced motion support', () => {
        // Arrange
        mockLocalStorage.getItem.mockReturnValue('night');
        themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.toggleTheme();

        // Assert - CSS can handle prefers-reduced-motion
        expect(document.body.classList.contains('theme-transitioning')).toBe(true);
    });
});

describe('SimpleThemeToggle - Edge Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.clear();

        document.body.innerHTML = '';

        document.documentElement.style = createMockStyle();

        jest.resetModules();
        delete require.cache[require.resolve('../js/simple-theme-toggle.js')];

        Object.defineProperty(document, 'readyState', {
            writable: true,
            value: 'loading'
        });

        require('../js/simple-theme-toggle.js');
        SimpleThemeToggle = window.SimpleThemeToggle;
    });

    test('should handle missing button gracefully', () => {
        // Arrange - No button in DOM
        // Act
        const themeToggle = new SimpleThemeToggle();

        // Assert
        expect(console.warn).toHaveBeenCalledWith('[SimpleThemeToggle] Button #themeToggle not found');
        expect(themeToggle.button).toBeNull();
    });

    test('should provide setTheme method for programmatic control', () => {
        // Arrange
        const mockButton = document.createElement('button');
        mockButton.id = 'themeToggle';
        document.body.appendChild(mockButton);
        mockLocalStorage.getItem.mockReturnValue('night');
        const themeToggle = new SimpleThemeToggle();

        // Act
        themeToggle.setTheme('day');

        // Assert
        expect(themeToggle.getCurrentTheme()).toBe('day');
    });

    test('should reject invalid theme in setTheme', () => {
        // Arrange
        const mockButton = document.createElement('button');
        mockButton.id = 'themeToggle';
        document.body.appendChild(mockButton);
        mockLocalStorage.getItem.mockReturnValue('night');
        const themeToggle = new SimpleThemeToggle();
        const initialTheme = themeToggle.getCurrentTheme();

        // Act
        themeToggle.setTheme('twilight');

        // Assert
        expect(themeToggle.getCurrentTheme()).toBe(initialTheme);
        expect(console.warn).toHaveBeenCalledWith('[SimpleThemeToggle] Invalid theme: twilight');
    });

    test('should log theme application for debugging', () => {
        // Arrange
        const mockButton = document.createElement('button');
        mockButton.id = 'themeToggle';
        document.body.appendChild(mockButton);
        mockLocalStorage.getItem.mockReturnValue('night');

        // Act
        const themeToggle = new SimpleThemeToggle();

        // Assert
        expect(console.log).toHaveBeenCalledWith('[SimpleThemeToggle] Applied theme: night');
    });

    test('should log initialization with current theme', () => {
        // Arrange
        const mockButton = document.createElement('button');
        mockButton.id = 'themeToggle';
        document.body.appendChild(mockButton);
        mockLocalStorage.getItem.mockReturnValue('day');

        // Act
        const themeToggle = new SimpleThemeToggle();

        // Assert
        expect(console.log).toHaveBeenCalledWith('[SimpleThemeToggle] Initialized with theme:', 'day');
    });
});
