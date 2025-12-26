precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// PRODUCTION DARK SHADER - ShaderToy Inspired
// Features: Flowing shadows, wispy particles, void/cosmic effect, parallax depth
// ============================================================================

// High-quality hash functions
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

// FBM for organic shadow patterns
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

// Domain-warped flowing shadows
float flowingShadows(vec2 uv, float time) {
    vec2 p = uv * 4.0;

    // Create flowing motion with domain warping
    vec2 warp1 = vec2(
        fbm(p + vec2(time * 0.05, 0.0), 3),
        fbm(p + vec2(0.0, time * 0.06), 3)
    );

    vec2 warp2 = vec2(
        fbm(p + warp1 * 2.0 + vec2(time * 0.03, 0.0), 4),
        fbm(p + warp1 * 2.0 + vec2(0.0, time * 0.04), 4)
    );

    // Final shadow pattern
    float shadows = fbm(p + warp2 * 3.0, 5);

    return shadows;
}

// Wispy dark particles with smooth movement
float wispyParticles(vec2 uv_scaled, float time) {
    float particles = 0.0;

    for(int i = 0; i < 15; i++) {
        float fi = float(i);
        float seed = hash12(vec2(fi, 0.0));

        // Long lifetime for slow, smooth movement
        float lifetime = 6.0 + seed * 4.0;
        float t = mod(time * 0.06 + seed * lifetime, lifetime) / lifetime;

        // Starting position
        vec2 start_pos = vec2(
            hash12(vec2(fi, 1.0)) * 2.0 - 1.0,
            -0.8
        );

        // Smooth sine wave drift
        float drift_x = sin(time * 0.2 + fi * 2.0) * 0.4;
        float drift_y = t * 2.8;

        // Add turbulence
        drift_x += fbm(vec2(fi, time * 0.1), 2) * 0.3;

        vec2 particle_pos = start_pos + vec2(drift_x, drift_y);

        float dist = length(uv_scaled - particle_pos);
        float size = 0.02 + hash12(vec2(fi, 2.0)) * 0.04;

        // Wispy particle (very soft, elongated)
        float wisp = smoothstep(size * 2.0, 0.0, dist);

        // Add elongated tail
        float tail_offset = sin(time * 0.5 + fi) * 0.1;
        float tail_dist = length(uv_scaled - particle_pos - vec2(tail_offset, -0.2));
        wisp += smoothstep(size * 3.0, 0.0, tail_dist) * 0.5;

        // Smooth fade in/out
        float fade = sin(t * 3.14159);
        fade = pow(fade, 0.7);

        particles += wisp * fade;
    }

    return particles;
}

// Dimmed star field for background depth
float dimStars(vec2 uv, float layer) {
    vec2 grid = uv * (80.0 + layer * 60.0);
    vec2 id = floor(grid);
    vec2 local = fract(grid);

    float star = 0.0;
    float h = hash12(id + layer * 50.0);

    // Very sparse stars
    if(h > 0.96) {
        vec2 star_pos = vec2(0.5) + (hash22(id + layer * 50.0) - 0.5) * 0.9;
        float dist = length(local - star_pos);
        float size = 0.001 + h * 0.002;

        // Very subtle twinkle
        float twinkle = 0.6 + 0.4 * sin(u_time * 1.5 + h * 6.28);

        star = smoothstep(size, 0.0, dist) * twinkle;
    }

    return star;
}

// Void/cosmic depth effect with parallax
vec3 voidEffect(vec2 uv, float time) {
    // Multiple parallax layers for depth
    float layer1 = flowingShadows(uv * 0.8 + time * 0.02, time);
    float layer2 = flowingShadows(uv * 1.2 - time * 0.015, time);
    float layer3 = flowingShadows(uv * 1.6 + time * 0.01, time);

    // Combine layers with different intensities
    float combined = layer1 * 0.5 + layer2 * 0.3 + layer3 * 0.2;

    // Dark purple tint for void effect
    vec3 void_color = vec3(0.08, 0.06, 0.12);

    return void_color * combined;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_scaled = uv * 2.0 - 1.0;
    uv_scaled.x *= u_resolution.x / u_resolution.y;

    // Very dark palette with purple tints
    vec3 deep_dark = vec3(0.02, 0.02, 0.04);       // #05050a
    vec3 mid_dark = vec3(0.04, 0.04, 0.06);        // #0a0a0f
    vec3 light_dark = vec3(0.1, 0.1, 0.18);        // #1a1a2e
    vec3 purple_tint = vec3(0.12, 0.08, 0.15);

    // Base gradient
    vec3 base_color = mix(deep_dark, mid_dark, smoothstep(0.0, 0.6, uv.y));
    base_color = mix(base_color, light_dark, smoothstep(0.7, 1.0, uv.y));

    // Void effect with parallax
    vec3 void_val = voidEffect(uv, u_time);

    // Flowing shadow patterns
    float shadows = flowingShadows(uv, u_time);
    vec3 shadow_color = mid_dark * smoothstep(0.3, 0.7, shadows);

    // Wispy dark particles
    float particles = wispyParticles(uv_scaled, u_time);
    vec3 particle_color = purple_tint * particles;

    // Dimmed background stars (very subtle)
    float stars = 0.0;
    stars += dimStars(uv_scaled, 0.0) * 0.3;
    stars += dimStars(uv_scaled, 1.0) * 0.2;
    vec3 star_color = vec3(0.15, 0.12, 0.18) * stars;

    // Strong vignette for depth
    float vignette = smoothstep(1.5, 0.3, length(uv_scaled));
    vignette = pow(vignette, 0.8);

    // Combine all elements
    vec3 color = base_color;
    color += void_val * 0.6;
    color += shadow_color * 0.4;
    color += particle_color * 0.3;
    color += star_color;

    // Apply vignette
    color *= 0.5 + 0.5 * vignette;

    // Apply intensity control
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
