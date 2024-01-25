precision mediump float;

uniform sampler2D texture;
uniform vec2 size;
varying vec2 vUv;

void main(){
    vec4 data = texture2D(texture,vUv);
    vec2 dx = vec2(1.0/size.x,0.0);
    vec2 dy = vec2(0.0,1.0/size.y);

    float average = (texture2D(texture,vUv-dx).r + texture2D(texture,vUv-dy).r + texture2D(texture,vUv+dx).r + texture2D(texture,vUv+dy).r) * 0.25;
    data.g += (average-data.r)*2.0;
    data.g *= 0.995;
    data.r += data.g;
    data.r *= 0.995;

    gl_FragColor=data;
}