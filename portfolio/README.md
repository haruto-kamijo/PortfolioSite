
ファイル構成
src/
  app/
    page.tsx
  components/
    three/
      SpaceCanvas.tsx       // Canvasラッパ（SSR無効）
      SceneRoot.tsx         // シーン全体のルート
      NebulaBackground.tsx  // 生きてるNebula背景
      StarField.tsx         // ランダムに瞬く星
  lib/
    three/
      shaders/
        nebulaShader.ts      // Nebula用 GLSL
        starfieldShader.ts   // Starfield用 GLSL
