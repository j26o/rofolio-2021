
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'

import FontFaceObserver from 'fontfaceobserver'
import imagesLoaded from 'imagesloaded'
import gsap from 'gsap'

import nameImg from '../assets/img/ro-vertical.png'

import nameFragment from '../assets/shaders/fragment_name.glsl'
import nameVertex from '../assets/shaders/vertex_name.glsl'

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

		this.controls = new OrbitControls( this.camera, this.renderer.domElement );

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
			// this.rotateHTMLList()
			this.addListeners()
			this.addLights()
			this.addObjects()
			this.render()
		})
	}

	addObjects() {
		const geometry = new THREE.BoxGeometry(20, 180, 20, 32, 32, 32);

		const img = document.getElementById('ro');
		let texture = new THREE.Texture(img);
		texture.needsUpdate = true;
		
		let uniforms = THREE.UniformsUtils.merge([
			THREE.UniformsLib[ "lights" ]
		])
		uniforms.diffuse = { type: 'c', value: new THREE.Color(0xffffff) }
		uniforms.uImage = { value: texture  }
		uniforms.uTime = { value: 0 }
		uniforms.lightIntensity = {type: 'f', value: 2.}
		
		this.material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: nameVertex,
			fragmentShader: nameFragment,
      lights: true,
			// transparent: true,
			// wireframe: true,
			side: THREE.FrontSide,
		})
		
		this.cube = new THREE.Mesh(geometry, this.material); 

		this.scene.add(this.cube)
	}

	addLights() {
		const geometry = new THREE.SphereGeometry( 2, 8, 8 );
		const material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
		const sphere = new THREE.Mesh( geometry, material );

    this.light1 = new THREE.PointLight(0xffffff);
		this.light1.add(sphere);
		this.light1.position.set(0, 1000, 1000);
		this.scene.add(this.light1);

		// this.light2 = new THREE.PointLight(0x00ff00);
		// this.light2.add(sphere.clone());
		// this.light2.position.set(0, 1000, 1000);
		// this.scene.add(this.light2);
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
    this.material.uniforms.uTime.value = this.clock.getElapsedTime()

		var timer = this.clock.getElapsedTime();
		this.light1.position.x = Math.cos(timer) * 80;
		this.light1.position.y = Math.cos(timer) * 150;
		this.light1.position.z = Math.sin(timer) * 80;
		// this.light2.position.y = Math.cos(timer * 1.25) * 250;
		// this.light2.position.z = Math.sin(timer * 1.25) * 250;

		this.cube.rotation.y += 0.04
    
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
	camZ: 400,
	bgColor: 0x000000
});
