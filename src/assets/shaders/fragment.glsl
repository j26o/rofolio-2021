varying vec2 vUv;
varying vec3 vPos;

uniform sampler2D uTexture;
uniform float uTime;

void main() {
    float time = uTime * 0.3;
    vec2 repeat = vec2(2., 1.);
    vec2 uv = fract(vUv * repeat - vec2(time, 0.));
    // vec2 uv = fract(vUv * repeat);
    vec3 texture = texture2D(uTexture, uv).rgb;

    gl_FragColor = vec4(texture, 1.);
}