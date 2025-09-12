(function () {
  const canvas = document.getElementById("glCanvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) { alert("WebGL2 Error!"); return; }

  gl.enable(gl.SCISSOR_TEST);

  function render() {
    const w = canvas.width, h = canvas.height;
    const hw = (w / 2) | 0, hh = (h / 2) | 0;

    const fill = (x, y, width, height, r, g, b) => {
      gl.viewport(x, y, width, height);
      gl.scissor(x, y, width, height);
      gl.clearColor(r, g, b, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    };

    fill(0, 0, hw, hh, 0.0, 0.0, 1.0);
    fill(hw, 0, hw, hh, 1.0, 1.0, 0.0);
    fill(0, hh, hw, hh, 0.0, 1.0, 0.0);
    fill(hw, hh, hw, hh, 1.0, 0.0, 0.0);
  }

  function resizeSquare() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
    canvas.width  = Math.max(1, Math.round(size));
    canvas.height = Math.max(1, Math.round(size));
    render();
  }

  window.addEventListener("resize", resizeSquare);
  resizeSquare();
})();
