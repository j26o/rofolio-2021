uniform vec3 diffuse;
uniform float uTime;
uniform sampler2D uImage;
uniform float lightIntensity;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;

struct PointLight {
    vec3 position;
    vec3 color;
    float distance;
};
uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

void main() {
    // vec4 addedLights = vec4(0.1, 0.1, 0.1, 1.0);
    // float time = uTime * 0.3;
    // vec2 repeat = vec2(10., 10.);
    // vec2 uv = fract(vUv * repeat + vec2(time, 0.));

    // vec3 fragColor = texture2D(uImage, vUv).rgb;

    // for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
    //     vec3 adjustedLight = pointLights[l].position + cameraPosition;
    //     vec3 lightDirection = normalize(vPos - adjustedLight);
    //     fragColor += clamp(dot(-lightDirection, vNormal), 0.0, 1.0) * pointLights[l].color;
    // }

    float time = uTime * 0.6;
    vec2 repeat = vec2(1., 3.);
    vec2 uv = fract(vUv * repeat + vec2(0., time));

    vec4 addedLights = vec4(0.0, 0.0, 0.0, 1.0);
		for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
			vec3 lightDirection = normalize(vPos - pointLights[l].position);
			addedLights.rgb += clamp(dot(-lightDirection, vNormal), 0.0, 1.0) * pointLights[l].color * lightIntensity;
		}

		// gl_FragColor = vec4(vUv, 1.);
		gl_FragColor = texture2D(uImage, vUv) * addedLights;

    // gl_FragColor = texture2D(uImage, uv);
    // gl_FragColor = vec4(fragColor, 1.);//mix(vec4(diffuse.x, diffuse.y, diffuse.z, 1.0), addedLights, addedLights);
}
