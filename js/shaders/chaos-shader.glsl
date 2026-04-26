precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// CHAOS — Ray-Marched Black Hole  (physically-grounded rewrite)
// ============================================================================
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  TWEAK ME — all visual controls in one place                           ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  BLACK HOLE                                                             ║
// ║    RS          Schwarzschild radius (scene units). Default 0.115       ║
// ║    BEND_FORCE  Gravitational lensing strength. Def 4.2                 ║
// ║    STEPS       Ray-march iterations. Default 100                       ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  ACCRETION DISK                                                         ║
// ║    DISK_INNER  Inner ISCO edge. RS*3.0 = Schwarzschild ISCO.            ║
// ║                RS*1.5 = Kerr maximally-spinning ISCO. Range RS*1.2…4.0 ║
// ║    DISK_OUTER  Outer edge radius. Range 2.0…5.0                        ║
// ║    DISK_HEIGHT Vertical half-thickness for sampling. Range 0.2…1.5     ║
// ║    DISK_BRIGHT Global disk emission scale. Range 1.0…8.0               ║
// ║    ISCO_RING   ISCO ring spike strength. 0.0=off, 12.0=blinding.       ║
// ║    TURBULENCE  FBM turbulence mix. 0.0=smooth, 1.0=stormy.             ║
// ║    SPIRAL      Spiral arm depth. 0.0=none, 1.0=strong.                 ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  DOPPLER / PHYSICS                                                      ║
// ║    DOPPLER_STR Relativistic Doppler exponent. Def 3.2 (Schwarzschild)  ║
// ║                Higher = stronger prograde/retrograde asymmetry          ║
// ║    OMEGA_SCALE Keplerian speed scale. Def 0.38                         ║
// ║    ANIM_SPEED  Overall animation multiplier. Def 1.0                   ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  PHOTON RING                                                            ║
// ║    RING_BRIGHT Photon ring brightness. 0.0=off, 12.0=vivid. Def 5.5   ║
// ║    RING_COLOR  Photon ring colour (blue-white).                        ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  CAMERA                                                                 ║
// ║    CAM_Y         Mean height above disk plane. 0.0=edge-on, 2.0=top   ║
// ║    CAM_Z         Distance from BH. Range 2.0…6.0. Default 3.5         ║
// ║    CAM_TILT      Look-down angle (negative). Default -0.185            ║
// ║    FOV           Focal length. 0.8=wide, 1.6=telephoto. Default 1.20  ║
// ║    CAM_ORBIT_SPEED  Radians/sec horizontal orbit. 0.0=static           ║
// ║                  Full orbit = 2π/CAM_ORBIT_SPEED seconds               ║
// ║    CAM_INCL_AMP  Elevation wobble amplitude (scene units). 0.0=none   ║
// ║                  Camera bobs ±CAM_INCL_AMP above/below mean height    ║
// ║    CAM_INCL_FREQ Elevation wobble rate (rad/s). Different from orbit   ║
// ║                  rate → non-repeating Lissajous path (spaceship feel)  ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  STARS / NEBULA                                                         ║
// ║    STAR_BRIGHT  Star field brightness. Default 1.3                     ║
// ║    NEBULA_MIX   Nebula colour intensity. Default 0.55                  ║
// ║    PURPLE_AMT   Purple accent nebula. Default 0.40                     ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  TONE MAPPING                                                           ║
// ║    TONEMAP_K    Reinhard denominator. Default 0.55                     ║
// ║    GAMMA        Display gamma. Default 0.82                            ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ── Black hole ────────────────────────────────────────────────────────────────
const float RS          = 0.110;
const float BEND_FORCE  = 4.4;
const int   STEPS       = 110;

// ── Accretion disk ────────────────────────────────────────────────────────────
const float DISK_INNER  = RS * 3.0;   // Schwarzschild ISCO = 3 * RS
const float DISK_OUTER  = 3.4;
const float DISK_HEIGHT = 0.90;
const float DISK_BRIGHT = 6.0;
const float ISCO_RING   = 9.0;
const float TURBULENCE  = 1.00;
const float SPIRAL      = 0.65;

// ── Doppler / physics ─────────────────────────────────────────────────────────
const float DOPPLER_STR = 4.0;
const float OMEGA_SCALE = 0.42;
const float ANIM_SPEED  = 1.0;

// ── Photon ring ───────────────────────────────────────────────────────────────
const float RING_BRIGHT = 6.5;
const vec3  RING_COLOR  = vec3(0.52, 0.84, 1.72);

// ── Camera ────────────────────────────────────────────────────────────────────
const float CAM_Y            = 0.60;
const float CAM_Z            = 3.3;
const float CAM_TILT         = -0.182;
const float FOV              = 1.22;
const float CAM_ORBIT_SPEED  = 0.035;   // 0.0 = static | 0.035 ≈ full orbit in 180 s
const float CAM_INCL_AMP     = 0.65;    // elevation wobble ± above CAM_Y
const float CAM_INCL_FREQ    = 0.023;   // irrational vs orbit freq → Lissajous path

// ── Stars / nebula ────────────────────────────────────────────────────────────
const float STAR_BRIGHT = 0.8;
const float NEBULA_MIX  = 0.35;
const float PURPLE_AMT  = 0.25;

// ── Tone mapping ──────────────────────────────────────────────────────────────
const float TONEMAP_K   = 0.40;
const float GAMMA       = 0.79;

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
    vec3 i = floor(p);
    vec3 f = fract(p);
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
float fbm5(vec2 p) {
    return fbm3(p) + 0.0625*vn(p*8.11) + 0.03125*vn(p*16.23);
}

// ── Star background + nebula ──────────────────────────────────────────────────

vec3 starBackground(vec3 dir) {
    float t = u_time * ANIM_SPEED;
    float stars  = pow(max(0.0, noise3D(dir * 180.0)), 22.0) * STAR_BRIGHT;
    stars += pow(max(0.0, noise3D(dir *  65.0 + 0.47)), 14.0) * STAR_BRIGHT * 0.50;
    float hue = fract(noise3D(dir * 42.0) * 6.39);
    vec3 starCol = mix(vec3(0.72, 0.84, 1.0), vec3(1.0, 0.88, 0.72), hue) * stars;

    float az = atan(dir.z, dir.x);
    float el = asin(clamp(dir.y, -0.999, 0.999));
    vec2  uv = vec2(az * 0.15915 + 0.5, el * 0.31831 + 0.5);
    float neb  = fbm3(uv * 2.2 + t * 0.003) * fbm3(uv * 1.5 + 0.74);
    float neb2 = fbm3(uv * 3.6 - t * 0.002);
    vec3  nebCol = mix(vec3(0.01, 0.02, 0.11), vec3(0.07, 0.01, 0.15), neb2);

    float nebPurple = noise3D(dir * 7.0 + vec3(t*0.012, 0.0, t*0.007)) * 0.22;
    vec3 bg = starCol + nebCol * neb * NEBULA_MIX;
    bg += vec3(0.55, 0.30, 0.85) * nebPurple * PURPLE_AMT;
    return bg;
}

// ── Volumetric accretion disk ─────────────────────────────────────────────────

vec3 diskEmit(vec3 pos, vec3 rayDir) {
    float r    = length(pos.xz);
    float absH = abs(pos.y);

    float scaleH = max(0.04, r * 0.12);
    float vFall  = exp(-absH / scaleH);
    float radial = smoothstep(DISK_INNER, DISK_INNER + 0.10, r)
                 * smoothstep(DISK_OUTER, DISK_OUTER * 0.30, r);
    float density = vFall * radial;
    if (density < 0.003) return vec3(0.0);

    float t = u_time * ANIM_SPEED;

    float omega = OMEGA_SCALE * sqrt(1.5 * RS / max(pow(r, 3.0), 0.001));
    float phi   = atan(pos.z, pos.x);
    float ap    = phi - t * omega;

    vec2  dc = vec2(ap * 1.9, log(max(r, 0.01)) * 5.0);
    float n1 = fbm5(dc + t * 0.033);
    float n2 = fbm3(dc * 1.7 + vec2(1.73, 0.0) - t * 0.047);
    float n3 = fbm3(dc * 0.68 + vec2(0.0, t * 0.022));

    float spiral  = 0.5 + SPIRAL * cos(ap * 2.0 + r * 1.5 - t * 0.08);
    density *= (1.0 - SPIRAL) + SPIRAL * spiral / (0.5 + SPIRAL * 0.5);

    float knots = pow(max(0.0, n2 - 0.44), 1.25) * 8.0;

    vec3  tangent = normalize(vec3(-pos.z, 0.0, pos.x));
    float doppler = dot(tangent, -rayDir);
    float boost   = pow(max(0.0, 1.0 + 3.0 * doppler), DOPPLER_STR);

    // Physically-grounded disk colour temperature:
    // ISCO/innermost → white-yellow (hottest, ~10^7 K mapped to visible)
    // Inner disk     → orange-yellow (~10^6 K)
    // Mid disk       → orange-red   (~10^5 K)
    // Outer disk     → deep red     (~10^4 K)
    vec3 c_isco  = vec3(2.5, 2.2, 1.8);   // near-white hot
    vec3 c_hot   = vec3(2.2, 1.2, 0.25);  // orange
    vec3 c_mid   = vec3(1.5, 0.45, 0.04); // dark orange
    vec3 c_outer = vec3(0.60, 0.04, 0.01);// deep red

    // Colour breakpoints scale with RS for correct physical proportions
    float r_isco  = RS * 3.0;
    float r_hot   = r_isco * 2.5;   // 7.5 * RS
    float r_mid   = r_isco * 5.0;   // 15.0 * RS
    float t1 = smoothstep(r_isco, r_hot, r);
    float t2 = smoothstep(r_hot,  r_mid, r);
    float t3 = smoothstep(r_mid,  DISK_OUTER, r);
    vec3 temp = mix(c_isco, c_hot,   t1);
         temp = mix(temp,   c_mid,   t2);
         temp = mix(temp,   c_outer, t3);

    // ISCO ring: physically placed at r = 3*RS (Schwarzschild)
    float isco_r = RS * 3.0;
    float isco_w = max(RS * 0.20, 0.012);
    float isco = exp(-pow((r - isco_r) / isco_w, 2.0)) * ISCO_RING;

    float em  = density * (0.40 + 0.60 * n1 * TURBULENCE) * boost;
          em += density * n2 * 0.40 * TURBULENCE;
          em += vFall * radial * isco * 0.65;

    vec3 result = temp * em;
    result += c_isco * knots * density * n3 * 0.55 * TURBULENCE;
    return result;
}

// ── Main — ray marcher ────────────────────────────────────────────────────────

void main() {
    vec2  uv = gl_FragCoord.xy / u_resolution;
    float ar = u_resolution.x / u_resolution.y;
    vec2  sc = (uv * 2.0 - 1.0) * vec2(ar, 1.0);

    // Inclined-orbit camera: horizontal orbit + independent elevation wobble.
    // With CAM_ORBIT_SPEED=0 and CAM_INCL_AMP=0 this reduces to the original
    // static camera at (0, CAM_Y, CAM_Z) looking toward origin with CAM_TILT.
    float orbitAngle = u_time * ANIM_SPEED * CAM_ORBIT_SPEED;
    float elevAngle  = u_time * ANIM_SPEED * CAM_INCL_FREQ;
    float dynY       = CAM_Y + CAM_INCL_AMP * sin(elevAngle);
    vec3  camPos     = vec3(sin(orbitAngle) * CAM_Z, dynY, cos(orbitAngle) * CAM_Z);

    // "Inward" direction in the horizontal plane + static tilt toward disk plane
    vec3 inward = normalize(vec3(-sin(orbitAngle), 0.0, -cos(orbitAngle)));
    vec3 fwd    = normalize(inward + vec3(0.0, CAM_TILT, 0.0));
    vec3 rgt    = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
    vec3 camUp  = cross(rgt, fwd);

    vec3 pos        = camPos;
    vec3 dir        = normalize(fwd * FOV + rgt * sc.x + camUp * sc.y);
    vec3 initialDir = dir;

    vec3  color = vec3(0.0);
    float trans = 1.0;

    for (int i = 0; i < STEPS; i++) {
        float r = length(pos);

        if (r < RS) break;

        if (r > 9.0) {
            color += trans * starBackground(dir);
            break;
        }

        float step = mix(0.022, 0.18, clamp((r - RS * 2.0) / 8.0, 0.0, 1.0));

        vec3  toCenter = -pos / r;
        float bend     = (RS * BEND_FORCE) / (r * r + RS * 0.5);
        dir = normalize(dir + toCenter * bend * step * 1.8);

        if (abs(pos.y) < DISK_HEIGHT) {
            vec3 em = diskEmit(pos, dir);
            if (dot(em, em) > 0.0002) {
                color += trans * em * step * DISK_BRIGHT;
                float rr   = length(pos.xz);
                float scH  = max(0.04, rr * 0.12);
                float absorb = exp(-abs(pos.y) / scH)
                             * smoothstep(DISK_INNER, DISK_INNER + 0.09, rr)
                             * smoothstep(DISK_OUTER, 0.55, rr) * 0.55;
                trans *= exp(-absorb * step);
            }

            float rr2 = length(pos.xz);
            float glow = exp(-abs(pos.y) * 9.0) * 0.07 / (rr2 + 0.5);
            color += vec3(1.6, 0.75, 0.28) * glow * trans;
        }

        pos += dir * step;
        if (trans < 0.015) break;
    }

    // Analytical photon ring from impact parameter
    float photonSphere = RS * 1.5;
    float impactParam  = length(cross(camPos, initialDir));
    float ring = smoothstep(photonSphere * 2.52, photonSphere * 2.72, impactParam)
               * (1.0 - smoothstep(photonSphere * 2.72, photonSphere * 2.92, impactParam));
    color += RING_COLOR * ring * RING_BRIGHT;

    // Reinhard tone mapping + gamma
    color = color / (1.0 + color * TONEMAP_K);
    color *= max(0.0, 1.0 - length(sc) * 0.09);
    gl_FragColor = vec4(pow(max(vec3(0.0), color * u_intensity), vec3(GAMMA)), 1.0);
}
