// src/lib/three/shaders/nebulaShader.ts

export const nebulaVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const nebulaFragmentShader = /* glsl */ `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0,0.0));
    float c = hash(i + vec2(0.0,1.0));
    float d = hash(i + vec2(1.0,1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
  }

  float fbm(vec2 p){
    float v = 0.0;
    float a = 0.55;
    v += a*noise(p); p*=2.0; a*=0.5;
    v += a*noise(p); p*=2.0; a*=0.5;
    v += a*noise(p);
    return v;
  }

  void main(){
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;

    // 速度（ゆっくり）
    float t = uTime * 0.10;

    vec2 q = uv * 3.2;
    q += vec2(t * 0.10, -t * 0.06);
    q.x += sin(t * 0.7 + uv.y * 2.0) * 0.18;
    q.y += cos(t * 0.6 + uv.x * 1.5) * 0.14;

    float base   = fbm(q);
    float detail = fbm(q * 2.2 + vec2(-t * 0.25, t * 0.22));
    float cloud = base * 0.75 + detail * 0.55;

    // 雲の量（宇宙っぽく少なめ）
    cloud *= 1.0 - smoothstep(0.5, 0.95, cloud);
    cloud = clamp(cloud, 0.0, 1.0);

    // 中央を暗めに（文字のため）
    float dist = length(uv);
    float center = 1.0 - smoothstep(0.0, 0.55, dist);
    cloud *= (1.0 - center * 0.65);

    // 発光感（色の乗り）
    vec3 col = mix(uColorA, uColorB, cloud);
    col = mix(col, uColorC, cloud * 0.6);
    col *= uIntensity;

    // 透明度：濃い部分だけ見せる（宇宙雲らしく）
    float alpha = cloud * 0.55;

    gl_FragColor = vec4(col, alpha);
  }
`;
