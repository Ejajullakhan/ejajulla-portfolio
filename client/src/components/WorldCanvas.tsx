import { useEffect, useRef } from "react";

type Scene = {
  label: string;
  primary: string;
  secondary: string;
};

type WorldCanvasProps = {
  scene: Scene;
};

const vertexShader = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform float u_time;
  uniform float u_scroll;
  varying vec2 v_uv;

  #define PI 3.14159265359

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = p * 2.03 + vec2(7.1, 2.4);
      amplitude *= 0.5;
    }
    return value;
  }

  vec3 globeColor(vec3 normal, float scale, float rotation, float intensity) {
    vec3 lightDirection = normalize(vec3(-0.42, 0.48, 1.0));
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float rim = pow(1.0 - max(normal.z, 0.0), 2.4);
    float surfaceNoise = fbm(normal.xz * 4.0 + vec2(rotation * 0.12, normal.y * 2.0));
    float land = smoothstep(0.54, 0.68, surfaceNoise + sin(normal.x * 8.0 + normal.y * 3.0) * 0.05);
    vec3 deep = vec3(0.018, 0.035, 0.12);
    vec3 indigo = vec3(0.08, 0.12, 0.34);
    vec3 cyan = vec3(0.18, 0.64, 0.78);
    vec3 violet = vec3(0.28, 0.16, 0.62);
    vec3 color = mix(deep, indigo, diffuse * 0.75 + surfaceNoise * 0.22);
    color = mix(color, violet, land * 0.22);
    color += cyan * pow(diffuse, 5.0) * 0.42;
    color += vec3(0.12, 0.58, 0.75) * rim * 0.9;

    float latitude = abs(sin(asin(clamp(normal.y, -1.0, 1.0)) * 12.0));
    float longitude = abs(sin((atan(normal.z, normal.x) + rotation) * 9.0));
    float longitudeLines = 1.0 - smoothstep(0.03, 0.12, longitude);
    float latitudeLines = 1.0 - smoothstep(0.035, 0.12, latitude);
    color += vec3(0.18, 0.72, 0.85) * (longitudeLines * 0.18 + latitudeLines * 0.12) * intensity;

    float cloud = smoothstep(0.68, 0.82, fbm(normal.xy * 6.0 + vec2(u_time * 0.018, 0.0)));
    color = mix(color, vec3(0.62, 0.8, 0.9), cloud * 0.1);
    return color * scale;
  }

  float sphereMask(vec2 uv, vec2 center, float radius, out vec3 normal) {
    vec2 p = (uv - center) / radius;
    float d = dot(p, p);
    if (d > 1.0) {
      normal = vec3(0.0);
      return 0.0;
    }
    normal = normalize(vec3(p.x, p.y, sqrt(max(0.0, 1.0 - d))));
    return 1.0;
  }

  vec3 renderSphere(vec2 uv, vec2 center, float radius, float rotation, vec3 tint, float alpha) {
    vec3 normal;
    float mask = sphereMask(uv, center, radius, normal);
    if (mask < 0.5) return vec3(0.0);
    vec3 color = globeColor(normal, 1.0, rotation, alpha);
    float rim = pow(1.0 - max(normal.z, 0.0), 2.8);
    color = mix(color, tint, 0.14);
    color += tint * rim * 0.8;
    return color * alpha;
  }

  void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = (gl_FragCoord.xy / u_resolution.y) - vec2(aspect * 0.5, 0.5);
    float pointerX = (u_pointer.x - 0.5);
    float pointerY = (u_pointer.y - 0.5);

    vec3 background = vec3(0.006, 0.012, 0.045);
    float atmosphere = fbm(uv * 1.6 + vec2(u_time * 0.006, -u_scroll * 0.08));
    background += vec3(0.025, 0.04, 0.13) * atmosphere;
    background += vec3(0.035, 0.012, 0.1) * smoothstep(0.2, 1.1, length(uv - vec2(0.15, 0.1)));
    background += vec3(0.01, 0.1, 0.15) * smoothstep(0.9, 0.05, length(uv - vec2(0.55, -0.05)));

    float starField = step(0.9975, hash21(floor((uv + vec2(2.0, 1.0)) * 72.0)));
    background += vec3(0.25, 0.6, 0.85) * starField * 0.28;

    float wideLayout = smoothstep(0.72, 1.0, aspect);
    vec2 globeCenter = vec2(mix(0.2, 0.36, wideLayout) + pointerX * mix(0.018, 0.045, wideLayout), mix(0.1, 0.04, wideLayout) - u_scroll * 0.03 + pointerY * mix(0.014, 0.025, wideLayout));
    float globeRadius = mix(0.29, 0.48, wideLayout) + sin(u_time * 0.12) * 0.006 - u_scroll * 0.02;
    float globeRotation = u_time * 0.09 + pointerX * 0.42;
    vec3 globeNormal;
    float globeHit = sphereMask(uv, globeCenter, globeRadius, globeNormal);
    if (globeHit > 0.5) {
      vec3 color = globeColor(globeNormal, 1.0, globeRotation, 1.0);
      float edge = pow(1.0 - max(globeNormal.z, 0.0), 2.2);
      color += vec3(0.13, 0.68, 0.9) * edge * 0.85;
      gl_FragColor = vec4(color, 1.0);
      return;
    }

    float globeAtmosphere = 1.0 - smoothstep(globeRadius * 0.94, globeRadius * 1.18, distance(uv, globeCenter));
    background += vec3(0.04, 0.31, 0.58) * pow(globeAtmosphere, 2.4) * 0.54;
    background += vec3(0.16, 0.09, 0.47) * pow(globeAtmosphere, 5.0) * 0.32;

    vec2 orbitPoint = uv - globeCenter;
    float orbitScale = globeRadius * 1.27;
    float ellipseDistance = abs(length(orbitPoint / vec2(1.0, 0.38)) - orbitScale);
    float orbitLine = 1.0 - smoothstep(0.002, 0.008, ellipseDistance);
    background += vec3(0.15, 0.61, 0.85) * orbitLine * 0.36;

    vec2 orbitPoint2 = uv - globeCenter;
    float ellipseDistance2 = abs(length(orbitPoint2 / vec2(0.42, 1.0)) - globeRadius * 1.1);
    float orbitLine2 = 1.0 - smoothstep(0.002, 0.009, ellipseDistance2);
    background += vec3(0.35, 0.22, 0.8) * orbitLine2 * 0.22;

    vec2 smallA = vec2(globeCenter.x - globeRadius * mix(0.92, 1.22, wideLayout) + sin(u_time * 0.13) * 0.025, globeCenter.y + globeRadius * 0.5);
    vec2 smallB = vec2(globeCenter.x + globeRadius * mix(0.05, 1.03, wideLayout) + cos(u_time * 0.17) * 0.02, globeCenter.y - globeRadius * 0.46);
    background += renderSphere(uv, smallA, globeRadius * 0.115, -u_time * 0.22, vec3(0.2, 0.56, 0.8), 0.7);
    background += renderSphere(uv, smallB, globeRadius * 0.075, u_time * 0.18, vec3(0.42, 0.22, 0.75), 0.58);

    float dust = step(0.998, hash21(floor((uv + vec2(5.0, 4.0)) * 120.0)));
    background += vec3(0.42, 0.78, 0.95) * dust * 0.2;

    float vignette = smoothstep(1.35, 0.16, length(uv / vec2(aspect * 0.62, 0.68)));
    background *= 0.72 + vignette * 0.34;
    gl_FragColor = vec4(background, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function WorldCanvas({ scene }: WorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) return;
    const program = createProgram(gl);
    if (!program) return;

    const position = gl.getAttribLocation(program, "a_position");
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const pointer = gl.getUniformLocation(program, "u_pointer");
    const time = gl.getUniformLocation(program, "u_time");
    const scroll = gl.getUniformLocation(program, "u_scroll");
    const buffer = gl.createBuffer();
    if (!buffer) return;

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compact = window.innerWidth < 700;
    const pointerState = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    const scrollState = { value: 0, target: 0 };
    let width = 0;
    let height = 0;
    let frame = 0;
    let elapsed = 0;
    let visible = document.visibilityState === "visible";

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.6);
      width = Math.max(1, canvas.clientWidth);
      height = Math.max(1, canvas.clientHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const updatePointer = (event: PointerEvent) => {
      pointerState.targetX = event.clientX / Math.max(window.innerWidth, 1);
      pointerState.targetY = event.clientY / Math.max(window.innerHeight, 1);
    };
    const updateScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollState.target = max > 0 ? window.scrollY / max : 0;
    };

    const draw = () => {
      if (!visible) {
        frame = 0;
        return;
      }
      elapsed += reducedMotion ? 0.0018 : 0.006;
      pointerState.x += (pointerState.targetX - pointerState.x) * (reducedMotion ? 0.03 : 0.06);
      pointerState.y += (pointerState.targetY - pointerState.y) * (reducedMotion ? 0.03 : 0.06);
      scrollState.value += (scrollState.target - scrollState.value) * 0.03;
      gl.useProgram(program);
      gl.uniform2f(resolution, width, height);
      gl.uniform2f(pointer, pointerState.x, pointerState.y);
      gl.uniform1f(time, elapsed);
      gl.uniform1f(scroll, scrollState.value);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frame = window.requestAnimationFrame(draw);
    };
    const handleVisibility = () => {
      visible = document.visibilityState === "visible";
      if (visible && !frame) frame = window.requestAnimationFrame(draw);
    };

    resize();
    updateScroll();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    draw();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("scroll", updateScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="world-canvas" data-scene={scene.label} />;
}
