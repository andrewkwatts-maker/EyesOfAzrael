precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// ORDER SHADER - Divine/Angelic/Sacred Geometry Theme
// Features: Sacred geometry (Flower of Life, Metatron's Cube), golden light,
// pearl shimmer, rotating mandalas, heavenly particles
// Clean, organized, harmonious - represents divine order
// ============================================================================

#define PI 3.14159265359
#define TAU 6.28318530718

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

// Rotation matrix
mat2 rotate2D(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

// Sacred Geometry: Flower of Life pattern
float flowerOfLife(vec2 uv, float scale, float time) {
    vec2 p = uv * scale;

    float pattern = 1000.0;

    // Central circle
    pattern = min(pattern, abs(length(p) - 0.5));

    // Six circles around center (hexagonal pattern)
    for(int i = 0; i < 6; i++) {
        float angle = float(i) * TAU / 6.0 + time * 0.05;
        vec2 offset = vec2(cos(angle), sin(angle)) * 0.5;
        pattern = min(pattern, abs(length(p - offset) - 0.5));
    }

    // Outer ring of circles
    for(int i = 0; i < 12; i++) {
        float angle = float(i) * TAU / 12.0 + time * 0.03;
        vec2 offset = vec2(cos(angle), sin(angle)) * 0.866;
        pattern = min(pattern, abs(length(p - offset) - 0.5));
    }

    // Convert distance to pattern
    return smoothstep(0.015, 0.005, pattern);
}

// Metatron's Cube (simplified sacred geometry)
float metatronsCube(vec2 uv, float scale, float time) {
    vec2 p = uv * scale;
    p = p * rotate2D(time * 0.04);

    float pattern = 0.0;

    // 13 circles forming Metatron's Cube base
    vec2 positions[13];
    positions[0] = vec2(0.0, 0.0);

    // Inner hexagon
    for(int i = 0; i < 6; i++) {
        float angle = float(i) * TAU / 6.0;
        positions[i + 1] = vec2(cos(angle), sin(angle)) * 0.35;
    }

    // Outer hexagon
    for(int i = 0; i < 6; i++) {
        float angle = float(i) * TAU / 6.0 + TAU / 12.0;
        positions[i + 7] = vec2(cos(angle), sin(angle)) * 0.7;
    }

    // Draw circles
    for(int i = 0; i < 13; i++) {
        float dist = length(p - positions[i]);
        pattern += smoothstep(0.15, 0.12, dist);
    }

    // Connect with lines (star pattern)
    float line_width = 0.008;
    for(int i = 1; i < 7; i++) {
        for(int j = 7; j < 13; j++) {
            vec2 a = positions[i];
            vec2 b = positions[j];
            vec2 ap = p - a;
            vec2 ab = b - a;
            float h = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0);
            float d = length(ap - ab * h);
            pattern += smoothstep(line_width, line_width * 0.5, d) * 0.3;
        }
    }

    return clamp(pattern, 0.0, 1.0);
}

// Rotating mandala pattern
float mandalaPattern(vec2 uv, float scale, float time) {
    vec2 p = uv * scale;

    float dist = length(p);
    float angle = atan(p.y, p.x);

    // Rotating symmetric pattern
    float symmetry = 8.0;
    float rotation = time * 0.08;
    float mandala_angle = mod(angle + rotation, TAU / symmetry);

    // Radial waves
    float pattern = sin(dist * 10.0 - time * 0.2) * 0.5 + 0.5;
    pattern *= sin(mandala_angle * symmetry * 2.0) * 0.5 + 0.5;

    // Add detail
    pattern *= 0.5 + 0.5 * sin(dist * 20.0 + mandala_angle * symmetry * 4.0);

    // Fade with distance
    pattern *= smoothstep(1.5, 0.3, dist);

    return pattern;
}

// Heavenly light particles (gentle, organized movement)
float divineParticles(vec2 uv_scaled, float time) {
    float particles = 0.0;

    for(int i = 0; i < 10; i++) {
        float fi = float(i);
        float seed = hash12(vec2(fi, 0.0));

        // Organized, cyclical motion
        float lifetime = 8.0;
        float t = mod(time * 0.05 + seed * lifetime, lifetime) / lifetime;

        // Circular orbit around center
        float orbit_radius = 0.4 + sin(fi) * 0.2;
        float orbit_angle = t * TAU + fi * TAU / 10.0;

        vec2 particle_pos = vec2(
            cos(orbit_angle) * orbit_radius,
            sin(orbit_angle) * orbit_radius
        );

        // Vertical oscillation (floating)
        particle_pos.y += sin(time * 0.3 + fi) * 0.1;

        float dist = length(uv_scaled - particle_pos);
        float size = 0.01 + hash12(vec2(fi, 1.0)) * 0.015;

        // Soft, glowing particles
        float core = smoothstep(size, size * 0.4, dist);
        float glow = smoothstep(size * 4.0, 0.0, dist) * 0.7;

        // Gentle pulsing
        float pulse = 0.8 + 0.2 * sin(time * 1.5 + fi * 2.0);

        particles += (core + glow) * pulse;
    }

    return particles;
}

// Pearl shimmer effect
float pearlShimmer(vec2 uv, float time) {
    // Iridescent shimmer using interference pattern
    float shimmer = fbm(uv * 20.0 + vec2(time * 0.02, -time * 0.015), 5);

    // Add directional shimmer waves
    float wave1 = sin(uv.x * 15.0 + time * 0.1) * 0.5 + 0.5;
    float wave2 = sin(uv.y * 12.0 - time * 0.12) * 0.5 + 0.5;

    shimmer = shimmer * 0.6 + wave1 * 0.2 + wave2 * 0.2;

    return shimmer * 0.08; // Very subtle
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_scaled = uv * 2.0 - 1.0;
    uv_scaled.x *= u_resolution.x / u_resolution.y;

    // Divine color palette (pearl white, gold, soft light)
    vec3 pure_white = vec3(1.0, 1.0, 1.0);           // #FFFFFF - Pure light
    vec3 pearl = vec3(1.0, 0.98, 0.94);              // #FFF9F0 - Pearl
    vec3 soft_gold = vec3(1.0, 0.89, 0.71);          // #FFE4B5 - Moccasin
    vec3 gold = vec3(1.0, 0.84, 0.0);                // #FFD700 - Gold
    vec3 light_gold = vec3(1.0, 0.95, 0.8);          // #FFF2CC - Light gold

    // Base pearl gradient
    vec3 base_color = mix(pearl, light_gold, smoothstep(0.0, 1.0, uv.y) * 0.3);

    // Add pearl shimmer
    float shimmer = pearlShimmer(uv, u_time);
    base_color += shimmer;

    // Sacred geometry layers (subtle, overlapping)
    float flower = flowerOfLife(uv_scaled, 1.5, u_time);
    float metatron = metatronsCube(uv_scaled * 0.8, 1.2, u_time);
    float mandala = mandalaPattern(uv_scaled, 0.8, u_time);

    // Apply sacred geometry with golden light
    base_color = mix(base_color, soft_gold, flower * 0.15);
    base_color = mix(base_color, gold, metatron * 0.12);
    base_color += light_gold * mandala * 0.08;

    // Divine particles
    float particles = divineParticles(uv_scaled, u_time);
    base_color = mix(base_color, pure_white, particles * 0.3);

    // Soft radial gradient (lighter in center)
    float radial = smoothstep(1.5, 0.0, length(uv_scaled));
    base_color = mix(base_color, pure_white, radial * 0.1);

    // Gentle overall glow
    float ambient = fbm(uv * 4.0 + u_time * 0.01, 3) * 0.03;
    base_color += ambient;

    // Ensure bright, divine appearance
    base_color = max(base_color, vec3(0.85)); // Minimum brightness

    // Apply intensity control
    vec3 color = base_color * u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
