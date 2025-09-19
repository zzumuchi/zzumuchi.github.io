#version 300 es
precision mediump float;

out vec4 FragColor;
uniform vec4 uColor;   // 빨간색 전달

void main() {
    FragColor = uColor;
}
