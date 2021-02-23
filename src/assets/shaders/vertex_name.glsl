varying vec3 vPos;
varying vec3 vNormal;
varying vec2 vUv;

uniform float uTime;

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
	vPos = (modelMatrix * vec4(position, 1.0 )).xyz;
	vNormal = normalize(normalMatrix * normal);
	// vNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;

	vUv = uv;

	vec3 pos = position;

	vec3 axis = vec3(0., 1., 0.);
	float twist = 0.02 * sin(time);
	float angle = vPos.y * twist;

	vec3 transformed = rotate(vPos, axis, angle);
	
	gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos,1.0);
}
