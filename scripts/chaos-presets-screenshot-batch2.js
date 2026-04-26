/**
 * Batch-2 screenshots — zoomed-out camera, wider accretion disk (presets F–J).
 *
 * node scripts/chaos-presets-screenshot-batch2.js
 */
const { chromium } = require('playwright');
const { spawn }    = require('child_process');
const path         = require('path');
const fs           = require('fs');

// ── Presets ────────────────────────────────────────────────────────────────────
// All widen DISK_OUTER (4.8–7.0) and pull camera back (CAM_Z 4.5–6.5)
// so the full spread of the accretion disk is visible.

const PRESETS = [
    {
        id: 'F', name: 'Grand_Spiral_Observatory',
        desc: 'Elevated wide view — full spiral arms visible as they curve outward. '
            + 'Camera pulled back to 5.0 units; disk extends to 5.5. '
            + 'Moderate turbulence lets the spiral structure read clearly.',
        params: {
            RS: 0.110, BEND_FORCE: 4.2, STEPS: 110,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 5.5, DISK_HEIGHT: 1.00,
            DISK_BRIGHT: 4.2, ISCO_RING: 7.0, TURBULENCE: 0.80, SPIRAL: 0.70,
            DOPPLER_STR: 3.8, OMEGA_SCALE: 0.40, ANIM_SPEED: 1.0,
            RING_BRIGHT: 5.5, RING_COLOR: 'vec3(0.52, 0.84, 1.72)',
            CAM_Y: 1.20, CAM_Z: 5.0, CAM_TILT: -0.240, FOV: 1.08,
            CAM_ORBIT_SPEED: 0.025, CAM_INCL_AMP: 0.50, CAM_INCL_FREQ: 0.017,
            STAR_BRIGHT: 1.2, NEBULA_MIX: 0.55, PURPLE_AMT: 0.40,
            TONEMAP_K: 0.52, GAMMA: 0.82,
        },
    },
    {
        id: 'G', name: 'Deep_Space_Abyss',
        desc: 'Maximum pull-back (6.5 units) — black hole floats in a rich star field '
            + 'and nebula. Wide disk (6.0) fills the mid-frame; dark outer edges '
            + 'contrast against the cosmic background.',
        params: {
            RS: 0.115, BEND_FORCE: 3.8, STEPS: 100,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 6.0, DISK_HEIGHT: 0.85,
            DISK_BRIGHT: 3.5, ISCO_RING: 5.5, TURBULENCE: 0.70, SPIRAL: 0.55,
            DOPPLER_STR: 3.2, OMEGA_SCALE: 0.36, ANIM_SPEED: 1.0,
            RING_BRIGHT: 5.0, RING_COLOR: 'vec3(0.50, 0.82, 1.68)',
            CAM_Y: 1.60, CAM_Z: 6.5, CAM_TILT: -0.246, FOV: 1.00,
            CAM_ORBIT_SPEED: 0.020, CAM_INCL_AMP: 0.55, CAM_INCL_FREQ: 0.013,
            STAR_BRIGHT: 1.8, NEBULA_MIX: 0.75, PURPLE_AMT: 0.60,
            TONEMAP_K: 0.60, GAMMA: 0.84,
        },
    },
    {
        id: 'H', name: 'Saturn_Ring_Formation',
        desc: 'Near-edge-on, very flat disk (height 0.30) extending to 6.5 units. '
            + 'Camera at CAM_Y=0.35 so the ring reads as a thin bright band across '
            + 'the frame — Saturn-ring geometry with relativistic Doppler crescent.',
        params: {
            RS: 0.120, BEND_FORCE: 5.0, STEPS: 120,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 6.5, DISK_HEIGHT: 0.30,
            DISK_BRIGHT: 5.0, ISCO_RING: 7.5, TURBULENCE: 0.60, SPIRAL: 0.35,
            DOPPLER_STR: 4.8, OMEGA_SCALE: 0.42, ANIM_SPEED: 1.0,
            RING_BRIGHT: 8.0, RING_COLOR: 'vec3(0.60, 0.90, 1.90)',
            CAM_Y: 0.35, CAM_Z: 5.5, CAM_TILT: -0.065, FOV: 1.12,
            CAM_ORBIT_SPEED: 0.022, CAM_INCL_AMP: 0.70, CAM_INCL_FREQ: 0.015,
            STAR_BRIGHT: 1.3, NEBULA_MIX: 0.40, PURPLE_AMT: 0.20,
            TONEMAP_K: 0.48, GAMMA: 0.80,
        },
    },
    {
        id: 'I', name: 'Tempest_Wide',
        desc: 'Slightly pulled back (4.5) with wide turbulent disk (4.8). '
            + 'Maximum turbulence + spiral so the full chaotic disk structure '
            + 'fills the frame — violent knots and shockfronts visible.',
        params: {
            RS: 0.110, BEND_FORCE: 4.6, STEPS: 110,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 4.8, DISK_HEIGHT: 1.15,
            DISK_BRIGHT: 5.5, ISCO_RING: 9.5, TURBULENCE: 1.00, SPIRAL: 0.75,
            DOPPLER_STR: 4.2, OMEGA_SCALE: 0.44, ANIM_SPEED: 1.0,
            RING_BRIGHT: 7.0, RING_COLOR: 'vec3(0.54, 0.86, 1.75)',
            CAM_Y: 0.85, CAM_Z: 4.5, CAM_TILT: -0.190, FOV: 1.18,
            CAM_ORBIT_SPEED: 0.030, CAM_INCL_AMP: 0.60, CAM_INCL_FREQ: 0.021,
            STAR_BRIGHT: 0.9, NEBULA_MIX: 0.40, PURPLE_AMT: 0.30,
            TONEMAP_K: 0.42, GAMMA: 0.80,
        },
    },
    {
        id: 'J', name: 'Galactic_Core_Overhead',
        desc: 'High elevated view (CAM_Y=1.80) with the widest disk (7.0 units). '
            + 'Looks down onto the full disk like observing a galaxy nucleus — '
            + 'rich spiral structure, clear dark shadow at center.',
        params: {
            RS: 0.105, BEND_FORCE: 3.6, STEPS: 100,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 7.0, DISK_HEIGHT: 0.95,
            DISK_BRIGHT: 3.0, ISCO_RING: 5.0, TURBULENCE: 0.90, SPIRAL: 0.65,
            DOPPLER_STR: 3.0, OMEGA_SCALE: 0.34, ANIM_SPEED: 1.0,
            RING_BRIGHT: 4.5, RING_COLOR: 'vec3(0.48, 0.80, 1.60)',
            CAM_Y: 1.80, CAM_Z: 5.5, CAM_TILT: -0.330, FOV: 0.98,
            CAM_ORBIT_SPEED: 0.018, CAM_INCL_AMP: 0.45, CAM_INCL_FREQ: 0.012,
            STAR_BRIGHT: 1.6, NEBULA_MIX: 0.70, PURPLE_AMT: 0.55,
            TONEMAP_K: 0.65, GAMMA: 0.85,
        },
    },
];

// ── Patch shader-sources.js ────────────────────────────────────────────────────

function patchShaderSource(src, p) {
    const pairs = [
        [/const float RS\s*=\s*[0-9.]+;/,           `const float RS          = ${p.RS.toFixed(4)};`],
        [/const float BEND_FORCE\s*=\s*[0-9.]+;/,   `const float BEND_FORCE  = ${p.BEND_FORCE.toFixed(2)};`],
        [/const int\s+STEPS\s*=\s*[0-9]+;/,         `const int   STEPS       = ${Math.round(p.STEPS)};`],
        [/const float DISK_INNER\s*=\s*[^;]+;/,     `const float DISK_INNER  = ${p.DISK_INNER};`],
        [/const float DISK_OUTER\s*=\s*[0-9.]+;/,   `const float DISK_OUTER  = ${p.DISK_OUTER.toFixed(2)};`],
        [/const float DISK_HEIGHT\s*=\s*[0-9.]+;/,  `const float DISK_HEIGHT = ${p.DISK_HEIGHT.toFixed(2)};`],
        [/const float DISK_BRIGHT\s*=\s*[0-9.]+;/,  `const float DISK_BRIGHT = ${p.DISK_BRIGHT.toFixed(2)};`],
        [/const float ISCO_RING\s*=\s*[0-9.]+;/,    `const float ISCO_RING   = ${p.ISCO_RING.toFixed(2)};`],
        [/const float TURBULENCE\s*=\s*[0-9.]+;/,   `const float TURBULENCE  = ${p.TURBULENCE.toFixed(2)};`],
        [/const float SPIRAL\s*=\s*[0-9.]+;/,       `const float SPIRAL      = ${p.SPIRAL.toFixed(2)};`],
        [/const float DOPPLER_STR\s*=\s*[0-9.]+;/,  `const float DOPPLER_STR = ${p.DOPPLER_STR.toFixed(2)};`],
        [/const float OMEGA_SCALE\s*=\s*[0-9.]+;/,  `const float OMEGA_SCALE = ${p.OMEGA_SCALE.toFixed(3)};`],
        [/const float ANIM_SPEED\s*=\s*[0-9.]+;/,   `const float ANIM_SPEED  = ${p.ANIM_SPEED.toFixed(2)};`],
        [/const float RING_BRIGHT\s*=\s*[0-9.]+;/,  `const float RING_BRIGHT = ${p.RING_BRIGHT.toFixed(2)};`],
        [/const vec3\s+RING_COLOR\s*=\s*vec3\([^)]+\);/, `const vec3  RING_COLOR  = ${p.RING_COLOR};`],
        [/const float CAM_Y\s*=\s*[0-9.]+;/,        `const float CAM_Y            = ${p.CAM_Y.toFixed(3)};`],
        [/const float CAM_Z\s*=\s*[0-9.]+;/,        `const float CAM_Z            = ${p.CAM_Z.toFixed(2)};`],
        [/const float CAM_TILT\s*=\s*-?[0-9.]+;/,   `const float CAM_TILT         = ${p.CAM_TILT.toFixed(4)};`],
        [/const float FOV\s*=\s*[0-9.]+;/,          `const float FOV              = ${p.FOV.toFixed(3)};`],
        [/const float CAM_ORBIT_SPEED\s*=\s*[0-9.]+;/, `const float CAM_ORBIT_SPEED  = ${p.CAM_ORBIT_SPEED.toFixed(4)};`],
        [/const float CAM_INCL_AMP\s*=\s*[0-9.]+;/,   `const float CAM_INCL_AMP     = ${p.CAM_INCL_AMP.toFixed(3)};`],
        [/const float CAM_INCL_FREQ\s*=\s*[0-9.]+;/,  `const float CAM_INCL_FREQ    = ${p.CAM_INCL_FREQ.toFixed(4)};`],
        [/const float STAR_BRIGHT\s*=\s*[0-9.]+;/,  `const float STAR_BRIGHT = ${p.STAR_BRIGHT.toFixed(2)};`],
        [/const float NEBULA_MIX\s*=\s*[0-9.]+;/,   `const float NEBULA_MIX  = ${p.NEBULA_MIX.toFixed(2)};`],
        [/const float PURPLE_AMT\s*=\s*[0-9.]+;/,   `const float PURPLE_AMT  = ${p.PURPLE_AMT.toFixed(2)};`],
        [/const float TONEMAP_K\s*=\s*[0-9.]+;/,    `const float TONEMAP_K   = ${p.TONEMAP_K.toFixed(3)};`],
        [/const float GAMMA\s*=\s*[0-9.]+;/,        `const float GAMMA       = ${p.GAMMA.toFixed(3)};`],
    ];
    let out = src;
    for (const [re, rep] of pairs) out = out.replace(re, rep);
    return out;
}

function waitForServer(port, retries = 25) {
    const http = require('http');
    return new Promise((resolve, reject) => {
        let n = 0;
        const try_ = () => {
            const req = http.get(`http://localhost:${port}/`, res => { res.resume(); resolve(); });
            req.on('error', () => { if (++n >= retries) return reject(new Error('Server timeout')); setTimeout(try_, 500); });
            req.end();
        };
        try_();
    });
}

async function run() {
    const shaderSourcePath = path.join(__dirname, '..', 'js', 'shaders', 'shader-sources.js');
    const originalShaderSource = fs.readFileSync(shaderSourcePath, 'utf8');
    const outDir = path.join(__dirname, '..', 'screenshots', 'presets');
    fs.mkdirSync(outDir, { recursive: true });

    const PORT = 3004;
    console.log(`[server] Starting dev server on port ${PORT}...`);
    const devServer = spawn('node', ['dev-server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: String(PORT) },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    devServer.stdout.on('data', d => process.stdout.write('[dev] ' + d));
    devServer.stderr.on('data', d => process.stderr.write('[dev] ' + d));

    await waitForServer(PORT);
    console.log('[server] Ready.\n');

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-web-security', '--disable-remote-fonts'],
    });

    for (const preset of PRESETS) {
        console.log(`[preset ${preset.id}] ${preset.name}`);
        const patched = patchShaderSource(originalShaderSource, preset.params);
        fs.writeFileSync(shaderSourcePath, patched, 'utf8');

        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        page.on('console', m => { if (m.type() === 'error') console.log(`  [err] ${m.text().slice(0, 120)}`); });

        await page.addInitScript(() => {
            localStorage.setItem('eoaplot-selected-theme', 'chaos');
            localStorage.setItem('eoaplot-shader-enabled', 'true');
        });

        await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(10000);

        const imgPath = path.join(outDir, `preset_${preset.id}_${preset.name}.png`);
        await page.screenshot({ path: imgPath, animations: 'disabled', timeout: 30000 });
        await page.close();

        const kb = (fs.statSync(imgPath).size / 1024).toFixed(0);
        console.log(`  Saved ${kb} KB → ${imgPath}\n`);

        // write JSON config
        fs.writeFileSync(
            path.join(outDir, `preset_${preset.id}_config.json`),
            JSON.stringify({ id: preset.id, name: preset.name, description: preset.desc, parameters: preset.params,
                screenshot: `preset_${preset.id}_${preset.name}.png` }, null, 2),
        );
    }

    await browser.close();
    devServer.kill();
    fs.writeFileSync(shaderSourcePath, originalShaderSource, 'utf8');
    console.log('Shader restored. Done.');
}

run().catch(e => { console.error(e); process.exit(1); });
