precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// PRODUCTION WATER SHADER - ShaderToy Inspired
// Features: Realistic waves, caustics, bubbles, god rays, depth variation
// ============================================================================

// High-quality hash functions for better randomness
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

// Quintic interpolation for smooth noise
vec2 quintic(vec2 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// High-quality value noise with quintic interpolation
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

// Fractal Brownian Motion for organic patterns
float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for(int i = 0; i < 8; i++) {
        if(i >= octaves) break;
        value += amplitude * valueNoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Voronoi-based caustics
float voronoi(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);

    float minDist = 1.0;

    for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
            vec2 neighbor = vec2(float(i), float(j));
            vec2 point = hash22(n + neighbor);

            // Animate points for flowing caustics
            point = 0.5 + 0.5 * sin(u_time * 0.4 + 6.2831 * point);

            vec2 diff = neighbor + point - f;
            float dist = length(diff);

            if(dist < minDist) {
                minDist = dist;
            }
        }
    }

    return minDist;
}

// Realistic caustics using Voronoi
float caustics(vec2 uv, float time) {
    vec2 p = uv * 5.0;

    // Layer multiple Voronoi patterns with different scales and speeds
    float c1 = voronoi(p + time * 0.1);
    float c2 = voronoi(p * 1.5 - time * 0.15);
    float c3 = voronoi(p * 2.0 + time * 0.08);

    // Combine layers
    float caustic = (c1 + c2 * 0.5 + c3 * 0.25) / 1.75;

    // Sharpen the caustic patterns
    caustic = pow(1.0 - caustic, 3.0);
    caustic = smoothstep(0.3, 0.8, caustic);

    return caustic;
}

// Realistic wave motion using domain warping
float waves(vec2 uv, float time) {
    vec2 p = vec2(uv.x * 12.0, uv.y * 4.0);

    // Primary wave motion
    float wave = fbm(p + vec2(time * 0.3, 0.0), 4);

    // Domain warping for realistic wave deformation
    vec2 warp = vec2(
        fbm(p + vec2(0.0, time * 0.2), 3),
        fbm(p + vec2(time * 0.25, 0.0), 3)
    );

    wave = fbm(p + warp * 1.5, 5);

    return wave;
}

// Rising bubbles with refraction effect
float bubbles(vec2 uv_scaled, vec2 uv, float time) {
    float bubble = 0.0;

    for(int i = 0; i < 8; i++) {
        float fi = float(i);
        float offset = hash12(vec2(fi, 0.0));

        // Stagger bubble timing
        float t = mod(time * 0.12 + offset * 3.0, 3.0) / 3.0;

        // Bubble position with lateral drift
        vec2 bubble_start = vec2(
            hash12(vec2(fi, 1.0)) * 2.0 - 1.0,
            -0.6
        );

        // Add subtle lateral movement
        float drift = sin(time * 0.5 + fi * 2.0 + t * 6.28) * 0.2;
        vec2 bubble_pos = bubble_start + vec2(drift, t * 2.2);

        float dist = length(uv_scaled - bubble_pos);
        float size = 0.015 + hash12(vec2(fi, 2.0)) * 0.025;

        // Bubble core (darker - represents hollow interior)
        float core = smoothstep(size, size * 0.7, dist);

        // Bubble rim (brighter - refraction effect)
        float rim = smoothstep(size, size * 0.9, dist) - smoothstep(size * 1.05, size, dist);
        rim *= 3.0;

        // Fade out as bubble rises
        float fade = (1.0 - t) * smoothstep(0.0, 0.1, t);

        bubble += (rim + core * 0.3) * fade;
    }

    return bubble;
}

// Underwater god rays (subtle)
float godRays(vec2 uv, float time) {
    float angle = uv.x * 10.0 + time * 0.1;
    float rays = sin(angle) * 0.5 + 0.5;
    rays = pow(rays, 4.0);

    // Rays stronger near top
    rays *= smoothstep(0.0, 0.6, uv.y);

    // Subtle variation using noise
    rays *= 0.5 + 0.5 * fbm(vec2(uv.x * 3.0, uv.y * 2.0 + time * 0.05), 3);

    return rays * 0.15;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_scaled = uv * 2.0 - 1.0;
    uv_scaled.x *= u_resolution.x / u_resolution.y;

    // Rich blue-green water color palette with depth variation
    vec3 deep_color = vec3(0.00, 0.08, 0.16);      // #001428
    vec3 mid_color = vec3(0.04, 0.15, 0.25);       // #0a2540
    vec3 light_color = vec3(0.12, 0.23, 0.37);     // #1e3a5f

    // Base color with depth gradient
    float depth = 1.0 - uv.y;
    vec3 base_color = mix(light_color, deep_color, depth * 0.8);

    // Gentle waves at top edge only
    float wave = 0.0;
    if(uv.y > 0.88) {
        float edge_factor = smoothstep(0.88, 0.96, uv.y);
        wave = waves(uv, u_time) * edge_factor * 0.12;
    }

    // Caustics across surface
    float caustic = caustics(uv, u_time);

    // Rising bubbles
    float bubble = bubbles(uv_scaled, uv, u_time);

    // Subtle god rays
    float rays = godRays(uv, u_time);

    // Ambient underwater texture
    float ambient_noise = fbm(uv * 8.0 + u_time * 0.02, 4) * 0.03;

    // Combine all effects
    vec3 color = base_color;

    // Add caustics (subtle bright patterns)
    color += vec3(0.15, 0.25, 0.35) * caustic * 0.08;

    // Add wave brightness at top
    color += vec3(0.08, 0.15, 0.22) * wave;

    // Add bubbles (bright refraction)
    color += vec3(0.3, 0.4, 0.5) * bubble * 0.25;

    // Add god rays
    color += vec3(0.05, 0.1, 0.15) * rays;

    // Add subtle texture
    color += ambient_noise;

    // Apply intensity control
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
