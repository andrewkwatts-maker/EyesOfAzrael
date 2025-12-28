const SimpleThemeToggle = require('./js/simple-theme-toggle.js');

// Mock setup
const mockStyle = {
    setProperty: function(prop, value) {
        console.log(`Setting: ${prop} = ${value}`);
    }
};

document.documentElement.style = mockStyle;
document.body.innerHTML = '<button id="themeToggle"></button>';

const instance = new SimpleThemeToggle();
console.log('\n=== After init ===');
instance.applyTheme('day');
console.log('\n=== After applyTheme ===');
