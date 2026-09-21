# Footer contrast, verified by compositing (not by trusting axe)

`js/shaders/shader-themes.js` paints a full-viewport, animated WebGL canvas
behind the page. `css/shader-backgrounds.css` makes `body`, `.view-container`
and `.site-footer` `background: transparent !important` while a shader is
active, so the canvas shows through. axe-core cannot read canvas pixels — it
walks the DOM for an opaque `background-color` and, finding none, assumes
white. That is wrong in both directions: it flags light text on a dark theme
as a false failure (assumed white behind it, when the real canvas is
near-black), and it lets a real failure through if a bright patch of the
animated shader passes behind text axe already waved through.

`scripts/verify-contrast-composited.js` verifies the footer (the one
Firebase-independent, theme-exposed region with real copy) by driving a real
Chromium through every featured theme via `window.ShaderThemePicker`,
screenshotting the actual composited pixels, and computing WCAG contrast
between each text node's real computed colour and the real painted pixel
behind it — sampled across several frames, since the shader is animated and
a single frame only proves the ratio at that instant.

## Confirmed bug, fixed

`.site-footer .footer-section-link` and `.site-footer .footer-social-link`
(`css/navigation-polish.css`) — the entire footer sitemap (Home, Explore,
Mythologies, Deities, ... about twenty links) and the social icon row — were
rendering in **pure black or pure white text, not the theme's own colour, on
every theme**.

Root cause: `css/accessibility.css` has `.site-footer a { color: inherit; }`
at specificity `(0,1,1)` — one class plus the `a` type selector. The intended
styling, `.footer-section-link { color: var(--color-text-secondary); }`, is
`(0,1,0)` — one class alone. `(0,1,1)` beats `(0,1,0)` regardless of source
order, so the link always fell back to `color: inherit`, which resolves to
`<body>`'s own colour. And body's colour is driven by a *third*, unrelated
system: `accessibility.css`'s `@media (prefers-color-scheme: dark/light)`
blocks set `--text-high-contrast` to white or black based on the **visitor's
OS preference**, completely independent of which in-app theme (Night,
Cosmic, Fire, ...) they picked with the theme button.

Net effect: any visitor whose OS prefers light mode — an extremely ordinary,
unremarkable setting — got literal `rgb(0,0,0)` footer links on top of the
app's own default **Night** theme's near-black canvas. Composited contrast
ratio ≈1.1:1 against a 4.5:1 WCAG AA requirement. A visitor whose OS prefers
dark mode got the opposite failure on light themes. Confirmed and measured
before/after across all six featured themes with `colorScheme: 'light'`
emulation; after the fix, every sitemap and social link measured 4.5:1 or
better (typically 7-14:1) on every theme.

**Fix**: qualified both selectors with `.site-footer` to raise their
specificity to `(0,2,0)`, which wins. Two lines changed, `css/bundle.css`
rebuilt. No other footer link class was affected — `.footer-links a`
(the About/Privacy/Terms row) already wins its own specificity tie against
`.site-footer a` because it is `(0,1,1)` too and `navigation-polish.css` is
later in the bundle than `accessibility.css`. The same `color: inherit` rule
also applies to `.site-header a`, but the header's own background is opaque
and theme-independent, so black-on-white there was never actually a contrast
problem — left alone.

## Reported, not auto-fixed: accent colours near the shader's bright zones

Several elements use a theme's *accent* colour (`--color-primary` — the
brand-purple/orange/teal/red swatch, not the dedicated `--color-text-*`
tokens) directly as text or icon fill on the raw canvas:
`.footer-logo-icon`, and the second line of the "Stay Updated" heading.
These intermittently or consistently measured below AA on Sacred, Golden,
Ocean and Fire:

- `.footer-logo-icon` (uses `--color-primary`): failed on Sacred (1.47:1),
  Golden (3.9:1), Ocean (2.28:1), Fire (1.73:1) — passed comfortably on
  Night and Cosmic.
- Fire theme's accent red (`#dc2626`) on its own near-black canvas patch
  measured as low as 1.68:1 in the worst sampled frame, and 3.93-4.07:1 in
  calmer frames — under the 4.5:1 requirement even at its best observed
  frame.

These are a different kind of problem from the bug above: not a CSS
specificity accident, but a genuine risk in using a *brand accent* colour —
chosen for saturation and recognisability, not contrast — as body text or
icon fill directly over an animated background whose own bright highlights
can be similarly saturated and mid-luminance. The dedicated
`--color-text-primary` / `--color-text-secondary` tokens were evidently
chosen at the luminance extremes specifically to survive this; the accent
tokens were not designed for that job and probably shouldn't be asked to do
it without a backing panel. Left for a person to decide (swap the icon/text
to a text-token colour, or give it an opaque backing chip) rather than
auto-fixed, since changing `--color-primary`'s usage is a design call with
knock-on effects wherever else that class or theme swatch is reused, not a
one-rule bug.

## Verify it yourself

```
npm run dev            # or: PORT=8080 node dev-server.js
node scripts/verify-contrast-composited.js
```

Sandboxes with no GPU fall back to software WebGL and can occasionally
sample a stray all-white frame during a theme switch (background that
doesn't resemble the theme's palette at all) — see the script's own header
comment for how to tell that apart from a real finding.
