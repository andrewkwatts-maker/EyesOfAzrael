precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// AIR SHADER - Wind/Air Element Theme
// Features: Flowing wind patterns, floating particles, swirling currents
// Light, airy, ethereal feel with domain warping
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

// Fractal Brownian Motion
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

// Advanced domain warping for wind flow visualization
vec2 domainWarp(vec2 p, float time, int depth) {
    vec2 q = vec2(
        fbm(p + vec2(0.0, 0.0), 4),
        fbm(p + vec2(5.2, 1.3), 4)
    );

    if(depth < 2) {
        vec2 r = vec2(
            fbm(p + 4.0 * q + vec2(time * 0.05, time * 0.03), 3),
            fbm(p + 4.0 * q + vec2(time * 0.04, -time * 0.06), 3)
        );

        if(depth < 1) {
            return p + r * 1.5;
        }
        return p + q * 2.0 + r * 0.5;
    }

    return p + q * 1.0;
}

// Flowing wind patterns with turbulence
float windFlow(vec2 uv, float time) {
    // Create flowing wind using domain warping
    vec2 p = uv * 4.0;

    // Apply domain warping for realistic flow
    vec2 warped = domainWarp(p, time, 1);

    // Multi-scale wind patterns
    float flow1 = fbm(warped + vec2(time * 0.08, 0.0), 5);
    float flow2 = fbm(warped * 1.5 + vec2(-time * 0.06, time * 0.05), 4);
    float flow3 = fbm(warped * 2.5 + vec2(time * 0.04, -time * 0.07), 3);

    // Combine flows
    float wind = flow1 * 0.5 + flow2 * 0.3 + flow3 * 0.2;

    return wind;
}

// Swirling air currents (visible wind streams)
float airCurrents(vec2 uv, float time) {
    vec2 p = uv * 6.0;

    // Create spiral/vortex patterns
    vec2 center = vec2(0.5, 0.5);
    vec2 toCenter = p - center * 6.0;
    float dist = length(toCenter);
    float angle = atan(toCenter.y, toCenter.x);

    // Rotating currents
    float current = sin(angle * 3.0 + dist * 2.0 - time * 0.3) * 0.5 + 0.5;
    current *= sin(angle * 5.0 - dist * 1.5 + time * 0.4) * 0.5 + 0.5;

    // Add noise variation
    current *= fbm(p + vec2(time * 0.05, -time * 0.06), 3);

    // Make currents more defined
    current = smoothstep(0.3, 0.7, current);

    // Fade with distance from spiral
    current *= smoothstep(8.0, 2.0, dist);

    return current;
}

// Floating particles (feathers/leaves) with wind-affected motion
float floatingParticles(vec2 uv_scaled, float time) {
    float particles = 0.0;

    for(int i = 0; i < 12; i++) {
        float fi = float(i);
        float seed = hash12(vec2(fi, 0.0));

        // Particle lifetime
        float lifetime = 8.0 + seed * 4.0;
        float t = mod(time * 0.06 + seed * lifetime, lifetime) / lifetime;

        // Starting position
        vec2 start_pos = vec2(
            hash12(vec2(fi, 1.0)) * 2.5 - 1.25,
            hash12(vec2(fi, 2.0)) * 2.5 - 1.25
        );

        // Wind-affected motion (flowing, swirling)
        vec2 wind_offset = vec2(
            fbm(vec2(fi, time * 0.1), 3) * 2.0 - 1.0,
            fbm(vec2(fi + 10.0, time * 0.08), 3) * 2.0 - 1.0
        );

        // Spiral motion
        float spiral_angle = t * 12.56 + fi * 2.0;
        float spiral_radius = 0.3 * sin(time * 0.2 + fi);

        vec2 spiral = vec2(
            cos(spiral_angle) * spiral_radius,
            sin(spiral_angle) * spiral_radius
        );

        // Combined motion
        vec2 particle_pos = start_pos + wind_offset * t * 0.5 + spiral;

        float dist = length(uv_scaled - particle_pos);

        // Particle shape (elongated like feather/leaf)
        float angle_to_particle = atan(uv_scaled.y - particle_pos.y, uv_scaled.x - particle_pos.x);
        float rotation = time * 0.5 + fi * 6.28;
        float shaped_dist = dist * (1.0 + 0.3 * sin(angle_to_particle + rotation));

        float size = 0.012 + hash12(vec2(fi, 3.0)) * 0.018;

        // Particle with soft glow
        float core = smoothstep(size, size * 0.3, shaped_dist);
        float glow = smoothstep(size * 2.5, 0.0, shaped_dist) * 0.5;

        // Tumbling/rotating fade
        float tumble = 0.7 + 0.3 * sin(time * 1.5 + fi * 3.0);

        // Smooth fade in/out
        float fade = sin(t * 3.14159) * tumble;

        particles += (core + glow) * fade;
    }

    return particles;
}

// Atmospheric transparency effect
float atmosphericDepth(vec2 uv, float time) {
    // Very subtle atmospheric variation
    float depth = fbm(uv * 5.0 + vec2(time * 0.02, time * 0.015), 4);
    return depth * 0.04;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_scaled = uv * 2.0 - 1.0;
    uv_scaled.x *= u_resolution.x / u_resolution.y;

    // Airy color palette (light blues, whites, transparency feel)
    vec3 light_air = vec3(0.91, 0.96, 0.97);      // #E8F4F8 - Very light blue
    vec3 mid_air = vec3(0.84, 0.92, 0.95);        // #D6EAF2 - Soft blue
    vec3 deep_air = vec3(0.72, 0.85, 0.91);       // #B8D8E8 - Deeper blue
    vec3 wind_highlight = vec3(0.95, 0.98, 1.00); // #F2FAFF - Almost white
    vec3 particle_glow = vec3(0.88, 0.93, 0.96);  // #E0EDF5 - Soft glow

    // Base gradient (subtle, top to bottom)
    vec3 base_color = mix(light_air, mid_air, uv.y * 0.6);
    base_color = mix(base_color, deep_air, pow(uv.y, 2.0) * 0.4);

    // Wind flow patterns
    float wind = windFlow(uv, u_time);

    // Apply wind as subtle color variation
    vec3 wind_color = mix(base_color, wind_highlight, wind * 0.15);

    // Air currents (visible streams)
    float currents = airCurrents(uv, u_time);
    wind_color = mix(wind_color, wind_highlight, currents * 0.12);

    // Floating particles
    float particles = floatingParticles(uv_scaled, u_time);

    // Atmospheric depth texture
    float depth = atmosphericDepth(uv, u_time);

    // Combine effects
    vec3 color = wind_color;

    // Add subtle depth variation
    color += depth;

    // Add floating particles with glow
    color = mix(color, particle_glow, particles * 0.35);

    // Very subtle radial transparency effect (lighter in center)
    float radial = smoothstep(1.2, 0.0, length(uv_scaled));
    color = mix(color, light_air, radial * 0.08);

    // Ensure light, airy feel (no dark areas)
    color = max(color, vec3(0.7)); // Minimum brightness

    // Apply intensity control
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
