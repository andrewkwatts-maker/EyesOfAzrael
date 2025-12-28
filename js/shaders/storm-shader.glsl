precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// STORM SHADER
// Dark storm clouds with lightning flashes
// ============================================================================

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

// Turbulent storm clouds
vec3 stormClouds(vec2 uv, float time) {
    vec2 p = uv * 3.0;

    // Multiple turbulent layers
    float cloud1 = fbm(p + vec2(time * 0.05, time * 0.03), 6);
    float cloud2 = fbm(p * 1.4 - vec2(time * 0.04, time * 0.02), 5);
    float cloud3 = fbm(p * 0.8 + vec2(-time * 0.06, time * 0.04), 5);

    // Combine for turbulent effect
    float clouds = (cloud1 * 0.5 + cloud2 * 0.3 + cloud3 * 0.2);
    clouds = pow(clouds, 1.5);

    // Add billowing detail
    float detail = fbm(p * 4.0 + time * 0.1, 4) * 0.3;
    clouds += detail;

    // Dark storm cloud colors
    vec3 dark_cloud = vec3(0.08, 0.08, 0.12);    // Very dark grey
    vec3 mid_cloud = vec3(0.15, 0.15, 0.20);     // Medium grey
    vec3 light_cloud = vec3(0.25, 0.26, 0.30);   // Lighter grey edges

    // Color variation based on cloud density
    vec3 cloud_color = mix(dark_cloud, mid_cloud, clouds);
    cloud_color = mix(cloud_color, light_cloud, pow(clouds, 2.0) * 0.5);

    return cloud_color;
}

// Lightning flashes
float lightning(vec2 uv, float time) {
    // Lightning strikes every 5-8 seconds
    float period = 6.5;
    float t = mod(time, period);

    // Only flash briefly
    if(t > 0.3) return 0.0;

    // Quick flash timing
    float flash = 0.0;
    if(t < 0.05) {
        flash = smoothstep(0.0, 0.02, t) * (1.0 - smoothstep(0.03, 0.05, t));
    } else if(t > 0.08 && t < 0.15) {
        // Secondary flash
        float t2 = t - 0.08;
        flash = smoothstep(0.0, 0.02, t2) * (1.0 - smoothstep(0.04, 0.07, t2)) * 0.7;
    } else if(t > 0.18 && t < 0.25) {
        // Tertiary flash
        float t3 = t - 0.18;
        flash = smoothstep(0.0, 0.015, t3) * (1.0 - smoothstep(0.03, 0.07, t3)) * 0.4;
    }

    // Lightning position (randomized per period)
    float strike_seed = floor(time / period);
    float strike_x = hash13(vec3(strike_seed, 0.0, 0.0)) * 0.6 + 0.2;
    float strike_y = 0.6 + hash13(vec3(strike_seed, 1.0, 0.0)) * 0.3;

    // Distance from lightning
    vec2 strike_pos = vec2(strike_x, strike_y);
    float dist = length(uv - strike_pos);

    // Lightning illumination (brighter near strike)
    float illumination = flash * (1.0 - smoothstep(0.0, 0.7, dist));

    // Add some vertical spread for lightning bolt shape
    float vertical_spread = abs(uv.x - strike_x);
    illumination += flash * smoothstep(0.15, 0.0, vertical_spread) *
                    smoothstep(strike_y - 0.3, strike_y, uv.y) * 0.5;

    return illumination;
}

// Rain effect
float rain(vec2 uv, float time) {
    vec2 p = uv * vec2(20.0, 30.0);
    p.y += time * 5.0;

    vec2 id = floor(p);
    vec2 local = fract(p);

    float drop = 0.0;
    float h = hash12(id);

    if(h > 0.7) {
        // Raindrop streak
        float x = local.x;
        float y = local.y;
        float streak = smoothstep(0.5, 0.48, abs(x - 0.5)) *
                      smoothstep(0.9, 0.0, y);
        drop = streak * 0.3;
    }

    return drop;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Dark stormy sky gradient
    vec3 sky_top = vec3(0.12, 0.12, 0.18);       // #1f1f2e
    vec3 sky_bottom = vec3(0.08, 0.09, 0.12);    // #14161f
    vec3 sky_color = mix(sky_bottom, sky_top, smoothstep(0.0, 0.6, uv.y));

    // Storm clouds
    vec3 clouds = stormClouds(uv, u_time);

    // Lightning
    float lightning_val = lightning(uv, u_time);
    vec3 lightning_color = vec3(0.8, 0.85, 1.0) * lightning_val;

    // Rain
    float rain_val = rain(uv, u_time);
    vec3 rain_color = vec3(0.6, 0.65, 0.7) * rain_val;

    // Combine elements
    vec3 color = sky_color * 0.3 + clouds * 0.7;

    // Lightning illuminates the clouds
    color += lightning_color;
    color += lightning_color * clouds * 0.5; // Clouds reflect lightning

    // Add rain
    color += rain_color;

    // Slight purple tint for dramatic effect
    color.b += 0.05;

    // Apply intensity
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
