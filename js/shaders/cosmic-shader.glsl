precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// COSMIC SHADER
// Deep space nebula with stars and cosmic dust
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
    float frequency = 1.0;

    for(int i = 0; i < 8; i++) {
        if(i >= octaves) break;
        value += amplitude * valueNoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Nebula clouds
vec3 nebula(vec2 uv, float time) {
    vec2 p = uv * 2.5;

    // Multiple nebula layers
    float n1 = fbm(p + vec2(time * 0.015, time * 0.01), 6);
    float n2 = fbm(p * 1.3 - vec2(time * 0.012, time * 0.008), 5);
    float n3 = fbm(p * 0.8 + vec2(time * 0.018, -time * 0.01), 5);

    // Combine for swirling effect
    float nebula_val = (n1 * 0.6 + n2 * 0.4 + n3 * 0.3);
    nebula_val = pow(nebula_val, 1.3);

    // Add bright spots
    float bright_spots = fbm(p * 3.0 + time * 0.02, 4);
    bright_spots = pow(bright_spots, 3.0) * 0.5;
    nebula_val += bright_spots;

    // Cosmic nebula colors
    vec3 purple = vec3(0.4, 0.1, 0.6);     // Deep purple
    vec3 blue = vec3(0.1, 0.3, 0.8);       // Cosmic blue
    vec3 pink = vec3(0.8, 0.2, 0.5);       // Pink highlights
    vec3 cyan = vec3(0.2, 0.6, 0.8);       // Cyan accents

    // Color variation across nebula
    vec3 nebula_color = mix(purple, blue, n2);
    nebula_color = mix(nebula_color, pink, n3 * 0.6);
    nebula_color = mix(nebula_color, cyan, bright_spots);

    return nebula_color * nebula_val * 0.8;
}

// Stars with varying sizes and colors
float stars(vec2 uv, float layer, float time) {
    vec2 grid = uv * (80.0 + layer * 60.0);
    vec2 id = floor(grid);
    vec2 local = fract(grid);

    float star = 0.0;
    float h = hash12(id + layer * 100.0);

    if(h > 0.88) {
        vec2 star_pos = vec2(0.5) + (hash22(id + layer * 100.0) - 0.5) * 0.9;
        float dist = length(local - star_pos);

        // Varied star sizes
        float size = 0.001 + h * 0.005;

        // Twinkling
        float twinkle = 0.6 + 0.4 * sin(time * (2.0 + h * 3.0) + h * 6.28);

        // Star brightness
        star = smoothstep(size, 0.0, dist) * twinkle;

        // Add glow for larger stars
        if(h > 0.95) {
            star += smoothstep(size * 3.0, 0.0, dist) * 0.3;
        }
    }

    return star;
}

// Cosmic dust
vec3 cosmicDust(vec2 uv, float time) {
    vec2 p = uv * 4.0;

    float dust1 = fbm(p + vec2(time * 0.01, time * 0.008), 5);
    float dust2 = fbm(p * 1.5 - vec2(time * 0.012, -time * 0.006), 4);

    float dust_val = (dust1 * 0.5 + dust2 * 0.5);
    dust_val = pow(dust_val, 2.5) * 0.4;

    // Dust colors (subtle greys and blues)
    vec3 dust_color = vec3(0.15, 0.2, 0.3);

    return dust_color * dust_val;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_scaled = uv * 2.0 - 1.0;
    uv_scaled.x *= u_resolution.x / u_resolution.y;

    // Deep space gradient
    vec3 deep_space = vec3(0.01, 0.01, 0.04);    // Nearly black
    vec3 space_blue = vec3(0.03, 0.05, 0.12);    // Dark blue
    vec3 space_color = mix(deep_space, space_blue, smoothstep(0.0, 0.5, uv.y));

    // Stars - multiple layers for depth
    float star_val = 0.0;
    star_val += stars(uv_scaled, 0.0, u_time) * 1.0;
    star_val += stars(uv_scaled, 1.0, u_time * 0.8) * 0.7;
    star_val += stars(uv_scaled, 2.0, u_time * 0.6) * 0.5;
    star_val += stars(uv_scaled, 3.0, u_time * 0.9) * 0.8;

    // Star colors (slight color variation)
    vec3 star_color = vec3(0.9, 0.95, 1.0) * star_val;

    // Nebula
    vec3 nebula_color = nebula(uv, u_time);

    // Cosmic dust
    vec3 dust_color = cosmicDust(uv, u_time);

    // Combine all elements
    vec3 color = space_color;
    color += dust_color;
    color += nebula_color;
    color += star_color;

    // Subtle vignette for depth
    float vignette = 1.0 - 0.3 * length(uv_scaled * 0.5);
    color *= vignette;

    // Apply intensity
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
