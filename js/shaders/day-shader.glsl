precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// DAY SHADER - Bright Daylight Sky Theme
// Features: Blue sky gradient, wispy clouds, subtle sun rays, warm atmosphere
// Optimized for 60fps performance
// ============================================================================

// High-quality hash for randomness
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

// Quintic interpolation for smooth transitions
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

// Fractal Brownian Motion for cloud patterns
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

// Wispy, realistic cloud patterns using domain warping
float clouds(vec2 uv, float time) {
    // Multiple layers of clouds at different scales
    vec2 p = uv * 3.0;

    // Slow horizontal drift
    p.x += time * 0.015;

    // Domain warping for realistic cloud shapes
    vec2 warp = vec2(
        fbm(p + vec2(time * 0.01, 0.0), 3),
        fbm(p + vec2(0.0, time * 0.012), 3)
    );

    // Primary cloud layer
    float cloud1 = fbm(p + warp * 1.2, 5);

    // Secondary wispy layer
    float cloud2 = fbm(p * 1.8 + warp * 0.8 + vec2(time * 0.02, 0.0), 4);

    // Combine layers
    float cloud = cloud1 * 0.6 + cloud2 * 0.4;

    // Make clouds more defined but still soft
    cloud = smoothstep(0.45, 0.65, cloud);

    // Clouds more prominent in middle and lower areas
    cloud *= smoothstep(1.0, 0.3, uv.y);

    return cloud;
}

// Subtle sun rays from top of screen
float sunRays(vec2 uv, float time) {
    // Convert to polar-like coordinates from top center
    vec2 sunPos = vec2(0.5, 1.2); // Sun position (above screen)
    vec2 toSun = uv - sunPos;

    float angle = atan(toSun.x, toSun.y);
    float dist = length(toSun);

    // Create ray pattern
    float rays = sin(angle * 8.0 + time * 0.1) * 0.5 + 0.5;
    rays = pow(rays, 3.0);

    // Rays stronger near top, fade with distance
    float rayFade = smoothstep(1.2, 0.4, dist) * smoothstep(0.0, 0.5, uv.y);
    rays *= rayFade;

    // Add noise variation to rays
    rays *= 0.5 + 0.5 * fbm(vec2(angle * 2.0, dist * 3.0 + time * 0.05), 3);

    return rays * 0.08; // Very subtle
}

// Atmospheric haze/glow effect
float atmosphericGlow(vec2 uv) {
    // Warmer glow near horizon (bottom)
    float horizon = 1.0 - uv.y;
    float glow = pow(horizon, 2.5) * 0.3;

    // Add slight variation
    glow *= 0.8 + 0.2 * valueNoise(uv * 5.0);

    return glow;
}

// Subtle depth variation in sky
float skyDepth(vec2 uv, float time) {
    // Very subtle noise for sky texture
    float depth = fbm(uv * 6.0 + vec2(time * 0.005, time * 0.003), 4);
    return depth * 0.03; // Very subtle
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_scaled = uv * 2.0 - 1.0;
    uv_scaled.x *= u_resolution.x / u_resolution.y;

    // Day sky color palette
    vec3 sky_top = vec3(0.53, 0.81, 0.92);        // #87CEEB - Sky blue
    vec3 sky_middle = vec3(0.68, 0.87, 0.95);     // #ADE0F3 - Lighter blue
    vec3 sky_bottom = vec3(0.99, 0.93, 0.82);     // #FDE9D1 - Warm horizon
    vec3 golden_glow = vec3(0.99, 0.72, 0.39);    // #FDB863 - Golden
    vec3 cloud_color = vec3(0.98, 0.98, 1.00);    // #FAFAFF - White clouds
    vec3 cloud_shadow = vec3(0.85, 0.88, 0.92);   // #D9E0EB - Cloud shadows

    // Base sky gradient (top to bottom)
    vec3 base_sky = mix(sky_top, sky_middle, uv.y);
    base_sky = mix(base_sky, sky_bottom, pow(uv.y, 1.5));

    // Add golden glow near horizon
    float horizon_glow = atmosphericGlow(uv);
    base_sky = mix(base_sky, golden_glow, horizon_glow);

    // Add subtle depth texture
    float depth = skyDepth(uv, u_time);
    base_sky += depth;

    // Generate clouds
    float cloud = clouds(uv, u_time);

    // Cloud coloring (mix white with slight shadow)
    vec3 cloud_mix = mix(cloud_color, cloud_shadow, 0.3);

    // Apply clouds to sky
    vec3 color = mix(base_sky, cloud_mix, cloud * 0.4);

    // Add subtle sun rays
    float rays = sunRays(uv, u_time);
    color += golden_glow * rays;

    // Very subtle overall brightness variation
    float ambient = fbm(uv * 4.0 + u_time * 0.01, 3) * 0.02;
    color += ambient;

    // Slight vignette for depth (very subtle)
    float vignette = smoothstep(1.8, 0.3, length(uv_scaled));
    color *= 0.95 + 0.05 * vignette;

    // Apply intensity control
    color *= u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
