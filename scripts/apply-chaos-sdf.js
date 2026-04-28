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
// Geometry shared with mobile so both renders look comparable.
const float DISK_INNER  = RS * 3.0;
const float DISK_OUTER  = 7.0;     // wide Saturn-style disk
const float DISK_HEIGHT = 0.24;    // slightly thicker disk for more volume
const float DISK_BRIGHT = 7.0;
const float DISK_VOL_SC = 0.78;    // volumetric scale — lifts lensed below-arc
const float ISCO_RING   = 10.0;
const float TURBULENCE  = 0.72;    // richer wispy texture
const float SPIRAL      = 0.25;
const float DISK_ABSORB = 0.28;
const float ANG_CELLS   = 14.0;    // angular fold cells (must match mobile)

// ── Saturn ring bands & dust lanes ────────────────────────────────────────────
const float RING_FREQ   = 4.0;    // number of bright/dark band cycles
const float DUST_LANES  = 0.50;   // dark lane contrast between rings

// ── Asteroid/dust chunks embedded in disk (folded-space SDF + noise) ──────────
const float CHUNK_DENS  = 0.85;   // density of dark chunk silhouettes inside disk
const float CHUNK_SIZE  = 0.075;  // base chunk radius in fold-cell units
const float CHUNK_DRIFT = 0.05;   // slow tangential drift speed
const float CHUNK_RIM   = 5.0;    // rim-light brightness around each chunk

// ── Physics ───────────────────────────────────────────────────────────────────
const float DOPPLER_STR  = 3.5;
const float OMEGA_SCALE  = 0.42;
const float ANIM_SPEED   = 1.0;

// ── Photon ring (analytical supplement) ───────────────────────────────────────
const float RING_BRIGHT     = 3.0;
const vec3  RING_COLOR      = vec3(0.92, 0.97, 1.0);
const float RING_DOPP_AMP   = 0.55;   // Doppler asymmetry across the ring
const float RING_PERTURB    = 0.014;  // noise scale that breaks the perfect circle

// ── Camera — SHARED with mobile so both renders have comparable framing ──────
const float CAM_Y            = 1.10;   // elevated viewpoint — disk + lensed arc visible
const float CAM_Z            = 7.5;    // pulled back for cinematic Saturn-ring look
const float FOV              = 0.88;
const float CAM_ORBIT_SPEED  = 0.022;
const float CAM_INCL_AMP     = 0.30;
const float CAM_INCL_FREQ    = 0.012;
const float CAM_AXIS_TILT    = 0.20;   // ~11° tilt of orbital plane (off-kilter)
const float CAM_ROLL_AMP     = 0.10;   // camera roll wobble (radians)
const float CAM_ROLL_FREQ    = 0.014;

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

// ── Seamless angular coordinate ───────────────────────────────────────────────
// Maps an angle to (cos,sin)*scale.  Sampling noise at this 2D coord wraps
// continuously around the disk — no atan() ±π seam, no spaghetti drift.
vec2 angC(float ang, float scale){ return vec2(cos(ang), sin(ang)) * scale; }
// Bounded time oscillation — replaces linear t*k drift in noise offsets so
// the texture doesn't slowly fold into spaghetti over long sessions.
vec2 tWobble(float t, float freq, float amp){ return vec2(sin(t*freq), cos(t*freq*1.13)) * amp; }

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

    // ── Gas/nebula noise — SEAMLESS angular sampling (no atan ±π wrap) ────────
    // angC(ap, k) = (cos*k, sin*k) — wraps continuously around the disk.
    // tWobble bounded oscillation — replaces linear t drift that caused spaghetti.
    float lr = log(max(r, 0.01));
    vec2  ac1   = angC(ap, 1.6) + vec2(0.0, lr * 5.0) + tWobble(t, 0.05, 0.7);
    vec2  ac2   = angC(ap, 2.4) + vec2(1.73, lr * 7.5) + tWobble(t, 0.07, 0.6);
    vec2  ac3   = angC(ap, 1.0) + vec2(0.0, lr * 3.2) + tWobble(t, 0.03, 0.5);
    vec2  acC   = angC(ap, 0.45) + vec2(0.0, lr * 1.5) + tWobble(t, 0.02, 0.3); // big cloud
    float n1     = fbm5(ac1);
    float n2     = fbm3(ac2);
    float n3     = fbm3(ac3);
    float nCloud = fbm3(acC);
    // Wispy filaments — high RADIAL frequency, low ANGULAR (tangential streaks).
    vec2  wisp1C = angC(ap, 0.55) + vec2(0.0, lr * 9.0) + tWobble(t, 0.04, 0.6);
    vec2  wisp2C = angC(ap, 0.80) + vec2(2.1, lr * 11.5) + tWobble(t, 0.05, 0.5);
    float wispBase = fbm5(wisp1C);
    float wispFine = fbm3(wisp2C);
    float nWisp = pow(max(0.0, wispBase - 0.30), 1.6) * (0.55 + 0.85 * wispFine);
    float gasTexture = mix(n1, max(nCloud * 1.3, nWisp * 1.4), 0.45);

    // ── Dust lanes: dark logarithmic spirals — periodic in cos(ap), no seam ───
    float dustPhase = ap * 2.0 + lr * 2.0 - t * 0.02;
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

    // ── Temperature gradient — Interstellar-style sepia/copper palette ────────
    // High contrast: hot white-ivory inner, dim copper/brown body so wisps pop.
    vec3 ci = vec3(5.5, 4.6, 3.4);    // very hot ivory-white inner
    vec3 ch = vec3(3.0, 2.0, 0.85);   // golden cream (dimmer)
    vec3 cm = vec3(1.6, 0.85, 0.28);  // copper mid-disk (dimmer)
    vec3 co = vec3(0.72, 0.30, 0.08); // rust/sepia outer
    vec3 ce = vec3(0.20, 0.08, 0.02); // deep brown edge (alpha out)
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
    // Bright streaky filaments — hot copper-white tendrils riding on top
    result += vec3(2.6, 1.75, 0.65) * nWisp * density * 1.45 * boost * edgeFade;
    // Cooler brown dust layer — adds the sepia "dirty gas" character
    result += vec3(1.5, 0.95, 0.42) * pow(wispBase, 1.1) * density * 0.55 * edgeFade;
    // Dark dust modulator — punches in shadowy striations between bright wisps
    float dustMod = pow(max(0.0, 0.5 - wispBase), 1.4) * 1.2;
    result *= 1.0 - dustMod * 0.32 * edgeFade;

    // ── Folded-space chunk silhouettes embedded in disk ────────────────────────
    // Domain-replicated SDF spheres in a wrap-aware azimuthal grid.
    // Angular cells: ANG_CELLS divisions of [0, 2π); cell index wraps modulo
    // ANG_CELLS so neighbours across the seam (cell -1 ≡ cell ANG_CELLS-1)
    // hash to the same chunk — no wrap-line artifact.
    float angU = ap * (ANG_CELLS / 6.28318);            // angular cell coord
    float radU = lr * 4.0;                              // radial cell coord
    float angI = floor(angU);
    float radI = floor(radU);
    vec2 cellLocal = vec2(fract(angU), fract(radU)) - 0.5;
    float chunkMask = 0.0;
    for (int dy = -1; dy <= 1; dy++) {
        for (int dx = -1; dx <= 1; dx++) {
            // Wrap angular index modulo ANG_CELLS for hash consistency across seam
            float nAng = mod(angI + float(dx) + ANG_CELLS, ANG_CELLS);
            float nRad = radI + float(dy);
            vec2  nid  = vec2(nAng, nRad);
            float h1 = hash12(nid * 7.13);
            float h2 = hash12(nid * 11.37 + 3.7);
            float h3 = hash12(nid * 17.91 - 1.3);
            // Sub-cell position offset (relative to neighbour)
            vec2 off = vec2(h1 - 0.5, h2 - 0.5) * 0.7 + vec2(float(dx), float(dy));
            // Bounded chunk drift — oscillates instead of accumulating linearly
            vec2 drift = vec2(sin(t * CHUNK_DRIFT * (h1 + 0.3)),
                              cos(t * CHUNK_DRIFT * (h2 + 0.4))) * 0.08;
            float radius = CHUNK_SIZE * (0.4 + 1.6 * h3);
            float exists = step(0.45, h1 * h2);
            float d = length(cellLocal - off - drift) - radius;
            chunkMask = max(chunkMask, exists * (1.0 - smoothstep(0.0, radius * 0.4, d)));
        }
    }
    chunkMask *= edgeFade;
    // Apply: darken disk where chunk silhouette sits, add hot rim from surrounding gas
    result *= 1.0 - chunkMask * CHUNK_DENS;
    float rim = chunkMask * (1.0 - chunkMask) * 4.0;
    result += vec3(2.6, 1.6, 0.55) * rim * CHUNK_RIM * boost * edgeFade;
    return result;
}

// ── Radiance cascade — sample disk emission along geodesic-approximated rays ─
// Approximates the disk-light field at any point in space.  Used both for
// asteroid illumination and for volumetric god-ray scattering in nearby fog.
// Cheap analytical model: the disk midplane glows brightest at r=DISK_INNER..OUTER,
// and the geodesic bend near the BH means light wraps further than straight-line.
vec3 radianceAt(vec3 pt, float t) {
    vec3 acc = vec3(0.0);
    // 6 cardinal samples around the midplane circle (azimuthal cascade)
    for (int k = 0; k < 6; k++) {
        float a = float(k) * 1.04719755 + t * 0.012; // 60° steps + slow rotation
        float sR = (DISK_INNER + DISK_OUTER) * 0.5;
        vec3  src = vec3(cos(a) * sR, 0.0, sin(a) * sR);
        // Approximate disk-emission colour at sample (without doppler — cheap)
        vec3 srcCol = diskEmit(src, normalize(pt - src), t) * DISK_BRIGHT;
        // Distance-falloff with a soft floor (geodesic-bent light reaches further)
        float d = length(src - pt);
        float falloff = 1.0 / (0.6 + d * d * 0.7);
        acc += srcCol * falloff;
    }
    // Vertical bias — points above/below the disk receive less direct light
    float vAtten = exp(-abs(pt.y) * 1.5);
    return acc * vAtten * 0.10;
}

// (Foreground asteroid silhouettes removed — chunks are now embedded in the
//  disk via folded-space SDF inside diskEmit.)

// ── Main ──────────────────────────────────────────────────────────────────────

void main() {
    vec2  uv = gl_FragCoord.xy / u_resolution;
    float ar = u_resolution.x / u_resolution.y;
    vec2  sc = (uv*2.0-1.0) * vec2(ar,1.0);

    float t = u_time * ANIM_SPEED;

    // Orbiting camera — tilted orbital plane + roll wobble (off-kilter framing)
    float camAngle   = t * CAM_ORBIT_SPEED;
    float inclWobble = CAM_INCL_AMP * sin(t * CAM_INCL_FREQ);
    float camY       = CAM_Y + inclWobble * 0.22;

    // Base orbit on horizontal plane
    vec3 baseOrbit = vec3(sin(camAngle)*CAM_Z, camY, cos(camAngle)*CAM_Z);

    // Tilt the orbital plane around the X axis — disk now sits askew in frame
    float ct = cos(CAM_AXIS_TILT), st = sin(CAM_AXIS_TILT);
    vec3 camPos = vec3(
        baseOrbit.x,
        baseOrbit.y * ct - baseOrbit.z * st,
        baseOrbit.y * st + baseOrbit.z * ct
    );

    vec3 fwd = normalize(-camPos);                                // look at origin

    // Roll oscillation — camera not held perfectly upright
    float roll  = CAM_ROLL_AMP * sin(t * CAM_ROLL_FREQ);
    vec3  worldUp = vec3(sin(roll), cos(roll), 0.0);
    vec3 rgt    = normalize(cross(fwd, worldUp));
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

        // ── God rays / volumetric scattering ──────────────────────────────────
        // Outside the disk volume, sample radiance cascade every ~8 steps for
        // cheap god-ray glow.  Light shafts catch in the dust around the BH.
        if (mod(float(i), 8.0) < 0.5 && r < 9.0 && r > RS * 1.5) {
            vec3  scatter = radianceAt(pos, t);
            float fogDens = 0.020 * exp(-abs(pos.y) * 0.7) * smoothstep(9.0, 2.0, r);
            color += trans * scatter * fogDens * step * 8.0;
        }

        prevY = nextPos.y;
        pos   = nextPos;
        if (trans < 0.008) break;
    }

    // ── Photon ring (analytical) — Doppler-modulated, perturbed, with sub-ring ──
    // Critical impact parameter b_c = 3√3/2 · RS ≈ 2.598·RS
    float ip = length(cross(camPos, initialDir));
    // Perturb the radius slightly with directional noise so it isn't a perfect circle.
    float ipNoise = (fbm3(initialDir.xy * 11.0 + t * 0.04) - 0.5) * 2.0;
    float ipMod   = ip + RING_PERTURB * ipNoise * RS;
    // Doppler asymmetry: bright on the side of the disk rotating toward us.
    vec3  ringPlaneN = normalize(cross(camPos, vec3(0.0, 1.0, 0.0)));
    float ringDopp   = dot(initialDir, ringPlaneN);              // -1..+1 across ring
    float ringBoost  = pow(max(0.30, 1.0 + RING_DOPP_AMP * ringDopp), 2.4);
    // n=1 main ring + n=2 sub-ring closer to critical b_c
    float r1 = smoothstep(RS*2.40, RS*2.58, ipMod)
             * (1.0 - smoothstep(RS*2.58, RS*2.76, ipMod));
    float r2 = smoothstep(RS*2.575, RS*2.595, ipMod)
             * (1.0 - smoothstep(RS*2.595, RS*2.615, ipMod));
    // Slight hue shift across ring — Doppler blue/red shift cue
    vec3 ringColShift = mix(vec3(1.05, 0.92, 0.72),
                            vec3(0.78, 0.92, 1.10),
                            ringDopp * 0.5 + 0.5);
    color += ringColShift * RING_COLOR * (r1 + r2 * 1.6) * RING_BRIGHT * ringBoost;

    // Sky for all non-occluded rays (escaped + step-limited grazing paths)
    color += trans * starBackground(dir);

    // Tone map + vignette + gamma
    color  = color / (1.0 + color*TONEMAP_K);
    color *= max(0.0, 1.0 - length(sc)*0.07);
    gl_FragColor = vec4(pow(max(vec3(0.0), color*u_intensity), vec3(GAMMA)), 1.0);
}`;

// ─── CHAOS MOBILE — stripped-down for low-power devices ───────────────────────
// Cuts: STEPS 200→70, no asteroids, no radiance cascades / god rays,
// no n=2 sub-ring, no volumetric sampling, no off-kilter camera, no wisp
// emission, single-noise gas, smaller exit radius. Targets ~60fps on phones.
const CHAOS_MOBILE = `precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_intensity;

const float RS          = 0.22;
const float BEND_FORCE  = 4.5;
const int   STEPS       = 100;         // mobile budget (vs 200 desktop)

const float DISK_INNER  = RS * 3.0;
const float DISK_OUTER  = 7.0;         // wider Saturn-ring
const float DISK_HEIGHT = 0.22;
const float DISK_BRIGHT = 7.0;
const float ISCO_RING   = 10.0;
const float TURBULENCE  = 0.70;
const float DISK_ABSORB = 0.30;

const float DOPPLER_STR = 3.5;
const float OMEGA_SCALE = 0.42;
const float ANIM_SPEED  = 1.0;
const float RING_BRIGHT = 3.0;

// SHARED camera params — match desktop so the two renders look comparable.
const float CAM_Y           = 1.10;
const float CAM_Z           = 7.5;
const float FOV             = 0.88;
const float CAM_ORBIT_SPEED = 0.022;
const float CAM_TILT        = 0.20;
const float CAM_ROLL        = 0.10;

const float STAR_BRIGHT = 4.0;
const float TONEMAP_K   = 0.44;
const float GAMMA       = 0.80;

float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float vn(vec2 p){vec2 i=floor(p),f=p-i;f=f*f*(3.0-2.0*f);return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x),mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x),f.y);}
float fbm3(vec2 p){return 0.5*vn(p)+0.25*vn(p*2.03)+0.125*vn(p*4.07);}

// Seamless angular sampler — wraps continuously, no atan ±π seam
vec2 angC(float a, float k){ return vec2(cos(a), sin(a))*k; }
// Bounded time wobble — replaces linear t-drift in noise offsets
vec2 tWob(float t, float f, float a){ return vec2(sin(t*f), cos(t*f*1.13))*a; }

vec3 starBg(vec3 dir){
    float az=atan(dir.z,dir.x), el=asin(clamp(dir.y,-0.999,0.999));
    vec2 sph=vec2(az,el);
    float pt=0.0;
    {vec2 c=floor(sph*200.0),v=fract(sph*200.0)-0.5;float h=hash12(c+0.71);
     float cx=fract(h*7.1)-0.5,cy=fract(h*13.7)-0.5;
     float d2=(v.x-cx)*(v.x-cx)+(v.y-cy)*(v.y-cy);
     pt+=step(0.95,h)*exp(-d2*2200.0)*(h-0.95)/0.05*8.0*STAR_BRIGHT;}
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
    float lr = log(max(r, 0.01));
    // SEAMLESS noise sampling — no atan ±π wrap, no spaghetti drift
    float gas  = fbm3(angC(ap, 1.6) + vec2(0.0, lr*5.0) + tWob(t, 0.05, 0.7));
    float wisp = fbm3(angC(ap, 0.55) + vec2(0.0, lr*9.0) + tWob(t, 0.04, 0.6));
    float wispH = pow(max(0.0, wisp - 0.32), 1.4);
    float density = rB * ef;
    vec3  tang = normalize(vec3(-cp.z,0.0,cp.x));
    float dop  = dot(tang,-rd);
    float boost= pow(max(0.0,1.0+3.2*dop), DOPPLER_STR);
    // Sepia/copper temperature gradient — same palette as desktop for consistency
    vec3 ci=vec3(5.5,4.6,3.4), cm=vec3(1.6,0.85,0.28), co=vec3(0.72,0.30,0.08), ce=vec3(0.20,0.08,0.02);
    float t1 = smoothstep(DISK_INNER, DISK_INNER*2.6, r);
    float t2 = smoothstep(DISK_INNER*2.0, DISK_OUTER*0.72, r);
    float t3 = smoothstep(DISK_OUTER*0.58, DISK_OUTER, r);
    vec3 temp = mix(mix(ci, cm, t1), co, t2);
    temp = mix(temp, ce, t3);
    float iscoR = DISK_INNER + 0.032;
    float isco  = exp(-pow((r-iscoR)/0.026, 2.0)) * ISCO_RING;
    float em = density * (0.30 + 0.70*gas*TURBULENCE) * boost + isco * 0.7;
    vec3 result = temp * em;
    // Hot copper-white wisps + cool brown dust — matches desktop tone
    result += vec3(2.6, 1.75, 0.65) * wispH * density * 1.45 * boost * ef;
    result += vec3(1.5, 0.95, 0.42) * pow(wisp, 1.1) * density * 0.55 * ef;
    // Dark dust modulator — shadowy striations for richer texture
    float dustMod = pow(max(0.0, 0.5 - wisp), 1.4) * 1.2;
    result *= 1.0 - dustMod * 0.32 * ef;
    return result;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float ar = u_resolution.x / u_resolution.y;
    // Aspect-aware: in portrait, expand vertical so BH stays centred and disk fits.
    vec2 sc = ar > 1.0 ? (uv*2.0-1.0) * vec2(ar, 1.0)
                       : (uv*2.0-1.0) * vec2(1.0, 1.0/ar);
    // (no off-centre offset — shared framing with desktop)
    float t = u_time * ANIM_SPEED;
    float a = t * CAM_ORBIT_SPEED;
    // Inclined (non-planar) orbit — tilts the orbital plane around X axis
    vec3 base = vec3(sin(a)*CAM_Z, CAM_Y, cos(a)*CAM_Z);
    float ct = cos(CAM_TILT), st = sin(CAM_TILT);
    vec3 camPos = vec3(base.x, base.y*ct - base.z*st, base.y*st + base.z*ct);
    vec3 fwd = normalize(-camPos);
    // Roll camera around its forward axis
    float cR = cos(CAM_ROLL), sR = sin(CAM_ROLL);
    vec3 worldUp = vec3(sR, cR, 0.0);
    vec3 rgt = normalize(cross(fwd, worldUp));
    vec3 up  = cross(rgt, fwd);
    vec3 pos = camPos;
    vec3 dir = normalize(fwd*FOV + rgt*sc.x + up*sc.y);
    vec3 color = vec3(0.0);
    float trans = 1.0;
    float prevY = pos.y;
    for(int i=0; i<STEPS; i++){
        float r  = length(pos);
        float dR = length(pos.xz);
        if(r < RS*1.05) break;
        if(r > 13.0) break;       // exit > camera distance + disk extent
        float step = min(0.05 * r / (1.0 + 8.0*RS/r), 0.25);
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
        // Cheap volumetric: grazing-angle rays inside disk volume — adds Einstein-ring visibility
        if(abs(pos.y) < DISK_HEIGHT && dR >= DISK_INNER && dR <= DISK_OUTER){
            float vF = exp(-abs(pos.y)/(DISK_HEIGHT*0.6));
            float dS = step / (DISK_HEIGHT*2.0);
            color += trans * diskEmit(pos, dir, t) * dS * 0.45 * vF;
            trans *= exp(-DISK_ABSORB * 0.20 * dS * vF);
        }
        prevY = nextPos.y;
        pos = nextPos;
        if(trans < 0.01) break;
    }
    float ip = length(cross(camPos, normalize(fwd*FOV + rgt*sc.x + up*sc.y)));
    float ring = smoothstep(RS*2.40, RS*2.58, ip) * (1.0 - smoothstep(RS*2.58, RS*2.76, ip));
    color += vec3(0.92, 0.97, 1.0) * ring * RING_BRIGHT;
    color += trans * starBg(dir);
    color = color / (1.0 + color*TONEMAP_K);
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
    if (re.test(src)) {
        return src.replace(re, rep);
    }
    // Entry not found — append it just before the export/footer.
    console.log('Entry not found, appending:', name);
    return src.replace(/(\n\/\/ === END SHADER SOURCES ===|$)/, `\n${rep}\n$1`);
}

src = writeShader(src, 'chaos-shader.glsl',         CHAOS);
src = writeShader(src, 'chaos-mobile-shader.glsl',  CHAOS_MOBILE);
src = writeShader(src, 'cosmic-shader.glsl',        COSMIC);
fs.writeFileSync(file, src);

const v = fs.readFileSync(file, 'utf8');
console.log('chaos  — SDF crossing: ', v.includes('disk-plane crossing'));
console.log('chaos  — STEPS 200:    ', v.includes('STEPS       = 200'));
console.log('chaos  — radiance:     ', v.includes('radianceAt'));
console.log('chaos  — chunks SDF:   ', v.includes('Folded-space chunk silhouettes'));
console.log('mobile — present:      ', v.includes('chaos-mobile-shader.glsl'));
console.log('cosmic — spiral arm:   ', v.includes('spiralArm'));
console.log('cosmic — SDF galaxy:   ', v.includes('SDF galaxy disk'));
console.log('File size:', v.length, 'bytes');
console.log('Done.');
