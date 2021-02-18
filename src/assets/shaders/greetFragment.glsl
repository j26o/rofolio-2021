varying vec2 vUv;
varying vec3 vPosition;
varying vec4 vColor;

uniform sampler2D uTexture;
uniform float uTime;

void main() {
    float time = uTime * 0.3;
    vec2 repeat = vec2(2., 1.);
    vec2 uv = fract(vUv * repeat + vec2(time, 0.));
    // vec2 uv = fract(vUv * repeat);
    vec3 texture = texture2D(uTexture, uv).rgb;

    float fog = clamp(vPosition.z / 4., 0., 1.);
    vec3 fragColor = mix(vec3(0.), texture, fog);

    gl_FragColor = vColor * vec4(fragColor, 1.);
}