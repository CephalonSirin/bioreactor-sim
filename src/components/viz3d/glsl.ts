/**
 * Shader sources for the 3D reactor. Colours are authored in linear space
 * and every fragment shader ends with three's tone-mapping and colour-space
 * chunks so custom materials sit in the same exposure as the lit metal.
 *
 * The liquid is rendered as a participating medium: each fragment (and
 * each particle) measures how much culture lies between it and the eye by
 * intersecting the view ray with the liquid cylinder analytically, then
 * applies Beer-Lambert attenuation with an extinction set by biomass.
 */

const OUT = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`

/** Liquid column uniforms + analytic path length through it. */
export const LIQUID_PATH = /* glsl */ `
  uniform float uLevelY;
  uniform float uBaseY;
  uniform float uRad;
  float liquidPath(vec3 p, vec3 d) {
    float t = 100.0;
    float a = d.x * d.x + d.z * d.z;
    if (a > 1e-5) {
      float b = p.x * d.x + p.z * d.z;
      float c = p.x * p.x + p.z * p.z - uRad * uRad;
      float disc = b * b - a * c;
      t = (-b + sqrt(max(disc, 0.0))) / a;
    }
    if (d.y > 1e-4) t = min(t, (uLevelY - p.y) / d.y);
    else if (d.y < -1e-4) t = min(t, (uBaseY - p.y) / d.y);
    return max(t, 0.0);
  }
`

/**
 * Stirred-tank circulation: a Rushton turbine throws fluid radially to the
 * wall, where it splits into an upper and a lower recirculation loop.
 * Particles ride nested elliptical loops above and below the impeller plane
 * plus a tangential swirl, scaled to the current liquid height.
 */
const CIRCULATE = /* glsl */ `
  uniform float uTime;
  uniform float uImpY;
  vec3 circulate(vec4 A, vec4 B, float speed, float swirl) {
    float top = uLevelY - 0.05;
    float bot = uBaseY + 0.05;
    float imp = clamp(uImpY, bot + 0.12, max(top - 0.05, bot + 0.13));
    bool upper = A.z > 0.3;
    float y0 = upper ? imp : bot;
    float y1 = upper ? top : imp;
    float yc = 0.5 * (y0 + y1);
    float hb = max(0.5 * (y1 - y0), 0.02);
    float ring = 0.22 + 0.78 * B.y;
    float rc = 0.52 * uRad;
    float ra = 0.41 * uRad * ring;
    float rb = hb * 0.92 * ring;
    float dir = upper ? 1.0 : -1.0;
    float th = 6.28318 * A.x + dir * uTime * speed * (0.6 + 0.8 * B.x) / max(hb, 0.35);
    float r = rc + ra * cos(th);
    float y = yc + rb * sin(th);
    float phi = A.y + uTime * swirl * (0.5 + B.x) / (0.35 + r);
    vec3 p = vec3(cos(phi) * r, y, sin(phi) * r);
    float w = B.w * 43.0;
    p += 0.035 * vec3(sin(uTime * 1.3 + w), sin(uTime * 0.9 + w * 1.7), cos(uTime * 1.1 + w * 2.3));
    float rr = length(p.xz);
    float rmax = uRad - 0.045;
    if (rr > rmax) p.xz *= rmax / rr;
    p.y = clamp(p.y, bot, top);
    return p;
  }
`

// ---------------------------------------------------------------- glass
export const GLASS_VERT = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vN;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

export const GLASS_FRAG = /* glsl */ `
  uniform float uOpacity;
  uniform float uGrad;
  uniform float uY0;
  uniform float uH;
  uniform float uFade;
  uniform vec3 uTint;
  varying vec3 vWorld;
  varying vec3 vN;
  float band(float az, float c, float w) {
    float d = abs(atan(sin(az - c), cos(az - c)));
    return smoothstep(w, w * 0.15, d);
  }
  void main() {
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 N = normalize(vN);
    if (!gl_FrontFacing) N = -N;
    float ndv = abs(dot(N, V));
    float fres = pow(1.0 - ndv, 3.0);
    vec3 R = reflect(-V, N);
    float az = atan(R.z, R.x);
    float vert = smoothstep(-0.35, 0.1, R.y) * smoothstep(0.95, 0.55, R.y);
    float key = band(az, 1.25, 0.2) * vert;
    float key2 = band(az, 0.55, 0.07) * vert;
    float rim = band(az, -2.3, 0.13) * vert;
    float top = smoothstep(0.55, 1.0, R.y);
    vec3 col = uTint * 0.12;
    col += vec3(1.0, 0.97, 0.92) * (key * 1.5 + key2 * 0.9);
    col += vec3(0.45, 0.95, 0.88) * rim * 1.1;
    col += vec3(0.6, 0.8, 0.85) * top * 0.25;
    col += vec3(0.4, 0.85, 0.8) * fres * 0.55;
    float a = uOpacity + fres * 0.32 + key * 0.4 + key2 * 0.3 + rim * 0.35 + top * 0.08;

    // Printed graduation marks every 10 % of the working height.
    if (uGrad > 0.5 && gl_FrontFacing) {
      float paz = atan(vWorld.z, vWorld.x);
      float h = (vWorld.y - uY0) / uH;
      float k = h * 10.0;
      float dist = abs(fract(k + 0.5) - 0.5) * 0.1 * uH;
      float line = smoothstep(0.011, 0.004, dist);
      float major = 1.0 - mod(floor(k + 0.5), 2.0);
      float len = major > 0.5 ? 0.16 : 0.09;
      float inBand = step(abs(paz - 0.98), len) * step(0.05, h) * step(h, 0.96);
      col += vec3(0.85, 0.95, 0.93) * line * inBand * 0.6;
      a += line * inBand * 0.35;
    }
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uFade);
    ${OUT}
  }
`

// --------------------------------------------------------------- liquid
export const LIQUID_VERT = /* glsl */ `
  uniform float uLevelY;
  uniform float uBaseY;
  varying vec3 vWorld;
  varying vec3 vN;
  void main() {
    vec3 p = position;
    p.y = mix(uBaseY, uLevelY, position.y);
    vWorld = p;
    vN = normal;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`

export const LIQUID_FRAG = /* glsl */ `
  ${LIQUID_PATH}
  uniform vec3 uColor;
  uniform float uTurb;
  uniform float uTime;
  uniform vec3 uKeyDir;
  uniform float uFade;
  varying vec3 vWorld;
  varying vec3 vN;
  void main() {
    vec3 d = normalize(vWorld - cameraPosition);
    float L = liquidPath(vWorld + d * 0.001, d);
    float sigma = 0.22 + 3.6 * uTurb;
    float absorb = 1.0 - exp(-sigma * L);
    vec3 N = normalize(vN);
    float h = clamp((vWorld.y - uBaseY) / max(uLevelY - uBaseY, 0.01), 0.0, 1.0);
    float lit = 0.5 + 0.4 * max(dot(N, uKeyDir), 0.0) + 0.22 * h;
    // Forward scattering: the far side glows where light passes through.
    float through = pow(max(dot(-d, -uKeyDir) * 0.5 + 0.5, 0.0), 3.0);
    vec3 col = uColor * lit * mix(1.1, 0.75, absorb * 0.6);
    col += uColor * through * 0.35 * (1.0 - uTurb * 0.5);
    // Faint caustic shimmer in clear medium.
    float c = sin(vWorld.y * 18.0 + uTime * 1.3 + sin(atan(vWorld.z, vWorld.x) * 7.0) * 1.5);
    col += vec3(0.5, 0.9, 0.85) * smoothstep(0.85, 1.0, c) * 0.05 * (1.0 - uTurb);
    float fres = pow(1.0 - abs(dot(N, -d)), 2.5);
    col += fres * vec3(0.6, 0.9, 0.85) * 0.12;
    float a = mix(0.14, 0.95, absorb);
    gl_FragColor = vec4(col, a * uFade);
    ${OUT}
  }
`

export const SURFACE_VERT = /* glsl */ `
  uniform float uLevelY;
  uniform float uRad;
  uniform float uTime;
  uniform float uAgit;
  uniform float uGas;
  varying vec3 vWorld;
  varying vec3 vN;
  float height(vec2 xz) {
    float r = length(xz) / uRad;
    float a = atan(xz.y, xz.x);
    float vortex = -uAgit * 0.04 * (1.0 - r * r);
    float w = sin(r * 14.0 - uTime * 2.4 + a * 3.0) * 0.006
            + sin(r * 9.0 + a * 5.0 + uTime * 1.7) * 0.005
            + sin(xz.x * 6.0 + uTime * 1.3) * sin(xz.y * 7.0 - uTime * 1.1) * 0.007;
    w *= (0.3 + uAgit) * (1.0 + uGas * 0.9) * smoothstep(1.0, 0.8, r);
    return vortex + w;
  }
  void main() {
    vec2 xz = position.xz;
    float e = 0.02;
    float h0 = height(xz);
    float hx = height(xz + vec2(e, 0.0));
    float hz = height(xz + vec2(0.0, e));
    vN = normalize(vec3(h0 - hx, e, h0 - hz));
    vec3 p = vec3(xz.x, uLevelY + h0, xz.y);
    vWorld = p;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`

export const SURFACE_FRAG = /* glsl */ `
  uniform float uBaseY;
  uniform float uRad;
  uniform float uLevelY;
  float liquidPathS(vec3 p, vec3 d) {
    float t = 100.0;
    float a = d.x * d.x + d.z * d.z;
    if (a > 1e-5) {
      float b = p.x * d.x + p.z * d.z;
      float c = p.x * p.x + p.z * p.z - uRad * uRad;
      t = (-b + sqrt(max(b * b - a * c, 0.0))) / a;
    }
    if (d.y < -1e-4) t = min(t, (uBaseY - p.y) / d.y);
    return max(t, 0.0);
  }
  uniform vec3 uColor;
  uniform float uTurb;
  uniform vec3 uKeyDir;
  uniform vec3 uRimDir;
  uniform float uFade;
  varying vec3 vWorld;
  varying vec3 vN;
  void main() {
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 N = normalize(vN);
    float ndv = max(dot(N, V), 0.0);
    float fres = 0.03 + 0.97 * pow(1.0 - ndv, 5.0);
    vec3 R = reflect(-V, N);
    vec3 sky = mix(vec3(0.02, 0.05, 0.06), vec3(0.16, 0.27, 0.3), smoothstep(-0.1, 0.9, R.y));
    float spec = pow(max(dot(R, uKeyDir), 0.0), 140.0) * 2.2 + pow(max(dot(R, uRimDir), 0.0), 50.0) * 0.6;
    vec3 refr = refract(-V, N, 0.75);
    float L = liquidPathS(vWorld - vec3(0.0, 0.002, 0.0), refr);
    float sigma = 0.22 + 3.6 * uTurb;
    float absorb = 1.0 - exp(-sigma * L);
    vec3 body = uColor * (0.72 + 0.2 * max(dot(N, uKeyDir), 0.0));
    vec3 col = mix(body, sky, fres) + spec;
    float edge = smoothstep(0.9, 1.0, length(vWorld.xz) / uRad);
    col += vec3(0.7, 0.95, 0.9) * edge * 0.25;
    float a = clamp(mix(0.12, 0.95, absorb) + fres * 0.45 + spec + edge * 0.2, 0.0, 1.0);
    gl_FragColor = vec4(col, a * uFade);
    ${OUT}
  }
`

// ------------------------------------------------------------ particles
export const CELL_VERT = /* glsl */ `
  ${LIQUID_PATH}
  ${CIRCULATE}
  attribute vec4 aA;
  attribute vec4 aB;
  uniform float uDensity;
  uniform float uScale;
  uniform float uSigma;
  varying vec3 vN;
  varying vec3 vView;
  varying float vVis;
  varying float vTone;
  void main() {
    vec3 c = circulate(aA, aB, 0.5, 0.3);
    float show = smoothstep(uDensity, uDensity - 0.04, aA.w);
    float s = uScale * (0.6 + 0.8 * aB.z) * show;
    float ang = aB.w * 6.2831 + uTime * (0.25 + aB.x * 0.6);
    float ca = cos(ang), sa = sin(ang);
    float b = aA.y + aB.x * 3.0;
    float cb = cos(b), sb = sin(b);
    vec3 lp = position * vec3(2.0, 1.0, 1.0);
    lp = vec3(ca * lp.x - sa * lp.y, sa * lp.x + ca * lp.y, lp.z);
    lp = vec3(cb * lp.x + sb * lp.z, lp.y, -sb * lp.x + cb * lp.z);
    vec3 n = normal * vec3(0.5, 1.0, 1.0);
    n = vec3(ca * n.x - sa * n.y, sa * n.x + ca * n.y, n.z);
    n = vec3(cb * n.x + sb * n.z, n.y, -sb * n.x + cb * n.z);
    vN = normalize(n);
    vec3 toCam = normalize(cameraPosition - c);
    vView = toCam;
    vVis = exp(-uSigma * liquidPath(c, toCam));
    vTone = 0.8 + 0.4 * aB.w;
    gl_Position = projectionMatrix * viewMatrix * vec4(c + lp * s, 1.0);
  }
`

export const CELL_FRAG = /* glsl */ `
  uniform vec3 uCellColor;
  uniform vec3 uLiquid;
  uniform vec3 uKeyDir;
  uniform float uFade;
  varying vec3 vN;
  varying vec3 vView;
  varying float vVis;
  varying float vTone;
  void main() {
    vec3 n = normalize(vN);
    float diff = 0.4 + 0.6 * max(dot(n, uKeyDir), 0.0);
    float rim = pow(1.0 - abs(dot(n, normalize(vView))), 2.0);
    vec3 col = uCellColor * vTone * diff + rim * vec3(1.0, 0.86, 0.55) * 0.55;
    col = mix(uLiquid * 0.8, col, vVis);
    float a = smoothstep(0.03, 0.45, vVis) * 0.95 * uFade;
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
    ${OUT}
  }
`

export const POINTS_VERT = /* glsl */ `
  ${LIQUID_PATH}
  ${CIRCULATE}
  attribute vec4 aA;
  attribute vec4 aB;
  uniform float uDensity;
  uniform float uSize;
  uniform float uPR;
  uniform float uSigma;
  uniform float uSpeed;
  varying float vVis;
  varying float vTw;
  void main() {
    vec3 c = circulate(aA, aB, uSpeed, uSpeed * 0.6);
    float show = smoothstep(uDensity, uDensity - 0.05, aA.w);
    vec4 mv = viewMatrix * vec4(c, 1.0);
    gl_PointSize = uSize * (0.6 + 0.8 * aB.z) * show * uPR / max(-mv.z, 0.1);
    vVis = exp(-uSigma * liquidPath(c, normalize(cameraPosition - c)));
    vTw = 0.75 + 0.25 * sin(uTime * 2.6 + aB.w * 50.0);
    gl_Position = projectionMatrix * mv;
  }
`

export const GLOW_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vVis;
  varying float vTw;
  void main() {
    vec2 q = gl_PointCoord * 2.0 - 1.0;
    float d = dot(q, q);
    if (d > 1.0) discard;
    float core = exp(-d * 5.0);
    vec3 col = uColor * (core * 1.5 + 0.15) * vTw;
    gl_FragColor = vec4(col, core * vVis * uAlpha);
    ${OUT}
  }
`

export const RING_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vVis;
  varying float vTw;
  void main() {
    vec2 q = gl_PointCoord * 2.0 - 1.0;
    float r = length(q);
    if (r > 1.0) discard;
    float ring = smoothstep(0.45, 0.68, r) * smoothstep(1.0, 0.8, r);
    float dotc = smoothstep(0.3, 0.0, r) * 0.5;
    gl_FragColor = vec4(uColor * 1.3, (ring + dotc) * vVis * uAlpha * vTw);
    ${OUT}
  }
`

export const BUBBLE_VERT = /* glsl */ `
  ${LIQUID_PATH}
  attribute vec4 aA;
  attribute vec4 aB;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uSpargeY;
  uniform float uSpargeR;
  uniform float uImpY;
  uniform float uAgit;
  uniform float uSigma;
  varying vec3 vN;
  varying vec3 vView;
  varying float vVis;
  void main() {
    float cycle = 3.3;
    float speed = 0.5 + 0.35 * aA.z;
    float y = uSpargeY + mod(aA.x * cycle + uTime * speed, cycle);
    float alive = step(y, uLevelY - 0.012);
    float fadeTop = smoothstep(uLevelY - 0.005, uLevelY - 0.07, y);
    float fadeIn = smoothstep(uSpargeY - 0.01, uSpargeY + 0.06, y);
    float disp = smoothstep(uImpY - 0.06, uImpY + 0.3, y) * (0.25 + 0.75 * uAgit);
    float r = mix(uSpargeR + (aB.w - 0.5) * 0.06, 0.28 + 0.62 * aB.z, disp);
    float phi = aA.y + disp * uTime * 0.5 * uAgit + 0.12 * sin(uTime * aB.x * 3.0 + aB.w * 20.0);
    vec3 c = vec3(cos(phi) * r, y, sin(phi) * r);
    c.x += 0.018 * sin(uTime * 5.0 * aB.x + aB.w * 10.0);
    c.z += 0.018 * cos(uTime * 4.0 * aB.x + aB.w * 7.0);
    float show = step(aA.w, uIntensity) * alive;
    float s = (0.026 + 0.036 * aB.y) * (1.0 + 0.3 * (y - uSpargeY) / 3.0) * show * fadeIn * fadeTop;
    vN = normal;
    vec3 toCam = normalize(cameraPosition - c);
    vView = toCam;
    vVis = exp(-uSigma * liquidPath(c, toCam));
    gl_Position = projectionMatrix * viewMatrix * vec4(c + position * s * vec3(1.0, 0.82, 1.0), 1.0);
  }
`

export const BUBBLE_FRAG = /* glsl */ `
  uniform vec3 uKeyDir;
  uniform float uFade;
  varying vec3 vN;
  varying vec3 vView;
  varying float vVis;
  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(vView);
    float rim = pow(1.0 - max(dot(n, v), 0.0), 2.2);
    float spec = pow(max(dot(reflect(-v, n), uKeyDir), 0.0), 30.0);
    vec3 col = vec3(0.85, 1.0, 0.97) * (rim * 0.95 + 0.06) + spec * 1.4;
    float a = (rim * 0.9 + 0.08 + spec) * mix(0.25, 1.0, vVis) * uFade;
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
    ${OUT}
  }
`

// ---------------------------------------------------------- flow & misc
export const UV_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vN;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

/** Translucent silicone tubing with pulses travelling in the flow direction. */
export const TUBE_FRAG = /* glsl */ `
  uniform vec3 uFluid;
  uniform float uFlow;
  uniform float uTime;
  uniform float uLen;
  uniform float uShow;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vN;
  void main() {
    vec3 V = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - abs(dot(normalize(vN), V)), 2.0);
    float k = fract(vUv.x * uLen * 2.2 - uTime * (0.6 + 2.4 * uFlow));
    float pulse = smoothstep(0.0, 0.25, k) * smoothstep(0.7, 0.3, k) * uShow;
    vec3 col = uFluid * (0.45 + 0.9 * pulse * (0.4 + uFlow)) + vec3(0.8, 0.95, 0.95) * fres * 0.35;
    float a = 0.42 + fres * 0.35 + pulse * 0.35;
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
    ${OUT}
  }
`

/** Falling feed stream: drips at low F, a continuous thread at high F. */
export const STREAM_FRAG = /* glsl */ `
  uniform vec3 uFluid;
  uniform float uFlow;
  uniform float uTime;
  uniform float uLen;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vN;
  void main() {
    float k = fract(vUv.y * uLen * 3.0 + uTime * 3.2);
    float duty = mix(0.22, 0.97, uFlow);
    float drop = smoothstep(0.0, 0.08, k) * smoothstep(duty + 0.05, duty, k);
    vec3 V = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - abs(dot(normalize(vN), V)), 1.5);
    vec3 col = uFluid * 1.6 + fres * 0.5;
    float a = drop * (0.75 + fres * 0.25);
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
    ${OUT}
  }
`

/** Expanding ripples where the feed lands, and impeller discharge streaks. */
export const RIPPLE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uAmt;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vN;
  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float r = length(q);
    float a = 0.0;
    for (int i = 0; i < 2; i++) {
      float ph = fract(uTime * 0.9 + float(i) * 0.5);
      a += smoothstep(0.08, 0.0, abs(r - ph)) * (1.0 - ph);
    }
    a *= smoothstep(1.0, 0.8, r) * uAmt;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor * 1.5, a * 0.7);
    ${OUT}
  }
`

export const JET_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uAmt;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vN;
  void main() {
    float r = length(vWorld.xz);
    float az = atan(vWorld.z, vWorld.x);
    float s = pow(0.5 + 0.5 * sin(az * 12.0 - uTime * 5.0 + r * 10.0), 6.0);
    float s2 = pow(0.5 + 0.5 * sin(az * 7.0 - uTime * 3.5 - r * 6.0), 8.0);
    float fall = smoothstep(0.34, 0.45, r) * smoothstep(0.98, 0.5, r);
    float a = (s * 0.7 + s2 * 0.5) * fall * uAmt;
    gl_FragColor = vec4(uColor, a);
    ${OUT}
  }
`

export const FLOOR_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

export const FLOOR_FRAG = /* glsl */ `
  uniform vec3 uGlow;
  uniform float uGlowAmt;
  uniform float uFade;
  varying vec3 vWorld;
  float grid(vec2 p, float scale) {
    vec2 q = p * scale;
    vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  void main() {
    float r = length(vWorld.xz);
    float fade = smoothstep(11.0, 2.5, r);
    vec3 col = vec3(0.018, 0.04, 0.045);
    col += vec3(0.27, 0.88, 0.78) * (grid(vWorld.xz, 2.0) * 0.045 + grid(vWorld.xz, 0.5) * 0.09) * fade;
    // Rings of a turntable-like plinth under the vessel.
    float ring = smoothstep(0.02, 0.0, abs(r - 1.75)) + smoothstep(0.012, 0.0, abs(r - 2.05)) * 0.6;
    col += vec3(0.27, 0.88, 0.78) * ring * 0.18;
    float shadow = smoothstep(2.1, 1.0, r);
    col *= 1.0 - shadow * 0.55;
    col += uGlow * uGlowAmt * smoothstep(3.2, 1.1, r) * 0.18;
    float a = smoothstep(12.0, 5.0, r) * uFade;
    gl_FragColor = vec4(col, a);
    ${OUT}
  }
`

export const DUST_VERT = /* glsl */ `
  attribute vec4 aA;
  uniform float uTime;
  uniform float uPR;
  varying float vA;
  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * (0.04 + aA.x * 0.06), 7.0) - 0.5;
    p.x += sin(uTime * 0.2 + aA.y * 30.0) * 0.3;
    p.z += cos(uTime * 0.17 + aA.z * 30.0) * 0.3;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.2 + aA.w * 2.4) * uPR * 7.0 / max(-mv.z, 0.1);
    vA = smoothstep(-0.5, 0.6, p.y) * smoothstep(6.5, 4.5, p.y) * (0.25 + 0.75 * aA.w);
    gl_Position = projectionMatrix * mv;
  }
`

export const DUST_FRAG = /* glsl */ `
  uniform float uFade;
  varying float vA;
  void main() {
    vec2 q = gl_PointCoord * 2.0 - 1.0;
    float d = dot(q, q);
    if (d > 1.0) discard;
    gl_FragColor = vec4(vec3(0.55, 0.95, 0.88), exp(-d * 4.0) * vA * 0.5 * uFade);
    ${OUT}
  }
`

export const HALO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAmt;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vN;
  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float d = dot(q, q);
    gl_FragColor = vec4(uColor, exp(-d * 3.5) * uAmt * smoothstep(1.0, 0.7, d));
    ${OUT}
  }
`
