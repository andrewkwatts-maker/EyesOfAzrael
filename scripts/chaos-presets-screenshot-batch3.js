/**
 * Batch-3 — H-variant refinements: soft Doppler gradient, wider disk, further camera.
 *
 * node scripts/chaos-presets-screenshot-batch3.js
 */
const { chromium } = require('playwright');
const { spawn }    = require('child_process');
const path         = require('path');
const fs           = require('fs');

// ── H-variant presets ─────────────────────────────────────────────────────────
// All share H's flat near-edge-on geometry. Key axis of variation:
//   DOPPLER_STR  4.8 → 2.0–2.8  (kills the white blowout on the RHS)
//   DISK_OUTER   6.5 → 7.0–9.5  (wider ring)
//   CAM_Z        5.5 → 5.5–9.0  (further pull-back on later variants)
//   DISK_BRIGHT  bumped slightly to compensate for lower Doppler average

const PRESETS = [
    {
        id: 'H1', name: 'H1_Balanced_Doppler',
        desc: 'Same distance as H, DOPPLER_STR dropped to 2.0. '
            + 'RHS glow stays warm orange rather than blowing to white; '
            + 'retrograde side stays dark red/maroon instead of black.',
        params: {
            RS: 0.120, BEND_FORCE: 5.0, STEPS: 120,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 7.0, DISK_HEIGHT: 0.30,
            DISK_BRIGHT: 6.0, ISCO_RING: 7.5, TURBULENCE: 0.60, SPIRAL: 0.35,
            DOPPLER_STR: 2.0, OMEGA_SCALE: 0.42, ANIM_SPEED: 1.0,
            RING_BRIGHT: 8.0, RING_COLOR: 'vec3(0.60, 0.90, 1.90)',
            CAM_Y: 0.30, CAM_Z: 5.5, CAM_TILT: -0.058, FOV: 1.12,
            CAM_ORBIT_SPEED: 0.022, CAM_INCL_AMP: 0.70, CAM_INCL_FREQ: 0.015,
            STAR_BRIGHT: 1.3, NEBULA_MIX: 0.45, PURPLE_AMT: 0.22,
            TONEMAP_K: 0.52, GAMMA: 0.81,
        },
    },
    {
        id: 'H2', name: 'H2_Wide_Soft_Arc',
        desc: 'Pulled back to 6.5, disk widened to 7.5. DOPPLER_STR 2.2 '
            + '— gentle prograde brightening, ring reads as a full smooth arc '
            + 'rather than a bright crescent with a dark half.',
        params: {
            RS: 0.120, BEND_FORCE: 5.0, STEPS: 120,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 7.5, DISK_HEIGHT: 0.28,
            DISK_BRIGHT: 5.8, ISCO_RING: 7.0, TURBULENCE: 0.60, SPIRAL: 0.35,
            DOPPLER_STR: 2.2, OMEGA_SCALE: 0.42, ANIM_SPEED: 1.0,
            RING_BRIGHT: 7.5, RING_COLOR: 'vec3(0.58, 0.88, 1.85)',
            CAM_Y: 0.32, CAM_Z: 6.5, CAM_TILT: -0.052, FOV: 1.10,
            CAM_ORBIT_SPEED: 0.020, CAM_INCL_AMP: 0.68, CAM_INCL_FREQ: 0.015,
            STAR_BRIGHT: 1.4, NEBULA_MIX: 0.50, PURPLE_AMT: 0.28,
            TONEMAP_K: 0.52, GAMMA: 0.81,
        },
    },
    {
        id: 'H3', name: 'H3_Deep_Space_Ring',
        desc: 'Camera at 7.5, DISK_OUTER 8.0. DOPPLER_STR 2.5 — still visible '
            + 'left/right warmth gradient, never clips. Star field + nebula '
            + 'visible in the wide dark area around the thin ring.',
        params: {
            RS: 0.120, BEND_FORCE: 5.0, STEPS: 120,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 8.0, DISK_HEIGHT: 0.30,
            DISK_BRIGHT: 5.5, ISCO_RING: 7.0, TURBULENCE: 0.58, SPIRAL: 0.32,
            DOPPLER_STR: 2.5, OMEGA_SCALE: 0.40, ANIM_SPEED: 1.0,
            RING_BRIGHT: 7.0, RING_COLOR: 'vec3(0.57, 0.87, 1.82)',
            CAM_Y: 0.30, CAM_Z: 7.5, CAM_TILT: -0.043, FOV: 1.08,
            CAM_ORBIT_SPEED: 0.018, CAM_INCL_AMP: 0.68, CAM_INCL_FREQ: 0.013,
            STAR_BRIGHT: 1.6, NEBULA_MIX: 0.65, PURPLE_AMT: 0.40,
            TONEMAP_K: 0.55, GAMMA: 0.82,
        },
    },
    {
        id: 'H4', name: 'H4_Grand_Horizon',
        desc: 'Maximum pull-back (9.0), widest ring (9.5). DOPPLER_STR 2.0 — '
            + 'very subtle left/right gradient. Ring is a slim luminous thread '
            + 'against deep space. Rich star field dominates the frame.',
        params: {
            RS: 0.120, BEND_FORCE: 5.0, STEPS: 120,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 9.5, DISK_HEIGHT: 0.28,
            DISK_BRIGHT: 5.0, ISCO_RING: 6.5, TURBULENCE: 0.55, SPIRAL: 0.30,
            DOPPLER_STR: 2.0, OMEGA_SCALE: 0.38, ANIM_SPEED: 1.0,
            RING_BRIGHT: 7.0, RING_COLOR: 'vec3(0.55, 0.85, 1.78)',
            CAM_Y: 0.25, CAM_Z: 9.0, CAM_TILT: -0.030, FOV: 1.06,
            CAM_ORBIT_SPEED: 0.016, CAM_INCL_AMP: 0.65, CAM_INCL_FREQ: 0.011,
            STAR_BRIGHT: 1.8, NEBULA_MIX: 0.70, PURPLE_AMT: 0.50,
            TONEMAP_K: 0.58, GAMMA: 0.83,
        },
    },
    {
        id: 'H5', name: 'H5_Moderate_Far',
        desc: 'Camera 7.0, DISK_OUTER 8.5. DOPPLER_STR 2.8 — noticeable '
            + 'warm-to-cool gradient L→R but TONEMAP_K 0.55 prevents clipping. '
            + 'Best of both: visible asymmetry without any white blowout.',
        params: {
            RS: 0.120, BEND_FORCE: 5.0, STEPS: 120,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 8.5, DISK_HEIGHT: 0.30,
            DISK_BRIGHT: 5.5, ISCO_RING: 7.5, TURBULENCE: 0.62, SPIRAL: 0.35,
            DOPPLER_STR: 2.8, OMEGA_SCALE: 0.42, ANIM_SPEED: 1.0,
            RING_BRIGHT: 7.5, RING_COLOR: 'vec3(0.60, 0.90, 1.90)',
            CAM_Y: 0.32, CAM_Z: 7.0, CAM_TILT: -0.048, FOV: 1.10,
            CAM_ORBIT_SPEED: 0.020, CAM_INCL_AMP: 0.70, CAM_INCL_FREQ: 0.014,
            STAR_BRIGHT: 1.5, NEBULA_MIX: 0.55, PURPLE_AMT: 0.32,
            TONEMAP_K: 0.55, GAMMA: 0.82,
        },
    },
];

// ── Patch ─────────────────────────────────────────────────────────────────────

function patchShaderSource(src, p) {
    const pairs = [
        [/const float RS\s*=\s*[0-9.]+;/,              `const float RS          = ${p.RS.toFixed(4)};`],
        [/const float BEND_FORCE\s*=\s*[0-9.]+;/,      `const float BEND_FORCE  = ${p.BEND_FORCE.toFixed(2)};`],
        [/const int\s+STEPS\s*=\s*[0-9]+;/,            `const int   STEPS       = ${Math.round(p.STEPS)};`],
        [/const float DISK_INNER\s*=\s*[^;]+;/,        `const float DISK_INNER  = ${p.DISK_INNER};`],
        [/const float DISK_OUTER\s*=\s*[0-9.]+;/,      `const float DISK_OUTER  = ${p.DISK_OUTER.toFixed(2)};`],
        [/const float DISK_HEIGHT\s*=\s*[0-9.]+;/,     `const float DISK_HEIGHT = ${p.DISK_HEIGHT.toFixed(2)};`],
        [/const float DISK_BRIGHT\s*=\s*[0-9.]+;/,     `const float DISK_BRIGHT = ${p.DISK_BRIGHT.toFixed(2)};`],
        [/const float ISCO_RING\s*=\s*[0-9.]+;/,       `const float ISCO_RING   = ${p.ISCO_RING.toFixed(2)};`],
        [/const float TURBULENCE\s*=\s*[0-9.]+;/,      `const float TURBULENCE  = ${p.TURBULENCE.toFixed(2)};`],
        [/const float SPIRAL\s*=\s*[0-9.]+;/,          `const float SPIRAL      = ${p.SPIRAL.toFixed(2)};`],
        [/const float DOPPLER_STR\s*=\s*[0-9.]+;/,     `const float DOPPLER_STR = ${p.DOPPLER_STR.toFixed(2)};`],
        [/const float OMEGA_SCALE\s*=\s*[0-9.]+;/,     `const float OMEGA_SCALE = ${p.OMEGA_SCALE.toFixed(3)};`],
        [/const float ANIM_SPEED\s*=\s*[0-9.]+;/,      `const float ANIM_SPEED  = ${p.ANIM_SPEED.toFixed(2)};`],
        [/const float RING_BRIGHT\s*=\s*[0-9.]+;/,     `const float RING_BRIGHT = ${p.RING_BRIGHT.toFixed(2)};`],
        [/const vec3\s+RING_COLOR\s*=\s*vec3\([^)]+\);/, `const vec3  RING_COLOR  = ${p.RING_COLOR};`],
        [/const float CAM_Y\s*=\s*[0-9.]+;/,           `const float CAM_Y            = ${p.CAM_Y.toFixed(3)};`],
        [/const float CAM_Z\s*=\s*[0-9.]+;/,           `const float CAM_Z            = ${p.CAM_Z.toFixed(2)};`],
        [/const float CAM_TILT\s*=\s*-?[0-9.]+;/,      `const float CAM_TILT         = ${p.CAM_TILT.toFixed(4)};`],
        [/const float FOV\s*=\s*[0-9.]+;/,             `const float FOV              = ${p.FOV.toFixed(3)};`],
        [/const float CAM_ORBIT_SPEED\s*=\s*[0-9.]+;/, `const float CAM_ORBIT_SPEED  = ${p.CAM_ORBIT_SPEED.toFixed(4)};`],
        [/const float CAM_INCL_AMP\s*=\s*[0-9.]+;/,    `const float CAM_INCL_AMP     = ${p.CAM_INCL_AMP.toFixed(3)};`],
        [/const float CAM_INCL_FREQ\s*=\s*[0-9.]+;/,   `const float CAM_INCL_FREQ    = ${p.CAM_INCL_FREQ.toFixed(4)};`],
        [/const float STAR_BRIGHT\s*=\s*[0-9.]+;/,     `const float STAR_BRIGHT = ${p.STAR_BRIGHT.toFixed(2)};`],
        [/const float NEBULA_MIX\s*=\s*[0-9.]+;/,      `const float NEBULA_MIX  = ${p.NEBULA_MIX.toFixed(2)};`],
        [/const float PURPLE_AMT\s*=\s*[0-9.]+;/,      `const float PURPLE_AMT  = ${p.PURPLE_AMT.toFixed(2)};`],
        [/const float TONEMAP_K\s*=\s*[0-9.]+;/,       `const float TONEMAP_K   = ${p.TONEMAP_K.toFixed(3)};`],
        [/const float GAMMA\s*=\s*[0-9.]+;/,           `const float GAMMA       = ${p.GAMMA.toFixed(3)};`],
    ];
    let out = src;
    for (const [re, rep] of pairs) out = out.replace(re, rep);
    return out;
}

function waitForServer(port, retries = 25) {
    const http = require('http');
    return new Promise((resolve, reject) => {
        let n = 0;
        const t = () => {
            const req = http.get(`http://localhost:${port}/`, res => { res.resume(); resolve(); });
            req.on('error', () => { if (++n >= retries) return reject(new Error('timeout')); setTimeout(t, 500); });
            req.end();
        };
        t();
    });
}

async function run() {
    const shaderSourcePath = path.join(__dirname, '..', 'js', 'shaders', 'shader-sources.js');
    const orig = fs.readFileSync(shaderSourcePath, 'utf8');
    const outDir = path.join(__dirname, '..', 'screenshots', 'presets');
    fs.mkdirSync(outDir, { recursive: true });

    const PORT = 3005;
    console.log(`[server] Starting on port ${PORT}...`);
    const srv = spawn('node', ['dev-server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: String(PORT) },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    srv.stdout.on('data', d => process.stdout.write('[dev] ' + d));
    srv.stderr.on('data', d => process.stderr.write('[dev] ' + d));
    await waitForServer(PORT);
    console.log('[server] Ready.\n');

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-web-security', '--disable-remote-fonts'],
    });

    for (const preset of PRESETS) {
        console.log(`[${preset.id}] ${preset.name}`);
        fs.writeFileSync(shaderSourcePath, patchShaderSource(orig, preset.params), 'utf8');

        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        await page.addInitScript(() => {
            localStorage.setItem('eoaplot-selected-theme', 'chaos');
            localStorage.setItem('eoaplot-shader-enabled', 'true');
        });
        await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(10000);

        const imgPath = path.join(outDir, `preset_${preset.id}_${preset.name}.png`);
        await page.screenshot({ path: imgPath, animations: 'disabled', timeout: 60000 });
        await page.close();

        fs.writeFileSync(
            path.join(outDir, `preset_${preset.id}_config.json`),
            JSON.stringify({ id: preset.id, name: preset.name, description: preset.desc, parameters: preset.params,
                screenshot: `preset_${preset.id}_${preset.name}.png` }, null, 2),
        );
        console.log(`  ${(fs.statSync(imgPath).size / 1024).toFixed(0)} KB\n`);
    }

    await browser.close();
    srv.kill();
    fs.writeFileSync(shaderSourcePath, orig, 'utf8');
    console.log('Done.');
}

run().catch(e => { console.error(e); process.exit(1); });
