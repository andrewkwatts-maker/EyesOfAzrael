precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// PRODUCTION LIGHT SHADER - ShaderToy Inspired
// Features: Bokeh particles, soft light rays, lens flare, warm glow
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

// FBM for soft patterns
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

// Bokeh-style particles with hexagonal shape
float bokehParticle(vec2 p, float size) {
    float dist = length(p);

    // Soft circular core
    float circle = smoothstep(size, size * 0.7, dist);

    // Hexagonal ring for bokeh effect
    float angle = atan(p.y, p.x);
    float hexagon = cos(angle * 3.0) * 0.5 + 0.5;
    float ring = smoothstep(size * 1.1, size * 0.9, dist) - smoothstep(size * 1.3, size * 1.1, dist);
    ring *= hexagon;

    // Soft outer glow
    float glow = smoothstep(size * 4.0, 0.0, dist) * 0.3;

    return circle + ring * 0.5 + glow;
}

// Floating bokeh particles
float floatingParticles(vec2 uv_scaled, float time) {
    float particles = 0.0;

    for(int i = 0; i < 25; i++) {
        float fi = float(i);
        float seed = hash12(vec2(fi, 0.0));

        // Gentle floating motion
        vec2 start_pos = vec2(
            hash12(vec2(fi, 1.0)) * 2.0 - 1.0,
            hash12(vec2(fi, 2.0)) * 2.0 - 1.0
        );

        // Slow drift
        float drift_x = sin(time * 0.2 + fi) * 0.3;
        float drift_y = cos(time * 0.15 + fi * 1.5) * 0.3;

        vec2 particle_pos = start_pos + vec2(drift_x, drift_y);

        vec2 to_particle = uv_scaled - particle_pos;
        float size = 0.02 + hash12(vec2(fi, 3.0)) * 0.04;

        // Bokeh particle
        float bokeh = bokehParticle(to_particle, size);

        // Gentle pulsing
        float pulse = 0.7 + 0.3 * sin(time * 1.5 + fi * 2.0) * sin(time * 1.0 + fi);

        particles += bokeh * pulse;
    }

    return particles;
}

// Soft light rays using raymarching technique
float lightRays(vec2 uv_centered, float time) {
    float angle = atan(uv_centered.y, uv_centered.x);
    float dist = length(uv_centered);

    // Rotating rays
    float ray_count = 12.0;
    float ray_angle = angle + time * 0.15;
    float rays = sin(ray_angle * ray_count) * 0.5 + 0.5;

    // Sharpen rays
    rays = pow(rays, 4.0);

    // Fade with distance from center
    rays *= smoothstep(1.8, 0.3, dist);

    // Add noise for organic feel
    rays *= 0.8 + 0.2 * fbm(vec2(angle * 3.0, time * 0.1), 3);

    return rays;
}

// Subtle lens flare
float lensFlare(vec2 uv_centered, float time) {
    vec2 flare_pos = vec2(0.3, 0.2);
    float dist = length(uv_centered - flare_pos);

    // Main flare spot
    float flare = smoothstep(0.15, 0.0, dist);
    flare = pow(flare, 2.0);

    // Secondary flare spots (ghosts)
    for(int i = 0; i < 3; i++) {
        float fi = float(i + 1);
        vec2 ghost_pos = -flare_pos * fi * 0.4;
        float ghost_dist = length(uv_centered - ghost_pos);
        float ghost_size = 0.05 + fi * 0.02;
        flare += smoothstep(ghost_size, ghost_size * 0.5, ghost_dist) * (0.3 / fi);
    }

    // Pulsing animation
    flare *= 0.8 + 0.2 * sin(time * 2.0);

    return flare * 0.15;
}

// Atmospheric glow
float atmosphericGlow(vec2 uv, float time) {
    float glow = fbm(uv * 3.0 + time * 0.05, 4);
    glow = pow(glow, 2.0);

    // Stronger at top
    glow *= smoothstep(0.2, 0.8, uv.y);

    return glow;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_centered = uv * 2.0 - 1.0;
    uv_centered.x *= u_resolution.x / u_resolution.y;

    // Warm golden color palette
    vec3 base_color = vec3(0.96, 0.95, 0.94);      // #f5f3f0
    vec3 bright_color = vec3(1.0, 0.98, 0.95);     // #fef9f3
    vec3 golden = vec3(1.0, 0.85, 0.5);            // Golden tint

    // Soft gradient background
    vec3 bg_gradient = mix(base_color, bright_color, smoothstep(0.0, 1.0, uv.y));

    // Floating bokeh particles
    float particles = floatingParticles(uv_centered, u_time);

    // Soft light rays
    float rays = lightRays(uv_centered, u_time);

    // Subtle lens flare
    float flare = lensFlare(uv_centered, u_time);

    // Atmospheric glow
    float atmo = atmosphericGlow(uv, u_time);

    // Central radial gradient (warm glow from center)
    float center_glow = smoothstep(1.2, 0.0, length(uv_centered));
    center_glow = pow(center_glow, 0.8);

    // Combine all elements
    vec3 color = bg_gradient * 0.15;

    // Add center glow
    color += golden * center_glow * 0.08;

    // Add light rays
    color += golden * rays * 0.12;

    // Add particles with golden tint
    color += mix(bright_color, golden, 0.3) * particles * 0.3;

    // Add lens flare
    color += vec3(1.0, 0.95, 0.8) * flare;

    // Add atmospheric glow
    color += golden * atmo * 0.05;

    // Apply intensity control
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
