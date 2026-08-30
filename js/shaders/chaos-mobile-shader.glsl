precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform float u_intensity;
// Adaptive step budget set by ShaderThemeManager (<= STEPS). 0 = use STEPS.
uniform float u_steps;

const float RS          = 0.22;
const float BEND_FORCE  = 4.5;
const int   STEPS       = 60;          // mobile ceiling (desktop shader: 75)

const float DISK_INNER  = RS * 3.0;
const float DISK_OUTER  = 7.0;         // wider Saturn-ring
const float DISK_HEIGHT = 0.22;
const float DISK_BRIGHT = 7.0;
const float ISCO_RING   = 10.0;
const float TURBULENCE  = 0.70;
const float DISK_ABSORB = 0.30;

const float DOPPLER_STR = 3.5;
const float OMEGA_SCALE = 0.42;
const float ANIM_SPEED  = 1.0;
const float RING_BRIGHT = 3.0;

// SHARED camera params — match desktop so the two renders look comparable.
const float CAM_Y           = 1.10;
const float CAM_Z           = 7.5;
const float FOV             = 0.88;
const float CAM_ORBIT_SPEED = 0.022;
const float CAM_TILT        = 0.20;
const float CAM_ROLL        = 0.10;

const float STAR_BRIGHT = 4.0;
const float TONEMAP_K   = 0.44;
const float GAMMA       = 0.80;

float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float vn(vec2 p){vec2 i=floor(p),f=p-i;f=f*f*(3.0-2.0*f);return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x),mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x),f.y);}
float fbm3(vec2 p){return 0.5*vn(p)+0.25*vn(p*2.03)+0.125*vn(p*4.07);}

// Seamless angular sampler — wraps continuously, no atan ±π seam
vec2 angC(float a, float k){ return vec2(cos(a), sin(a))*k; }
// Bounded time wobble — replaces linear t-drift in noise offsets
vec2 tWob(float t, float f, float a){ return vec2(sin(t*f), cos(t*f*1.13))*a; }

vec3 starBg(vec3 dir){
    float az=atan(dir.z,dir.x), el=asin(clamp(dir.y,-0.999,0.999));
    vec2 sph=vec2(az,el);
    float pt=0.0;
    {vec2 c=floor(sph*200.0),v=fract(sph*200.0)-0.5;float h=hash12(c+0.71);
     float cx=fract(h*7.1)-0.5,cy=fract(h*13.7)-0.5;
     float d2=(v.x-cx)*(v.x-cx)+(v.y-cy)*(v.y-cy);
     pt+=step(0.95,h)*exp(-d2*2200.0)*(h-0.95)/0.05*8.0*STAR_BRIGHT;}
    return vec3(0.002,0.008,0.025)+vec3(0.85,0.92,1.0)*pt;
}

vec3 diskEmit(vec3 cp, vec3 rd, float t){
    float r = length(cp.xz);
    float rN = clamp((r-DISK_INNER)/(DISK_OUTER-DISK_INNER),0.0,1.0);
    float ef = smoothstep(0.0,0.07,rN) * (1.0 - smoothstep(0.62,1.0,rN));
    float omega = OMEGA_SCALE * sqrt(1.5*RS/max(r*r*r,0.001));
    float phi = atan(cp.z,cp.x);
    float ap  = phi - t * omega;
    float rB  = 0.5 + 0.5 * cos(rN * 6.283 * 4.0);
    rB += 0.25 * (0.5 + 0.5 * cos(rN * 6.283 * 11.0));
    float lr = log(max(r, 0.01));
    // SEAMLESS noise sampling — no atan ±π wrap, no spaghetti drift
    float gas  = fbm3(angC(ap, 1.6) + vec2(0.0, lr*5.0) + tWob(t, 0.05, 0.7));
    float wisp = fbm3(angC(ap, 0.55) + vec2(0.0, lr*9.0) + tWob(t, 0.04, 0.6));
    float wispH = pow(max(0.0, wisp - 0.32), 1.4);
    float density = rB * ef;
    vec3  tang = normalize(vec3(-cp.z,0.0,cp.x));
    float dop  = dot(tang,-rd);
    float boost= pow(max(0.0,1.0+3.2*dop), DOPPLER_STR);
    // Sepia/copper temperature gradient — same palette as desktop for consistency
    vec3 ci=vec3(5.5,4.6,3.4), cm=vec3(1.6,0.85,0.28), co=vec3(0.72,0.30,0.08), ce=vec3(0.20,0.08,0.02);
    float t1 = smoothstep(DISK_INNER, DISK_INNER*2.6, r);
    float t2 = smoothstep(DISK_INNER*2.0, DISK_OUTER*0.72, r);
    float t3 = smoothstep(DISK_OUTER*0.58, DISK_OUTER, r);
    vec3 temp = mix(mix(ci, cm, t1), co, t2);
    temp = mix(temp, ce, t3);
    float iscoR = DISK_INNER + 0.032;
    float isco  = exp(-pow((r-iscoR)/0.026, 2.0)) * ISCO_RING;
    float em = density * (0.30 + 0.70*gas*TURBULENCE) * boost + isco * 0.7;
    vec3 result = temp * em;
    // Hot copper-white wisps + cool brown dust — matches desktop tone
    result += vec3(2.6, 1.75, 0.65) * wispH * density * 1.45 * boost * ef;
    result += vec3(1.5, 0.95, 0.42) * pow(wisp, 1.1) * density * 0.55 * ef;
    // Dark dust modulator — shadowy striations for richer texture
    float dustMod = pow(max(0.0, 0.5 - wisp), 1.4) * 1.2;
    result *= 1.0 - dustMod * 0.32 * ef;
    return result;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float ar = u_resolution.x / u_resolution.y;
    // Aspect-aware: in portrait, expand vertical so BH stays centred and disk fits.
    vec2 sc = ar > 1.0 ? (uv*2.0-1.0) * vec2(ar, 1.0)
                       : (uv*2.0-1.0) * vec2(1.0, 1.0/ar);
    // (no off-centre offset — shared framing with desktop)
    float t = u_time * ANIM_SPEED;
    float a = t * CAM_ORBIT_SPEED;
    // Inclined (non-planar) orbit — tilts the orbital plane around X axis
    vec3 base = vec3(sin(a)*CAM_Z, CAM_Y, cos(a)*CAM_Z);
    float ct = cos(CAM_TILT), st = sin(CAM_TILT);
    vec3 camPos = vec3(base.x, base.y*ct - base.z*st, base.y*st + base.z*ct);
    vec3 fwd = normalize(-camPos);
    // Roll camera around its forward axis
    float cR = cos(CAM_ROLL), sR = sin(CAM_ROLL);
    vec3 worldUp = vec3(sR, cR, 0.0);
    vec3 rgt = normalize(cross(fwd, worldUp));
    vec3 up  = cross(rgt, fwd);
    vec3 pos = camPos;
    vec3 dir = normalize(fwd*FOV + rgt*sc.x + up*sc.y);
    vec3 color = vec3(0.0);
    float trans = 1.0;
    float prevY = pos.y;
    // GLSL ES 1.0 needs a constant loop bound; the adaptive budget breaks early.
    float stepBudget = (u_steps > 0.5) ? min(u_steps, float(STEPS)) : float(STEPS);
    for(int i=0; i<STEPS; i++){
        if(float(i) >= stepBudget) break;
        float r  = length(pos);
        float dR = length(pos.xz);
        if(r < RS*1.05) break;
        if(r > 13.0) break;       // exit > camera distance + disk extent
        float step = min(0.05 * r / (1.0 + 8.0*RS/r), 0.25);
        vec3 toC = -pos / r;
        float accel = (RS*BEND_FORCE) / (r*r + RS*0.4);
        dir = normalize(dir + toC * accel * step * 2.0);
        vec3 nextPos = pos + dir * step;
        if(prevY * nextPos.y < 0.0){
            float al = prevY / (prevY - nextPos.y);
            vec3 cp = pos + dir * step * al;
            float cr = length(cp.xz);
            if(cr >= DISK_INNER && cr <= DISK_OUTER){
                vec3 em = diskEmit(cp, dir, t);
                color += trans * em * DISK_BRIGHT;
                trans *= exp(-DISK_ABSORB);
            }
        }
        // Cheap volumetric: grazing-angle rays inside disk volume — adds Einstein-ring visibility
        if(abs(pos.y) < DISK_HEIGHT && dR >= DISK_INNER && dR <= DISK_OUTER){
            float vF = exp(-abs(pos.y)/(DISK_HEIGHT*0.6));
            float dS = step / (DISK_HEIGHT*2.0);
            color += trans * diskEmit(pos, dir, t) * dS * 0.45 * vF;
            trans *= exp(-DISK_ABSORB * 0.20 * dS * vF);
        }
        prevY = nextPos.y;
        pos = nextPos;
        if(trans < 0.01) break;
    }
    float ip = length(cross(camPos, normalize(fwd*FOV + rgt*sc.x + up*sc.y)));
    float ring = smoothstep(RS*2.40, RS*2.58, ip) * (1.0 - smoothstep(RS*2.58, RS*2.76, ip));
    color += vec3(0.92, 0.97, 1.0) * ring * RING_BRIGHT;
    color += trans * starBg(dir);
    color = color / (1.0 + color*TONEMAP_K);
    color *= max(0.0, 1.0 - length(sc)*0.07);
    gl_FragColor = vec4(pow(max(vec3(0.0), color*u_intensity), vec3(GAMMA)), 1.0);
}