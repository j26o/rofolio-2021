
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'

import FontFaceObserver from 'fontfaceobserver'
import imagesLoaded from 'imagesloaded'
import gsap from 'gsap'

// import nameImg from '../assets/img/ro-vertical.png'

// import nameFragment from '../assets/shaders/fragment_name.glsl'
// import nameVertex from '../assets/shaders/vertex_name.glsl'
const deg = g => (g * Math.PI) / 180;	
export default class App {
	constructor(opt) {
		this.opt = opt
		this.container = opt.dom;
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		
		this.renderer = new THREE.WebGLRenderer({
      alpha: true,
			antialias: true
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(opt.bgColor, 1);

    this.camera = new THREE.PerspectiveCamera( opt.fov, this.width / this.height, 0.001, 1000 );

    this.camera.position.z = opt.camZ;
		this.camera.fov = 2 * Math.atan((this.height/2 * this.camZ)) * (180/Math.PI);

    this.scene = new THREE.Scene();
		
    this.clock = new THREE.Clock();
		this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
		this.currentScroll = 0;
    this.previousScroll = 0;    

		const canvas = this.renderer.domElement;
    
		this.container.appendChild( this.renderer.domElement );

		// this.controls = new OrbitControls( this.camera, this.renderer.domElement );

		const fontPatuaOne = new Promise((resolve, reject) => {
			new FontFaceObserver('Patua One').load().then(()=>{ resolve() })
		})

		const fontLato = new Promise((resolve, reject) => {
			new FontFaceObserver('Lato').load().then(()=>{ resolve() })
		})

		const preloadImages = new Promise((resolve, reject) => {
			imagesLoaded(document.querySelectorAll("img"), { background: true }, resolve);
		});

		const fontProm = [fontLato, fontPatuaOne, preloadImages];
		Promise.all(fontProm).then(()=>{
			this.rotateHTMLList()
			this.addListeners()
			this.addLights()
			this.addObjects()
			this.render()
		})
	}

	addObjects() {
		const img = document.getElementById('ro');
		this.texture = new THREE.Texture(img);
		this.texture.anisotropy = 32;
		this.texture.needsUpdate = true;
		this.texture.offset = new THREE.Vector2(-20, 0)

		// this.texture.wrapS = THREE.RepeatWrapping;
    // this.texture.wrapT = THREE.RepeatWrapping;
    
		
		this.material = new THREE.MeshStandardMaterial({
			map: this.texture,
			// roughnessMap: texture,
			metalness: 0.5,
			roughness: 0.5,
			side: THREE.DoubleSide
		})

		this.material.onBeforeCompile = function (shader) {
			shader.uniforms.uTime = { value: 0 }
			shader.uniforms.uPI = { value: Math.PI }
			shader.uniforms.uTexture = { value: this.texture }
		
			shader.vertexShader = "uniform float uTime;\nuniform float uPI;\nvarying vec2 vNuv;\n" + shader.vertexShader;

			shader.vertexShader = shader.vertexShader.replace(
				"#include <clipping_planes_pars_vertex>",
				`#include <clipping_planes_pars_vertex>
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

				`
			);

			shader.vertexShader = shader.vertexShader.replace(
				"#include <begin_vertex>",
				`
					float time = uTime * 0.2;
					vNuv = uv;

					vec3 pos = position;

					vec3 axis = vec3(1., 0., 0.);
					float twist = 0.04 * sin(time * uPI);

					
					float angle = sin(pos.x * twist);
					// float angle = pos.x * twist;

					vec3 transformed = rotate(pos, axis, angle);
				`
			);

			shader.fragmentShader = "uniform float uTime;\nvarying vec2 vNuv;\nuniform sampler2D uTexture;\n" + shader.fragmentShader;

			// shader.fragmentShader.replace(
			// 	`#include <tonemapping_fragment>`,
			// 	`
			// 	float time = uTime * 0.3;
			// 	vec2 repeat = vec2(2., 1.);
			// 	vec2 newUv = fract(vNuv * repeat + vec2(time, 0.));

			// 	vec3 texture = texture2D(uTexture, newUv).rgb;
			// 	vec3 fragColor = mix(vec3(0.), texture, outgoingLight);

			// 	gl_FragColor = vec4( fragColor, diffuseColor.a );
			// 	#include <tonemapping_fragment>
			// 	`
			// );
		// 	shader.fragmentShader.replace(
		// 		`#include <map_fragment>`,
		// 		`
		// 		#ifdef USE_MAP
		// 		float time = uTime * 0.3;
		// 		vec4 texelColor = texture2D( uTexture, vUv + vec2(time, 0.) );
		// 		texelColor = mapTexelToLinear( texelColor );
		// 		diffuseColor *= texelColor;
				
		// 		#endif
		// `
		// 	);
		
			this.material = shader;
		};

		this.material.needsUpdate = true;

		const geometry = new THREE.BoxBufferGeometry(160, 20, 20, 64, 64, 64);
		// const geometry = new THREE.BoxBufferGeometry(0.9, 0.3, 0.3, 100, 200, 100);

		// console.log(this.material)

		this.greet = new THREE.Mesh(geometry, this.material);
		this.greet.position.z = -10
    // this.greet.position.x = -25
    this.greet.rotation.x = -0.2
    this.greet.rotation.y = -0.6
    this.greet.rotation.z = 0

		this.scene.add(this.greet)
	}

	addLights() {
		const geometry = new THREE.SphereGeometry( 1, 8, 8 );
		const material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
		const sphere = new THREE.Mesh( geometry, material );

    this.light1 = new THREE.PointLight(0xffffff);
		this.light1.add(sphere);
		this.light1.position.set(70, 90, 0);
		this.scene.add(this.light1);

		this.light2 = new THREE.PointLight(0xffffff);
		this.light2.add(sphere.clone());
		this.light2.position.set(60, -30, 90);
		this.scene.add(this.light2);
  }

  rotateHTMLList() {
    const list = document.querySelectorAll('.rotate-list')
    list.forEach(val => {
      const el = [...val.getElementsByTagName('li')]
      
      el.forEach(li => {
        li.setAttribute('style', `--rotY: ${ Math.floor(Math.random() * 37) + 8 }deg; --rotZ: ${ Math.floor(Math.random() * 8) - 4 }deg`)
      })
    }) 
  }

	render() {
		window.requestAnimationFrame(this.render.bind(this))

    if(this.controls) this.controls.update()

    // Update time
    // this.material.uniforms.uTime.value = this.clock.getElapsedTime()

		let timer = this.clock.getElapsedTime();
		
		// console.log(friction)
		if (this.material.material) {
			this.material.material.uniforms.uTime.value = timer
		}

		var lightIntensity = 0.75 + 0.2 * Math.cos(timer * Math.PI);

    // this.material.uniforms.lightIntensity.value = lightIntensity;
    // this.light1.color.setHSL(lightIntensity, 1.0, 0.5);
		this.light1.intensity = lightIntensity
		this.light2.intensity = lightIntensity + 0.05

		// this.cube.rotation.y += 0.04
		// this.greet.rotation.x = timer;
		this.texture.offset = new THREE.Vector2(Math.cos(timer + Math.PI/2) * 0.08);
		// this.texture.offset = new THREE.Vector2(timer * 0.08);
    
		this.renderer.render(this.scene, this.camera)
  }

  addListeners() {
    window.addEventListener('resize', this.resize.bind(this))
		this.mouseMove()
  }

	mouseMove(){
		window.addEventListener( 'mousemove', (event)=>{
				this.mouse.x = ( event.clientX / this.width ) * 2 - 1;
				this.mouse.y = - ( event.clientY / this.height ) * 2 + 1;

				// update the picking ray with the camera and mouse position
				this.raycaster.setFromCamera( this.mouse, this.camera );

				// calculate objects intersecting the picking ray
				const intersects = this.raycaster.intersectObjects( this.scene.children );

				if(intersects.length>0){
					// console.log(intersects[0]);
					// let obj = intersects[0].object;
					// obj.material.uniforms.hover.value = intersects[0].uv;
					// obj.material.uniforms.hoverState.value = 1;
				}
		}, false );
	}

	resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    // this.camera.updateProjectionMatrix();

		this.camera.fov = 2 * Math.atan((this.height/2 * this.camZ)) * (180/Math.PI);
		this.renderer.setSize(this.width, this.height);
  }
}

new App({
	dom: document.getElementById('viz'),
	fov: 70,
	camZ: 60,
	bgColor: 0x000000,
	friction: 0
});
