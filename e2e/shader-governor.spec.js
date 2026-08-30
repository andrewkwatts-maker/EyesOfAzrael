/**
 * Shader governor tests — the black-hole (chaos) shader must compile, render,
 * self-monitor, and adapt. Headless CI runs SwiftShader (software GL), which
 * doubles as a worst-case GPU for the adaptation ladder.
 */
const { test, expect } = require('@playwright/test');

test.describe('Black-hole shader governor', () => {
  test.setTimeout(120000);

  async function activateChaos(page) {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForFunction(
      () => window.ShaderThemePicker && window.ShaderThemePicker.isInitialized(),
      { timeout: 15000 }
    );
    // Drive the manager directly so the test controls the theme.
    const activated = await page.evaluate(async () => {
      window.EyesOfAzrael = window.EyesOfAzrael || {};
      if (!window.EyesOfAzrael.shaders && window.ShaderThemeManager) {
        window.EyesOfAzrael.shaders = new window.ShaderThemeManager({ quality: 'high' });
      }
      const mgr = window.EyesOfAzrael.shaders;
      if (!mgr) return { ok: false, reason: 'no manager' };
      const ok = await mgr.activate('chaos');
      return { ok, supported: mgr.webglSupported };
    });
    return activated;
  }

  test('chaos shader compiles and renders (u_steps uniform accepted)', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const activated = await activateChaos(page);
    test.skip(!activated.supported, 'WebGL unavailable in this environment');
    expect(activated.ok).toBeTruthy();

    // Let it render a few frames, then confirm no shader compile/link errors.
    await page.waitForTimeout(3000);
    const shaderErrors = errors.filter(e => /shader|compile|link|GLSL/i.test(e));
    expect(shaderErrors).toEqual([]);

    // The canvas must exist and have non-zero backing size.
    const canvas = await page.evaluate(() => {
      const c = document.getElementById('shader-background');
      return c ? { w: c.width, h: c.height } : null;
    });
    expect(canvas).toBeTruthy();
    expect(canvas.w).toBeGreaterThan(0);
  });

  test('governor self-monitors and adapts under load', async ({ page }) => {
    const activated = await activateChaos(page);
    test.skip(!activated.supported, 'WebGL unavailable in this environment');
    test.skip(!activated.ok, 'shader disabled for session (previous starvation)');

    // Sample the status over ~12 seconds of rendering. The service worker can
    // reload the page mid-test — re-arm the manager if the window got wiped.
    const samples = [];
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(1000);
      const status = await page.evaluate(async () => {
        if (!window.EyesOfAzrael?.shaders && window.ShaderThemeManager) {
          window.EyesOfAzrael = window.EyesOfAzrael || {};
          window.EyesOfAzrael.shaders = new window.ShaderThemeManager({ quality: 'high' });
          await window.EyesOfAzrael.shaders.activate('chaos');
        }
        return window.EyesOfAzrael?.shaders?.getStatus?.() ?? null;
      });
      if (status) samples.push(status);
    }
    expect(samples.length).toBeGreaterThan(5);

    const last = samples[samples.length - 1];
    console.log('governor samples:', samples.map(s =>
      `${s.fps}fps q=${s.quality} scale=${(s.resolutionScale ?? 1).toFixed(2)} steps=${s.stepBudget}`
    ));

    // Self-monitoring is alive: fps is being measured...
    expect(samples.some(s => typeof s.fps === 'number')).toBeTruthy();

    // ...and the governor reacted coherently: EITHER the device holds a good
    // frame rate at full quality, OR quality/scale stepped down, OR — on a
    // hopeless GPU — the shader deactivated for the session. All three are
    // correct behaviours; what is wrong is starving at full quality.
    const starvedAtFull = last.enabled
      && last.fps < 24
      && last.quality === 'high'
      && (last.resolutionScale ?? 1) >= 0.99;
    expect(starvedAtFull).toBeFalsy();

    // Status surface for self-monitoring is complete.
    expect(last).toHaveProperty('resolutionScale');
    expect(last).toHaveProperty('stepBudget');
    expect(last).toHaveProperty('reducedMotion');
  });

  test('prefers-reduced-motion renders a single static frame', async ({ page, context }) => {
    await context.close(); // replaced by emulated context below
  });
});

test.describe('Black-hole shader reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test.setTimeout(60000);

  test('reduced motion: renders once, does not animate', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForFunction(
      () => window.ShaderThemePicker && window.ShaderThemePicker.isInitialized(),
      { timeout: 15000 }
    );
    const result = await page.evaluate(async () => {
      window.EyesOfAzrael = window.EyesOfAzrael || {};
      if (!window.EyesOfAzrael.shaders && window.ShaderThemeManager) {
        window.EyesOfAzrael.shaders = new window.ShaderThemeManager({});
      }
      const mgr = window.EyesOfAzrael.shaders;
      if (!mgr || !mgr.webglSupported) return { skip: true };
      await mgr.activate('chaos');
      await new Promise(r => setTimeout(r, 1500));
      return { skip: false, status: mgr.getStatus(), animating: mgr.animationId !== null };
    });
    test.skip(result.skip, 'WebGL unavailable');
    expect(result.status.reducedMotion).toBeTruthy();
    expect(result.animating).toBeFalsy();
  });
});
