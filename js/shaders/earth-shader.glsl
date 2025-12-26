precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// ============================================================================
// ENHANCED EARTH SHADER - Living Meadow Theme
// Features: Organic patterns, Voronoi cells, flowing particles, plant growth
// NEW: Swaying grass, dandelion seeds, edge flowers - living meadow feel
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

// FBM for organic textures
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

// Voronoi pattern for organic earth texture
vec2 voronoi(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);

    float minDist = 8.0;
    vec2 minPoint;

    for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
            vec2 neighbor = vec2(float(i), float(j));
            vec2 point = hash22(n + neighbor);

            // Animate points slowly for organic movement
            point += 0.3 * vec2(
                sin(u_time * 0.1 + hash12(n + neighbor) * 6.28),
                cos(u_time * 0.12 + hash12(n + neighbor + 1.0) * 6.28)
            );

            vec2 diff = neighbor + point - f;
            float dist = length(diff);

            if(dist < minDist) {
                minDist = dist;
                minPoint = point;
            }
        }
    }

    return vec2(minDist, hash12(minPoint));
}

// Growth/plant-like pattern
float growthPattern(vec2 uv, float time) {
    vec2 p = uv * 8.0;

    // Flowing growth direction
    vec2 flow = vec2(
        fbm(p * 0.5 + vec2(time * 0.05, 0.0), 3),
        fbm(p * 0.5 + vec2(0.0, time * 0.06), 3)
    );

    // Branch-like structure
    float growth = fbm(p + flow * 2.0, 4);

    // Add veiny structure
    vec2 voro = voronoi(p * 2.0);
    growth += voro.x * 0.3;

    return growth;
}

// Flowing particles with natural movement
float particles(vec2 uv_scaled, float time) {
    float particle = 0.0;

    for(int i = 0; i < 18; i++) {
        float fi = float(i);
        float seed = hash12(vec2(fi, 0.0));

        // Varied lifetime for each particle
        float lifetime = 5.0 + seed * 3.0;
        float t = mod(time * 0.08 + seed * lifetime, lifetime) / lifetime;

        // Starting position
        vec2 start_pos = vec2(
            hash12(vec2(fi, 1.0)) * 2.0 - 1.0,
            hash12(vec2(fi, 2.0)) * 2.0 - 1.0
        );

        // Organic floating motion (circular/spiral paths)
        float angle = t * 6.28 + fi;
        float radius = 0.3 + sin(time * 0.2 + fi) * 0.2;

        vec2 particle_pos = start_pos + vec2(
            cos(angle) * radius * t,
            sin(angle) * radius * t
        );

        // Add drift
        particle_pos += vec2(
            fbm(vec2(fi, time * 0.1), 2) * 0.3,
            fbm(vec2(fi + 10.0, time * 0.12), 2) * 0.3
        );

        float dist = length(uv_scaled - particle_pos);
        float size = 0.01 + hash12(vec2(fi, 3.0)) * 0.02;

        // Particle with soft edges
        float core = smoothstep(size, size * 0.4, dist);
        float glow = smoothstep(size * 3.0, 0.0, dist) * 0.4;

        // Pulsing animation
        float pulse = 0.7 + 0.3 * sin(time * 2.0 + fi * 2.0);

        // Smooth fade in/out
        float fade = sin(t * 3.14159);

        particle += (core + glow) * pulse * fade;
    }

    return particle;
}

// NEW: Swaying grass blades on bottom edge (living meadow)
float grassBlades(vec2 uv, float time) {
    // Only render grass at bottom 5-10% of screen
    if(uv.y > 0.1) return 0.0;

    float grass = 0.0;
    vec2 p = vec2(uv.x * 80.0, uv.y * 20.0);

    // Multiple grass blades
    for(int i = 0; i < 30; i++) {
        float fi = float(i);
        float x = fi * 2.7 + hash12(vec2(fi, 0.0)) * 2.0;

        // Blade position
        float blade_x = p.x - x;

        // Sway motion (wind effect)
        float sway = sin(time * 1.5 + fi * 0.5) * 0.3;
        float height = uv.y * 20.0;

        // Blade shape (tapering toward top)
        float blade_width = 0.08 * (1.0 - height * 8.0);
        float blade = smoothstep(blade_width, 0.0, abs(blade_x - sway * height));

        // Fade at top of grass
        blade *= smoothstep(0.12, 0.0, uv.y);

        grass += blade;
    }

    return grass * 0.5;
}

// NEW: Dandelion seeds floating upward
float dandelionSeeds(vec2 uv_scaled, vec2 uv, float time) {
    float seeds = 0.0;

    for(int i = 0; i < 8; i++) {
        float fi = float(i);
        float seed = hash12(vec2(fi, 10.0));

        // Seed lifetime (floating up from meadow)
        float lifetime = 6.0 + seed * 3.0;
        float t = mod(time * 0.06 + seed * lifetime, lifetime) / lifetime;

        // Start from bottom
        vec2 start_pos = vec2(
            hash12(vec2(fi, 11.0)) * 2.0 - 1.0,
            -0.8
        );

        // Float upward with gentle drift
        float drift = sin(time * 0.8 + fi * 2.0) * 0.3;
        vec2 seed_pos = start_pos + vec2(drift, t * 2.5);

        // Add wind turbulence
        seed_pos.x += fbm(vec2(fi, time * 0.15), 2) * 0.2;

        float dist = length(uv_scaled - seed_pos);
        float size = 0.012;

        // Dandelion seed shape (central seed + wispy parachute)
        float core = smoothstep(size * 0.3, 0.0, dist);

        // Wispy parachute structure (star-like rays)
        float parachute = 0.0;
        for(int j = 0; j < 6; j++) {
            float angle = float(j) * 6.28 / 6.0 + time * 0.5 + fi;
            vec2 ray_dir = vec2(cos(angle), sin(angle));
            vec2 to_seed = uv_scaled - seed_pos;
            float ray_dist = abs(dot(to_seed, vec2(-ray_dir.y, ray_dir.x)));
            float along = dot(to_seed, ray_dir);

            if(along > 0.0 && along < size * 4.0) {
                parachute += smoothstep(size * 0.15, 0.0, ray_dist) * (1.0 - along / (size * 4.0));
            }
        }

        // Fade in/out during lifetime
        float fade = sin(t * 3.14159);

        seeds += (core + parachute * 0.3) * fade * 0.6;
    }

    return seeds;
}

// NEW: Small flowers/plants growing at borders
float edgeFlowers(vec2 uv_scaled, vec2 uv, float time) {
    float flowers = 0.0;

    // Only on bottom and side edges
    float edge_dist = min(min(uv.y, 1.0 - uv.y), min(uv.x, 1.0 - uv.x));
    if(edge_dist > 0.08) return 0.0;

    for(int i = 0; i < 12; i++) {
        float fi = float(i);
        float seed = hash12(vec2(fi, 20.0));

        // Flower position (at edges)
        vec2 flower_pos;
        if(seed < 0.4) {
            // Bottom edge
            flower_pos = vec2(
                hash12(vec2(fi, 21.0)) * 2.0 - 1.0,
                -0.75 - hash12(vec2(fi, 22.0)) * 0.15
            );
        } else if(seed < 0.7) {
            // Left edge
            flower_pos = vec2(
                -0.85 - hash12(vec2(fi, 21.0)) * 0.15,
                hash12(vec2(fi, 22.0)) * 2.0 - 1.0
            );
        } else {
            // Right edge
            flower_pos = vec2(
                0.85 + hash12(vec2(fi, 21.0)) * 0.15,
                hash12(vec2(fi, 22.0)) * 2.0 - 1.0
            );
        }

        // Gentle swaying in wind
        flower_pos.x += sin(time * 0.5 + fi) * 0.02;

        float dist = length(uv_scaled - flower_pos);
        float size = 0.015 + hash12(vec2(fi, 23.0)) * 0.01;

        // Simple flower shape (5 petals)
        float flower = 0.0;
        for(int j = 0; j < 5; j++) {
            float angle = float(j) * 6.28 / 5.0 + time * 0.1;
            vec2 petal_offset = vec2(cos(angle), sin(angle)) * size * 0.8;
            float petal_dist = length(uv_scaled - flower_pos - petal_offset);
            flower += smoothstep(size * 0.6, size * 0.3, petal_dist);
        }

        // Flower center
        flower += smoothstep(size * 0.4, size * 0.2, dist);

        flowers += flower * 0.3;
    }

    return flowers;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv_scaled = uv * 2.0 - 1.0;
    uv_scaled.x *= u_resolution.x / u_resolution.y;

    // Organic earth pattern using Voronoi
    vec2 voro = voronoi(uv * 6.0);
    float pattern = smoothstep(0.0, 0.6, voro.x);

    // Growth pattern
    float growth = growthPattern(uv, u_time);
    growth = smoothstep(0.3, 0.7, growth);

    // Multi-octave noise for rich texture
    float texture1 = fbm(uv * 10.0 + u_time * 0.03, 5);
    float texture2 = fbm(uv * 15.0 - u_time * 0.02, 4);

    // Flowing particles
    float particle_val = particles(uv_scaled, u_time);

    // NEW: Living meadow features
    float grass = grassBlades(uv, u_time);
    float seeds = dandelionSeeds(uv_scaled, uv, u_time);
    float flowers = edgeFlowers(uv_scaled, uv, u_time);

    // Earthy color palette
    vec3 dark_soil = vec3(0.06, 0.04, 0.02);       // #0f0a05
    vec3 medium_earth = vec3(0.1, 0.08, 0.06);     // #1a1410
    vec3 dark_green = vec3(0.18, 0.29, 0.17);      // #2d4a2b
    vec3 light_green = vec3(0.23, 0.37, 0.21);     // #3a5f35
    vec3 grass_color = vec3(0.25, 0.42, 0.23);     // #409e3a - Bright grass
    vec3 flower_color = vec3(0.45, 0.35, 0.15);    // #725926 - Earthy flowers
    vec3 seed_color = vec3(0.85, 0.85, 0.82);      // #D9D9D1 - Light seeds

    // Base color from Voronoi pattern
    vec3 base_color = mix(dark_soil, medium_earth, pattern);

    // Add growth pattern (greenish tint)
    base_color = mix(base_color, dark_green, growth * 0.4);

    // Add texture layers
    base_color += (texture1 - 0.5) * 0.05;
    base_color += (texture2 - 0.5) * 0.03;

    // Add particles with earthy glow
    vec3 particle_color = mix(medium_earth, light_green, particle_val * 0.5);
    base_color += particle_color * particle_val * 0.35;

    // NEW: Add grass (bright green at bottom)
    base_color = mix(base_color, grass_color, grass * 0.6);

    // NEW: Add dandelion seeds (light, floating)
    base_color = mix(base_color, seed_color, seeds * 0.4);

    // NEW: Add edge flowers (warm earthy blooms)
    base_color = mix(base_color, flower_color, flowers * 0.5);

    // Subtle vignette for depth
    float vignette = smoothstep(1.5, 0.5, length(uv_scaled));
    base_color *= 0.7 + 0.3 * vignette;

    // Apply intensity control
    vec3 color = base_color * u_intensity;

    gl_FragColor = vec4(color, 1.0);
}
