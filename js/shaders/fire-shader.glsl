precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// PRODUCTION FIRE SHADER - ShaderToy Inspired
// Features: Edge flames with domain warping, rising embers, heat shimmer
// ============================================================================

// High-quality hash function
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

// Quintic interpolation
vec2 quintic(vec2 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// Smooth value noise
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

// FBM with variable octaves
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

// Domain-warped fire effect
float firePattern(vec2 uv, float time) {
    // Rising flame motion
    vec2 p = uv;
    p.y -= time * 0.4;

    // Multi-layer domain warping for realistic flame turbulence
    vec2 warp1 = vec2(
        fbm(p * 2.0 + vec2(time * 0.15, 0.0), 4),
        fbm(p * 2.0 + vec2(0.0, time * 0.2), 4)
    );

    vec2 warp2 = vec2(
        fbm(p * 3.0 + warp1 * 1.5 + vec2(time * 0.1, 0.0), 3),
        fbm(p * 3.0 + warp1 * 1.5 + vec2(0.0, time * 0.12), 3)
    );

    // Final fire pattern
    float fire = fbm(p + warp2 * 2.5, 5);

    // Sharpen flame edges
    fire = pow(fire, 1.8);

    // Add flickering
    fire *= 0.85 + 0.15 * sin(time * 8.0 + uv.x * 10.0);

    return fire;
}

// Rising embers with natural drift
float embers(vec2 uv_scaled, float time) {
    float ember = 0.0;

    for(int i = 0; i < 12; i++) {
        float fi = float(i);
        float seed = hash12(vec2(fi, 0.0));

        // Stagger ember timing
        float lifetime = 4.0 + seed * 2.0;
        float t = mod(time * 0.1 + seed * lifetime, lifetime) / lifetime;

        // Starting position
        vec2 start_pos = vec2(
            hash12(vec2(fi, 1.0)) * 2.0 - 1.0,
            -0.7
        );

        // Natural drift using turbulence
        float drift_x = sin(time * 0.3 + fi) * 0.3 + fbm(vec2(fi, time * 0.1), 2) * 0.2;
        float drift_y = t * 2.5;

        vec2 ember_pos = start_pos + vec2(drift_x, drift_y);

        float dist = length(uv_scaled - ember_pos);
        float size = 0.008 + hash12(vec2(fi, 2.0)) * 0.012;

        // Ember core
        float core = smoothstep(size, size * 0.3, dist);

        // Ember glow (larger, softer)
        float glow = smoothstep(size * 4.0, 0.0, dist) * 0.5;

        // Flickering animation
        float flicker = 0.6 + 0.4 * sin(time * 6.0 + fi * 3.0) * sin(time * 4.0 + fi * 2.0);

        // Fade as ember rises
        float fade = (1.0 - pow(t, 0.8)) * smoothstep(0.0, 0.1, t);

        ember += (core + glow) * flicker * fade;
    }

    return ember;
}

// Heat shimmer distortion effect
vec2 heatDistortion(vec2 uv, float time) {
    vec2 distortion = vec2(
        fbm(uv * 6.0 + vec2(time * 0.2, 0.0), 3),
        fbm(uv * 6.0 + vec2(0.0, time * 0.25), 3)
    );

    return (distortion - 0.5) * 0.015;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_scaled = uv * 2.0 - 1.0;
    uv_scaled.x *= u_resolution.x / u_resolution.y;

    // Apply subtle heat distortion
    uv += heatDistortion(uv, u_time);

    // Edge detection - flames only at edges (5-10% from borders)
    float edge_dist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float edge_mask = smoothstep(0.1, 0.05, edge_dist);

    // Fire at edges with domain warping
    float fire_val = 0.0;
    if(edge_mask > 0.01) {
        vec2 fire_uv = uv * 4.0;
        fire_val = firePattern(fire_uv, u_time) * edge_mask;
    }

    // Rising embers throughout
    float ember_val = embers(uv_scaled, u_time);

    // Rich ember color palette
    vec3 base_color = vec3(0.04, 0.07, 0.05);          // #0a0500 (very dark)
    vec3 dark_ember = vec3(0.18, 0.07, 0.0);           // #2d1200 (dark brown)
    vec3 hot_ember = vec3(0.55, 0.15, 0.0);            // #8b2500 (red-orange)
    vec3 bright_ember = vec3(1.0, 0.42, 0.1);          // #ff6b1a (bright orange)

    // Ambient glow
    float ambient_glow = fbm(uv * 3.0 + u_time * 0.05, 3) * 0.02;

    // Build fire color with temperature gradient
    vec3 fire_color = mix(dark_ember, hot_ember, fire_val);
    fire_color = mix(fire_color, bright_ember, pow(fire_val, 2.0));

    // Combine effects
    vec3 color = base_color;

    // Add fire at edges
    color += fire_color * fire_val * 0.25;

    // Add embers with color gradient
    vec3 ember_color = mix(hot_ember, bright_ember, pow(ember_val, 1.5));
    color += ember_color * ember_val * 0.4;

    // Add subtle ambient glow
    color += dark_ember * ambient_glow;

    // Apply intensity control
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
