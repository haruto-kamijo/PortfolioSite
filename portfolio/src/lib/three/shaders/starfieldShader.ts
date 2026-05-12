// src/lib/three/shaders/starfieldShader.ts

export const starfieldVertexShader = /* glsl */ `
  attribute float aPhase;

  varying float vPhase;
  varying float vRandA;
  varying float vRandB;

  float hash(float x) {
    return fract(sin(x) * 43758.5453123);
  }

  void main() {
    vPhase = aPhase;

    // 星ごとの乱数（固定）
    vRandA = hash(aPhase * 12.9898 + 78.233);
    vRandB = hash(aPhase * 39.3467 + 11.135);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float dist = -mvPosition.z;

    // --- 距離によるサイズ変化（弱め） ---
    float baseSize = 2.2;

    // 個体差（サイズのランダム性）
    float sizeJitter = mix(0.6, 1.5, vRandA);

    // 恒星（ごく一部だけ大きい）
    // 例：0.3% 程度（好みで 0.997 → 0.995 にすると増える）
    float giant = (vRandB > 0.997) ? 2.8 : 1.0;

    float size = baseSize * sizeJitter * giant * (120.0 / dist);

    gl_PointSize = size;
  }
`;

export const starfieldFragmentShader = /* glsl */ `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  uniform float uTime;

  varying float vPhase;
  varying float vRandA;
  varying float vRandB;

  float hash(float x) {
    return fract(sin(x) * 43758.5453123);
  }

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float dist = length(c);
    if (dist > 0.5) discard;

    // 丸い星にする
    float falloff = smoothstep(0.5, 0.05, dist);

    // --- 星色のばらつき（白〜青白） ---
    vec3 warm = vec3(1.0, 1.0, 1.0);           // 白
    vec3 cool = vec3(0.65, 0.75, 1.0);         // 青白
    float colorBias = pow(vRandA, 1.2);        // 極端に振れないように
    vec3 starColor = mix(warm, cool, colorBias);

    // 恒星はちょっと明るく（大きい星が“強い”感じ）
    float giantBoost = (vRandB > 0.997) ? 1.5 : 1.0;

    // --- 「ごくまれに消えて、その後復活しない」 ---
    // まず「この星が消える運命か？」（例：100000個に1つ）
    float willDie = step(0.000001, hash(vPhase * 91.7 + 12.3)); // 0なら消える候補

    // 消える候補の星だけ、消える時刻を決める（例：8〜90秒の間に1回だけ消える）
    float deathRand = hash(vPhase * 17.3 + 44.4);
    float deathTime = mix(8.0, 90.0, deathRand);

    // willDie==0 の星だけ deathTime で消える（step(uTime, deathTime): uTime<=deathTimeで1、超えたら0）
    // willDie==1 の星はずっと生きる（alive=1）
    float alive = (willDie < 0.5) ? step(uTime, deathTime) : 1.0;

    // ベース輝度（頻繁な明滅はさせず、ほんの少し揺らす程度）
    float shimmer = 0.95 + 0.05 * sin(uTime * 0.25 + vPhase * 5.0);

    float brightness = shimmer * giantBoost * alive;

    vec3 col = starColor * brightness;

    gl_FragColor = vec4(col, falloff);
  }
`;
