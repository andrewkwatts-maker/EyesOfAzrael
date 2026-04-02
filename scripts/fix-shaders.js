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

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 5; i++) {
        v += a * valueNoise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 c = uv * 2.0 - 1.0;
    c.x *= u_resolution.x / u_resolution.y;

    vec3 warm = vec3(0.78, 0.66, 0.31);
    vec3 cream = vec3(0.96, 0.94, 0.88);
    vec3 amber = vec3(0.83, 0.66, 0.26);

    float glow = smoothstep(1.5, 0.0, length(c - vec2(0.0, 0.8)));
    glow = pow(glow, 1.5);

    float shimmer = fbm(uv * 6.0 + u_time * 0.03);
    float shimmer2 = fbm(uv * 12.0 - u_time * 0.02);
    float caustic = pow(shimmer * shimmer2, 2.0) * 2.0;

    float pulse = 0.95 + 0.05 * sin(u_time * 0.5);

    vec3 color = cream * 0.08;
    color += warm * glow * 0.12 * pulse;
    color += amber * caustic * 0.04;
    color += warm * shimmer * 0.03;
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}`;

const chaosGLSL = `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 6; i++) {
        v += a * valueNoise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 c = uv * 2.0 - 1.0;
    c.x *= u_resolution.x / u_resolution.y;

    float r = length(c);
    float angle = atan(c.y, c.x);

    // Gravitational lensing distortion
    float bend = 0.3 / (r + 0.3);
    vec2 warped = c * (1.0 + bend * 0.5);
    float wr = length(warped);
    float wa = atan(warped.y, warped.x);

    // Accretion disk - thin ring with doppler shift
    float diskPlane = abs(warped.y) / (wr + 0.01);
    float ring = smoothstep(0.02, 0.0, diskPlane) * smoothstep(0.15, 0.35, wr) * smoothstep(1.2, 0.4, wr);

    // Doppler shift - one side brighter
    float doppler = 0.6 + 0.4 * cos(wa + u_time * 0.3);
    ring *= doppler;

    // Smoky nebula spiraling inward
    float spiral = wa + log(wr + 0.1) * 3.0 - u_time * 0.15;
    float smoke = fbm(vec2(spiral * 0.8, wr * 4.0) + u_time * 0.05);
    smoke *= smoothstep(0.1, 0.3, wr) * smoothstep(1.8, 0.5, wr);

    float smoke2 = fbm(vec2(spiral * 1.2 + 3.0, wr * 3.0) - u_time * 0.03);
    smoke2 *= smoothstep(0.15, 0.4, wr) * smoothstep(2.0, 0.6, wr);

    // Event horizon darkness
    float shadow = smoothstep(0.08, 0.2, r);

    // Colors
    vec3 orange = vec3(1.0, 0.55, 0.0);
    vec3 amber = vec3(1.0, 0.67, 0.0);
    vec3 darkRed = vec3(0.55, 0.0, 0.0);

    vec3 color = vec3(0.0);
    color += amber * ring * 0.5;
    color += mix(darkRed, orange, smoke) * smoke * 0.15;
    color += mix(darkRed, amber, smoke2) * smoke2 * 0.08;
    color *= shadow;
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}`;

const orderGLSL = `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 4; i++) {
        v += a * valueNoise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Marble veining
    vec2 warp = vec2(fbm(uv * 4.0 + u_time * 0.01), fbm(uv * 4.0 + 5.0 - u_time * 0.008));
    float vein = fbm(uv * 3.0 + warp * 1.5);
    vein = smoothstep(0.35, 0.65, vein);

    // Subtle grid
    vec2 grid = sin(uv * 40.0 + u_time * 0.02) * 0.5 + 0.5;
    float gridLine = max(smoothstep(0.98, 1.0, grid.x), smoothstep(0.98, 1.0, grid.y));

    // Base white
    vec3 white = vec3(0.95, 0.95, 0.96);
    vec3 veinColor = vec3(0.88, 0.88, 0.92);

    vec3 color = white;
    color = mix(color, veinColor, vein * 0.04);
    color -= gridLine * 0.02;

    color *= u_intensity;
    gl_FragColor = vec4(color, 1.0);
}`;

const stormGLSL = `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 6; i++) {
        v += a * valueNoise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Rolling storm clouds with domain warping
    vec2 warp1 = vec2(fbm(uv * 3.0 + u_time * 0.08), fbm(uv * 3.0 + 10.0 + u_time * 0.06));
    vec2 warp2 = vec2(fbm(uv * 5.0 + warp1 + u_time * 0.04), fbm(uv * 5.0 + warp1 + 20.0 - u_time * 0.05));
    float clouds = fbm(uv * 2.0 + warp2 * 0.8);
    float clouds2 = fbm(uv * 4.0 + warp1 * 1.2 - u_time * 0.03);

    // Lightning flash - rare and brief
    float t = u_time * 0.7;
    float flash = step(0.992, hash12(vec2(floor(t), 0.0)));
    float flashBright = flash * pow(max(0.0, sin(fract(t) * 12.56)), 8.0);

    // Lightning bolt path
    float bolt = 0.0;
    if(flash > 0.5) {
        vec2 boltUV = uv;
        boltUV.x += fbm(vec2(boltUV.y * 8.0, floor(t))) * 0.15 - 0.075;
        float boltDist = abs(boltUV.x - 0.5 - hash12(vec2(floor(t), 1.0)) * 0.4 + 0.2);
        bolt = smoothstep(0.008, 0.0, boltDist) * step(0.3, uv.y) * step(uv.y, 0.9);
        bolt *= flashBright;
    }

    // Rain streaks
    float rain = 0.0;
    for(int i = 0; i < 12; i++) {
        float fi = float(i);
        vec2 rainUV = uv;
        rainUV.x += hash12(vec2(fi, 0.0)) * 2.0 - 1.0;
        rainUV.y = fract(rainUV.y + u_time * (0.8 + hash12(vec2(fi, 1.0)) * 0.4) + fi * 0.37);
        float streak = smoothstep(0.003, 0.0, abs(rainUV.x - 0.5));
        streak *= smoothstep(0.0, 0.04, rainUV.y) * smoothstep(0.12, 0.04, rainUV.y);
        rain += streak * 0.15;
    }

    // Colors
    vec3 darkSky = vec3(0.05, 0.05, 0.1);
    vec3 cloudColor = vec3(0.12, 0.12, 0.18);
    vec3 lightCloud = vec3(0.18, 0.18, 0.25);

    vec3 color = darkSky;
    color = mix(color, cloudColor, clouds * 0.7);
    color = mix(color, lightCloud, clouds2 * 0.3);
    color += vec3(0.7, 0.75, 0.9) * bolt;
    color += flashBright * 0.08;
    color += vec3(0.4, 0.45, 0.6) * rain;
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}`;

const waterGLSL = `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

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

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 5; i++) {
        v += a * valueNoise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

float voronoi(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float d = 1.0;
    for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash22(n + g);
            o = 0.5 + 0.5 * sin(u_time * 0.4 + 6.2831 * o);
            float dist = length(g + o - f);
            if(dist < d) d = dist;
        }
    }
    return d;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uc = uv * 2.0 - 1.0;
    uc.x *= u_resolution.x / u_resolution.y;

    // Depth gradient
    vec3 deep = vec3(0.0, 0.08, 0.16);
    vec3 mid = vec3(0.04, 0.15, 0.25);
    vec3 light = vec3(0.12, 0.23, 0.37);
    float depth = 1.0 - uv.y;
    vec3 base = mix(light, deep, depth * 0.8);

    // Waves - top 20%
    float wave = 0.0;
    if(uv.y > 0.80) {
        float e = smoothstep(0.80, 0.95, uv.y);
        vec2 wp = vec2(uv.x * 12.0, uv.y * 4.0);
        vec2 warp = vec2(fbm(wp + u_time * 0.2), fbm(wp + 5.0 + u_time * 0.15));
        wave = fbm(wp + warp * 1.5) * e * 0.15;
    }

    // Foam at very top
    float foam = 0.0;
    if(uv.y > 0.93) {
        float fe = smoothstep(0.93, 0.98, uv.y);
        foam = fbm(vec2(uv.x * 20.0 + u_time * 0.3, uv.y * 10.0)) * fe * 0.2;
    }

    // Caustics
    float c1 = voronoi(uv * 5.0 + u_time * 0.1);
    float c2 = voronoi(uv * 7.5 - u_time * 0.15);
    float caustic = pow(1.0 - (c1 + c2 * 0.5) / 1.5, 3.0);
    caustic = smoothstep(0.3, 0.8, caustic);

    // Subtle bubbles - small and numerous
    float bubble = 0.0;
    for(int i = 0; i < 25; i++) {
        float fi = float(i);
        float t = mod(u_time * 0.08 + hash12(vec2(fi, 0.0)) * 4.0, 4.0) / 4.0;
        vec2 bp = vec2(hash12(vec2(fi, 1.0)) * 2.0 - 1.0, -0.8 + t * 2.5);
        bp.x += sin(u_time * 0.3 + fi * 1.7) * 0.1;
        float dist = length(uc - bp);
        float sz = 0.004 + hash12(vec2(fi, 2.0)) * 0.008;
        float rim = smoothstep(sz, sz * 0.8, dist) - smoothstep(sz * 1.1, sz, dist);
        bubble += rim * (1.0 - t) * smoothstep(0.0, 0.1, t);
    }

    // God rays
    float rays = sin(uv.x * 10.0 + u_time * 0.1) * 0.5 + 0.5;
    rays = pow(rays, 4.0);
    rays *= smoothstep(0.0, 0.6, uv.y) * 0.15;
    rays *= 0.5 + 0.5 * fbm(vec2(uv.x * 3.0, u_time * 0.05));

    // Combine
    vec3 color = base;
    color += vec3(0.15, 0.25, 0.35) * caustic * 0.14;
    color += vec3(0.08, 0.15, 0.22) * wave;
    color += vec3(0.5, 0.6, 0.7) * foam;
    color += vec3(0.2, 0.3, 0.4) * bubble * 0.1;
    color += vec3(0.05, 0.1, 0.15) * rays;
    color += fbm(uv * 8.0 + u_time * 0.02) * 0.03;
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
