precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// CHAOS SHADER - Void/Black Hole Theme
// Features: Central void, accretion disk, spiraling particles, gravitational lensing
// Dark purple/red/black palette with reality distortions
// Inspired by ShaderToy black hole shaders but optimized and subtle
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

// Gravitational lensing effect (space distortion around black hole)
vec2 gravitationalLens(vec2 uv, vec2 center, float time) {
    vec2 toCenter = uv - center;
    float dist = length(toCenter);

    // Event horizon radius (very small, center void)
    float event_horizon = 0.08;

    // Gravitational strength (falls off with distance)
    float gravity = event_horizon / max(dist, 0.001);
    gravity = min(gravity, 2.0); // Clamp maximum distortion

    // Apply lensing (space warping)
    float warp_amount = gravity * 0.15;

    // Spiral distortion (rotating space around black hole)
    float angle = atan(toCenter.y, toCenter.x);
    float rotation = gravity * 0.5 + time * 0.1;

    vec2 warped = toCenter;
    warped *= 1.0 + warp_amount;

    // Rotate around center
    float cos_r = cos(rotation);
    float sin_r = sin(rotation);
    warped = vec2(
        warped.x * cos_r - warped.y * sin_r,
        warped.x * sin_r + warped.y * cos_r
    );

    return center + warped;
}

// Accretion disk (swirling matter around black hole)
float accretionDisk(vec2 uv, vec2 center, float time) {
    vec2 toCenter = uv - center;
    float dist = length(toCenter);
    float angle = atan(toCenter.y, toCenter.x);

    // Disk parameters
    float inner_radius = 0.1;
    float outer_radius = 0.45;

    // Only draw in disk range
    if(dist < inner_radius || dist > outer_radius) {
        return 0.0;
    }

    // Rotating spiral pattern
    float spiral_arms = 3.0;
    float rotation_speed = time * 0.2;
    float spiral = sin(angle * spiral_arms - dist * 8.0 + rotation_speed) * 0.5 + 0.5;

    // Add turbulence
    float turbulence = fbm(vec2(angle * 3.0, dist * 10.0) + time * 0.1, 4);
    spiral *= turbulence;

    // Brightness falls off with distance from sweet spot
    float optimal_dist = (inner_radius + outer_radius) * 0.5;
    float falloff = 1.0 - abs(dist - optimal_dist) / (outer_radius - inner_radius);
    falloff = smoothstep(0.0, 1.0, falloff);

    // Hot inner edge, cooler outer edge
    float temperature = 1.0 - (dist - inner_radius) / (outer_radius - inner_radius);

    return spiral * falloff * temperature;
}

// Spiraling particles being pulled into void
float voidParticles(vec2 uv, vec2 center, float time) {
    float particles = 0.0;

    for(int i = 0; i < 15; i++) {
        float fi = float(i);
        float seed = hash12(vec2(fi, 0.0));

        // Particle lifetime (being pulled in)
        float lifetime = 6.0 + seed * 3.0;
        float t = mod(time * 0.08 + seed * lifetime, lifetime) / lifetime;

        // Starting position (far from center)
        float start_angle = seed * 6.28318;
        float start_dist = 0.6 + hash12(vec2(fi, 1.0)) * 0.4;

        vec2 start_pos = center + vec2(
            cos(start_angle) * start_dist,
            sin(start_angle) * start_dist
        );

        // Pull toward center with spiral motion
        float current_dist = start_dist * (1.0 - t * 0.9);
        float spiral_speed = 3.0 + fi * 0.5;
        float current_angle = start_angle + t * spiral_speed;

        vec2 particle_pos = center + vec2(
            cos(current_angle) * current_dist,
            sin(current_angle) * current_dist
        );

        // Add chaotic movement
        particle_pos += vec2(
            fbm(vec2(fi, time * 0.15), 2) * 0.05,
            fbm(vec2(fi + 10.0, time * 0.13), 2) * 0.05
        );

        float dist = length(uv - particle_pos);
        float size = 0.008 + hash12(vec2(fi, 2.0)) * 0.012;

        // Particle with glow
        float core = smoothstep(size, size * 0.3, dist);
        float glow = smoothstep(size * 3.0, 0.0, dist) * 0.6;

        // Fade as particle gets closer to center (being destroyed)
        float fade = (1.0 - pow(t, 2.0)) * smoothstep(0.0, 0.2, t);

        // Brighter when close to black hole
        float energy = 1.0 + (1.0 - current_dist) * 2.0;

        particles += (core + glow) * fade * energy;
    }

    return particles;
}

// Reality cracks/distortions
float realityCracks(vec2 uv, float time) {
    vec2 p = uv * 8.0;

    // Occasional crack patterns
    float crack_time = mod(time * 0.1, 5.0);
    float crack_pulse = smoothstep(4.0, 4.5, crack_time) * smoothstep(5.0, 4.5, crack_time);

    if(crack_pulse < 0.01) return 0.0;

    // Sharp lines using noise derivatives
    float crack1 = fbm(p + vec2(time * 0.05, 0.0), 5);
    float crack2 = fbm(p.yx * 1.3 - vec2(0.0, time * 0.06), 5);

    float crack = abs(crack1 - 0.5) + abs(crack2 - 0.5);
    crack = smoothstep(0.15, 0.05, crack);

    return crack * crack_pulse * 0.3;
}

// Void core (black hole center)
float voidCore(vec2 uv, vec2 center) {
    float dist = length(uv - center);

    // Event horizon (pure black)
    float event_horizon = 0.08;

    // Smooth falloff just outside event horizon
    float void_edge = smoothstep(event_horizon + 0.02, event_horizon, dist);

    return void_edge;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_scaled = uv * 2.0 - 1.0;
    uv_scaled.x *= u_resolution.x / u_resolution.y;

    // Black hole center (offset slightly for visual interest)
    vec2 center = vec2(0.0, 0.1);

    // Apply gravitational lensing
    vec2 lensed_uv = gravitationalLens(uv_scaled, center, u_time);

    // Chaos color palette (deep space, void, energy)
    vec3 void_black = vec3(0.0, 0.0, 0.0);           // #000000 - Pure void
    vec3 deep_void = vec3(0.10, 0.04, 0.12);         // #1a0a1f - Deep purple
    vec3 chaos_purple = vec3(0.29, 0.08, 0.27);      // #4a1545 - Chaos energy
    vec3 hot_matter = vec3(0.6, 0.15, 0.2);          // #992633 - Hot accretion
    vec3 energy_glow = vec3(0.8, 0.25, 0.35);        // #CC4059 - Energy release

    // Base void gradient
    float dist_from_center = length(uv_scaled - center);
    vec3 base_color = mix(deep_void, void_black, smoothstep(1.5, 0.3, dist_from_center));

    // Add chaotic energy in mid-range
    base_color = mix(base_color, chaos_purple, smoothstep(0.8, 0.4, dist_from_center) * 0.4);

    // Accretion disk
    float disk = accretionDisk(lensed_uv, center, u_time);
    vec3 disk_color = mix(chaos_purple, hot_matter, disk);
    base_color = mix(base_color, disk_color, disk * 0.8);

    // Spiraling particles
    float particles = voidParticles(lensed_uv, center, u_time);
    base_color = mix(base_color, energy_glow, particles * 0.4);

    // Void core (pure black at center)
    float void_center = voidCore(uv_scaled, center);
    base_color = mix(base_color, void_black, void_center);

    // Reality cracks
    float cracks = realityCracks(lensed_uv, u_time);
    base_color += vec3(0.5, 0.2, 0.4) * cracks;

    // Ambient chaotic texture
    float chaos_texture = fbm(lensed_uv * 6.0 + u_time * 0.03, 5);
    base_color += (chaos_texture - 0.5) * 0.03;

    // Subtle outer glow
    float outer_glow = smoothstep(1.8, 0.6, dist_from_center) * 0.1;
    base_color += chaos_purple * outer_glow;

    // Apply intensity control
    vec3 color = base_color * u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
