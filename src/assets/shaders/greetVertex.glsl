attribute vec4 color;
uniform float uTime;
uniform float uPi;
uniform vec2 hover;
uniform float hoverState;

varying vec2 vUv;
varying vec4 vColor;
varying vec3 vPosition;

mat4 rotation3d(vec3 axis, float angle) {
	axis = normalize(axis);
	float s = sin(angle);
	float c = cos(angle);
	float oc = 1.0 - c;

	return mat4(
		oc * axis.x * axis.x + c,           oc * axis.x * axis.y + axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
		oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
		oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
		0.0,                                0.0,                                0.0,                                1.0
	);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
	return (rotation3d(axis, angle) * vec4(v, 1.0)).xyz;
}

void main() {
	float time = uTime * 0.2;
	
	vUv = uv;
	vColor = color;

	vec3 pos = position;
	vPosition = position;
	
	float PI = 3.1415925;
	float dist = distance(uv,hover) * 6.;

	vec3 axis = vec3(1., 0., 0.);
	float twist = 0.04 * sin(time);
	// float twist = 0.;

	
	// float angle = sin((pos.x * twist) + time);
	float angle = pos.x * twist;

	vec3 transformed = rotate(pos, axis, angle);
	transformed.x += sin((dist * hoverState)*2./PI);

	gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
}