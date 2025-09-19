#version 300 es
layout (location = 0) in vec3 aPos;

// 과제 요구: vertex shader의 uniform으로 이동
uniform vec2 uOffset;

void main() {
    vec2 moved = aPos.xy + uOffset;
    gl_Position = vec4(moved, aPos.z, 1.0);
}
