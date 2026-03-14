/**
 * Share Toolbar & Reading Progress
 *
 * Provides share buttons (copy link, Twitter/X, Facebook, Reddit)
 * and a reading progress bar at the top of entity pages.
 */

class ShareToolbar {
    constructor(container, entity) {
        this.container = container;
        this.entity = entity;
    }

    init() {
        this._renderShareButtons();
        this._renderReadingProgress();
    }

    _renderShareButtons() {
        const name = this.entity.name || this.entity.title || 'Entity';
        const url = window.location.href;
        const text = `${name} - Eyes of Azrael Mythology Encyclopedia`;

        const toolbar = document.createElement('div');
        toolbar.className = 'share-toolbar';
        toolbar.innerHTML = `
            <button class="share-btn share-btn-copy" title="Copy link" data-action="copy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
            </button>
            <button class="share-btn share-btn-x" title="Share on X" data-action="x">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
            </button>
            <button class="share-btn share-btn-reddit" title="Share on Reddit" data-action="reddit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
            </button>
        `;

        // Insert after hero section
        const hero = this.container.querySelector('.hero-section');
        if (hero) {
            hero.insertAdjacentElement('afterend', toolbar);
        }

        // Bind click handlers
        toolbar.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                if (action === 'copy') {
                    navigator.clipboard.writeText(url).then(() => {
                        btn.classList.add('copied');
                        btn.title = 'Copied!';
                        setTimeout(() => {
                            btn.classList.remove('copied');
                            btn.title = 'Copy link';
                        }, 2000);
                    });
                } else if (action === 'x') {
                    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=550,height=420');
                } else if (action === 'reddit') {
                    window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`, '_blank');
                }
            });
        });
    }

    _renderReadingProgress() {
        let bar = document.getElementById('reading-progress-bar');
        if (bar) return; // Already exists

        bar = document.createElement('div');
        bar.id = 'reading-progress-bar';
        bar.className = 'reading-progress-bar';
        bar.innerHTML = '<div class="reading-progress-fill" id="readingProgressFill"></div>';
        document.body.prepend(bar);

        const fill = document.getElementById('readingProgressFill');

        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
            fill.style.width = progress + '%';
        };

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }
}

window.ShareToolbar = ShareToolbar;
