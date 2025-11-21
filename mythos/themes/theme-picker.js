// Theme Picker for World Mythos Explorer

(function() {
  'use strict';

  // Initialize theme picker
  function initThemePicker() {
    const container = document.getElementById('theme-picker-container');

    if (!container) {
      return;
    }

    // Create theme picker HTML
    const themePicker = document.createElement('div');
    themePicker.className = 'theme-picker';
    themePicker.innerHTML = `
      <button id="theme-toggle" class="theme-toggle" title="Toggle theme">
        <span class="theme-icon">🌙</span>
      </button>
    `;

    container.appendChild(themePicker);

    // Add theme picker styles
    const style = document.createElement('style');
    style.textContent = `
      .theme-picker {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
      }

      .theme-toggle {
        background: rgba(30, 41, 59, 0.9);
        border: 2px solid var(--color-primary);
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .theme-toggle:hover {
        background: var(--color-primary);
        transform: scale(1.1) rotate(15deg);
        box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
      }

      .theme-icon {
        font-size: 1.5rem;
        line-height: 1;
      }

      @media (max-width: 768px) {
        .theme-picker {
          top: 0.5rem;
          right: 0.5rem;
        }

        .theme-toggle {
          width: 40px;
          height: 40px;
        }

        .theme-icon {
          font-size: 1.25rem;
        }
      }
    `;
    document.head.appendChild(style);

    // Theme toggle functionality
    const toggleButton = document.getElementById('theme-toggle');
    const themeIcon = toggleButton.querySelector('.theme-icon');

    // Get saved theme or default to dark
    let currentTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(currentTheme);

    toggleButton.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
      localStorage.setItem('theme', currentTheme);
    });

    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemePicker);
  } else {
    initThemePicker();
  }
})();
