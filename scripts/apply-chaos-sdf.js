/**
 * Rewrites chaos-shader.glsl with SDF thin-cylinder disk intersection.
 * Key perf win: disk emission computed only at y=0 plane crossings (1-2×/ray)
 * instead of at every march step (110×/ray). Steps reduced 110→70.
 * node scripts/apply-chaos-sdf.js
 */
const fs   = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'js', 'shaders', 'shader-sources.js');
let src = fs.readFileSync(file, 'utf8');

// ─── CHAOS SDF SHADER ──────────────────────────────────────────────────────────
const CHAOS = `precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// CHAOS — SDF Thin-Cylinder Accretion Disk + Ray-Marched Black Hole
//
// Performance: disk emission computed only at y=0 plane crossings (SDF
// cylinder intersection) — 1-2× per ray vs 70× with volumetric sampling.
// ============================================================================
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  TWEAK ME                                                               ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  BLACK HOLE                                                             ║
// ║    RS          Schwarzschild radius.                           0.22     ║
// ║    BEND_FORCE  Lensing strength.                               6.2      ║
// ║    STEPS       Ray-march iterations. 50=fast 100=cinematic.   70       ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  ACCRETION DISK (SDF thin cylinder)                                     ║
// ║    DISK_INNER  Inner edge. ISCO≈RS*3, Kerr≈RS*1.5.            RS*3     ║
// ║    DISK_OUTER  Outer edge radius.                              3.2      ║
// ║    DISK_BRIGHT Emission scale.                                 6.0      ║
// ║    ISCO_RING   Inner white-hot spike.                          10.0     ║
// ║    TURBULENCE  Plasma noise depth. 0=smooth 1=stormy.         0.80     ║
// ║    SPIRAL      Spiral arm contrast.                            0.15     ║
// ║    DISK_ABSORB Opacity per crossing. 0=transparent 1=opaque.  0.55     ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  PHYSICS                                                                ║
// ║    DOPPLER_STR Doppler exponent.                               1.8      ║
// ║    OMEGA_SCALE Keplerian speed.                                0.42     ║
// ║    ANIM_SPEED  Global speed multiplier.                        1.0      ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  PHOTON RING                                                            ║
// ║    RING_BRIGHT Bright lensed arc. 0=off 16=vivid.             14.0     ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  CAMERA (orbit + inclination wobble)                                    ║
// ║    CAM_Y            Base height above disk.                    0.85     ║
// ║    CAM_Z            Radial distance.                           2.8      ║
// ║    FOV              Focal length.                              0.76     ║
// ║    CAM_ORBIT_SPEED  Horizontal orbit speed.                    0.018    ║
// ║    CAM_INCL_AMP     Inclination wobble amplitude.              0.30     ║
// ║    CAM_INCL_FREQ    Inclination wobble frequency.              0.010    ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  SKY                                                                    ║
// ║    STAR_BRIGHT Stars. 1=sparse 4=dense.                        3.0      ║
// ║    NEBULA_MIX  Nebula intensity.                               0.50     ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  OUTPUT                                                                 ║
// ║    TONEMAP_K   Reinhard rolloff.                               0.41     ║
// ║    GAMMA       Display gamma.                                  0.79     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ── Black hole ────────────────────────────────────────────────────────────────
const float RS          = 0.22;
const float BEND_FORCE  = 4.5;
const int   STEPS       = 200;

// ── Accretion disk (SDF + volumetric)  ───────────────────────────────────────
const float DISK_INNER  = RS * 3.0;
const float DISK_OUTER  = 6.5;     // wide Saturn-style disk
const float DISK_HEIGHT = 0.14;    // half-thickness for volumetric sampling
const float DISK_BRIGHT = 7.0;
const float DISK_VOL_SC = 0.65;    // volumetric sampling scale
const float ISCO_RING   = 10.0;
const float TURBULENCE  = 0.62;
const float SPIRAL      = 0.25;
const float DISK_ABSORB = 0.28;

// ── Saturn ring bands & dust lanes ────────────────────────────────────────────
const float RING_FREQ   = 4.0;    // number of bright/dark band cycles
const float DUST_LANES  = 0.50;   // dark lane contrast between rings

// ── Physics ───────────────────────────────────────────────────────────────────
const float DOPPLER_STR  = 3.5;
const float OMEGA_SCALE  = 0.42;
const float ANIM_SPEED   = 1.0;

// ── Photon ring (analytical supplement) ───────────────────────────────────────
const float RING_BRIGHT  = 3.0;
const vec3  RING_COLOR   = vec3(0.92, 0.97, 1.0);

// ── Camera — nearly edge-on Saturn geometry ────────────────────────────────────
const float CAM_Y            = 0.35;   // ~3.6° elevation above disk
const float CAM_Z            = 5.5;
const float FOV              = 0.95;
const float CAM_ORBIT_SPEED  = 0.022;
const float CAM_INCL_AMP     = 0.35;
const float CAM_INCL_FREQ    = 0.012;

// ── Sky ───────────────────────────────────────────────────────────────────────
const float STAR_BRIGHT  = 5.0;    // sparser — disk dominates the frame
const float NEBULA_MIX   = 0.80;
const float PURPLE_AMT   = 0.25;

// ── Output ────────────────────────────────────────────────────────────────────
const float TONEMAP_K    = 0.44;
const float GAMMA        = 0.80;

// ── Noise ─────────────────────────────────────────────────────────────────────

float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
vec3 hash33(vec3 p){p=fract(p*vec3(0.1031,0.11369,0.13787));p+=dot(p,p.yxz+19.19);return-1.0+2.0*fract(vec3((p.x+p.y)*p.z,(p.x+p.z)*p.y,(p.y+p.z)*p.x));}
float noise3D(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(dot(hash33(i),f),dot(hash33(i+vec3(1,0,0)),f-vec3(1,0,0)),f.x),mix(dot(hash33(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(hash33(i+vec3(1,1,0)),f-vec3(1,1,0)),f.x),f.y),mix(mix(dot(hash33(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(hash33(i+vec3(1,0,1)),f-vec3(1,0,1)),f.x),mix(dot(hash33(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(hash33(i+vec3(1,1,1)),f-vec3(1,1,1)),f.x),f.y),f.z);}
float vn(vec2 p){vec2 i=floor(p),f=p-i;f=f*f*(3.0-2.0*f);return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x),mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x),f.y);}
float fbm3(vec2 p){return 0.500*vn(p)+0.250*vn(p*2.03)+0.125*vn(p*4.07);}
float fbm5(vec2 p){return fbm3(p)+0.0625*vn(p*8.11)+0.03125*vn(p*16.23);}

// ── Sky ───────────────────────────────────────────────────────────────────────

vec3 starBackground(vec3 dir) {
    float az = atan(dir.z,dir.x), el = asin(clamp(dir.y,-0.999,0.999));
    vec2  sph = vec2(az, el);

    // Smooth Gaussian point stars — 3 tiers: bright/medium/faint
    // Each hash cell gets a random star offset so edges are smooth, not blocky
    float starPt = 0.0;
    // Tier 1: bright (sparse)
    {   vec2 c = floor(sph*180.0), v = fract(sph*180.0) - 0.5;
        float h = hash12(c + 0.71);
        float cx = fract(h*7.1)-0.5, cy = fract(h*13.7)-0.5;
        float d2 = (v.x-cx)*(v.x-cx)+(v.y-cy)*(v.y-cy);
        starPt += step(0.965, h) * exp(-d2*1800.0) * (h-0.965)/0.035 * 12.0 * STAR_BRIGHT; }
    // Tier 2: medium
    {   vec2 c = floor(sph*280.0), v = fract(sph*280.0) - 0.5;
        float h = hash12(c + 17.3);
        float cx = fract(h*4.3)-0.5, cy = fract(h*8.1)-0.5;
        float d2 = (v.x-cx)*(v.x-cx)+(v.y-cy)*(v.y-cy);
        starPt += step(0.945, h) * exp(-d2*4000.0) * (h-0.945)/0.055 * 5.0 * STAR_BRIGHT; }
    // Tier 3: faint (common, background density)
    {   vec2 c = floor(sph*460.0), v = fract(sph*460.0) - 0.5;
        float h = hash12(c + 53.1);
        float cx = fract(h*3.7)-0.5, cy = fract(h*9.3)-0.5;
        float d2 = (v.x-cx)*(v.x-cx)+(v.y-cy)*(v.y-cy);
        starPt += step(0.900, h) * exp(-d2*10000.0) * (h-0.900)/0.100 * 2.0 * STAR_BRIGHT; }

    float hue = fract(hash12(floor(sph*180.0)) * 5.31);
    vec3  sc  = mix(vec3(0.80,0.92,1.0), vec3(1.0,0.94,0.78), hue) * starPt;

    vec2  uv = vec2(az*0.15915+0.5, el*0.31831+0.5);
    float neb  = fbm3(uv*2.5) * fbm3(uv*1.8+0.74);
    float neb2 = fbm3(uv*3.2);
    vec3 nebCol = mix(vec3(0.00,0.06,0.25), vec3(0.04,0.14,0.42), neb2);
    float nebP  = noise3D(dir*7.0)*0.28;
    // Deep-space base tint — rich dark navy
    vec3 base = vec3(0.002, 0.008, 0.028);
    return base + sc + nebCol*neb*NEBULA_MIX + vec3(0.28,0.18,0.60)*nebP*PURPLE_AMT;
}

// ── SDF accretion disk emission ───────────────────────────────────────────────
// Called only at y=0 plane crossings — O(1) per ray instead of O(STEPS).

vec3 diskEmit(vec3 cp, vec3 rayDir, float t) {
    float r     = length(cp.xz);
    float rNorm = clamp((r - DISK_INNER) / (DISK_OUTER - DISK_INNER), 0.0, 1.0);

    // ── Soft alpha envelope — smooth inner & outer edges ──────────────────────
    float innerFade = smoothstep(0.0, 0.07, rNorm);
    float outerFade = 1.0 - smoothstep(0.62, 1.0, rNorm); // wide soft outer fade
    float edgeFade  = innerFade * outerFade;

    // ── Keplerian rotation ────────────────────────────────────────────────────
    float omega = OMEGA_SCALE * sqrt(1.5 * RS / max(r*r*r, 0.001));
    float phi   = atan(cp.z, cp.x);
    float ap    = phi - t * omega;

    // ── Saturn-like radial ring bands ─────────────────────────────────────────
    // Multiple harmonic frequencies create concentric bright/dark rings.
    float rB  = 0.60 * (0.5 + 0.5 * cos(rNorm * 6.28318 * RING_FREQ));
    rB += 0.28 * (0.5 + 0.5 * cos(rNorm * 6.28318 * RING_FREQ * 2.85));
    rB += 0.12 * (0.5 + 0.5 * cos(rNorm * 6.28318 * RING_FREQ * 6.60));

    // ── Gas/nebula noise — multi-scale for cloud + filament structure ─────────
    vec2  dc     = vec2(ap * 2.0, log(max(r, 0.01)) * 5.0);
    float n1     = fbm5(dc + t * 0.028);
    float n2     = fbm3(dc * 1.5  + vec2(1.73, 0.0) - t * 0.040);
    float n3     = fbm3(dc * 0.65 + vec2(0.0, t * 0.016));
    float nCloud = fbm3(dc * 0.28 + t * 0.006);           // large gas cloud
    float nWisp  = fbm3(dc * 0.75 + vec2(2.1, 0.0) + t * 0.014); // wispy filaments
    float gasTexture = mix(n1, max(nCloud * 1.3, nWisp * 0.8), 0.45);

    // ── Dust lanes: dark logarithmic spirals separating the rings ─────────────
    float dustPhase = ap * 2.0 + log(max(r, 0.01)) * 2.0 - t * 0.022;
    float dustLane  = max(0.0, cos(dustPhase)) * DUST_LANES * edgeFade;

    // ── Density: ring bands modulated by spiral structure & dust ─────────────
    float spiralMod = 0.5 + SPIRAL * cos(ap * 2.0 + r * 1.4 - t * 0.055);
    float density = rB * ((1.0 - SPIRAL * 0.5) + SPIRAL * 0.5 * spiralMod);
    density = max(0.0, density - dustLane * 0.70) * edgeFade;

    float knots = pow(max(0.0, n2 - 0.40), 1.4) * 8.0 * edgeFade;

    // ── Relativistic Doppler ──────────────────────────────────────────────────
    vec3  tang    = normalize(vec3(-cp.z, 0.0, cp.x));
    float doppler = dot(tang, -rayDir);
    float boost   = pow(max(0.0, 1.0 + 3.2 * doppler), DOPPLER_STR);

    // ── Temperature gradient: white-hot ISCO → warm orange → rust → black ────
    vec3 ci = vec3(5.0, 4.6, 4.0);    // white-hot inner (ISCO region)
    vec3 ch = vec3(4.0, 2.6, 0.55);   // warm cream / gold
    vec3 cm = vec3(2.2, 0.90, 0.10);  // deep orange mid-disk
    vec3 co = vec3(0.55, 0.06, 0.01); // rust-brown outer
    vec3 ce = vec3(0.05, 0.00, 0.00); // near-black edge (alpha out)
    float mid1 = DISK_INNER * 1.40;
    float mid2 = DISK_INNER * 2.60;
    float t1   = smoothstep(DISK_INNER, mid1, r);
    float t2   = smoothstep(mid1, mid2, r);
    float t3   = smoothstep(mid2, DISK_OUTER * 0.72, r);
    float t4   = smoothstep(DISK_OUTER * 0.58, DISK_OUTER, r); // alpha fade to black
    vec3 temp  = mix(mix(mix(ci, ch, t1), cm, t2), co, t3);
    temp       = mix(temp, ce, t4);           // fade to black at outer edge
    temp      *= (1.0 - dustLane * 0.80);    // dust lanes darken/cool the gas

    // ── ISCO ring spike ───────────────────────────────────────────────────────
    float iscoR = DISK_INNER + 0.032;
    float isco  = exp(-pow((r - iscoR) / 0.026, 2.0)) * ISCO_RING;

    // ── Emission assembly ─────────────────────────────────────────────────────
    float em  = density * (0.30 + 0.70 * gasTexture * TURBULENCE) * boost;
          em += density * n2 * 0.28 * TURBULENCE;
          em += isco * 0.68;

    vec3 result = temp * em;
    result += ci * knots * density * n3 * 0.42 * TURBULENCE;
    return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────

void main() {
    vec2  uv = gl_FragCoord.xy / u_resolution;
    float ar = u_resolution.x / u_resolution.y;
    vec2  sc = (uv*2.0-1.0) * vec2(ar,1.0);

    float t = u_time * ANIM_SPEED;

    // Orbiting camera with inclination wobble
    float camAngle   = t * CAM_ORBIT_SPEED;
    float inclWobble = CAM_INCL_AMP * sin(t * CAM_INCL_FREQ);
    float camY = CAM_Y + inclWobble * 0.22;

    vec3 camPos = vec3(sin(camAngle)*CAM_Z, camY, cos(camAngle)*CAM_Z);
    vec3 fwd    = normalize(-camPos);                          // always look at origin
    vec3 rgt    = normalize(cross(fwd, vec3(0.0,1.0,0.0)));
    vec3 camUp  = cross(rgt, fwd);

    vec3 pos        = camPos;
    vec3 dir        = normalize(fwd*FOV + rgt*sc.x + camUp*sc.y);
    vec3 initialDir = dir;

    vec3  color = vec3(0.0);
    float trans = 1.0;
    float prevY = pos.y;   // SDF crossing tracker

    for (int i = 0; i < STEPS; i++) {
        float r  = length(pos);
        float dR = length(pos.xz);

        if (r < RS * 1.05) break;   // event horizon
        if (r > 14.0) break;        // large exit — geodesics complete their arcs

        // ── Physical Schwarzschild null geodesic ──────────────────────────────
        // Step: fine near BH for accurate photon-sphere tracing, coarser far out.
        float step = min(0.038 * r / (1.0 + 9.0 * RS / r), 0.20);

        // Geodesic acceleration: GM/r² toward centre.  BEND_FORCE is a scale factor
        // applied on top of the Schwarzschild formula (allows artistic tuning).
        vec3  toC   = -pos / r;
        float accel = (RS * BEND_FORCE) / (r * r + RS * 0.4);
        dir = normalize(dir + toC * accel * step * 2.0);

        vec3 nextPos = pos + dir * step;

        // ── SDF: detect every disk-plane crossing ─────────────────────────────
        // A geodesic ray can cross y=0 multiple times (direct image, Einstein ring,
        // photon ring etc).  Each crossing accumulates disk emission.
        if (prevY * nextPos.y < 0.0) {
            float alpha = prevY / (prevY - nextPos.y);
            vec3  cp    = pos + dir * step * alpha;
            float cr    = length(cp.xz);

            if (cr >= DISK_INNER && cr <= DISK_OUTER) {
                vec3  em     = diskEmit(cp, dir, t);
                float absorb = DISK_ABSORB * smoothstep(DISK_OUTER, DISK_INNER * 1.5, cr);
                color += trans * em * DISK_BRIGHT;
                trans *= exp(-absorb);
            }
            if (cr < DISK_OUTER * 1.6) {
                color += vec3(1.8, 0.75, 0.20) * (0.06 / (cr + 0.45)) * trans;
            }
        }

        // ── Volumetric: grazing-angle rays inside disk volume ─────────────────
        // Rays traveling nearly horizontally accumulate emission continuously.
        // Complements SDF — essential for edge-on and lensed-arc visibility.
        if (abs(pos.y) < DISK_HEIGHT && dR >= DISK_INNER && dR <= DISK_OUTER) {
            float vFall = exp(-abs(pos.y) / max(DISK_HEIGHT * 0.6, 0.01));
            float dStep = step / (DISK_HEIGHT * 2.0);
            vec3  em    = diskEmit(pos, dir, t);
            color += trans * em * dStep * DISK_VOL_SC * vFall;
            trans *= exp(-DISK_ABSORB * 0.25 * dStep * vFall);
        }

        prevY = nextPos.y;
        pos   = nextPos;
        if (trans < 0.008) break;
    }

    // Analytical photon ring at correct Schwarzschild impact parameter b_c = 2.598*RS
    float ip = length(cross(camPos, initialDir));
    float ring = smoothstep(RS*2.40, RS*2.58, ip)
               * (1.0 - smoothstep(RS*2.58, RS*2.76, ip));
    color += RING_COLOR * ring * RING_BRIGHT;

    // Sky for all non-occluded rays (escaped + step-limited grazing paths)
    color += trans * starBackground(dir);

    // Tone map + vignette + gamma
    color  = color / (1.0 + color*TONEMAP_K);
    color *= max(0.0, 1.0 - length(sc)*0.07);
    gl_FragColor = vec4(pow(max(vec3(0.0), color*u_intensity), vec3(GAMMA)), 1.0);
}`;

// ─── GALAXY / COSMIC SHADER ────────────────────────────────────────────────────
const COSMIC = `precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// COSMIC — SDF Spiral Galaxy
//
// Volumetric spiral galaxy disk. Camera orbits at ~25° inclination giving
// an M31-style view: full disk ellipse + bright core + winding arms.
// SDF disk crossing used for equatorial plane detection (fast).
// ============================================================================
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  TWEAK ME                                                               ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  GALAXY SCALE                                                           ║
// ║    CORE_R      Bulge radius.                                   0.35     ║
// ║    DISK_R      Outer spiral disk radius.                       4.5      ║
// ║    DISK_H      Disk vertical scale height.                     0.18     ║
// ║    SCALE_R     Exponential disk scale length.                  1.8      ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  ARMS                                                                   ║
// ║    N_ARMS      Number of spiral arms.                          2        ║
// ║    ARM_PITCH   Arm tightness. 0.15=tight 0.40=open.           0.25     ║
// ║    ARM_WIDTH   Arm brightness contrast.                        0.75     ║
// ║    ARM_SPEED   Arm rotation speed.                             0.012    ║
// ║    DUST_DEPTH  Dark dust lane depth. 0=none 1=strong.         0.65     ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  BRIGHTNESS                                                             ║
// ║    CORE_BRIGHT Central bulge brightness.                       5.0      ║
// ║    ARM_BRIGHT  Arm emission brightness.                        2.5      ║
// ║    NEBULA_AMT  Pink H-alpha nebula in arms.                    0.55     ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  CAMERA                                                                 ║
// ║    CAM_DIST    Distance from galaxy center.                    7.0      ║
// ║    CAM_INCL    Inclination above disk (radians). 0=edge-on.   0.42     ║
// ║    CAM_SPEED   Orbital speed (slow drift).                     0.010    ║
// ║    FOV         Focal length.                                   0.90     ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  SKY                                                                    ║
// ║    STAR_BRIGHT Background star density.                        2.0      ║
// ║    NEBULA_MIX  Background nebula intensity.                    0.65     ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  OUTPUT                                                                 ║
// ║    TONEMAP_K   Reinhard rolloff.                               0.45     ║
// ║    GAMMA       Display gamma.                                  0.84     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ── Galaxy scale ──────────────────────────────────────────────────────────────
const float CORE_R      = 0.35;
const float DISK_R      = 4.5;
const float DISK_H      = 0.18;
const float SCALE_R     = 1.8;

// ── Arms ──────────────────────────────────────────────────────────────────────
const float ARM_PITCH   = 0.25;
const float ARM_WIDTH   = 0.75;
const float ARM_SPEED   = 0.012;
const float DUST_DEPTH  = 0.65;

// ── Brightness ────────────────────────────────────────────────────────────────
const float CORE_BRIGHT = 12.0;
const float ARM_BRIGHT  = 3.0;
const float NEBULA_AMT  = 0.55;

// ── Camera ────────────────────────────────────────────────────────────────────
const float CAM_DIST    = 7.0;
const float CAM_INCL    = 0.42;
const float CAM_SPEED   = 0.010;
const float FOV         = 0.90;

// ── Sky ───────────────────────────────────────────────────────────────────────
const float STAR_BRIGHT = 2.0;
const float NEBULA_MIX  = 0.65;

// ── Output ────────────────────────────────────────────────────────────────────
const float TONEMAP_K   = 0.45;
const float GAMMA       = 0.84;

// ── Noise ─────────────────────────────────────────────────────────────────────

float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
vec3 hash33(vec3 p){p=fract(p*vec3(0.1031,0.11369,0.13787));p+=dot(p,p.yxz+19.19);return-1.0+2.0*fract(vec3((p.x+p.y)*p.z,(p.x+p.z)*p.y,(p.y+p.z)*p.x));}
float noise3D(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(dot(hash33(i),f),dot(hash33(i+vec3(1,0,0)),f-vec3(1,0,0)),f.x),mix(dot(hash33(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(hash33(i+vec3(1,1,0)),f-vec3(1,1,0)),f.x),f.y),mix(mix(dot(hash33(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(hash33(i+vec3(1,0,1)),f-vec3(1,0,1)),f.x),mix(dot(hash33(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(hash33(i+vec3(1,1,1)),f-vec3(1,1,1)),f.x),f.y),f.z);}
float vn(vec2 p){vec2 i=floor(p),f=p-i;f=f*f*(3.0-2.0*f);return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x),mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x),f.y);}
float fbm3(vec2 p){return 0.500*vn(p)+0.250*vn(p*2.03)+0.125*vn(p*4.07);}
float fbm5(vec2 p){return fbm3(p)+0.0625*vn(p*8.11)+0.03125*vn(p*16.23);}

// ── Star background ───────────────────────────────────────────────────────────

vec3 starBackground(vec3 dir) {
    float stars = pow(max(0.0,noise3D(dir*200.0)),20.0)*STAR_BRIGHT;
    stars      += pow(max(0.0,noise3D(dir*80.0+0.3)),16.0)*STAR_BRIGHT*0.6;
    stars      += pow(max(0.0,noise3D(dir*35.0+0.9)),12.0)*STAR_BRIGHT*0.3;
    float hue   = fract(noise3D(dir*44.0)*6.39);
    vec3 sc     = mix(vec3(0.80,0.90,1.0),vec3(1.0,0.95,0.85),hue)*stars;
    float az=atan(dir.z,dir.x), el=asin(clamp(dir.y,-0.999,0.999));
    vec2  uv=vec2(az*0.15915+0.5, el*0.31831+0.5);
    float neb=fbm3(uv*1.8)*fbm3(uv*1.2+0.6), neb2=fbm3(uv*2.5);
    vec3 nebCol=mix(vec3(0.00,0.01,0.06), vec3(0.04,0.05,0.18), neb2);
    float nebP=noise3D(dir*5.0)*0.25;
    vec3 bg = sc + nebCol*neb*NEBULA_MIX;
    bg += vec3(0.55,0.22,0.88)*nebP*0.35;   // purple accent
    bg += vec3(0.88,0.35,0.55)*fbm3(uv*4.0+0.3)*neb*0.18; // H-alpha
    return bg;
}

// ── Spiral arm density ────────────────────────────────────────────────────────

float spiralArm(float phi, float r, float t) {
    float angle  = t * ARM_SPEED;
    // Two-arm logarithmic spiral
    float arm1   = cos(2.0*(phi - log(max(r,0.01))/ARM_PITCH - angle));
    float arm2   = cos(2.0*(phi - log(max(r,0.01))/ARM_PITCH + angle + 3.14159));
    float arms   = max(arm1, arm2);
    return max(0.0, (arms - (1.0-ARM_WIDTH)) / ARM_WIDTH);
}

// ── Galaxy emission at a disk-plane intersection point ────────────────────────

vec4 galaxyEmit(vec3 cp, float t) {
    float r    = length(cp.xz);
    float absY = abs(cp.y);

    // Vertical falloff
    float h     = max(0.015, DISK_H * (1.0 + r*0.08));
    float vFall = exp(-absY / h);

    // Radial profile: exponential disk + central bulge
    float diskR  = exp(-r / SCALE_R);
    float bulge  = exp(-pow(r / CORE_R, 1.5)) * 3.0;
    float radial = diskR + bulge;

    float phi    = atan(cp.z, cp.x);
    float arm    = spiralArm(phi, r, t);

    // FBM turbulence for clumpy star-forming regions
    vec2 dc = vec2(phi*r*0.8, log(max(r,0.05))*3.5);
    float n1 = fbm5(dc + t*0.008);
    float n2 = fbm3(dc*1.8 + vec2(0.83,0.0) + t*0.005);
    float clump = pow(max(0.0, n1-0.35), 1.4) * 4.0;

    // Dust lanes: dark regions in the disk spiral
    float dustArm = cos(2.0*(phi - log(max(r,0.01))/ARM_PITCH - t*ARM_SPEED + 1.5));
    float dust    = max(0.0, dustArm) * DUST_DEPTH * diskR * (1.0 - exp(-r));

    // Density: arm-modulated disk + bulge
    float density = vFall * (radial * (0.3 + 0.7*arm) - dust*0.5);
    density = max(0.0, density);

    // ── Colours ──────────────────────────────────────────────────────────────
    // Core: warm golden — old Population II stars
    vec3 cCore  = vec3(3.2, 2.0, 0.5);
    // Disk: blue-white — Population I stars
    vec3 cDisk  = vec3(0.9, 1.1, 1.8);
    // Arm peaks: blue-white + H-alpha pink
    vec3 cArm   = vec3(1.2, 1.4, 2.4);
    // H-alpha nebula (star-forming)
    vec3 cHa    = vec3(2.8, 0.5, 0.8);

    float tBulge = smoothstep(1.0, 0.0, r / (CORE_R * 2.5));
    vec3  temp   = mix(mix(cDisk, cArm, arm), cCore, tBulge);

    float em     = density * (0.5 + 0.5*n2) * ARM_BRIGHT;
    float coreEm = bulge * vFall * CORE_BRIGHT;

    vec3 result = temp * em + cCore * coreEm;
    // Nebula emission in arm clumps
    result += cHa * clump * arm * vFall * diskR * NEBULA_AMT;

    // Return rgb + density for absorption
    return vec4(result, density * 0.35);
}

// ── Main ──────────────────────────────────────────────────────────────────────

void main() {
    vec2  uv = gl_FragCoord.xy / u_resolution;
    float ar = u_resolution.x / u_resolution.y;
    vec2  sc = (uv*2.0-1.0) * vec2(ar,1.0);

    float t = u_time;

    // Camera: slow orbit, fixed inclination (M31-style view)
    float camAngle = t * CAM_SPEED;
    float cy = CAM_DIST * sin(CAM_INCL);
    float cz = CAM_DIST * cos(CAM_INCL);
    vec3 camPos = vec3(sin(camAngle)*cz, cy, cos(camAngle)*cz);

    vec3 fwd   = normalize(-camPos);
    vec3 rgt   = normalize(cross(fwd, vec3(0.0,1.0,0.0)));
    vec3 camUp = cross(rgt, fwd);

    vec3 pos = camPos;
    vec3 dir = normalize(fwd*FOV + rgt*sc.x + camUp*sc.y);

    vec3  color = vec3(0.0);
    float trans = 1.0;

    // Straight ray march — no lensing for galaxy
    // Use larger adaptive steps; disk is volumetric but gentle
    float prevY = pos.y;

    const int GSTEPS = 80;
    for (int i = 0; i < GSTEPS; i++) {
        float r = length(pos);
        if (r > 12.0) break;

        // Adaptive step: finer inside galaxy disk, coarser outside
        float distToDisk = max(0.0, abs(pos.y) - DISK_H);
        float step = mix(0.08, 0.35, clamp(distToDisk/1.5, 0.0, 1.0));

        vec3 nextPos = pos + dir*step;

        // ── SDF galaxy disk intersection ──────────────────────────────────────
        if (prevY * nextPos.y < 0.0 && r < DISK_R * 1.1) {
            float alpha = prevY / (prevY - nextPos.y);
            vec3  cp    = pos + dir * step * alpha;
            float cr    = length(cp.xz);

            if (cr < DISK_R) {
                vec4 em4 = galaxyEmit(cp, t);
                color  += trans * em4.rgb;
                trans  *= exp(-em4.w);
            }
        }

        // Volumetric sampling inside the disk plane (for thickness)
        if (abs(pos.y) < DISK_H * 3.0 && r < DISK_R) {
            vec4 em4 = galaxyEmit(pos, t);
            // Weight by how deep inside the disk we are
            float w = exp(-abs(pos.y)/DISK_H) * step * 0.6;
            color  += trans * em4.rgb * w;
            trans  *= exp(-em4.w * w);
        }

        prevY = nextPos.y;
        pos   = nextPos;
        if (trans < 0.008) break;
    }

    // Fallback sky for rays that ran out of steps
    color += trans * starBackground(dir);

    // Tone map + saturation boost (preserves golden core after compression) + gamma
    color  = color / (1.0 + color*TONEMAP_K);
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(lum), color, 1.6);  // restore golden/blue hue lost in tonemap
    color *= max(0.0, 1.0 - length(sc)*0.06);
    gl_FragColor = vec4(pow(max(vec3(0.0), color*u_intensity), vec3(GAMMA)), 1.0);
}`;

// ── Write both shaders ─────────────────────────────────────────────────────────

function writeShader(src, name, glsl) {
    const escaped = glsl.replace(/\r\n/g,'\n').replace(/\n/g,'\\r\\n').replace(/"/g,'\\"');
    const re  = new RegExp('window\\.SHADER_SOURCES\\["' + name + '"\\] = "[\\s\\S]*?";');
    const rep = `window.SHADER_SOURCES["${name}"] = "${escaped}";`;
    if (!re.test(src)) { console.error('Entry not found:', name); process.exit(1); }
    return src.replace(re, rep);
}

src = writeShader(src, 'chaos-shader.glsl',  CHAOS);
src = writeShader(src, 'cosmic-shader.glsl', COSMIC);
fs.writeFileSync(file, src);

const v = fs.readFileSync(file, 'utf8');
console.log('chaos  — SDF crossing:', v.includes('disk-plane crossing'));
console.log('chaos  — STEPS 200:  ', v.includes('STEPS       = 200'));
console.log('cosmic — spiral arm: ', v.includes('spiralArm'));
console.log('cosmic — SDF galaxy: ', v.includes('SDF galaxy disk'));
console.log('File size:', v.length, 'bytes');
console.log('Done.');
