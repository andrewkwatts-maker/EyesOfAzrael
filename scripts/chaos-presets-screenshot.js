/**
 * Screenshots 5 chaos shader presets.
 * Starts dev server, patches shader-sources.js for each preset, screenshots, restores.
 *
 * node scripts/chaos-presets-screenshot.js
 */
const { chromium } = require('playwright');
const { spawn }    = require('child_process');
const path         = require('path');
const fs           = require('fs');

// ── Physically-grounded presets ───────────────────────────────────────────────
// All presets use DISK_INNER = RS * 3.0 (Schwarzschild ISCO) except Kerr
// which uses RS * 1.5 (Kerr near-maximal ISCO is much closer to the horizon).

const PRESETS = [
    {
        id: 'A', name: 'Sagittarius_A_Star',
        desc: 'Our galaxy\'s black hole — quiescent state, warm orange glow. '
            + 'Slow orbit + moderate inclination wobble reveals the shadow from '
            + 'multiple angles like a probe in a wide stable orbit.',
        params: {
            RS: 0.115, BEND_FORCE: 4.2, STEPS: 110,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 3.6, DISK_HEIGHT: 0.70,
            DISK_BRIGHT: 3.8, ISCO_RING: 5.0, TURBULENCE: 0.75, SPIRAL: 0.25,
            DOPPLER_STR: 3.5, OMEGA_SCALE: 0.38, ANIM_SPEED: 1.0,
            RING_BRIGHT: 5.5, RING_COLOR: 'vec3(0.55, 0.85, 1.70)',
            CAM_Y: 0.55, CAM_Z: 3.6, CAM_TILT: -0.155, FOV: 1.20,
            CAM_ORBIT_SPEED: 0.025, CAM_INCL_AMP: 0.45, CAM_INCL_FREQ: 0.017,
            STAR_BRIGHT: 1.4, NEBULA_MIX: 0.55, PURPLE_AMT: 0.40,
            TONEMAP_K: 0.58, GAMMA: 0.82,
        },
    },
    {
        id: 'B', name: 'M87_Star_EHT_Portrait',
        desc: 'Inspired by the EHT image — low-inclination view, bright crescent '
            + 'from relativistic Doppler boost. Gentle inclination wobble sweeps '
            + 'the viewing angle through the famous shadow geometry.',
        params: {
            RS: 0.130, BEND_FORCE: 4.8, STEPS: 110,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 3.2, DISK_HEIGHT: 0.55,
            DISK_BRIGHT: 4.5, ISCO_RING: 6.5, TURBULENCE: 0.60, SPIRAL: 0.15,
            DOPPLER_STR: 4.5, OMEGA_SCALE: 0.40, ANIM_SPEED: 1.0,
            RING_BRIGHT: 7.5, RING_COLOR: 'vec3(0.60, 0.88, 1.80)',
            CAM_Y: 0.25, CAM_Z: 4.2, CAM_TILT: -0.060, FOV: 1.10,
            CAM_ORBIT_SPEED: 0.018, CAM_INCL_AMP: 0.55, CAM_INCL_FREQ: 0.011,
            STAR_BRIGHT: 1.2, NEBULA_MIX: 0.30, PURPLE_AMT: 0.15,
            TONEMAP_K: 0.50, GAMMA: 0.80,
        },
    },
    {
        id: 'C', name: 'Kerr_Maximal_Spin',
        desc: 'Near-maximally spinning Kerr BH — ISCO collapses to RS*1.5, '
            + 'extreme Doppler asymmetry. Tilted inclined orbit exaggerates '
            + 'the frame-dragging asymmetry as the camera passes over the poles.',
        params: {
            RS: 0.120, BEND_FORCE: 5.2, STEPS: 120,
            DISK_INNER: 'RS * 1.5', DISK_OUTER: 3.0, DISK_HEIGHT: 0.65,
            DISK_BRIGHT: 5.5, ISCO_RING: 8.5, TURBULENCE: 0.90, SPIRAL: 0.40,
            DOPPLER_STR: 5.5, OMEGA_SCALE: 0.48, ANIM_SPEED: 1.0,
            RING_BRIGHT: 8.0, RING_COLOR: 'vec3(0.65, 0.90, 2.00)',
            CAM_Y: 0.50, CAM_Z: 3.4, CAM_TILT: -0.148, FOV: 1.15,
            CAM_ORBIT_SPEED: 0.030, CAM_INCL_AMP: 0.70, CAM_INCL_FREQ: 0.019,
            STAR_BRIGHT: 1.0, NEBULA_MIX: 0.30, PURPLE_AMT: 0.20,
            TONEMAP_K: 0.44, GAMMA: 0.80,
        },
    },
    {
        id: 'D', name: 'ADAF_Thick_Disk',
        desc: 'Advection-dominated accretion flow — radiatively inefficient, '
            + 'puffy hot gas corona. Slow inclined wobble lets you watch the '
            + 'diffuse disk change shape from face-on to edge-on.',
        params: {
            RS: 0.105, BEND_FORCE: 3.8, STEPS: 100,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 4.5, DISK_HEIGHT: 1.40,
            DISK_BRIGHT: 2.8, ISCO_RING: 2.5, TURBULENCE: 1.00, SPIRAL: 0.55,
            DOPPLER_STR: 2.5, OMEGA_SCALE: 0.32, ANIM_SPEED: 1.0,
            RING_BRIGHT: 3.5, RING_COLOR: 'vec3(0.45, 0.75, 1.55)',
            CAM_Y: 0.90, CAM_Z: 4.5, CAM_TILT: -0.200, FOV: 1.05,
            CAM_ORBIT_SPEED: 0.020, CAM_INCL_AMP: 0.60, CAM_INCL_FREQ: 0.013,
            STAR_BRIGHT: 2.0, NEBULA_MIX: 0.80, PURPLE_AMT: 0.65,
            TONEMAP_K: 0.70, GAMMA: 0.86,
        },
    },
    {
        id: 'E', name: 'Tidal_Disruption_Event',
        desc: 'Star eaten by BH — dense clumpy debris stream, hot chaotic flares. '
            + 'Faster inclined orbit gives the spaceship-in-chaos feel as the '
            + 'camera dives through the debris plane.',
        params: {
            RS: 0.110, BEND_FORCE: 4.4, STEPS: 110,
            DISK_INNER: 'RS * 3.0', DISK_OUTER: 3.4, DISK_HEIGHT: 0.90,
            DISK_BRIGHT: 6.0, ISCO_RING: 9.0, TURBULENCE: 1.00, SPIRAL: 0.65,
            DOPPLER_STR: 4.0, OMEGA_SCALE: 0.42, ANIM_SPEED: 1.0,
            RING_BRIGHT: 6.5, RING_COLOR: 'vec3(0.52, 0.84, 1.72)',
            CAM_Y: 0.60, CAM_Z: 3.3, CAM_TILT: -0.182, FOV: 1.22,
            CAM_ORBIT_SPEED: 0.035, CAM_INCL_AMP: 0.65, CAM_INCL_FREQ: 0.023,
            STAR_BRIGHT: 0.8, NEBULA_MIX: 0.35, PURPLE_AMT: 0.25,
            TONEMAP_K: 0.40, GAMMA: 0.79,
        },
    },
];

// ── Patch shader-sources.js with preset constants ─────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────────

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

// ── Main ───────────────────────────────────────────────────────────────────────

async function run() {
    const shaderSourcePath = path.join(__dirname, '..', 'js', 'shaders', 'shader-sources.js');
    const originalShaderSource = fs.readFileSync(shaderSourcePath, 'utf8');

    const outDir = path.join(__dirname, '..', 'screenshots', 'presets');
    fs.mkdirSync(outDir, { recursive: true });

    const PORT = 3003;
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
        args: [
            '--no-sandbox',
            '--disable-web-security',
            '--disable-remote-fonts',
        ],
    });

    for (const preset of PRESETS) {
        console.log(`[preset ${preset.id}] ${preset.name}`);

        const patched = patchShaderSource(originalShaderSource, preset.params);
        fs.writeFileSync(shaderSourcePath, patched, 'utf8');

        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        page.on('console', m => { if (m.type() === 'error') console.log(`  [js-err] ${m.text().slice(0, 120)}`); });

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
    }

    await browser.close();
    devServer.kill();

    fs.writeFileSync(shaderSourcePath, originalShaderSource, 'utf8');
    console.log('Shader source restored. Done.');
}

run().catch(e => { console.error(e); process.exit(1); });
