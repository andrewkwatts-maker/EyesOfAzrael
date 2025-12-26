precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// PRODUCTION NIGHT SKY SHADER - ShaderToy Inspired
// Features: Realistic stars, aurora borealis, nebula, shooting stars
// ============================================================================

// High-quality hash functions
float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zxy + 31.32);
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

// FBM for organic patterns
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

// Realistic star field with varied sizes
float stars(vec2 uv, float layer, float time) {
    // Different grid sizes for star layers
    vec2 grid = uv * (120.0 + layer * 80.0);
    vec2 id = floor(grid);
    vec2 local = fract(grid);

    float star = 0.0;
    float h = hash12(id + layer * 100.0);

    // Control star density
    if(h > 0.92) {
        // Star position within cell (jittered)
        vec2 star_pos = vec2(0.5) + (hash22(id + layer * 100.0) - 0.5) * 0.9;
        float dist = length(local - star_pos);

        // Varied star sizes
        float size_seed = hash12(id + layer * 100.0 + 10.0);
        float size = 0.001 + size_seed * 0.004;

        // Twinkling at different speeds
        float twinkle_speed = 2.0 + h * 4.0;
        float twinkle = 0.4 + 0.6 * sin(time * twinkle_speed + h * 6.28) *
                             sin(time * twinkle_speed * 0.7 + h * 3.14);

        // Star brightness
        float brightness = smoothstep(size, 0.0, dist);

        // Add diffraction spikes for brighter stars
        if(size_seed > 0.7) {
            float angle = atan(local.y - star_pos.y, local.x - star_pos.x);
            float spike = pow(abs(sin(angle * 2.0)), 8.0) * smoothstep(size * 15.0, 0.0, dist);
            brightness += spike * 0.5;
        }

        star = brightness * twinkle;
    }

    return star;
}

// Realistic aurora borealis
vec3 aurora(vec2 uv, float time) {
    // Only in upper portion
    if(uv.y < 0.55) return vec3(0.0);

    vec2 p = vec2(uv.x * 4.0, uv.y * 2.0);

    // Flowing aurora waves
    float wave1 = fbm(p + vec2(time * 0.08, time * 0.05), 4);
    float wave2 = fbm(p * 1.3 - vec2(time * 0.06, time * 0.04), 4);
    float wave3 = fbm(p * 0.8 + vec2(time * 0.1, -time * 0.03), 3);

    // Combine waves
    float aurora_val = (wave1 + wave2 * 0.7 + wave3 * 0.5) / 2.2;

    // Shape aurora to upper sky
    aurora_val *= smoothstep(0.55, 0.7, uv.y);
    aurora_val *= 1.0 - smoothstep(0.85, 0.95, uv.y);

    // Add curtain-like vertical structure
    aurora_val *= 0.7 + 0.3 * sin(uv.x * 15.0 + wave1 * 3.0);

    aurora_val = pow(aurora_val, 1.5);

    // Aurora colors - green, purple, blue
    vec3 green = vec3(0.1, 0.5, 0.3);
    vec3 purple = vec3(0.4, 0.1, 0.5);
    vec3 blue = vec3(0.1, 0.3, 0.6);

    // Color variation across aurora
    vec3 aurora_color = mix(green, purple, wave2);
    aurora_color = mix(aurora_color, blue, wave3 * 0.5);

    return aurora_color * aurora_val * 0.4;
}

// Subtle flowing nebula
vec3 nebula(vec2 uv, float time) {
    vec2 p = uv * 2.0;

    float n1 = fbm(p + vec2(time * 0.02, time * 0.015), 5);
    float n2 = fbm(p * 1.5 + vec2(-time * 0.018, time * 0.012), 4);

    float nebula_val = (n1 + n2) * 0.5;
    nebula_val = pow(nebula_val, 2.0);

    // Nebula colors - very subtle purple and blue
    vec3 purple = vec3(0.08, 0.04, 0.12);
    vec3 blue = vec3(0.04, 0.06, 0.15);

    return mix(purple, blue, n2) * nebula_val * 0.3;
}

// Occasional shooting star
float shootingStar(vec2 uv, float time) {
    // One shooting star every 12-15 seconds
    float period = 13.0;
    float t = mod(time, period);

    // Only show for brief moment
    if(t > 0.8) return 0.0;

    // Smooth appearance
    float fade = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.4, 0.8, t));

    // Shooting star path (diagonal)
    float star_seed = floor(time / period);
    float start_x = hash13(vec3(star_seed, 0.0, 0.0)) * 1.5 - 0.25;
    float start_y = 0.5 + hash13(vec3(star_seed, 1.0, 0.0)) * 0.4;

    vec2 star_start = vec2(start_x, start_y);
    vec2 star_velocity = vec2(1.2, -0.6);
    vec2 star_pos = star_start + star_velocity * t;

    // Distance to shooting star trail
    vec2 to_star = uv - star_pos;
    vec2 trail_dir = normalize(star_velocity);
    float along_trail = dot(to_star, trail_dir);
    float dist_to_trail = length(to_star - trail_dir * along_trail);

    // Trail extends behind star
    float trail = 0.0;
    if(along_trail < 0.0 && along_trail > -0.15) {
        trail = smoothstep(0.003, 0.0, dist_to_trail) * (1.0 + along_trail / 0.15);
    }

    // Star head
    float dist = length(uv - star_pos);
    float head = smoothstep(0.005, 0.0, dist);

    return (head + trail * 0.6) * fade;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_scaled = uv * 2.0 - 1.0;
    uv_scaled.x *= u_resolution.x / u_resolution.y;

    // Deep night sky gradient
    vec3 deep_sky = vec3(0.02, 0.04, 0.08);        // #050a15
    vec3 horizon_sky = vec3(0.04, 0.06, 0.12);     // #0a0e1f
    vec3 mid_sky = vec3(0.1, 0.12, 0.23);          // #1a1f3a

    // Vertical gradient
    vec3 sky_color = mix(horizon_sky, deep_sky, smoothstep(0.0, 0.4, uv.y));
    sky_color = mix(sky_color, mid_sky, smoothstep(0.6, 1.0, uv.y));

    // Multiple star layers for depth and realism
    float star_val = 0.0;
    star_val += stars(uv_scaled, 0.0, u_time) * 1.0;          // Foreground stars
    star_val += stars(uv_scaled, 1.0, u_time * 0.8) * 0.7;    // Mid stars
    star_val += stars(uv_scaled, 2.0, u_time * 0.6) * 0.5;    // Background stars
    star_val += stars(uv_scaled, 3.0, u_time * 0.9) * 0.8;    // Additional layer

    // Star colors (slightly warm white)
    vec3 star_color = vec3(1.0, 0.95, 0.9) * star_val;

    // Aurora borealis
    vec3 aurora_color = aurora(uv, u_time);

    // Subtle nebula clouds
    vec3 nebula_color = nebula(uv, u_time);

    // Shooting star
    float shooting = shootingStar(uv, u_time);
    vec3 shooting_color = vec3(0.9, 0.95, 1.0) * shooting;

    // Combine all elements
    vec3 color = sky_color;
    color += nebula_color;
    color += aurora_color;
    color += star_color;
    color += shooting_color;

    // Apply intensity control
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
