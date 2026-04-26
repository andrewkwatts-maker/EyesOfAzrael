/**
 * Screenshots 5 chaos shader presets by:
 *   1. Starting the local dev server (port 3000)
 *   2. For each preset, intercepting shader-sources.js and patching the control constants
 *   3. Navigating to the chaos-theme home page and screenshotting
 *
 * node scripts/chaos-presets-screenshot.js
 */
const { chromium } = require('playwright');
const { spawn }    = require('child_process');
const path         = require('path');
const fs           = require('fs');

// ── Presets ────────────────────────────────────────────────────────────────

const PRESETS = [
    {
        id: 'A', name: 'Interstellar Classic',
        desc: 'Refined tilted view — warm tones, moderate lensing, visible ISCO ring',
        params: {
            RS: 0.115, BEND_FORCE: 4.2, STEPS: 120,
            DISK_INNER: 'RS * 2.0', DISK_OUTER: 3.2, DISK_HEIGHT: 0.75,
            DISK_BRIGHT: 4.5, ISCO_RING: 6.0, TURBULENCE: 0.85, SPIRAL: 0.30,
            DOPPLER_STR: 3.2, OMEGA_SCALE: 0.38, ANIM_SPEED: 1.0,
            RING_BRIGHT: 5.5, RING_COLOR: 'vec3(0.50, 0.82, 1.65)',
            CAM_Y: 0.55, CAM_Z: 3.2, CAM_TILT: -0.165, FOV: 1.20,
            STAR_BRIGHT: 1.2, NEBULA_MIX: 0.50, PURPLE_AMT: 0.35,
            TONEMAP_K: 0.52, GAMMA: 0.82,
        },
    },
    {
        id: 'B', name: 'Edge-On Drama',
        desc: 'Nearly edge-on — extreme Einstein ring, cinematic dark framing',
        params: {
            RS: 0.120, BEND_FORCE: 5.8, STEPS: 120,
            DISK_INNER: 'RS * 2.0', DISK_OUTER: 3.6, DISK_HEIGHT: 0.55,
            DISK_BRIGHT: 5.0, ISCO_RING: 7.5, TURBULENCE: 0.70, SPIRAL: 0.20,
            DOPPLER_STR: 4.0, OMEGA_SCALE: 0.42, ANIM_SPEED: 1.0,
            RING_BRIGHT: 9.0, RING_COLOR: 'vec3(0.60, 0.90, 2.00)',
            CAM_Y: 0.18, CAM_Z: 4.0, CAM_TILT: -0.045, FOV: 1.10,
            STAR_BRIGHT: 1.5, NEBULA_MIX: 0.40, PURPLE_AMT: 0.25,
            TONEMAP_K: 0.48, GAMMA: 0.78,
        },
    },
    {
        id: 'C', name: 'Wide Field Cosmic',
        desc: 'High camera — full disk ellipse visible, rich nebula and star field',
        params: {
            RS: 0.105, BEND_FORCE: 3.8, STEPS: 120,
            DISK_INNER: 'RS * 2.0', DISK_OUTER: 4.2, DISK_HEIGHT: 1.1,
            DISK_BRIGHT: 3.8, ISCO_RING: 4.5, TURBULENCE: 1.0, SPIRAL: 0.45,
            DOPPLER_STR: 2.8, OMEGA_SCALE: 0.34, ANIM_SPEED: 1.0,
            RING_BRIGHT: 4.0, RING_COLOR: 'vec3(0.45, 0.78, 1.50)',
            CAM_Y: 1.30, CAM_Z: 4.8, CAM_TILT: -0.270, FOV: 1.05,
            STAR_BRIGHT: 1.8, NEBULA_MIX: 0.70, PURPLE_AMT: 0.55,
            TONEMAP_K: 0.58, GAMMA: 0.84,
        },
    },
    {
        id: 'D', name: 'Plasma Storm',
        desc: 'Violent turbulence — blazing ISCO, strong spiral arms, Doppler contrast',
        params: {
            RS: 0.130, BEND_FORCE: 4.5, STEPS: 120,
            DISK_INNER: 'RS * 2.0', DISK_OUTER: 3.0, DISK_HEIGHT: 0.80,
            DISK_BRIGHT: 6.5, ISCO_RING: 10.0, TURBULENCE: 1.0, SPIRAL: 0.60,
            DOPPLER_STR: 4.5, OMEGA_SCALE: 0.44, ANIM_SPEED: 1.0,
            RING_BRIGHT: 7.0, RING_COLOR: 'vec3(0.55, 0.88, 1.80)',
            CAM_Y: 0.60, CAM_Z: 3.0, CAM_TILT: -0.190, FOV: 1.25,
            STAR_BRIGHT: 0.9, NEBULA_MIX: 0.35, PURPLE_AMT: 0.20,
            TONEMAP_K: 0.42, GAMMA: 0.80,
        },
    },
    {
        id: 'E', name: 'Clean Minimal',
        desc: 'Low turbulence — smooth concentric bands, serene deep-space feel',
        params: {
            RS: 0.100, BEND_FORCE: 3.5, STEPS: 120,
            DISK_INNER: 'RS * 2.0', DISK_OUTER: 3.8, DISK_HEIGHT: 0.60,
            DISK_BRIGHT: 3.2, ISCO_RING: 4.0, TURBULENCE: 0.30, SPIRAL: 0.10,
            DOPPLER_STR: 2.4, OMEGA_SCALE: 0.32, ANIM_SPEED: 1.0,
            RING_BRIGHT: 4.5, RING_COLOR: 'vec3(0.40, 0.75, 1.55)',
            CAM_Y: 0.70, CAM_Z: 3.8, CAM_TILT: -0.200, FOV: 1.15,
            STAR_BRIGHT: 1.6, NEBULA_MIX: 0.65, PURPLE_AMT: 0.50,
            TONEMAP_K: 0.65, GAMMA: 0.86,
        },
    },
];

// ── Patch the shader-sources.js content with new control constants ──────────

function patchShaderSource(originalContent, params) {
    // Find the chaos shader entry and replace the control block constants
    // The constants are at the top of the GLSL, escaped as \r\n in JS string
    const p = params;

    const replacements = [
        [/const float RS\s*=\s*[0-9.]+;/, `const float RS          = ${p.RS.toFixed(4)};`],
        [/const float BEND_FORCE\s*=\s*[0-9.]+;/, `const float BEND_FORCE  = ${p.BEND_FORCE.toFixed(2)};`],
        [/const int\s+STEPS\s*=\s*[0-9]+;/, `const int   STEPS       = ${Math.round(p.STEPS)};`],
        [/const float DISK_INNER\s*=\s*[^;]+;/, `const float DISK_INNER  = ${p.DISK_INNER};`],
        [/const float DISK_OUTER\s*=\s*[0-9.]+;/, `const float DISK_OUTER  = ${p.DISK_OUTER.toFixed(2)};`],
        [/const float DISK_HEIGHT\s*=\s*[0-9.]+;/, `const float DISK_HEIGHT = ${p.DISK_HEIGHT.toFixed(2)};`],
        [/const float DISK_BRIGHT\s*=\s*[0-9.]+;/, `const float DISK_BRIGHT = ${p.DISK_BRIGHT.toFixed(2)};`],
        [/const float ISCO_RING\s*=\s*[0-9.]+;/, `const float ISCO_RING   = ${p.ISCO_RING.toFixed(2)};`],
        [/const float TURBULENCE\s*=\s*[0-9.]+;/, `const float TURBULENCE  = ${p.TURBULENCE.toFixed(2)};`],
        [/const float SPIRAL\s*=\s*[0-9.]+;/, `const float SPIRAL      = ${p.SPIRAL.toFixed(2)};`],
        [/const float DOPPLER_STR\s*=\s*[0-9.]+;/, `const float DOPPLER_STR = ${p.DOPPLER_STR.toFixed(2)};`],
        [/const float OMEGA_SCALE\s*=\s*[0-9.]+;/, `const float OMEGA_SCALE = ${p.OMEGA_SCALE.toFixed(3)};`],
        [/const float ANIM_SPEED\s*=\s*[0-9.]+;/, `const float ANIM_SPEED  = ${p.ANIM_SPEED.toFixed(2)};`],
        [/const float RING_BRIGHT\s*=\s*[0-9.]+;/, `const float RING_BRIGHT = ${p.RING_BRIGHT.toFixed(2)};`],
        [/const vec3\s+RING_COLOR\s*=\s*vec3\([^)]+\);/, `const vec3  RING_COLOR  = ${p.RING_COLOR};`],
        [/const float CAM_Y\s*=\s*[0-9.]+;/, `const float CAM_Y       = ${p.CAM_Y.toFixed(3)};`],
        [/const float CAM_Z\s*=\s*[0-9.]+;/, `const float CAM_Z       = ${p.CAM_Z.toFixed(2)};`],
        [/const float CAM_TILT\s*=\s*-?[0-9.]+;/, `const float CAM_TILT    = ${p.CAM_TILT.toFixed(4)};`],
        [/const float FOV\s*=\s*[0-9.]+;/, `const float FOV         = ${p.FOV.toFixed(3)};`],
        [/const float STAR_BRIGHT\s*=\s*[0-9.]+;/, `const float STAR_BRIGHT = ${p.STAR_BRIGHT.toFixed(2)};`],
        [/const float NEBULA_MIX\s*=\s*[0-9.]+;/, `const float NEBULA_MIX  = ${p.NEBULA_MIX.toFixed(2)};`],
        [/const float PURPLE_AMT\s*=\s*[0-9.]+;/, `const float PURPLE_AMT  = ${p.PURPLE_AMT.toFixed(2)};`],
        [/const float TONEMAP_K\s*=\s*[0-9.]+;/, `const float TONEMAP_K   = ${p.TONEMAP_K.toFixed(3)};`],
        [/const float GAMMA\s*=\s*[0-9.]+;/, `const float GAMMA       = ${p.GAMMA.toFixed(3)};`],
    ];

    let patched = originalContent;
    for (const [re, replacement] of replacements) {
        patched = patched.replace(re, replacement);
    }
    return patched;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function waitForServer(port, retries = 20) {
    const http = require('http');
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const tryConnect = () => {
            const req = http.get(`http://localhost:${port}/`, res => {
                res.resume();
                resolve();
            });
            req.on('error', () => {
                if (++attempts >= retries) return reject(new Error('Server never started'));
                setTimeout(tryConnect, 500);
            });
            req.end();
        };
        tryConnect();
    });
}

// ── Main ───────────────────────────────────────────────────────────────────

async function run() {
    const shaderSourcePath = path.join(__dirname, '..', 'js', 'shaders', 'shader-sources.js');
    const originalShaderSource = fs.readFileSync(shaderSourcePath, 'utf8');

    const outDir = path.join(__dirname, '..', 'screenshots', 'presets');
    fs.mkdirSync(outDir, { recursive: true });

    // Start dev server
    console.log('[server] Starting dev server on port 3001...');
    const devServer = spawn('node', ['dev-server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: '3001' },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    devServer.stdout.on('data', d => process.stdout.write('[dev] ' + d));
    devServer.stderr.on('data', d => process.stderr.write('[dev-err] ' + d));

    await waitForServer(3001);
    console.log('[server] Dev server ready.\n');

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

    for (const preset of PRESETS) {
        console.log(`[preset ${preset.id}] ${preset.name}`);

        // Write patched shader-sources.js to disk so dev server serves it
        const patched = patchShaderSource(originalShaderSource, preset.params);
        fs.writeFileSync(shaderSourcePath, patched, 'utf8');

        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

        page.on('console', msg => {
            if (msg.type() === 'error') console.log(`  [js-err] ${msg.text().substring(0, 120)}`);
        });

        // Pre-set chaos theme
        await page.addInitScript(() => {
            localStorage.setItem('eoaplot-selected-theme', 'chaos');
            localStorage.setItem('eoaplot-shader-enabled', 'true');
        });

        await page.goto('http://localhost:3001', {
            waitUntil: 'domcontentloaded', timeout: 20000,
        }).catch(() => {});

        // Wait for content + shader to render
        await page.waitForTimeout(9000);

        const imgPath = path.join(outDir, `preset_${preset.id}_${preset.name.replace(/\s+/g, '_')}.png`);
        await page.screenshot({ path: imgPath, animations: 'disabled', timeout: 20000 });
        await page.close();
        console.log(`  Saved: ${imgPath}\n`);
    }

    await browser.close();
    devServer.kill();

    // Restore original shader
    fs.writeFileSync(shaderSourcePath, originalShaderSource, 'utf8');
    console.log('Shader source restored. All done.');
}

run().catch(e => { console.error(e); process.exit(1); });
