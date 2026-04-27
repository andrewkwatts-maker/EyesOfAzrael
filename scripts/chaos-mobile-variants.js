#!/usr/bin/env node
/**
 * Generate 10 mobile chaos shader variants, screenshot each, and save the
 * configs + screenshots so the user can pick the best one.
 *
 *   node scripts/chaos-mobile-variants.js
 *
 * Outputs to: variants/mobile-VV.png and variants/mobile-VV.json
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SHADER_FILE = 'js/shaders/shader-sources.js';
const OUT_DIR = 'variants';

// ── 10 mobile variants — vary camera distance, height, roll, orbit pattern ─
// orbit: 'planar' | 'wobble' | 'inclined' | 'figure8'
const VARIANTS = [
    { name: '01_distant_low',       camZ: 8.5, camY: 0.55, fov: 0.85, roll: 0.00, scOff: [0.0,  0.0],  orbit: 'planar',   discOuter: 6.5 },
    { name: '02_far_high_tilt',     camZ: 9.5, camY: 1.40, fov: 0.75, roll: 0.18, scOff: [-0.15, 0.0], orbit: 'inclined', discOuter: 7.0 },
    { name: '03_close_dramatic',    camZ: 4.5, camY: 0.30, fov: 1.10, roll: -0.22,scOff: [0.20, -0.10], orbit: 'wobble',   discOuter: 6.0 },
    { name: '04_overhead_tilt',     camZ: 7.0, camY: 2.40, fov: 0.90, roll: 0.30, scOff: [0.0,   0.15], orbit: 'inclined', discOuter: 6.5 },
    { name: '05_below_disk',        camZ: 7.5, camY: -1.20,fov: 0.95, roll: -0.10,scOff: [-0.10,-0.20], orbit: 'wobble',   discOuter: 6.5 },
    { name: '06_offcenter_skew',    camZ: 6.5, camY: 0.80, fov: 1.00, roll: -0.40,scOff: [0.30,  0.20], orbit: 'planar',   discOuter: 7.0 },
    { name: '07_figure8_orbit',     camZ: 7.5, camY: 1.00, fov: 0.92, roll: 0.12, scOff: [0.0,   0.0],  orbit: 'figure8',  discOuter: 6.5 },
    { name: '08_wide_pulledback',   camZ:10.0, camY: 0.70, fov: 0.65, roll: 0.05, scOff: [0.0,   0.0],  orbit: 'wobble',   discOuter: 7.5 },
    { name: '09_dutch_angle_close', camZ: 5.5, camY: 1.20, fov: 1.15, roll: 0.45, scOff: [-0.25,-0.10], orbit: 'inclined', discOuter: 6.0 },
    { name: '10_low_horizon',       camZ: 8.0, camY: 0.25, fov: 0.80, roll: -0.08,scOff: [0.10, -0.30], orbit: 'figure8',  discOuter: 7.0 },
];

function makeMobileShader(v) {
    // orbit logic per type
    let orbitCode;
    if (v.orbit === 'planar') {
        orbitCode = `
    float a = t * CAM_ORBIT_SPEED;
    vec3 camPos = vec3(sin(a)*CAM_Z, CAM_Y, cos(a)*CAM_Z);`;
    } else if (v.orbit === 'wobble') {
        orbitCode = `
    float a = t * CAM_ORBIT_SPEED;
    float ywob = sin(t * 0.018) * 0.6;
    vec3 camPos = vec3(sin(a)*CAM_Z, CAM_Y + ywob, cos(a)*CAM_Z);`;
    } else if (v.orbit === 'inclined') {
        orbitCode = `
    float a = t * CAM_ORBIT_SPEED;
    vec3 base = vec3(sin(a)*CAM_Z, CAM_Y, cos(a)*CAM_Z);
    float ti = 0.32;
    vec3 camPos = vec3(base.x, base.y*cos(ti) - base.z*sin(ti), base.y*sin(ti) + base.z*cos(ti));`;
    } else { // figure8
        orbitCode = `
    float a = t * CAM_ORBIT_SPEED;
    float fy = sin(a*2.0) * 1.2;
    vec3 camPos = vec3(sin(a)*CAM_Z, CAM_Y + fy, cos(a)*CAM_Z);`;
    }

    return `precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_intensity;

const float RS          = 0.22;
const float BEND_FORCE  = 4.5;
const int   STEPS       = 90;
const float DISK_INNER  = RS * 3.0;
const float DISK_OUTER  = ${v.discOuter.toFixed(2)};
const float DISK_HEIGHT = 0.20;
const float DISK_BRIGHT = 7.0;
const float ISCO_RING   = 10.0;
const float TURBULENCE  = 0.55;
const float DISK_ABSORB = 0.30;
const float DOPPLER_STR = 3.5;
const float OMEGA_SCALE = 0.42;
const float ANIM_SPEED  = 1.0;
const float RING_BRIGHT = 3.0;
const float CAM_Y           = ${v.camY.toFixed(2)};
const float CAM_Z           = ${v.camZ.toFixed(2)};
const float FOV             = ${v.fov.toFixed(2)};
const float CAM_ORBIT_SPEED = 0.022;
const float CAM_ROLL        = ${v.roll.toFixed(3)};
const vec2  SC_OFFSET       = vec2(${v.scOff[0].toFixed(2)}, ${v.scOff[1].toFixed(2)});
const float STAR_BRIGHT = 4.0;
const float TONEMAP_K   = 0.44;
const float GAMMA       = 0.80;

float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float vn(vec2 p){vec2 i=floor(p),f=p-i;f=f*f*(3.0-2.0*f);return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x),mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x),f.y);}
float fbm3(vec2 p){return 0.5*vn(p)+0.25*vn(p*2.03)+0.125*vn(p*4.07);}

vec3 starBg(vec3 dir){
    float az=atan(dir.z,dir.x), el=asin(clamp(dir.y,-0.999,0.999));
    vec2 sph=vec2(az,el);
    float pt=0.0;
    {vec2 c=floor(sph*200.0),v=fract(sph*200.0)-0.5;float h=hash12(c+0.71);
     float cx=fract(h*7.1)-0.5,cy=fract(h*13.7)-0.5;
     float d2=(v.x-cx)*(v.x-cx)+(v.y-cy)*(v.y-cy);
     pt+=step(0.95,h)*exp(-d2*2200.0)*(h-0.95)/0.05*8.0*STAR_BRIGHT;}
    {vec2 c=floor(sph*340.0),v=fract(sph*340.0)-0.5;float h=hash12(c+17.3);
     float cx=fract(h*4.3)-0.5,cy=fract(h*8.1)-0.5;
     float d2=(v.x-cx)*(v.x-cx)+(v.y-cy)*(v.y-cy);
     pt+=step(0.92,h)*exp(-d2*5500.0)*(h-0.92)/0.08*3.5*STAR_BRIGHT;}
    return vec3(0.002,0.008,0.025)+vec3(0.85,0.92,1.0)*pt;
}

vec3 diskEmit(vec3 cp, vec3 rd, float t){
    float r = length(cp.xz);
    float rN = clamp((r-DISK_INNER)/(DISK_OUTER-DISK_INNER),0.0,1.0);
    float ef = smoothstep(0.0,0.07,rN) * (1.0 - smoothstep(0.62,1.0,rN));
    float omega = OMEGA_SCALE * sqrt(1.5*RS/max(r*r*r,0.001));
    float phi = atan(cp.z,cp.x);
    float ap  = phi - t * omega;
    float rB  = 0.5 + 0.5 * cos(rN * 6.283 * 4.0);
    rB += 0.25 * (0.5 + 0.5 * cos(rN * 6.283 * 11.0));
    float gas = fbm3(vec2(ap*2.0, log(max(r,0.01))*5.0) + t*0.03);
    // Folded-space chunk silhouettes embedded in disk
    vec2 cellId = floor(vec2(ap*1.4, log(max(r,0.01))*4.0));
    vec2 cellLocal = fract(vec2(ap*1.4, log(max(r,0.01))*4.0)) - 0.5;
    float chunkMask = 0.0;
    for (int dy=-1; dy<=1; dy++){
      for (int dx=-1; dx<=1; dx++){
        vec2 nid = cellId + vec2(float(dx), float(dy));
        float h1 = hash12(nid*7.13);
        float h2 = hash12(nid*11.37+3.7);
        float h3 = hash12(nid*17.91-1.3);
        vec2 off = vec2(h1-0.5, h2-0.5)*0.7 + vec2(float(dx), float(dy));
        float radius = 0.075 * (0.4 + 1.6*h3);
        float exists = step(0.45, h1*h2);
        float d = length(cellLocal - off) - radius;
        chunkMask = max(chunkMask, exists * (1.0 - smoothstep(0.0, radius*0.4, d)));
      }
    }
    chunkMask *= ef;
    float density = rB * ef;
    vec3  tang = normalize(vec3(-cp.z,0.0,cp.x));
    float dop  = dot(tang,-rd);
    float boost= pow(max(0.0,1.0+3.2*dop), DOPPLER_STR);
    vec3 ci=vec3(5.0,4.6,4.0), cm=vec3(2.2,0.9,0.1), co=vec3(0.55,0.06,0.01), ce=vec3(0.05,0.0,0.0);
    float t1 = smoothstep(DISK_INNER, DISK_INNER*2.6, r);
    float t2 = smoothstep(DISK_INNER*2.0, DISK_OUTER*0.72, r);
    float t3 = smoothstep(DISK_OUTER*0.58, DISK_OUTER, r);
    vec3 temp = mix(mix(ci, cm, t1), co, t2);
    temp = mix(temp, ce, t3);
    float iscoR = DISK_INNER + 0.032;
    float isco  = exp(-pow((r-iscoR)/0.026, 2.0)) * ISCO_RING;
    float em = density * (0.30 + 0.70*gas*TURBULENCE) * boost + isco * 0.7;
    vec3 result = temp * em;
    result *= 1.0 - chunkMask * 0.85;
    float rim = chunkMask * (1.0 - chunkMask) * 4.0;
    result += vec3(2.6, 1.6, 0.55) * rim * 5.0 * boost * ef;
    return result;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float ar = u_resolution.x / u_resolution.y;
    vec2 sc = ar > 1.0 ? (uv*2.0-1.0) * vec2(ar, 1.0)
                       : (uv*2.0-1.0) * vec2(1.0, 1.0/ar);
    sc += SC_OFFSET;
    float t = u_time * ANIM_SPEED;${orbitCode}
    vec3 fwd = normalize(-camPos);
    // Roll camera around its forward axis
    float cR = cos(CAM_ROLL), sR = sin(CAM_ROLL);
    vec3 worldUp = vec3(sR, cR, 0.0);
    vec3 rgt = normalize(cross(fwd, worldUp));
    vec3 up  = cross(rgt, fwd);
    vec3 pos = camPos;
    vec3 dir = normalize(fwd*FOV + rgt*sc.x + up*sc.y);
    vec3 initialDir = dir;
    vec3 color = vec3(0.0);
    float trans = 1.0;
    float prevY = pos.y;
    for(int i=0; i<STEPS; i++){
        float r  = length(pos);
        float dR = length(pos.xz);
        if(r < RS*1.05) break;
        if(r > 12.0) break;
        float step = min(0.05 * r / (1.0 + 8.0*RS/r), 0.22);
        vec3 toC = -pos / r;
        float accel = (RS*BEND_FORCE) / (r*r + RS*0.4);
        dir = normalize(dir + toC * accel * step * 2.0);
        vec3 nextPos = pos + dir * step;
        if(prevY * nextPos.y < 0.0){
            float al = prevY / (prevY - nextPos.y);
            vec3 cp = pos + dir * step * al;
            float cr = length(cp.xz);
            if(cr >= DISK_INNER && cr <= DISK_OUTER){
                vec3 em = diskEmit(cp, dir, t);
                color += trans * em * DISK_BRIGHT;
                trans *= exp(-DISK_ABSORB);
            }
        }
        if(abs(pos.y) < DISK_HEIGHT && dR >= DISK_INNER && dR <= DISK_OUTER){
            float vF = exp(-abs(pos.y)/(DISK_HEIGHT*0.6));
            float dS = step / (DISK_HEIGHT*2.0);
            color += trans * diskEmit(pos, dir, t) * dS * 0.50 * vF;
            trans *= exp(-DISK_ABSORB * 0.20 * dS * vF);
        }
        prevY = nextPos.y;
        pos = nextPos;
        if(trans < 0.01) break;
    }
    float ip = length(cross(camPos, initialDir));
    float ring = smoothstep(RS*2.40, RS*2.58, ip) * (1.0 - smoothstep(RS*2.58, RS*2.76, ip));
    color += vec3(0.92, 0.97, 1.0) * ring * RING_BRIGHT;
    color += trans * starBg(dir);
    color = color / (1.0 + color*TONEMAP_K);
    color *= max(0.0, 1.0 - length(sc)*0.07);
    gl_FragColor = vec4(pow(max(vec3(0.0), color*u_intensity), vec3(GAMMA)), 1.0);
}`;
}

function patchShader(name, glsl) {
    const src = fs.readFileSync(SHADER_FILE, 'utf8');
    const escaped = glsl.replace(/\r\n/g, '\n').replace(/\n/g, '\\r\\n').replace(/"/g, '\\"');
    const re = new RegExp('window\\.SHADER_SOURCES\\["' + name + '"\\] = "[\\s\\S]*?";');
    if (!re.test(src)) { throw new Error('Entry not found: ' + name); }
    fs.writeFileSync(SHADER_FILE, src.replace(re, `window.SHADER_SOURCES["${name}"] = "${escaped}";`));
}

async function shoot(browser, outPath) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const ctx = await browser.newContext({
            viewport: { width: 414, height: 896 },
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
            isMobile: true, hasTouch: true,
            serviceWorkers: 'block'
        });
        const page = await ctx.newPage();
        try {
            await page.addInitScript(() => {
                const orig = HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext = function(type, opts) {
                    if (type === 'webgl' || type === 'webgl2') {
                        opts = Object.assign({}, opts || {}, { preserveDrawingBuffer: true });
                    }
                    return orig.call(this, type, opts);
                };
                localStorage.setItem('eoaplot-selected-theme', 'chaos');
                localStorage.setItem('eoaplot-shader-enabled', 'true');
            });
            await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 25000 });
            await new Promise(r => setTimeout(r, 11000));
            const data = await page.evaluate(() => {
                const c = document.getElementById('shader-background');
                if (!c) return null;
                try { return c.toDataURL('image/png'); } catch (e) { return null; }
            });
            await ctx.close();
            if (data && data.startsWith('data:image')) {
                fs.writeFileSync(outPath, Buffer.from(data.replace(/^data:image\/png;base64,/, ''), 'base64'));
                return true;
            }
        } catch (e) {
            console.log(`  attempt ${attempt+1} failed: ${e.message.split('\n')[0]}`);
            try { await ctx.close(); } catch {}
        }
    }
    return false;
}

async function main() {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    const browser = await chromium.launch();
    const results = [];
    for (let i = 0; i < VARIANTS.length; i++) {
        const v = VARIANTS[i];
        const glsl = makeMobileShader(v);
        patchShader('chaos-mobile-shader.glsl', glsl);
        const pngPath = path.join(OUT_DIR, `mobile-${v.name}.png`);
        const ok = await shoot(browser, pngPath);
        const cfgPath = path.join(OUT_DIR, `mobile-${v.name}.json`);
        fs.writeFileSync(cfgPath, JSON.stringify(v, null, 2));
        console.log(`[${i+1}/${VARIANTS.length}] ${v.name}: ${ok ? 'OK' : 'FAILED'}`);
        results.push({ ...v, png: pngPath, ok });
    }
    await browser.close();
    fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(results, null, 2));
    console.log(`\nAll variants saved to ${OUT_DIR}/`);
    console.log('Pick a favourite, then bake its config back into apply-chaos-sdf.js.');
}

main().catch(e => { console.error(e); process.exit(1); });
