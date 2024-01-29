precision mediump float;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform sampler2D texture;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vec4 data = texture2D(texture, uv);
    vec3 transformed = position;
    transformed += normal * data.r;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
    vPosition = gl_Position.xyz;
}