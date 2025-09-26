/*-------------------------------------------------------------------------
hw03.js
Circle + Line Segment 교점 시각화

입력 절차
1) 첫 드래그: 원 입력 (마우스 다운=중심, 드래그 길이=반지름) -> 노란색
2) 둘째 드래그: 선분 입력 (마우스 다운=시작, 드래그 끝=끝점) -> 자홍색
3) 선분 입력이 끝나는 즉시 교점 계산, 점을 찍어서 표시(흰색) + 상단 3번째 줄에 좌표 표시

조건
- canvas 크기: 700x700
- 교점 포인트 size: gl_PointSize = 10.0
---------------------------------------------------------------------------*/

import { resizeAspectRatio, setupText, updateText, Axes } from './util.js';
import { Shader, readShaderFile } from './shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

let isInitialized = false;
let shader;
let vao;
let positionBuffer;

let isDrawing = false;
let startPoint = null;
let tempCircleEnd = null;
let tempLineEnd = null;

let circle = null;       // { c:[x,y], r:number }
let line = null;         // [x1,y1,x2,y2]
let intersections = [];  // [[x,y], ...]

let textCircle;
let textLine;
let textIntersections;

let axes = new Axes(gl, 0.85);

// ---------------- 초기화 ----------------

document.addEventListener('DOMContentLoaded', () => {
  if (isInitialized) return;
  main().then(ok => {
    if (ok) isInitialized = true;
  }).catch(err => console.error(err));
});

function initWebGL() {
  if (!gl) {
    console.error('WebGL 2 not supported');
    return false;
  }
  canvas.width = 700;
  canvas.height = 700;
  resizeAspectRatio(gl, canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1, 0.2, 0.3, 1.0);
  return true;
}

function setupBuffers() {
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
}

function convertToWebGLCoordinates(x, y) {
  return [
    (x / canvas.width) * 2 - 1,
    -((y / canvas.height) * 2 - 1)
  ];
}

// ---------------- 입력 이벤트 ----------------

function setupMouseEvents() {
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const [gx, gy] = convertToWebGLCoordinates(e.clientX - rect.left, e.clientY - rect.top);
    startPoint = [gx, gy];
    isDrawing = true;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const [gx, gy] = convertToWebGLCoordinates(e.clientX - rect.left, e.clientY - rect.top);
    if (!circle) tempCircleEnd = [gx, gy];
    else if (!line) tempLineEnd = [gx, gy];
    render();
  });

  canvas.addEventListener("mouseup", () => {
    if (!isDrawing || !startPoint) return;

    if (!circle && tempCircleEnd) {
      const r = Math.hypot(tempCircleEnd[0] - startPoint[0], tempCircleEnd[1] - startPoint[1]);
      circle = { c: [startPoint[0], startPoint[1]], r };
      updateText(textCircle,
        `Circle: center=(${circle.c[0].toFixed(2)}, ${circle.c[1].toFixed(2)}), r=${circle.r.toFixed(2)}`);
    }
    else if (!line && tempLineEnd) {
      line = [startPoint[0], startPoint[1], tempLineEnd[0], tempLineEnd[1]];
      updateText(textLine,
        `Line: (${line[0].toFixed(2)}, ${line[1].toFixed(2)}) ~ (${line[2].toFixed(2)}, ${line[3].toFixed(2)})`);
      intersections = computeCircleLineIntersections(circle, line);
      if (intersections.length > 0) {
        updateText(textIntersections,
          `Intersections (${intersections.length}): ${intersections.map(p => `(${p[0].toFixed(2)},${p[1].toFixed(2)})`).join(", ")}`);
      } else {
        updateText(textIntersections, "No intersection");
      }
    }

    isDrawing = false;
    startPoint = null;
    tempCircleEnd = null;
    tempLineEnd = null;
    render();
  });
}

// ---------------- 수학 처리 ----------------

// circle {c:[cx,cy], r}, line [x1,y1,x2,y2]
function computeCircleLineIntersections(circle, line) {
  const [x1, y1, x2, y2] = line;
  const [cx, cy] = circle.c;
  const dx = x2 - x1, dy = y2 - y1;

  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx*dx + dy*dy;
  const b = 2*(fx*dx + fy*dy);
  const c = fx*fx + fy*fy - circle.r*circle.r;

  const disc = b*b - 4*a*c;
  if (disc < 0) return [];

  const t1 = (-b - Math.sqrt(disc)) / (2*a);
  const t2 = (-b + Math.sqrt(disc)) / (2*a);

  let pts = [];
  if (t1 >= 0 && t1 <= 1) pts.push([x1 + t1*dx, y1 + t1*dy]);
  if (t2 >= 0 && t2 <= 1 && disc > 0) pts.push([x1 + t2*dx, y1 + t2*dy]);
  return pts;
}

// ---------------- 렌더링 ----------------

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  shader.use();

  // 원 그리기 (circle 확정 시)
  if (circle) {
    const verts = [];
    const steps = 60;
    for (let i=0; i<=steps; i++) {
      const theta = 2*Math.PI*i/steps;
      verts.push(circle.c[0] + circle.r*Math.cos(theta));
      verts.push(circle.c[1] + circle.r*Math.sin(theta));
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    shader.setVec4("u_color", [1,1,0,1]);
    gl.drawArrays(gl.LINE_STRIP, 0, verts.length/2);
  }

  // 원 미리보기
  if (!circle && tempCircleEnd && startPoint) {
    const r = Math.hypot(tempCircleEnd[0]-startPoint[0], tempCircleEnd[1]-startPoint[1]);
    const verts = [];
    const steps = 60;
    for (let i=0; i<=steps; i++) {
      const theta = 2*Math.PI*i/steps;
      verts.push(startPoint[0] + r*Math.cos(theta));
      verts.push(startPoint[1] + r*Math.sin(theta));
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    shader.setVec4("u_color", [0.5,0.5,0.5,1]);
    gl.drawArrays(gl.LINE_STRIP, 0, verts.length/2);
  }

  // 선분 그리기
  if (line) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    shader.setVec4("u_color", [1,0,1,1]);
    gl.drawArrays(gl.LINES, 0, 2);
  }
  // 선분 미리보기
  if (!line && tempLineEnd && startPoint) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint,...tempLineEnd]), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    shader.setVec4("u_color", [0.5,0.5,0.5,1]);
    gl.drawArrays(gl.LINES, 0, 2);
  }

  // 교점 찍기
  if (intersections.length > 0) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(intersections.flat()), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    shader.setVec4("u_color", [1,1,1,1]);
    gl.drawArrays(gl.POINTS, 0, intersections.length);
  }

  // axes
  axes.draw(mat4.create(), mat4.create());
}

// ---------------- 셰이더 ----------------

async function initShader() {
  const vsrc = await readShaderFile('shVert.glsl');
  const fsrc = await readShaderFile('shFrag.glsl');
  shader = new Shader(gl, vsrc, fsrc);
}

// ---------------- main ----------------

async function main() {
  if (!initWebGL()) return false;
  await initShader();
  setupBuffers();
  shader.use();

  textCircle = setupText(canvas, "Draw circle (click & drag)", 1);
  textLine = setupText(canvas, "Then draw line segment", 2);
  textIntersections = setupText(canvas, "Intersections: none", 3);

  setupMouseEvents();
  render();
  return true;
}
