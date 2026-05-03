/**
 * Applies the Interstellar-look chaos shader rewrite.
 * node scripts/apply-chaos-interstellar.js
 */
const fs   = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'shaders', 'shader-sources.js');
let content = fs.readFileSync(filePath, 'utf8');

const GLSL = `precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// CHAOS — Interstellar-style Ray-Marched Black Hole
// ============================================================================
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  TWEAK ME — all visual controls in one place                           ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  BLACK HOLE                                                             ║
// ║    RS          Schwarzschild radius. Bigger = larger horizon.  Def 0.115║
// ║    BEND_FORCE  Lensing strength. Higher = more wrap.           Def 5.0  ║
// ║    STEPS       Ray-march iterations. 80=fast 140=cinematic.    Def 110  ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  ACCRETION DISK                                                         ║
// ║    DISK_INNER  Inner edge (RS multiples). ISCO≈3.0 Kerr≈1.5.  Def RS*3 ║
// ║    DISK_OUTER  Outer edge radius.                              Def 3.8  ║
// ║    DISK_HEIGHT Volumetric sample half-thickness.               Def 0.55 ║
// ║    DISK_BRIGHT Emission scale. 3=dim 8=blazing.                Def 5.5  ║
// ║    ISCO_RING   Inner white-hot spike. 0=off 12=blinding.       Def 7.0  ║
// ║    TURBULENCE  Disk plasma noise. 0=smooth 1=stormy.           Def 0.80 ║
// ║    SPIRAL      Spiral arm depth. 0=none 0.6=strong.            Def 0.25 ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  PHYSICS                                                                ║
// ║    DOPPLER_STR Doppler contrast exponent.                      Def 4.0  ║
// ║    OMEGA_SCALE Keplerian speed scale.                          Def 0.40 ║
// ║    ANIM_SPEED  Global animation speed multiplier.              Def 1.0  ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  PHOTON RING                                                            ║
// ║    RING_BRIGHT White lensed arc brightness. 0=off 12=vivid.    Def 8.0  ║
// ║    RING_COLOR  Lensed arc tint.                                         ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  CAMERA                                                                 ║
// ║    CAM_Y       Base height above disk. 0=edge-on 2=top-down.   Def 0.20 ║
// ║    CAM_Z       Radial distance.                                Def 3.8  ║
// ║    CAM_TILT    Downward look angle (negative).                 Def-0.055║
// ║    FOV         Focal length. 0.8=wide 1.6=tele.                Def 1.15 ║
// ║    CAM_ORBIT_SPEED  Horizontal orbit speed.                    Def 0.028║
// ║    CAM_INCL_AMP     Inclination wobble amplitude.              Def 0.50 ║
// ║    CAM_INCL_FREQ    Inclination wobble frequency.              Def 0.015║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  SKY                                                                    ║
// ║    STAR_BRIGHT Star density. 0.5=sparse 2.5=rich.              Def 1.3  ║
// ║    NEBULA_MIX  Nebula intensity.                               Def 0.45 ║
// ║    PURPLE_AMT  Purple accent.                                  Def 0.30 ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  OUTPUT                                                                 ║
// ║    TONEMAP_K   Reinhard rolloff. 0.3=punchy 0.8=muted.         Def 0.50 ║
// ║    GAMMA       Display gamma. 0.82=warm 1.0=linear.            Def 0.82 ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ── Black hole ────────────────────────────────────────────────────────────────
const float RS          = 0.115;
const float BEND_FORCE  = 5.0;
const int   STEPS       = 110;

// ── Accretion disk ────────────────────────────────────────────────────────────
const float DISK_INNER  = RS * 3.0;
const float DISK_OUTER  = 3.8;
const float DISK_HEIGHT = 0.55;
const float DISK_BRIGHT = 5.5;
const float ISCO_RING   = 7.0;
const float TURBULENCE  = 0.80;
const float SPIRAL      = 0.25;

// ── Physics ───────────────────────────────────────────────────────────────────
const float DOPPLER_STR  = 4.0;
const float OMEGA_SCALE  = 0.40;
const float ANIM_SPEED   = 1.0;

// ── Photon ring ───────────────────────────────────────────────────────────────
const float RING_BRIGHT  = 8.0;
const vec3  RING_COLOR   = vec3(0.85, 0.92, 1.0);

// ── Camera ────────────────────────────────────────────────────────────────────
const float CAM_Y            = 0.20;
const float CAM_Z            = 3.8;
const float CAM_TILT         = -0.055;
const float FOV              = 1.15;
const float CAM_ORBIT_SPEED  = 0.028;
const float CAM_INCL_AMP     = 0.50;
const float CAM_INCL_FREQ    = 0.015;

// ── Sky ───────────────────────────────────────────────────────────────────────
const float STAR_BRIGHT  = 1.3;
const float NEBULA_MIX   = 0.45;
const float PURPLE_AMT   = 0.30;

// ── Output ────────────────────────────────────────────────────────────────────
const float TONEMAP_K    = 0.50;
const float GAMMA        = 0.82;

// ── Noise ─────────────────────────────────────────────────────────────────────

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}
vec3 hash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.11369, 0.13787));
    p += dot(p, p.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3((p.x+p.y)*p.z, (p.x+p.z)*p.y, (p.y+p.z)*p.x));
}
float noise3D(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(dot(hash33(i),             f),
                dot(hash33(i+vec3(1,0,0)), f-vec3(1,0,0)), f.x),
            mix(dot(hash33(i+vec3(0,1,0)), f-vec3(0,1,0)),
                dot(hash33(i+vec3(1,1,0)), f-vec3(1,1,0)), f.x), f.y),
        mix(mix(dot(hash33(i+vec3(0,0,1)), f-vec3(0,0,1)),
                dot(hash33(i+vec3(1,0,1)), f-vec3(1,0,1)), f.x),
            mix(dot(hash33(i+vec3(0,1,1)), f-vec3(0,1,1)),
                dot(hash33(i+vec3(1,1,1)), f-vec3(1,1,1)), f.x), f.y), f.z);
}
float vn(vec2 p) {
    vec2 i = floor(p), f = p - i;
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i+vec2(1,0)), f.x),
               mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), f.x), f.y);
}
float fbm3(vec2 p) { return 0.500*vn(p) + 0.250*vn(p*2.03) + 0.125*vn(p*4.07); }
float fbm5(vec2 p) { return fbm3(p) + 0.0625*vn(p*8.11) + 0.03125*vn(p*16.23); }

// ── Sky: dark blue-teal space + stars ─────────────────────────────────────────

vec3 starBackground(vec3 dir) {
    float stars = pow(max(0.0, noise3D(dir * 180.0)), 22.0) * STAR_BRIGHT;
    stars      += pow(max(0.0, noise3D(dir *  65.0 + 0.47)), 14.0) * STAR_BRIGHT * 0.5;
    float hue   = fract(noise3D(dir * 42.0) * 6.39);
    vec3 starCol = mix(vec3(0.78, 0.90, 1.0), vec3(1.0, 0.92, 0.78), hue) * stars;

    float az = atan(dir.z, dir.x);
    float el = asin(clamp(dir.y, -0.999, 0.999));
    vec2  uv = vec2(az * 0.15915 + 0.5, el * 0.31831 + 0.5);

    // Blue-teal nebula (matches Interstellar's dark space feel)
    float neb  = fbm3(uv * 2.5) * fbm3(uv * 1.8 + 0.74);
    float neb2 = fbm3(uv * 3.2);
    vec3 nebCol = mix(vec3(0.00, 0.03, 0.10), vec3(0.02, 0.08, 0.16), neb2);

    float nebPurple = noise3D(dir * 7.0) * 0.18;
    vec3 bg = starCol + nebCol * neb * NEBULA_MIX;
    bg += vec3(0.30, 0.20, 0.65) * nebPurple * PURPLE_AMT;
    return bg;
}

// ── Accretion disk emission ────────────────────────────────────────────────────

vec3 diskEmit(vec3 pos, vec3 rayDir, float t) {
    float r    = length(pos.xz);
    float absH = abs(pos.y);

    float scaleH = max(0.035, r * 0.10);
    float vFall  = exp(-absH / scaleH);
    float radial = smoothstep(DISK_INNER, DISK_INNER + 0.12, r)
                 * smoothstep(DISK_OUTER, DISK_OUTER * 0.25, r);
    float density = vFall * radial;
    if (density < 0.003) return vec3(0.0);

    float omega = OMEGA_SCALE * sqrt(1.5 * RS / max(r * r * r, 0.001));
    float phi   = atan(pos.z, pos.x);
    float ap    = phi - t * omega;

    vec2  dc = vec2(ap * 2.2, log(max(r, 0.01)) * 5.5);
    float n1 = fbm5(dc + t * 0.031);
    float n2 = fbm3(dc * 1.6 + vec2(1.73, 0.0) - t * 0.044);
    float n3 = fbm3(dc * 0.72 + vec2(0.0, t * 0.019));

    // Spiral arms
    float spiral = 0.5 + SPIRAL * cos(ap * 2.0 + r * 1.8 - t * 0.07);
    density *= (1.0 - SPIRAL * 0.5) + SPIRAL * 0.5 * spiral;

    float knots = pow(max(0.0, n2 - 0.42), 1.3) * 9.0;

    // Doppler: prograde side blazes, retrograde fades
    vec3  tang    = normalize(vec3(-pos.z, 0.0, pos.x));
    float doppler = dot(tang, -rayDir);
    float boost   = pow(max(0.0, 1.0 + 3.2 * doppler), DOPPLER_STR);

    // Colour temperature gradient: white-hot → orange → deep red
    vec3 c_isco  = vec3(2.8, 2.5, 2.0);   // white-hot, HDR
    vec3 c_hot   = vec3(2.2, 1.2, 0.20);  // orange, HDR
    vec3 c_mid   = vec3(1.5, 0.55, 0.04); // amber
    vec3 c_outer = vec3(0.60, 0.06, 0.01);// deep red
    float t1 = smoothstep(DISK_INNER, 0.45, r);
    float t2 = smoothstep(0.45, 1.0,  r);
    float t3 = smoothstep(1.0,  2.5,  r);
    vec3 temp = mix(mix(mix(c_isco, c_hot, t1), c_mid, t2), c_outer, t3);

    // Sharp ISCO ring (innermost stable orbit — hottest point)
    float iscoR = DISK_INNER + 0.05;
    float isco  = exp(-pow((r - iscoR) / 0.030, 2.0)) * ISCO_RING;

    float em  = density * (0.35 + 0.65 * n1 * TURBULENCE) * boost;
          em += density * n2 * 0.35 * TURBULENCE;
          em += vFall * radial * isco * 0.70;

    vec3 result = temp * em;
    result += c_isco * knots * density * n3 * 0.50 * TURBULENCE;
    return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────

void main() {
    vec2  uv = gl_FragCoord.xy / u_resolution;
    float ar = u_resolution.x / u_resolution.y;
    vec2  sc = (uv * 2.0 - 1.0) * vec2(ar, 1.0);

    float t = u_time * ANIM_SPEED;

    // Orbiting + inclination-wobbling camera
    float camAngle  = t * CAM_ORBIT_SPEED;
    float inclWobble = CAM_INCL_AMP * sin(t * CAM_INCL_FREQ);
    float camY = CAM_Y + inclWobble * 0.25;
    vec3 camPos = vec3(sin(camAngle) * CAM_Z, camY, cos(camAngle) * CAM_Z);

    // Always look toward the black hole, with a slight downward tilt
    vec3 fwd    = normalize(-camPos + vec3(0.0, CAM_TILT * CAM_Z, 0.0));
    vec3 rgt    = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
    vec3 camUp  = cross(rgt, fwd);

    vec3 pos        = camPos;
    vec3 dir        = normalize(fwd * FOV + rgt * sc.x + camUp * sc.y);
    vec3 initialDir = dir;

    vec3  color = vec3(0.0);
    float trans = 1.0;

    for (int i = 0; i < STEPS; i++) {
        float r = length(pos);

        if (r < RS) { break; }

        if (r > 10.0) {
            color += trans * starBackground(dir);
            break;
        }

        // Adaptive step: fine near horizon, coarse far out
        float stepSize = mix(0.018, 0.20, clamp((r - RS * 2.0) / 9.0, 0.0, 1.0));

        // Gravitational deflection
        vec3  toCenter = -pos / r;
        float bend     = (RS * BEND_FORCE) / (r * r + RS * 0.6);
        dir = normalize(dir + toCenter * bend * stepSize * 1.9);

        // Disk sampling
        if (abs(pos.y) < DISK_HEIGHT) {
            vec3 em = diskEmit(pos, dir, t);
            if (dot(em, em) > 0.0001) {
                color += trans * em * stepSize * DISK_BRIGHT;
                float rr   = length(pos.xz);
                float scH  = max(0.035, rr * 0.10);
                float absorb = exp(-abs(pos.y) / scH)
                             * smoothstep(DISK_INNER, DISK_INNER + 0.08, rr)
                             * smoothstep(DISK_OUTER, 0.6, rr) * 0.50;
                trans *= exp(-absorb * stepSize);
            }
            // Disk-plane equatorial glow
            float rr2 = length(pos.xz);
            float glow = exp(-abs(pos.y) * 11.0) * 0.06 / (rr2 + 0.5);
            color += vec3(1.8, 0.80, 0.25) * glow * trans;
        }

        pos += dir * stepSize;
        if (trans < 0.012) break;
    }

    // Photon ring — bright white lensed arc (the defining Interstellar feature)
    float ps = RS * 1.5;
    float ip = length(cross(camPos, initialDir));
    float ring = smoothstep(ps * 2.48, ps * 2.70, ip)
               * (1.0 - smoothstep(ps * 2.70, ps * 2.92, ip));
    color += RING_COLOR * ring * RING_BRIGHT;

    // Soft lens flare around the horizon shadow edge
    float shadowEdge = smoothstep(RS * 2.2, RS * 1.4, length(cross(camPos, initialDir)) / length(camPos));
    color += vec3(0.9, 0.85, 0.75) * shadowEdge * 0.18 * trans;

    // Tone map + vignette + gamma
    color  = color / (1.0 + color * TONEMAP_K);
    color *= max(0.0, 1.0 - length(sc) * 0.07);
    gl_FragColor = vec4(pow(max(vec3(0.0), color * u_intensity), vec3(GAMMA)), 1.0);
}`;

const escaped = GLSL
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '\\r\\n')
    .replace(/"/g, '\\"');

const OLD = /window\.SHADER_SOURCES\["chaos-shader\.glsl"\] = "[\s\S]*?";/;
const NEW = `window.SHADER_SOURCES["chaos-shader.glsl"] = "${escaped}";`;

if (!OLD.test(content)) { console.error('chaos-shader entry not found'); process.exit(1); }
content = content.replace(OLD, NEW);
fs.writeFileSync(filePath, content);
console.log('Shader written. Size:', fs.readFileSync(filePath).length, 'bytes');
