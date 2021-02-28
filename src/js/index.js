
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples//jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples//jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples//jsm/postprocessing/UnrealBloomPass.js';

import FontFaceObserver from 'fontfaceobserver'
import imagesLoaded from 'imagesloaded'
import gsap from 'gsap'

// import nameImg from '../assets/img/ro-vertical.png'

// import nameFragment from '../assets/shaders/fragment_name.glsl'
// import nameVertex from '../assets/shaders/vertex_name.glsl'
export default class App {
	constructor(opt) {
		this.opt = opt
		this.width = opt.container.offsetWidth;
		this.height = opt.container.offsetHeight;
		
		this.renderer = new THREE.WebGLRenderer({
			antialias: true
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(opt.bgColor, 1);
		this.renderer.toneMapping = THREE.ReinhardToneMapping;
		this.renderer.toneMappingExposure = Math.pow( 1, 4.0 );

		opt.container.appendChild( this.renderer.domElement );

    this.camera = new THREE.PerspectiveCamera( opt.fov, this.width / this.height, 0.1, 1000 );
    this.camera.position.set(0,0,opt.camZ)
		this.camera.fov = 2 * Math.atan((this.height/2 * this.camZ)) * (180/Math.PI);

    this.scene = new THREE.Scene();
		
    this.clock = new THREE.Clock();
		this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

		// this.currentScroll = 0;
    // this.previousScroll = 0;

		this.renderScene = new RenderPass( this.scene, this.camera );

		this.bloomPass = new UnrealBloomPass( new THREE.Vector2( this.width, this.height ), 1.5, 0.4, 0.08 );
		this.bloomPass.threshold = 0;
		this.bloomPass.strength = 1.5;
		this.bloomPass.radius = 0.08;

		this.composer = new EffectComposer( this.renderer );
		this.composer.addPass( this.renderScene );
		this.composer.addPass( this.bloomPass );

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
		// this.texture.anisotropy = 32;
		this.texture.offset = new THREE.Vector2(100, 0)
		this.texture.needsUpdate = true;
		this.texture.setClearColor = 0x000000

		// this.texture.wrapS = THREE.RepeatWrapping;
    // this.texture.wrapT = THREE.RepeatWrapping;
    
		
		this.material = new THREE.MeshStandardMaterial({
			map: this.texture,
			// roughnessMap: this.texture,
			metalness: 0.2,
			roughness: 1,
			side: THREE.DoubleSide
		})

		this.material.onBeforeCompile = function (shader) {
			shader.uniforms.uTime = { value: 0 }
			shader.uniforms.uPI = { value: Math.PI }
			shader.uniforms.uTexture = { value: this.texture }
		
			shader.vertexShader = "uniform float uTime;\nuniform float uPI;\nvarying vec2 vNuv;\n" + shader.vertexShader;

			shader.vertexShader = shader.vertexShader.replace(
				"#include <begin_vertex>",
				`
					// https://codesandbox.io/s/threejs-twist-8-w0kvb?file=/index.js
					float time = uTime * 0.2;
					float friction = sin(time * 2.) * 0.045;

					float theta = position.x * friction;
					float c = cos( theta );
					float s = sin( theta );
					mat3 m = mat3( 1, 0, 0,
						0, c, -s,
						0, s, c );
					vec3 transformed = vec3( position ) * m;
					vNormal = vNormal * m;
				`
			);

			shader.fragmentShader = "uniform float uTime;\nvarying vec2 vNuv;\nuniform sampler2D uTexture;\n" + shader.fragmentShader;
			this.material = shader;
		};

		this.material.needsUpdate = true;

		const geometry = new THREE.BoxBufferGeometry(160, 20, 20, 64, 64, 64);

		this.greet = new THREE.Mesh(geometry, this.material);
		this.greet.position.z = -10
		this.greet.position.x = -8
    this.greet.rotation.x = 0
    this.greet.rotation.y = -0.6
    this.greet.rotation.z = 0

		this.scene.add(this.greet)
	}

	addLights() {
		const geometry = new THREE.SphereGeometry( 0.1, 8, 8 );
		const material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
		const sphere = new THREE.Mesh( geometry, material );

    this.light1 = new THREE.PointLight(0xffffff);
		this.light1.add(sphere);
		this.light1.position.set(-88, 88, 88);
		this.light1.intensity = 0.08
		this.scene.add(this.light1);

		// this.light2 = new THREE.PointLight(0xffffff);
		// this.light2.add(sphere.clone());
		// this.light2.position.set(-60, -80, 90);
		// this.scene.add(this.light2);

		this.follow = new THREE.PointLight(0xf1f1f1);
		this.follow.add(sphere.clone());
		this.follow.position.set(90, 88, 88);
		this.follow.intensity = 0.5;
		this.scene.add(this.follow);
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
    let timer = this.clock.getElapsedTime();
		
		if (this.material.material) {
			this.material.material.uniforms.uTime.value = timer
		}

		var lightIntensity = 0.08 + 0.3 * Math.sin(timer * Math.PI);

    // this.material.uniforms.lightIntensity.value = lightIntensity;
		// this.light1.intensity = lightIntensity
		// this.light2.intensity = lightIntensity + 0.05
		// this.follow.intensity = lightIntensity + 0.05

    // this.follow.color.setHSL(lightIntensity, 0.5, 0.5)

		this.texture.offset = new THREE.Vector2(Math.sin(timer - Math.PI*2) * 0.08 + 0.02);
		// this.texture.offset = new THREE.Vector2(timer * 0.08);

		// this.greet.rotation.z = timer
    // this.greet.rotation.y = -0.6
    // this.greet.rotation.z = 0
		// this.greet.rotation.set()

    
		// this.renderer.render(this.scene, this.camera)
		this.composer.render();
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

				if(intersects.length > 0){
					// console.log(intersects[0]);
					// let obj = intersects[0].object;
					// obj.material.uniforms.hover.value = intersects[0].uv;
					// obj.material.uniforms.hoverState.value = 1;
				}

				var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 180);
				vector.unproject( this.	camera );
				var dir = vector.sub( this.camera.position ).normalize();
				var distance = - this.camera.position.z+8 / dir.z;
				var pos = this.camera.position.clone().add( dir.multiplyScalar( distance ) );
				// this.follow.position.copy(pos)

				// console.log(pos)

				gsap.killTweensOf(this.follow)

				gsap.to(this.follow.position, {
					duration: 1.8,
					x: pos.x,
					y: pos.y,
					z: pos.z,
					delay: 0.08,
					ease: "elastic"
				})
		}, false );
	}

	resize() {
    this.width = this.opt.container.offsetWidth;
		this.height = this.opt.container.offsetHeight;

    this.camera.aspect = this.width / this.height;
    // this.camera.updateProjectionMatrix();

		this.renderer.setSize(this.width, this.height);
		this.composer.setSize(this.width, this.height);

		// this.camera.fov = 2 * Math.atan((this.height/2 * this.camZ)) * (180/Math.PI);
  }
}

new App({
	container: document.getElementById('viz'),
	fov: 70,
	camZ: 30,
	bgColor: 0x000000,
	friction: 0
});
