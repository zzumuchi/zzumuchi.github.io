// Global constants
const canvas = document.getElementById("glCanvas"); // Get the canvas element
const gl = canvas.getContext("webgl2"); // Get the WebGL2 context

if (!gl) {
  console.error("WebGL 2 is not supported by your browser.");
}

// Set canvas size: 현재 window 전체를 canvas로 사용
gl.enable(gl.SCISSOR_TEST);

function fill(x, y, width, height, r, g, b) {
  gl.viewport(x, y, width, height);
  gl.scissor(x, y, width, height);
  gl.clearColor(r, g, b, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function render() {
  const w = canvas.width / 2;
  const h = canvas.height / 2;

  fill(0, 0, w, h, 0, 0, 1); // Blue
  fill(w, 0, w, h, 1, 1, 0); // Yellow
  fill(0, h, w, h, 0, 1, 0); // Green
  fill(w, h, w, h, 1, 0, 0); // Red
}

function resizeSquare() {
  const size = Math.min(window.innerWidth, window.innerHeight);
  canvas.width = size;
  canvas.height = size;
  render();
}

// Resize viewport when window size changes
window.addEventListener("resize", resizeSquare);
resizeSquare(); // Initial rendering
