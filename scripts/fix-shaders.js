#!/usr/bin/env node
/**
 * fix-shaders.js
 * Rewrites the 5 shader entries in js/shaders/shader-sources.js
 * with improved GLSL implementations.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const shaderFile = path.join(__dirname, '..', 'js', 'shaders', 'shader-sources.js');

// ─── GLSL SOURCE CODE ────────────────────────────────────────────────────────

const lightGLSL = `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// GOLDEN LIGHT SHADER - Warm volumetric light, dust motes, caustics
// Features: Light beams, floating dust, caustic patterns, warm vignette
// ============================================================================

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec2 quintic(vec2 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = quintic(f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * valueNoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Soft volumetric light beam from upper-right, gently swaying
float lightBeam(vec2 uv, float beamAngle, float beamWidth, float sway, float t) {
    // Beam origin at upper-right
    vec2 origin = vec2(0.75 + sway * 0.03, 1.02);
    vec2 dir = vec2(cos(beamAngle), sin(beamAngle));
    vec2 toUV = uv - origin;
    float along = dot(toUV, dir);
    float perp = length(toUV - dir * along);
    float width = beamWidth + along * 0.08;
    float beam = smoothstep(width, width * 0.3, perp);
    beam *= smoothstep(0.0, 0.15, along);
    beam *= smoothstep(1.2, 0.3, along);
    // Soft noise modulation along beam
    float noiseAlong = fbm(vec2(along * 3.0 + t * 0.05, perp * 8.0), 3);
    beam *= 0.6 + 0.4 * noiseAlong;
    return max(0.0, beam);
}

// Voronoi for caustic patterns
float voronoi(vec2 p, float t) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float d = 1.0;
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash22(n + g);
            o = 0.5 + 0.5 * sin(t * 0.15 + 6.2831 * o);
            float dist = length(g + o - f);
            if (dist < d) d = dist;
        }
    }
    return d;
}

// Dust mote: tiny soft circular particle
float dustMote(vec2 uv, vec2 pos, float sz) {
    float d = length(uv - pos);
    return smoothstep(sz, sz * 0.1, d);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 c = uv * 2.0 - 1.0;
    c.x *= aspect;

    // ── Warm color palette ──────────────────────────────────────────────────
    vec3 warmCream   = vec3(0.96, 0.92, 0.82);
    vec3 sunAmber    = vec3(0.88, 0.68, 0.22);
    vec3 deepGold    = vec3(0.72, 0.52, 0.12);
    vec3 lightStraw  = vec3(0.98, 0.96, 0.88);
    vec3 roseGold    = vec3(0.92, 0.74, 0.48);

    // ── Background warm gradient: warmer top, slightly cooler bottom ────────
    float warmGrad = smoothstep(0.0, 1.0, uv.y);
    vec3 bgColor = mix(warmCream * 0.09, warmCream * 0.06, warmGrad);
    bgColor = mix(bgColor, sunAmber * 0.04, (1.0 - uv.y) * 0.5);

    // ── Slow background FBM for atmospheric depth ────────────────────────
    float bgNoise = fbm(uv * 2.5 + u_time * 0.015, 4);
    float bgNoise2 = fbm(uv * 4.0 - u_time * 0.01, 3);
    bgColor += warmCream * bgNoise * 0.018;
    bgColor += sunAmber * bgNoise2 * 0.010;

    // ── Light beams from upper-right, gently swaying ────────────────────────
    float sway1 = sin(u_time * 0.18) * 0.5;
    float sway2 = sin(u_time * 0.23 + 1.2) * 0.5;
    float sway3 = sin(u_time * 0.13 + 2.8) * 0.5;

    float beam1 = lightBeam(uv, -2.05 + sway1 * 0.02, 0.035, sway1, u_time);
    float beam2 = lightBeam(uv, -2.15 + sway2 * 0.02, 0.025, sway2, u_time);
    float beam3 = lightBeam(uv, -1.95 + sway3 * 0.02, 0.045, sway3, u_time);

    vec3 beamColor = sunAmber * 0.07;
    vec3 beams = beamColor * (beam1 + beam2 * 0.7 + beam3 * 0.5);

    // ── Caustic patterns: sunlight refraction ────────────────────────────
    float v1 = voronoi(uv * 5.5 + vec2(u_time * 0.04, u_time * 0.02), u_time);
    float v2 = voronoi(uv * 8.0 - vec2(u_time * 0.03, u_time * 0.025), u_time);
    float v3 = voronoi(uv * 11.0 + vec2(u_time * 0.02, -u_time * 0.03), u_time);
    float caustic = pow(1.0 - (v1 * 0.5 + v2 * 0.35 + v3 * 0.15), 3.5);
    caustic = smoothstep(0.2, 0.9, caustic) * 0.06;
    // Caustics stronger where beams land
    caustic *= 0.5 + 0.5 * (beam1 + beam2 + beam3);
    vec3 causticColor = mix(sunAmber, lightStraw, 0.5) * caustic;

    // ── Shimmer layers ──────────────────────────────────────────────────
    float shimmer1 = fbm(uv * 7.0 + u_time * 0.04, 4);
    float shimmer2 = fbm(uv * 13.0 - u_time * 0.03, 3);
    float shimmerCombined = shimmer1 * shimmer2;
    vec3 shimmerColor = sunAmber * pow(shimmerCombined, 2.5) * 0.08;

    // ── Midground warm glow from upper-right ─────────────────────────────
    vec2 glowOrigin = vec2(0.72, 1.1);
    float glowDist = length(uv - glowOrigin);
    float midGlow = exp(-glowDist * glowDist * 1.8) * 0.12;
    midGlow *= 0.9 + 0.1 * sin(u_time * 0.4);
    vec3 midGlowColor = mix(lightStraw, sunAmber, 0.4) * midGlow;

    // ── Foreground soft shimmer band ─────────────────────────────────────
    float fgShimmer = fbm(vec2(uv.x * 5.0 + u_time * 0.06, uv.y * 3.0), 3);
    fgShimmer = pow(fgShimmer, 3.0) * 0.04;
    vec3 fgColor = roseGold * fgShimmer;

    // ── Floating dust motes ───────────────────────────────────────────────
    vec3 dustColor = vec3(0.0);
    for (int i = 0; i < 30; i++) {
        float fi = float(i);
        vec2 seed = vec2(fi * 0.137, fi * 0.271);
        // Drift upward slowly, with gentle horizontal oscillation
        float speed = 0.04 + hash12(seed) * 0.04;
        float phase = hash12(seed + 7.3) * 6.28;
        float lifetime = hash12(seed + 13.7) * 6.0;
        float t = mod(u_time * speed + lifetime, 1.0);
        vec2 basePos = vec2(hash12(seed + 1.0), 1.0 - t);
        basePos.x += sin(u_time * 0.2 + phase) * 0.04;
        basePos.x = fract(basePos.x);
        float sz = 0.003 + hash12(seed + 5.0) * 0.006;
        float fade = smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.85, t);
        float mote = dustMote(uv, basePos, sz) * fade;
        // Warm amber tones, very soft
        vec3 moteColor = mix(sunAmber, lightStraw, hash12(seed + 2.0));
        dustColor += moteColor * mote * 0.04;
    }

    // ── Warm amber vignette at edges ─────────────────────────────────────
    float vignette = 1.0 - smoothstep(0.5, 1.2, length(c * vec2(0.8, 1.0)));
    vec3 vignetteColor = deepGold * (1.0 - vignette) * 0.05;

    // ── Temperature shift: warm at top-right, slightly cooler lower-left ─
    float tempShift = uv.x * 0.4 + uv.y * 0.3;
    vec3 tempColor = mix(roseGold * 0.015, sunAmber * 0.01, tempShift);

    // ── Slow pulse ───────────────────────────────────────────────────────
    float pulse = 0.97 + 0.03 * sin(u_time * 0.35);

    // ── Compose ──────────────────────────────────────────────────────────
    vec3 color = bgColor;
    color += beams;
    color += causticColor;
    color += shimmerColor;
    color += midGlowColor;
    color += fgColor;
    color += dustColor;
    color += vignetteColor;
    color += tempColor;
    color *= pulse;
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}`;

const chaosGLSL = `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// INTERSTELLAR BLACK HOLE SHADER - Gravitational lensing, accretion disk
// Features: Einstein ring, multi-band disk, nebula warp, relativistic jets
// ============================================================================

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec2 quintic(vec2 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = quintic(fract(p));
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * valueNoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Gravitational lensing: bends coordinates around black hole
vec2 gravitationalLens(vec2 pos, float mass) {
    float r = length(pos);
    if (r < 0.001) return pos;
    // Schwarzschild-inspired bending: stronger near singularity
    float bend = mass / (r * r + mass * 0.3);
    vec2 deflected = pos + normalize(pos) * (-bend) * r;
    return deflected;
}

// Star field with gravitational distortion
float starField(vec2 uv, float layer, float time) {
    vec2 grid = uv * (90.0 + layer * 60.0);
    vec2 id = floor(grid);
    vec2 local = fract(grid);
    float h = hash12(id + layer * 77.0);
    if (h < 0.88) return 0.0;
    vec2 starPos = vec2(0.5) + (hash22(id + layer * 77.0) - 0.5) * 0.85;
    float dist = length(local - starPos);
    float sz = 0.001 + hash12(id + layer * 77.0 + 5.0) * 0.003;
    float twinkle = 0.5 + 0.5 * sin(time * (1.5 + h * 3.0) + h * 6.28);
    return smoothstep(sz, 0.0, dist) * twinkle;
}

// Background nebula that gets warped
vec3 backgroundNebula(vec2 uv, float time) {
    vec2 p = uv * 1.8;
    float n1 = fbm(p + vec2(time * 0.008, time * 0.005), 5);
    float n2 = fbm(p * 1.4 - vec2(time * 0.006, time * 0.007), 4);
    float n3 = fbm(p * 0.6 + vec2(-time * 0.004, time * 0.003), 3);
    float nval = (n1 * 0.5 + n2 * 0.35 + n3 * 0.15);
    nval = pow(nval, 2.2);
    vec3 nebulaBlue   = vec3(0.02, 0.04, 0.14);
    vec3 nebulaPurple = vec3(0.06, 0.02, 0.12);
    vec3 nebulaRed    = vec3(0.08, 0.01, 0.04);
    vec3 col = mix(nebulaBlue, nebulaPurple, n2);
    col = mix(col, nebulaRed, n3 * 0.4);
    return col * nval * 0.5;
}

// Accretion disk with temperature gradient bands
vec3 accretionDisk(vec2 warped, float r, float angle, float time) {
    // Disk plane flatness
    float diskPlane = abs(warped.y) / (length(warped) + 0.001);
    float flatness  = smoothstep(0.04, 0.0, diskPlane);

    // Disk radial extent — inner hot, mid warm, outer cool
    float diskMask = smoothstep(0.10, 0.18, r) * smoothstep(1.4, 0.5, r);

    if (flatness < 0.001 || diskMask < 0.001) return vec3(0.0);

    // Rotation (prograde) — material orbits inward faster at smaller r
    float orbitalSpeed = 0.25 / (r + 0.05);
    float phi = angle - time * orbitalSpeed;

    // Turbulence in disk
    float diskNoise = fbm(vec2(phi * 2.0, log(r + 0.01) * 5.0) + time * 0.03, 4);
    float diskNoise2 = fbm(vec2(phi * 3.5 + 1.7, r * 8.0) - time * 0.05, 3);
    float turbulence = 0.6 + 0.4 * diskNoise;

    // Doppler boosting: approaching side (left) brighter
    float doppler = 0.5 + 0.5 * sin(phi + 1.57);
    float dopBoost = pow(max(0.0, doppler), 2.5) * 0.7 + 0.3;

    // Temperature bands by radius
    vec3 innerColor  = vec3(1.0, 0.98, 0.92);  // White-hot core
    vec3 midColor    = vec3(1.0, 0.62, 0.12);  // Orange mid
    vec3 outerColor  = vec3(0.6, 0.05, 0.0);   // Deep red outer

    float t = smoothstep(0.10, 0.25, r);
    float t2 = smoothstep(0.25, 0.65, r);
    vec3 diskTemp = mix(innerColor, midColor, t);
    diskTemp = mix(diskTemp, outerColor, t2);

    float brightness = flatness * diskMask * turbulence * dopBoost;
    brightness += flatness * diskMask * diskNoise2 * 0.25;

    return diskTemp * brightness * 0.65;
}

// Relativistic jets: subtle glow above and below
float jetGlow(vec2 pos, float r) {
    // Jets along vertical axis (polar)
    float jetWidth = 0.04;
    float axialDist = abs(pos.x);
    float jetMask = smoothstep(jetWidth, 0.0, axialDist);
    // Only far from disk plane
    float jetVertical = smoothstep(0.1, 0.4, abs(pos.y));
    float jetFade = smoothstep(1.5, 0.3, abs(pos.y));
    return jetMask * jetVertical * jetFade;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 c = uv * 2.0 - 1.0;
    c.x *= aspect;

    float r = length(c);
    float angle = atan(c.y, c.x);

    // ── Gravitational lensing ─────────────────────────────────────────────
    // Warp coordinate space — stronger near center
    float mass = 0.22;
    vec2 lensed = gravitationalLens(c, mass);
    float lr = length(lensed);

    // Einstein ring: photon sphere causes ring of light
    float photonR = 0.15;
    float einsteinRing = exp(-pow((r - photonR * 1.4) / 0.015, 2.0));
    einsteinRing *= 0.6 + 0.4 * fbm(vec2(angle * 3.0, u_time * 0.1), 2);

    // ── Star field behind, distorted by gravity ───────────────────────────
    // Use lensed coordinates for stars so gravity bends their positions
    float stars = 0.0;
    stars += starField(lensed * 0.5, 0.0, u_time * 0.5) * 0.9;
    stars += starField(lensed * 0.7, 1.0, u_time * 0.4) * 0.6;
    stars += starField(lensed * 0.9, 2.0, u_time * 0.3) * 0.4;
    // Stars dim near event horizon (photon capture)
    stars *= smoothstep(0.11, 0.25, r);
    vec3 starColor = vec3(0.9, 0.93, 1.0) * stars;

    // ── Background nebula warped ──────────────────────────────────────────
    vec3 nebula = backgroundNebula(lensed * 0.6 + 0.5, u_time);

    // ── Accretion disk ────────────────────────────────────────────────────
    // Additional spiral domain warp for smoky appearance
    float spiral = angle + log(r + 0.001) * 2.5 - u_time * 0.12;
    vec2 diskUV = vec2(spiral, r);
    vec2 diskWarp = vec2(
        fbm(diskUV * vec2(0.8, 3.0) + u_time * 0.04, 4),
        fbm(diskUV * vec2(1.2, 4.0) - u_time * 0.03, 3)
    );
    vec2 warpedPos = c + diskWarp * 0.04;

    vec3 disk = accretionDisk(warpedPos, length(warpedPos), atan(warpedPos.y, warpedPos.x), u_time);

    // ── Smoky in-fall material ────────────────────────────────────────────
    float infall1 = fbm(vec2(spiral * 0.7, r * 5.0) + u_time * 0.06, 5);
    float infall2 = fbm(vec2(spiral * 1.3 + 3.0, r * 4.0) - u_time * 0.04, 4);
    infall1 *= smoothstep(0.12, 0.35, r) * smoothstep(1.8, 0.4, r);
    infall2 *= smoothstep(0.16, 0.45, r) * smoothstep(2.0, 0.5, r);
    vec3 smokeColor = mix(vec3(0.45, 0.02, 0.0), vec3(0.9, 0.55, 0.0), infall1);
    vec3 smoke = smokeColor * infall1 * 0.18 + mix(vec3(0.4, 0.0, 0.0), vec3(0.8, 0.5, 0.0), infall2) * infall2 * 0.10;

    // ── Relativistic jets ─────────────────────────────────────────────────
    float jet = jetGlow(c, r);
    vec3 jetColor = vec3(0.3, 0.5, 1.0) * jet * 0.12;

    // ── Event horizon shadow ──────────────────────────────────────────────
    float horizon = 0.09;
    float shadow = smoothstep(horizon, horizon + 0.08, r);
    // Time dilation: smooth slowdown of animations near center
    float timeDilationMask = smoothstep(0.0, 0.35, r);

    // ── Background deep space ─────────────────────────────────────────────
    vec3 deepSpace = vec3(0.005, 0.005, 0.015);

    // ── Compose ──────────────────────────────────────────────────────────
    vec3 color = deepSpace;
    color += nebula;
    color += starColor;
    color += smoke;
    color += disk;
    color += vec3(1.0, 0.7, 0.3) * einsteinRing * 0.4;
    color += jetColor;
    color *= shadow;
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}`;

const orderGLSL = `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// WHITE MARBLE SHADER - Veined marble with sacred geometry overlay
// Features: Multi-scale veining, golden flecks, light play, Flower of Life
// ============================================================================

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 quintic(vec2 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = quintic(fract(p));
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * valueNoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Marble vein function: sharp-edged flowing veins
float marbleVein(vec2 p, float scale, float time, float speed) {
    vec2 warp = vec2(
        fbm(p * scale + vec2(time * speed, 0.0), 4),
        fbm(p * scale + vec2(0.0, time * speed * 0.7) + 5.0, 4)
    );
    float v = fbm(p * scale * 0.8 + warp * 1.8, 5);
    // Sharpen into veins using sine trick
    float vein = abs(sin(v * 6.28 * 1.5));
    vein = pow(1.0 - vein, 5.0);
    return vein;
}

// Flower of Life sacred geometry — concentric circles at hexagonal lattice
float flowerOfLife(vec2 uv, float scale) {
    uv = uv * scale;
    // Hexagonal lattice vectors
    vec2 a1 = vec2(1.0, 0.0);
    vec2 a2 = vec2(0.5, 0.8660254);
    // Find nearest hexagonal lattice points (up to ring-1 neighbors)
    float minDist = 1.0;
    for (int i = -2; i <= 2; i++) {
        for (int j = -2; j <= 2; j++) {
            vec2 center = float(i) * a1 + float(j) * a2;
            float d = length(uv - center);
            minDist = min(minDist, d);
        }
    }
    // Circle ring at radius 1.0 from each lattice point
    float ring = abs(minDist - 1.0);
    return smoothstep(0.025, 0.0, ring);
}

// Metatron's Cube: additional line pattern
float metatronLines(vec2 uv, float scale) {
    uv = uv * scale;
    // 6-fold star lines
    float lines = 0.0;
    for (int k = 0; k < 6; k++) {
        float angle = float(k) * 3.14159 / 3.0;
        vec2 dir = vec2(cos(angle), sin(angle));
        float lineDist = abs(dot(uv - dir * 0.5, vec2(-dir.y, dir.x)));
        lines += smoothstep(0.012, 0.0, lineDist) * step(0.0, dot(uv - dir * 0.5, dir)) * step(dot(uv - dir * 1.0, dir), 0.0);
    }
    return clamp(lines, 0.0, 1.0);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 c = uv * 2.0 - 1.0;
    c.x *= aspect;

    // ── Marble color palette ──────────────────────────────────────────────
    vec3 pureWhite  = vec3(0.97, 0.97, 0.98);
    vec3 warmWhite  = vec3(0.95, 0.94, 0.92);
    vec3 coolWhite  = vec3(0.93, 0.93, 0.96);
    vec3 veinGrey   = vec3(0.74, 0.74, 0.80);
    vec3 veinBlue   = vec3(0.70, 0.72, 0.82);
    vec3 goldFleck  = vec3(0.82, 0.70, 0.30);
    vec3 sacredGold = vec3(0.78, 0.68, 0.38);

    // ── Multi-scale marble veining ────────────────────────────────────────
    // Primary veins: large-scale, dominant
    float vein1 = marbleVein(uv, 2.0, u_time, 0.008);
    // Secondary veins: medium-scale, cross-cutting
    float vein2 = marbleVein(uv + vec2(0.3, 0.7), 4.5, u_time, 0.006);
    // Fine veins: hairline detail
    float vein3 = marbleVein(uv + vec2(0.9, 0.2), 9.0, u_time, 0.004);
    // Micro veins: finest texture
    float vein4 = marbleVein(uv + vec2(0.5, 0.5), 18.0, u_time, 0.003);

    // ── Base marble with warm/cool shift ─────────────────────────────────
    float warmCool = smoothstep(0.0, 1.0, uv.x + uv.y * 0.3);
    vec3 baseMarble = mix(warmWhite, coolWhite, warmCool * 0.5);

    // ── Apply veins at different weights ─────────────────────────────────
    vec3 veinColor1 = mix(veinGrey, veinBlue, 0.4);
    vec3 veinColor2 = mix(veinGrey, veinBlue, 0.7);

    vec3 color = baseMarble;
    color = mix(color, veinColor1, vein1 * 0.18);
    color = mix(color, veinColor2, vein2 * 0.12);
    color = mix(color, veinGrey,   vein3 * 0.06);
    color = mix(color, veinBlue,   vein4 * 0.03);

    // ── Golden flecks: very faint, scattered ─────────────────────────────
    float fleckNoise1 = fbm(uv * 22.0 + u_time * 0.003, 2);
    float fleckNoise2 = fbm(uv * 38.0 - u_time * 0.002, 2);
    float fleck = pow(fleckNoise1 * fleckNoise2, 4.0);
    fleck = smoothstep(0.3, 1.0, fleck) * 0.06;
    color = mix(color, goldFleck, fleck);

    // ── Light play: soft directional shadow gradient ──────────────────────
    // Light from upper-left, shadow lower-right
    float lightAngle = dot(normalize(c), normalize(vec2(-0.6, 0.8)));
    float lightPlay = lightAngle * 0.5 + 0.5;
    lightPlay = smoothstep(0.2, 0.8, lightPlay);
    color += pureWhite * lightPlay * 0.018;
    color -= pureWhite * (1.0 - lightPlay) * 0.012;

    // ── Subtle shimmer / movement ─────────────────────────────────────────
    float shimmer = fbm(uv * 15.0 + u_time * 0.02, 3);
    float shimmer2 = fbm(uv * 25.0 - u_time * 0.015, 2);
    float shimmerVal = pow(shimmer * shimmer2, 3.0) * 0.04;
    color += pureWhite * shimmerVal;

    // ── Sacred geometry: Flower of Life, very faint ──────────────────────
    // Animate scale slightly for breathing effect
    float geoScale = 2.8 + 0.05 * sin(u_time * 0.08);
    float fol = flowerOfLife(uv, geoScale);
    float meta = metatronLines(uv, geoScale * 0.5);
    float geo = max(fol, meta * 0.7);
    // Geo is barely perceptible — sacred geometry as hidden structure
    color = mix(color, sacredGold, geo * 0.022);

    // ── Barely-perceptible breathing pulse ──────────────────────────────
    float pulse = 0.998 + 0.002 * sin(u_time * 0.25);

    color *= pulse;
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}`;

const stormGLSL = `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// STORM SHADER - Layered clouds, lightning, rain, wind shear, atmospheric depth
// Features: 4 cloud layers, lightning flashes, angled rain, purple storm tones
// ============================================================================

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec2 quintic(vec2 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = quintic(fract(p));
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * valueNoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Wind-sheared cloud layer
float cloudLayer(vec2 uv, float scale, float speed, float windShear, float time) {
    // Wind stretches clouds horizontally
    vec2 sheared = uv + vec2(uv.y * windShear, 0.0);
    vec2 warp1 = vec2(
        fbm(sheared * scale + vec2(time * speed, 0.0), 4),
        fbm(sheared * scale + vec2(0.0, time * speed * 0.6) + 3.7, 4)
    );
    vec2 warp2 = vec2(
        fbm(sheared * scale * 1.8 + warp1 * 0.8 + vec2(time * speed * 0.7, 0.0), 3),
        fbm(sheared * scale * 1.8 + warp1 * 0.8 + vec2(0.0, time * speed * 0.5) + 7.1, 3)
    );
    float cloud = fbm(sheared * scale * 0.9 + warp2 * 0.6, 5);
    return cloud;
}

// Lightning channel with branching
float lightningChannel(vec2 uv, float seed, float time) {
    float result = 0.0;
    vec2 p = uv;
    float prevX = hash12(vec2(seed, 0.0)) * 0.6 + 0.2;
    // Descend from top in segments
    for (int seg = 0; seg < 8; seg++) {
        float y1 = 1.0 - float(seg) * 0.12;
        float y2 = y1 - 0.12;
        float segSeed = hash12(vec2(seed + float(seg) * 0.17, time * 0.1));
        float nextX = prevX + (segSeed - 0.5) * 0.14;
        nextX = clamp(nextX, 0.1, 0.9);
        // Interpolate along segment
        float t = clamp((uv.y - y2) / (y1 - y2), 0.0, 1.0);
        float boltX = mix(nextX, prevX, t);
        float dist = abs(uv.x - boltX);
        result += smoothstep(0.006, 0.0, dist) * step(y2, uv.y) * step(uv.y, y1);
        // Branch probability
        if (hash12(vec2(seed * 2.3 + float(seg), 1.0)) > 0.6) {
            float branchX = boltX + (hash12(vec2(seed, float(seg) * 0.5)) - 0.5) * 0.2;
            float brachLen = 0.06 + hash12(vec2(seed + 1.0, float(seg))) * 0.08;
            float branchY = mix(y1, y2, 0.5);
            float bt = clamp((uv.y - (branchY - brachLen)) / brachLen, 0.0, 1.0);
            float bx = mix(branchX, boltX, bt);
            float bdist = abs(uv.x - bx);
            result += smoothstep(0.004, 0.0, bdist) * step(branchY - brachLen, uv.y) * step(uv.y, branchY) * 0.5;
        }
        prevX = nextX;
    }
    return clamp(result, 0.0, 1.0);
}

// Rain streak in depth layers
float rainLayer(vec2 uv, float speed, float angle, float density, float time, float layerIdx) {
    float totalRain = 0.0;
    // Slant UV by wind angle
    vec2 slantedUV = vec2(uv.x + uv.y * tan(angle), uv.y);
    int iDensity = int(density);
    for (int i = 0; i < 20; i++) {
        if (i >= iDensity) break;
        float fi = float(i);
        vec2 seed = vec2(fi * 0.137 + layerIdx, fi * 0.271 + layerIdx * 0.5);
        float xOff = hash12(seed) * 2.0 - 1.0;
        float spd = speed + hash12(seed + 0.5) * speed * 0.3;
        float yPhase = fract(slantedUV.y * 0.5 + time * spd + hash12(seed + 1.0) * 4.0);
        float xPos = fract(slantedUV.x + xOff);
        float streak = smoothstep(0.003, 0.0, abs(xPos - 0.5));
        streak *= smoothstep(0.0, 0.03, yPhase) * smoothstep(0.1 + hash12(seed + 2.0) * 0.08, 0.03, yPhase);
        totalRain += streak;
    }
    return clamp(totalRain, 0.0, 1.0);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // ── Storm color palette ───────────────────────────────────────────────
    vec3 deepStorm    = vec3(0.04, 0.04, 0.08);
    vec3 midCloud     = vec3(0.10, 0.10, 0.17);
    vec3 lightCloud   = vec3(0.16, 0.16, 0.26);
    vec3 purpleCloud  = vec3(0.12, 0.08, 0.18);
    vec3 blueGrey     = vec3(0.08, 0.10, 0.16);
    vec3 lightningWht = vec3(0.85, 0.90, 1.00);
    vec3 lightningBlu = vec3(0.55, 0.65, 1.00);
    vec3 rainColor    = vec3(0.40, 0.45, 0.62);

    // ── Layer 1: deep background clouds (slow, large) ─────────────────────
    float layer1 = cloudLayer(uv, 1.5, 0.04, 0.4, u_time);
    // ── Layer 2: main storm clouds (medium speed) ─────────────────────────
    float layer2 = cloudLayer(uv + vec2(0.3, 0.1), 2.8, 0.07, 0.6, u_time);
    // ── Layer 3: fast mid-level clouds (more turbulent) ───────────────────
    float layer3 = cloudLayer(uv + vec2(0.7, 0.5), 5.0, 0.12, 0.8, u_time);
    // ── Layer 4: foreground wisps (fastest, finest detail) ────────────────
    float layer4 = cloudLayer(uv + vec2(0.9, 0.8), 9.0, 0.18, 1.0, u_time);

    // ── Compose cloud layers ─────────────────────────────────────────────
    vec3 cloudColor = deepStorm;
    cloudColor = mix(cloudColor, purpleCloud, layer1 * 0.6);
    cloudColor = mix(cloudColor, midCloud,    layer2 * 0.55);
    cloudColor = mix(cloudColor, blueGrey,    layer2 * layer3 * 0.3);
    cloudColor = mix(cloudColor, lightCloud,  layer3 * 0.35);
    cloudColor += purpleCloud * layer4 * 0.08;
    cloudColor += blueGrey * layer4 * 0.06;

    // ── Atmospheric depth haze at bottom ─────────────────────────────────
    float bottomHaze = smoothstep(0.3, 0.0, uv.y) * 0.5;
    vec3 hazeColor = blueGrey * 0.4;
    cloudColor = mix(cloudColor, hazeColor, bottomHaze);

    // ── Purple/blue storm tinting ────────────────────────────────────────
    float stormTint = fbm(uv * 1.5 + u_time * 0.02, 3);
    cloudColor += purpleCloud * stormTint * 0.04;

    // ── Lightning system ──────────────────────────────────────────────────
    // Flash timing — discrete flash events
    float flashPeriod = 7.0;
    float flashT = mod(u_time, flashPeriod);
    float flashSeed = floor(u_time / flashPeriod);

    // Secondary flash (different period)
    float flashPeriod2 = 11.3;
    float flashT2 = mod(u_time + 3.7, flashPeriod2);
    float flashSeed2 = floor((u_time + 3.7) / flashPeriod2);

    // Flash brightness envelope: sharp rise, exponential decay
    float flashActive = step(0.98, hash12(vec2(flashSeed, 0.0)));
    float flashBright = flashActive * exp(-flashT * 8.0) * step(flashT, 0.5);
    // Rumble: oscillating dim glow after flash
    float rumble = flashActive * exp(-flashT * 1.5) * abs(sin(flashT * 18.0)) * 0.06 * step(0.08, flashT);

    float flashActive2 = step(0.985, hash12(vec2(flashSeed2, 1.0)));
    float flashBright2 = flashActive2 * exp(-flashT2 * 10.0) * step(flashT2, 0.4);
    float rumble2 = flashActive2 * exp(-flashT2 * 1.2) * abs(sin(flashT2 * 14.0)) * 0.05 * step(0.06, flashT2);

    // Lightning bolt channels
    float bolt1 = 0.0;
    float bolt2 = 0.0;
    if (flashActive > 0.5) {
        bolt1 = lightningChannel(uv, flashSeed * 3.7, u_time) * flashBright;
    }
    if (flashActive2 > 0.5) {
        bolt2 = lightningChannel(uv, flashSeed2 * 5.3 + 1.1, u_time) * flashBright2;
    }

    // Cloud illumination from lightning (glow from within)
    float cloudGlow = (flashBright + flashBright2) * (layer2 * 0.5 + layer3 * 0.3) * 0.35;

    // ── Rain layers (3 depths with different angles and speeds) ──────────
    float rain1 = rainLayer(uv, 0.9, -0.25, 15.0, u_time, 0.0);  // Far
    float rain2 = rainLayer(uv, 1.3, -0.30, 12.0, u_time, 1.0);  // Mid
    float rain3 = rainLayer(uv, 1.8, -0.35,  8.0, u_time, 2.0);  // Near (heavier)

    vec3 rainFar  = rainColor * rain1 * 0.08;
    vec3 rainMid  = rainColor * rain2 * 0.12;
    vec3 rainNear = rainColor * rain3 * 0.18;

    // ── Compose final color ───────────────────────────────────────────────
    vec3 color = cloudColor;
    // Lightning bolt and glow
    color += lightningWht * (bolt1 + bolt2);
    color += lightningBlu * cloudGlow;
    color += lightningWht * (rumble + rumble2);
    // Rain at different depths
    color += rainFar;
    color += rainMid;
    color += rainNear;

    // ── Subtle vignette to darken storm edges ─────────────────────────────
    vec2 cv = uv * 2.0 - 1.0;
    float vignette = 1.0 - smoothstep(0.6, 1.4, length(cv * vec2(1.0, 0.8)));
    color *= 0.85 + 0.15 * vignette;

    color *= u_intensity;
    gl_FragColor = vec4(color, 1.0);
}`;

const waterGLSL = `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// OCEAN SHADER - Underwater world with volumetric light, bioluminescence
// Features: Light shafts, marine snow, surface ripples, biolumin, depth fog
// ============================================================================

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec2 quintic(vec2 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = quintic(fract(p));
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * valueNoise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Voronoi cell distance
float voronoi(vec2 p, float time) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float d = 1.0;
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash22(n + g);
            o = 0.5 + 0.5 * sin(time * 0.35 + 6.2831 * o);
            float dist = length(g + o - f);
            if (dist < d) d = dist;
        }
    }
    return d;
}

// Volumetric light shaft from surface above
float lightShaft(vec2 uv, float shaftX, float width, float waviness, float time) {
    // Shaft wiggles horizontally from wave action at surface
    float wiggle = sin(uv.y * 3.0 + time * 0.3 + shaftX * 6.28) * waviness;
    wiggle += sin(uv.y * 7.0 - time * 0.18) * waviness * 0.4;
    float dist = abs(uv.x - shaftX + wiggle);
    // Shaft narrows with depth (less focused deeper)
    float widthAtDepth = width + (1.0 - uv.y) * 0.04;
    float shaft = smoothstep(widthAtDepth, widthAtDepth * 0.2, dist);
    // Attenuate with depth — less light penetrates deep
    shaft *= exp(-(1.0 - uv.y) * 2.5);
    // Shaft intensity modulated by surface waves (passing clouds / ripples)
    float waveMod = fbm(vec2(shaftX * 4.0 + time * 0.12, time * 0.08), 3);
    shaft *= 0.5 + 0.5 * waveMod;
    return shaft;
}

// Surface ripple distortion pattern (viewed from below)
float surfaceRipple(vec2 uv, float time) {
    // Concentric ring patterns for ripples
    float r1 = fbm(uv * 8.0 + time * 0.25, 4);
    float r2 = fbm(uv * 12.0 - time * 0.18, 3);
    float ripple = sin((r1 + r2 * 0.5) * 12.56);
    ripple = ripple * 0.5 + 0.5;
    ripple = pow(ripple, 3.0);
    return ripple;
}

// Bioluminescent glow spot
float bioLumin(vec2 uv, vec2 center, float radius, float pulse) {
    float d = length(uv - center);
    float glow = exp(-d * d / (radius * radius * 2.0));
    return glow * pulse;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 c = uv * 2.0 - 1.0;
    c.x *= aspect;

    // ── Ocean color palette ───────────────────────────────────────────────
    vec3 deepOcean   = vec3(0.0,  0.05,  0.12);
    vec3 midOcean    = vec3(0.02, 0.10,  0.22);
    vec3 shallowBlue = vec3(0.06, 0.18,  0.35);
    vec3 surfaceBlue = vec3(0.12, 0.26,  0.48);
    vec3 lightBeam   = vec3(0.10, 0.22,  0.40);
    vec3 causticBlue = vec3(0.15, 0.32,  0.50);
    vec3 foamWhite   = vec3(0.55, 0.65,  0.75);
    vec3 bioGreen    = vec3(0.02, 0.45,  0.38);
    vec3 bioBlue     = vec3(0.02, 0.35,  0.58);
    vec3 snowWhite   = vec3(0.70, 0.75,  0.80);

    // ── Depth fog effect ──────────────────────────────────────────────────
    // UV.y = 1 is surface, UV.y = 0 is deep
    float depth = 1.0 - uv.y;
    float fogAmount = 1.0 - exp(-depth * 2.0);
    vec3 base = mix(shallowBlue, deepOcean, fogAmount);

    // ── Subtle current-driven FBM for ambient water movement ─────────────
    // Current flows leftward (from right to left)
    vec2 currentUV = uv + vec2(-u_time * 0.015, 0.0);
    float ambient1 = fbm(currentUV * 3.0, 4);
    float ambient2 = fbm(currentUV * 5.5 + 2.3, 3);
    base += midOcean * ambient1 * 0.04;
    base += shallowBlue * ambient2 * 0.02;

    // ── Volumetric light shafts from above ────────────────────────────────
    float shaft1 = lightShaft(uv, 0.30, 0.025, 0.015, u_time);
    float shaft2 = lightShaft(uv, 0.52, 0.018, 0.012, u_time + 1.3);
    float shaft3 = lightShaft(uv, 0.68, 0.030, 0.018, u_time + 2.7);
    float shaft4 = lightShaft(uv, 0.82, 0.015, 0.010, u_time + 0.8);
    float shafts = shaft1 + shaft2 * 0.7 + shaft3 * 0.85 + shaft4 * 0.5;
    // Only in upper portion (light doesn't penetrate far)
    shafts *= smoothstep(0.0, 0.7, uv.y);
    vec3 shaftColor = lightBeam * shafts * 0.35;

    // ── Caustic light patterns ─────────────────────────────────────────────
    float v1 = voronoi(uv * 5.5 + vec2(u_time * 0.06, u_time * 0.03), u_time);
    float v2 = voronoi(uv * 8.0  - vec2(u_time * 0.05, u_time * 0.04), u_time);
    float v3 = voronoi(uv * 12.0 + vec2(u_time * 0.03, -u_time * 0.05), u_time);
    float caustic = pow(1.0 - (v1 * 0.45 + v2 * 0.35 + v3 * 0.20), 4.0);
    caustic = smoothstep(0.25, 0.85, caustic);
    // Caustics only where light shafts reach
    caustic *= smoothstep(0.0, 0.6, uv.y) * 0.15;
    vec3 causticColor = causticBlue * caustic;

    // ── Surface ripple / wave pattern visible from below ──────────────────
    float ripple = surfaceRipple(uv, u_time);
    // Only visible near surface
    float rippleMask = smoothstep(0.75, 1.0, uv.y);
    vec3 rippleColor = surfaceBlue * ripple * rippleMask * 0.20;
    // Foam at very surface
    float foamNoise = fbm(vec2(uv.x * 18.0 + u_time * 0.25, uv.y * 8.0), 3);
    float foam = smoothstep(0.93, 1.0, uv.y) * foamNoise * 0.25;
    vec3 foamColor = foamWhite * foam;

    // ── Marine snow: tiny organic particles drifting with current ────────
    vec3 snowColor = vec3(0.0);
    for (int i = 0; i < 40; i++) {
        float fi = float(i);
        vec2 seed = vec2(fi * 0.113, fi * 0.257);
        float speed = 0.02 + hash12(seed) * 0.025;
        float xDrift = hash12(seed + 5.1) * 0.008;  // Leftward current
        float sway = sin(u_time * 0.15 + fi * 1.23) * 0.008;
        float t = mod(u_time * speed + hash12(seed + 3.0) * 8.0, 1.2) / 1.2;
        // Drift downward (snow falls) with current influence
        vec2 pos = vec2(
            fract(hash12(seed + 1.0) + sway - u_time * xDrift),
            1.0 - t
        );
        float sz = 0.002 + hash12(seed + 7.0) * 0.004;
        float fade = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.9, t);
        float mote = smoothstep(sz, sz * 0.1, length(uv - pos)) * fade;
        // Depth-based visibility: more particles mid-water, few near surface
        float depthVis = smoothstep(0.9, 0.7, uv.y) * smoothstep(0.05, 0.2, uv.y);
        snowColor += snowWhite * mote * depthVis * 0.06;
    }

    // ── Depth fog on particles (distance fade) ────────────────────────────
    // Already handled by depth gradient in base, but enhance further
    vec3 depthFog = deepOcean * fogAmount * 0.3;

    // ── Bioluminescent spots: rare, subtle, blue-green ────────────────────
    vec3 bioColor = vec3(0.0);
    // 5 bioluminescent organisms, slowly drifting
    for (int b = 0; b < 5; b++) {
        float fb = float(b);
        vec2 bSeed = vec2(fb * 0.318, fb * 0.541);
        float bSpeed = 0.008 + hash12(bSeed) * 0.006;
        float bPhase = hash12(bSeed + 2.0) * 6.28;
        // Drift slowly with slight oscillation
        float bx = fract(hash12(bSeed + 1.0) + u_time * bSpeed * 0.3 + sin(u_time * 0.1 + bPhase) * 0.02);
        float by = fract(hash12(bSeed + 3.0) + u_time * bSpeed + cos(u_time * 0.08 + bPhase) * 0.015);
        vec2 bPos = vec2(bx, by);
        // Only in deeper water (below surface)
        float depthMask = smoothstep(0.7, 0.4, by);
        // Pulse gently
        float bPulse = 0.3 + 0.7 * pow(sin(u_time * 0.4 + bPhase) * 0.5 + 0.5, 2.0);
        float bRadius = 0.015 + hash12(bSeed + 4.0) * 0.025;
        float glow = bioLumin(uv, bPos, bRadius, bPulse) * depthMask;
        // Mix between blue and green bioluminescence
        vec3 bioHue = mix(bioBlue, bioGreen, hash12(bSeed + 6.0));
        bioColor += bioHue * glow * 0.12;
    }

    // ── Current flow visualization (through particle drift direction) ──────
    // Already handled via snow particles + shaft wiggle, but add subtle streak
    float currentFlow = fbm(vec2(uv.x * 6.0 - u_time * 0.08, uv.y * 4.0), 3);
    float currentFlow2 = fbm(vec2(uv.x * 10.0 - u_time * 0.06, uv.y * 6.0 + 2.0), 2);
    vec3 currentColor = midOcean * currentFlow * currentFlow2 * 0.025;

    // ── Ambient noise for water texture ───────────────────────────────────
    float ambient = fbm(uv * 9.0 + u_time * 0.025, 4);
    vec3 ambientColor = midOcean * ambient * 0.03;

    // ── Compose all layers ────────────────────────────────────────────────
    vec3 color = base;
    color += depthFog;
    color += shaftColor;
    color += causticColor;
    color += rippleColor;
    color += foamColor;
    color += snowColor;
    color += bioColor;
    color += currentColor;
    color += ambientColor;
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}`;

// ─── BUILD REPLACEMENT LINES ──────────────────────────────────────────────────

function makeShaderLine(name, glslCode) {
    return `window.SHADER_SOURCES["${name}"] = ${JSON.stringify(glslCode.replace(/\n/g, '\r\n'))};`;
}

const replacements = {
    'light-shader.glsl': makeShaderLine('light-shader.glsl', lightGLSL),
    'chaos-shader.glsl': makeShaderLine('chaos-shader.glsl', chaosGLSL),
    'order-shader.glsl': makeShaderLine('order-shader.glsl', orderGLSL),
    'storm-shader.glsl': makeShaderLine('storm-shader.glsl', stormGLSL),
    'water-shader.glsl': makeShaderLine('water-shader.glsl', waterGLSL),
};

// ─── READ, PATCH, WRITE ───────────────────────────────────────────────────────

let source = fs.readFileSync(shaderFile, 'utf8');
const lines = source.split('\n');

let patchCount = 0;
const patched = lines.map((line, idx) => {
    for (const [name, newLine] of Object.entries(replacements)) {
        const prefix = `window.SHADER_SOURCES["${name}"]`;
        if (line.trimStart().startsWith(prefix)) {
            // Preserve any leading whitespace
            const leading = line.match(/^(\s*)/)[1];
            console.log(`  Patching line ${idx + 1}: ${name}`);
            patchCount++;
            return leading + newLine;
        }
    }
    return line;
});

if (patchCount !== 5) {
    console.error(`ERROR: Expected to patch 5 lines but only patched ${patchCount}.`);
    process.exit(1);
}

fs.writeFileSync(shaderFile, patched.join('\n'), 'utf8');
console.log(`\nDone. Patched ${patchCount}/5 shaders in ${shaderFile}`);
