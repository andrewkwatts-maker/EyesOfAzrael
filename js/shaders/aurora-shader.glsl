precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// AURORA BOREALIS SHADER
// Northern lights with vibrant colors and flowing patterns
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

// Flowing aurora curtains
vec3 aurora(vec2 uv, float time) {
    vec2 p = vec2(uv.x * 3.0, uv.y * 2.0);

    // Multiple flowing layers
    float wave1 = fbm(p + vec2(time * 0.12, time * 0.08), 5);
    float wave2 = fbm(p * 1.5 - vec2(time * 0.1, time * 0.06), 5);
    float wave3 = fbm(p * 0.7 + vec2(time * 0.15, -time * 0.05), 4);
    float wave4 = fbm(p * 2.0 + vec2(-time * 0.08, time * 0.1), 4);

    // Combine waves
    float aurora_val = (wave1 + wave2 * 0.8 + wave3 * 0.6 + wave4 * 0.5) / 3.0;

    // Vertical curtain structure
    float curtains = sin(uv.x * 12.0 + wave1 * 5.0 + time * 0.3) * 0.5 + 0.5;
    curtains = pow(curtains, 2.0);
    aurora_val *= 0.5 + curtains * 0.5;

    // Shape to upper portion of sky
    aurora_val *= smoothstep(0.3, 0.6, uv.y);
    aurora_val *= 1.0 - smoothstep(0.7, 1.0, uv.y);

    // Enhance contrast
    aurora_val = pow(aurora_val, 1.2);

    // Vibrant aurora colors
    vec3 green = vec3(0.2, 0.9, 0.4);      // Bright green
    vec3 purple = vec3(0.7, 0.2, 0.9);     // Vivid purple
    vec3 blue = vec3(0.2, 0.5, 1.0);       // Bright blue
    vec3 pink = vec3(1.0, 0.3, 0.6);       // Pink highlights

    // Color variation across aurora
    vec3 aurora_color = mix(green, purple, wave2);
    aurora_color = mix(aurora_color, blue, wave3 * 0.6);
    aurora_color = mix(aurora_color, pink, wave4 * 0.3);

    return aurora_color * aurora_val;
}

// Twinkling stars
float stars(vec2 uv, float time) {
    vec2 grid = uv * 100.0;
    vec2 id = floor(grid);
    vec2 local = fract(grid);

    float star = 0.0;
    float h = hash12(id);

    if(h > 0.95) {
        vec2 star_pos = vec2(0.5);
        float dist = length(local - star_pos);
        float twinkle = 0.5 + 0.5 * sin(time * 3.0 + h * 6.28);
        star = smoothstep(0.004, 0.0, dist) * twinkle;
    }

    return star;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_scaled = uv * 2.0 - 1.0;
    uv_scaled.x *= u_resolution.x / u_resolution.y;

    // Dark night sky gradient
    vec3 deep_night = vec3(0.02, 0.02, 0.08);    // #050515
    vec3 horizon = vec3(0.05, 0.08, 0.15);       // #0d1426
    vec3 sky_color = mix(horizon, deep_night, smoothstep(0.0, 0.5, uv.y));

    // Stars
    float star_val = stars(uv_scaled, u_time);
    star_val += stars(uv_scaled * 1.3, u_time * 0.7) * 0.6;
    vec3 star_color = vec3(0.9, 0.95, 1.0) * star_val;

    // Aurora
    vec3 aurora_color = aurora(uv, u_time);

    // Add subtle glow around aurora
    float glow = aurora(uv * 0.95, u_time * 1.1).g * 0.3;
    sky_color += vec3(0.1, 0.2, 0.15) * glow;

    // Combine
    vec3 color = sky_color;
    color += star_color;
    color += aurora_color;

    // Apply intensity
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
