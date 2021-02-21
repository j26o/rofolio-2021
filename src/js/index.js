
import * as THREE from 'three'
import loadFont from 'load-bmfont'

import dat from 'dat.gui'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'

import FontFaceObserver from 'fontfaceobserver'

import fragmentShader from '../assets/shaders/greetFragment.glsl'
import vertexShader from '../assets/shaders/greetVertex.glsl'

import fontFile from '../assets/fonts/PatuaOne-Regular.fnt';
import fontAtlas from '../assets/fonts/PatuaOne-Regular.png';

global.THREE = THREE;
const createGeometry = require("three-bmfont-text");
const MSDFShader = require("three-bmfont-text/shaders/msdf");
class App {
	constructor() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.camZ = 3;
		
		this.renderer = new THREE.WebGL1Renderer({
      alpha: true,
			antialias: true
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);

    this.camera = new THREE.PerspectiveCamera( 45, this.width / this.height, 0.001, 1000 );

    this.camera.position.z = this.camZ;
		this.camera.fov = 2 * Math.atan((this.height/2 * this.camZ)) * (180/Math.PI);

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

		const canvas = this.renderer.domElement;
    const container = document.querySelector('#viz');
    container.appendChild(canvas);

		const fontPatuaOne = new Promise((resolve, reject) => {
			new FontFaceObserver('Patua One').load().then(()=>{ resolve() })
		})

		const fontLato = new Promise((resolve, reject) => {
			new FontFaceObserver('Lato').load().then(()=>{ resolve() })
		})

		const fontProm = [fontLato, fontPatuaOne];
		Promise.all(fontProm).then(()=>{
			this.rotateHTMLList()
			this.initFont()
			
			this.addListeners()
		})
		
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

  initFont() {
    loadFont(fontFile, (err, font) => {
      this.fontGeometry = createGeometry({
        font,
        text: "hello! i'm ro"
      });

      // Load texture containing font glyps
      this.loader = new THREE.TextureLoader();
      this.loader.load(fontAtlas, texture => {
        this.fontMaterial = new THREE.RawShaderMaterial(
          MSDFShader({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true,
            negate: false,
            color: 0x888888
          })
        );
        
        this.createRenderTarget();
        this.createGreetMesh();

				// this.addLights();
    		// this.addControls()

        this.animate();
      });
    })
  }

  createRenderTarget() {
    // Render Target setup
    this.rt = new THREE.WebGLRenderTarget(
      this.width,
			this.height
    );

    this.rtCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    this.rtCamera.position.z = 4

    this.rtScene = new THREE.Scene()
    this.rtScene.background = new THREE.Color("#000000")
    // this.rtScene.background = new THREE.Color("#ffffff");

    // Create text mesh with font geometry and material
    this.text = new THREE.Mesh(this.fontGeometry, this.fontMaterial)

    // Adjust dimensions
    this.text.position.set(-0.88, -1.4, 0)
    this.text.rotation.set(Math.PI, 0, 0)
    this.text.scale.set(0.01, 0.088, 1)

    // Add text mesh to buffer scene
    this.rtScene.add(this.text)
  }

  createGreetMesh() {
    this.geometry = new THREE.BoxGeometry(150, 10, 10, 24, 24, 24)
    this.geometry.receiveShadow = true

    let uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib[ "lights" ]
    ])

    uniforms.uTime = { value: 0 }
    uniforms.uTexture = { value: this.rt.texture }
		uniforms.uPi = { value: THREE.PI }
    
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      receiveShadow: true,
      lights: true,
      // wireframe: true
    });

    this.greet = new THREE.Mesh(this.geometry, this.material)
    this.greet.position.z = -60
    this.greet.position.x = -25

    this.greet.rotation.x = -0.2
    this.greet.rotation.y = -0.8
    this.greet.rotation.z = 0
		
    this.greet.onBeforeRender = (renderer) => {
      renderer.setRenderTarget(this.rt)
      renderer.render(this.rtScene, this.rtCamera)
      renderer.setRenderTarget(null)
    }

    this.scene.add(this.greet)
  }

	animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.render();
  }

	render() {
    if(this.controls) this.controls.update()

    // Update time
    this.material.uniforms.uTime.value = this.clock.getElapsedTime()

    // Draw Render Target
    this.renderer.setRenderTarget(this.rt)
    this.renderer.render(this.rtScene, this.rtCamera)
    this.renderer.setRenderTarget(null)

    this.renderer.render(this.scene, this.camera)
  }

  addListeners() {
    window.addEventListener('resize', this.resize.bind(this))
  }

	addLights() {
    this.hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    this.hemiLight.color.setHSL( 0.6, 1, 0.6 );
    this.hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    this.hemiLight.position.set( 0, 50, 0 );
    this.scene.add( this.hemiLight );

    this.hemiLightHelper = new THREE.HemisphereLightHelper( this.hemiLight, 10 );
    this.scene.add( this.hemiLightHelper );

    //

    this.dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    this.dirLight.color.setHSL( 0.1, 1, 0.95 );
    this.dirLight.position.set( - 1, 1.75, 1 );
    this.dirLight.position.multiplyScalar( 30 );
    this.scene.add( this.dirLight );

    this.dirLight.castShadow = true;

    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;

    const d = 60;

    this.dirLight.shadow.camera.left = - d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = - d;

    this.dirLight.shadow.camera.far = 3500;
    this.dirLight.shadow.bias = - 0.0001;

    this.dirLightHelper = new THREE.DirectionalLightHelper( this.dirLight, 10 );
    this.scene.add( this.dirLightHelper );
  }

  addControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);  
    // this.controls.enableZoom = false;
    // this.controls.enablePan = false;
    // this.controls.autoRotate = true;


    this.gui = new dat.GUI();
		this.guiSettings = {
			greet: true
		}

		this.dirLight.visible = this.guiSettings.greet;
		this.dirLightHelper.visible = this.guiSettings.greet;

    // Lights
    this.lights = this.gui.addFolder('Lights');
    // this.lights.add(this.dirLight.position, 'x', -100, 100, 0.5).name('X').listen()
    // this.lights.add(this.dirLight.position, 'y', -100, 100, 0.5).name('Y').listen()
    // this.lights.add(this.dirLight.position, 'z', -100, 100, 0.5).name('Z').listen()
    this.lights.add(this.guiSettings, 'greet').onChange(val => {
			this.dirLight.visible = val
			this.dirLightHelper.visible = val
		})
    this.lights.open()
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

new App();