
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'

import FontFaceObserver from 'fontfaceobserver'
import gsap from 'gsap';

import name from '../assets/img/ro-caps-vertical.png'
export default class App {
	constructor(opt) {
		this.container = opt.dom;
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		
		this.renderer = new THREE.WebGLRenderer({
      alpha: true,
			antialias: true
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);

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

		this.controls = new OrbitControls( this.camera, this.renderer.domElement );

		const fontPatuaOne = new Promise((resolve, reject) => {
			new FontFaceObserver('Patua One').load().then(()=>{ resolve() })
		})

		const fontLato = new Promise((resolve, reject) => {
			new FontFaceObserver('Lato').load().then(()=>{ resolve() })
		})

		const fontProm = [fontLato, fontPatuaOne];
		Promise.all(fontProm).then(()=>{
			this.rotateHTMLList()
			this.addListeners()
			this.addLights()
			this.addObjects()
			this.render()
		})
	}

	addObjects() {
		const geometry = new THREE.BoxGeometry(20, 100, 20, 20, 20, 20);
		
		let uniforms = THREE.UniformsUtils.merge([
			THREE.UniformsLib[ "lights" ],
			{
				diffuse: { type: 'c', value: new THREE.Color(0xff00ff) }
			}
		])
		
		const material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			side: THREE.DoubleSide,
			lights: true,
			vertexShader: `
			varying vec3 vPos;
			varying vec3 vNormal;
			void main() {
				vPos = (modelMatrix * vec4(position, 1.0 )).xyz;
				vNormal = normalMatrix * normal;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
			}
			`,
			fragmentShader: `
			uniform vec3 diffuse;
			varying vec3 vPos;
			varying vec3 vNormal;

			struct PointLight {
				vec3 position;
				vec3 color;
			};
			uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

			void main() {
				vec4 addedLights = vec4(0.1, 0.1, 0.1, 1.0);
				for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
					vec3 adjustedLight = pointLights[l].position + cameraPosition;
					vec3 lightDirection = normalize(vPos - adjustedLight);
					addedLights.rgb += clamp(dot(-lightDirection, vNormal), 0.0, 1.0) * pointLights[l].color;
				}
				gl_FragColor = addedLights;//mix(vec4(diffuse.x, diffuse.y, diffuse.z, 1.0), addedLights, addedLights);
			}
			`
		})

		this.twist(geometry)

		material.needsUpdate = true;

		this.cube = new THREE.Mesh(geometry, material); 

		this.scene.add(this.cube)
	}

	twist(geometry) {
		const quaternion = new THREE.Quaternion();
		console.log(geometry)
		for (let i = 0; i < geometry.vertices.length; i++) {
			// a single vertex Y position
			const yPos = geometry.vertices[i].y;
			const twistAmount = 10;
			const upVec = new THREE.Vector3(0, 1, 0);
	
			quaternion.setFromAxisAngle(
				upVec, 
				(Math.PI / 180) * (yPos / twistAmount)
			);
	
			geometry.vertices[i].applyQuaternion(quaternion);
		}
		
		// tells Three.js to re-render this mesh
		geometry.verticesNeedUpdate = true;
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
		var timer = Date.now() * 0.00050;
		this.light1.position.x = Math.cos(timer) * 250;
		this.light1.position.z = Math.sin(timer) * 250;
		this.light2.position.y = Math.cos(timer * 1.25) * 250;
		this.light2.position.z = Math.sin(timer * 1.25) * 250;
		this.cube.rotation.x += 0.005;
		this.cube.rotation.y += 0.01;
    
		this.renderer.render(this.scene, this.camera)
  }

  addListeners() {
    window.addEventListener('resize', this.resize.bind(this))
		this.mouseMove()
  }

	addLights() {
		const geometry = new THREE.SphereGeometry( 5, 32, 32 );
		const material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
		const sphere = new THREE.Mesh( geometry, material );

    this.light1 = new THREE.PointLight(0xff0000);
		this.light1.add(sphere);
		this.light1.position.set(250, 0, 100);
		this.scene.add(this.light1);

		this.light2 = new THREE.PointLight(0x00ff00);
		// this.light2.addSphere();
		this.light2.position.set(0, 1000, 1000);
		this.scene.add(this.light2);
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
	camZ: 400
});