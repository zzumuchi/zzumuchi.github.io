/* hw02.js
   - 600x600 캔버스, 중앙 0.2 정사각형
   - Arrow 키로 ±0.01 이동 (vertex shader uniform 사용)
   - TRIANGLE_FAN 사용, index 미사용
   - 캔버스 밖으로는 못 나가도록 제한
   - 안내 문구 표시, resizeAspectRatio 적용
*/
import { resizeAspectRatio, setupText } from './util.js';
import { Shader, readShaderFile } from './shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
if (!gl) throw new Error('WebGL2 not supported');

canvas.width = 600;
canvas.height = 600;
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.08, 0.08, 0.08, 1.0);

resizeAspectRatio(gl, canvas);

// 안내 문구만 표시
setupText(canvas, "Use arrow keys to move the rectangle", 1);

const STEP = 0.01;   // 조건 충족
const HALF = 0.1;
const LIMIT = 1.0 - HALF;
let offset = { x: 0.0, y: 0.0 };
let keys = { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false };

let shader, vao;

async function initShader() {
  const vertSrc = await readShaderFile('./hw02.vert.glsl');
  const fragSrc = await readShaderFile('./hw02.frag.glsl');
  shader = new Shader(gl, vertSrc, fragSrc);
  shader.use();
}

function initBuffers() {
  const s = HALF;
  const vertices = new Float32Array([
    -s, -s, 0.0,
     s, -s, 0.0,
     s,  s, 0.0,
    -s,  s, 0.0
  ]);

  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  shader.setAttribPointer('aPos', 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
}

function clampMove(nx, ny) {
  offset.x = Math.max(-LIMIT, Math.min(LIMIT, nx));
  offset.y = Math.max(-LIMIT, Math.min(LIMIT, ny));
}

function setupKeys() {
  window.addEventListener('keydown', (e) => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { if (e.key in keys) keys[e.key] = false; });
}

function updateMovement() {
  let dx = 0, dy = 0;
  if (keys.ArrowUp)    dy += STEP;
  if (keys.ArrowDown)  dy -= STEP;
  if (keys.ArrowLeft)  dx -= STEP;
  if (keys.ArrowRight) dx += STEP;
  if (dx || dy) clampMove(offset.x + dx, offset.y + dy);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  shader.use();
  shader.setVec4('uColor', 1.0, 0.2, 0.15, 1.0);
  shader.setVec2('uOffset', offset.x, offset.y);
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  gl.bindVertexArray(null);
  updateMovement();
  requestAnimationFrame(render);
}

async function main() {
  await initShader();
  initBuffers();
  setupKeys();
  render();
}

main();
