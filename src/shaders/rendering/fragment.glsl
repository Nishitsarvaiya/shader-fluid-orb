precision mediump float;
uniform sampler2D texture;
uniform sampler2D matcapTexture;
uniform sampler2D matcapTexture2;
uniform float textureMix;
uniform vec2 size;
uniform vec3 eye;
uniform vec3 lightDirection;
uniform float angle;
varying vec2 vUv;
varying vec3 vPosition;

vec2 matcap(vec3 eye, vec3 normal) {
    vec3 reflected = reflect(eye, normal);
    float m = 2.8284271247461903 * sqrt(reflected.z + 1.0);
    return reflected.xy / m + 0.5;
}
float lambert(vec3 N, vec3 L) {
    vec3 nrmN = normalize(N);
    vec3 nrmL = normalize(L);
    float result = dot(nrmN, nrmL);
    return max(result, 0.0);
}
float blendOverlay(float base, float blend) {
    return base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
}
vec3 blendOverlay(vec3 base, vec3 blend) {
    return vec3(blendOverlay(base.r, blend.r), blendOverlay(base.g, blend.g), blendOverlay(base.b, blend.b));
}
vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
    return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
}
vec2 rotateUV(vec2 uv, float rotation) {
    float mid = 0.5;
    return vec2(cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid, cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid);
}

void main() {
    vec4 data = texture2D(texture, vUv);
    vec3 tangent = vec3(1.0 / size.x, texture2D(texture, vec2(vUv.x + (1.0 / size.x), vUv.y)).r - data.r, 0.0);
    vec3 bitangent = vec3(0.0, texture2D(texture, vec2(vUv.x, vUv.y + (1.0 / size.y))).r - data.r, 1.0 / size.y);
    vec3 normal = normalize(cross(tangent, bitangent));
    normal = vec3(normal.x, sqrt(1.0 - dot(normal.xz, normal.xz)), normal.z);
    vec2 matcapUv = matcap(eye, normal).xy;
    vec3 white = vec3(1.0);
    vec3 magenta = vec3(0.925, 0.4, 0.635);
    vec3 cyan = vec3(0.47, 0.729, 0.9);
    vec3 yellow = vec3(0.988, 0.8, 0);
    float light = lambert(normal, lightDirection);
    float specularStrength = 0.025;
    vec3 lightColor = white;
    vec3 viewDir = normalize(eye - vPosition);
    vec3 reflectDir = reflect(lightDirection, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 8.0);
    vec3 specular = specularStrength * spec * lightColor;
    vec2 rotatedUv = rotateUV(vUv, angle);
    vec3 color = mix(texture2D(matcapTexture, rotatedUv).rgb, texture2D(matcapTexture2, rotatedUv).rgb, textureMix);
    gl_FragColor = vec4(blendOverlay(color, vec3(light)) + specular, 1.0);
}