global.THREE = require("three");
const THREE = global.THREE;
const OrbitControls = require("three-orbit-controls")(THREE);
const loadFont = require("load-bmfont");
const createGeometry = require("three-bmfont-text");
const MSDFShader = require("three-bmfont-text/shaders/msdf");

import fragmentShader from '../assets/shaders/greetFragment.glsl'
import vertexShader from '../assets/shaders/greetVertex.glsl'

import fontFile from '../assets/fonts/PatuaOne-Regular.fnt';
import fontAtlas from '../assets/fonts/PatuaOne-Regular.png';

import dat from 'dat.gui'

class App {
	constructor() {
		this.renderer = new THREE.WebGL1Renderer({
      alpha: true,
			antialias: true
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);

    this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );

    this.camera.position.z = 3;

    this.scene = new THREE.Scene();

    this.clock = new THREE.Clock();

		const canvas = this.renderer.domElement;
    const container = document.querySelector('#viz');
    container.appendChild(canvas);

		this.init();
	}

	init() {

		loadFont(fontFile, (err, font) => {
      this.fontGeometry = createGeometry({
        font,
        text: "hello, i'm ro"
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
        this.createMesh();
        this.animate();
      });
    });
    
    this.rotateList()
    this.addLights()
    this.addControls()

		window.addEventListener('resize', this.resize.bind(this));
	}

  rotateList() {
    const list = document.querySelectorAll('.rotate-list')
    list.forEach(val => {
      const el = [...val.getElementsByTagName('li')]
      
      el.forEach(li => {
        li.setAttribute('style', `--rotY: ${ Math.floor(Math.random() * 37) + 8 }deg; --rotZ: ${ Math.floor(Math.random() * 8) - 4 }deg`)
      })
    })
    
  }

  addLights() {
    this.ambient = new THREE.AmbientLight(0x404040)
    this.directional = new THREE.DirectionalLight( 0xffffff, 1 )
    this.scene.add(this.ambient)
    this.scene.add(this.directional)
  }

  addControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);  
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    // this.controls.autoRotate = true;


    this.gui = new dat.GUI();

    // Lights
    this.lights = this.gui.addFolder('Lights');
    this.lights.add(this.ambient.position, 'x', -100, 100).name('X').listen()
    this.lights.add(this.ambient.position, 'y', -100, 100).name('Y').listen()
    this.lights.add(this.ambient.position, 'z', -100, 100).name('Z').listen()
    // this.lights.open()
  }

	createRenderTarget() {
    // Render Target setup
    this.rt = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );

    this.rtCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this.rtCamera.position.z = 2.5;

    this.rtScene = new THREE.Scene();
    this.rtScene.background = new THREE.Color("#000000");

    // Create text mesh with font geometry and material
    this.text = new THREE.Mesh(this.fontGeometry, this.fontMaterial);

    // Adjust dimensions
    this.text.position.set(-0.8, -0.525, 0);
    this.text.rotation.set(Math.PI, 0, 0);
    this.text.scale.set(0.008, 0.04, 1);

    // Add text mesh to buffer scene
    this.rtScene.add(this.text);
  }

  createMesh() {
    this.geometry = new THREE.BoxGeometry(150, 10, 10, 32, 32, 32)
    this.geometry.receiveShadow = true;
    
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: this.rt.texture }
      },
      receiveShadow: true,
      // wireframe: true
    });

    this.greet = new THREE.Mesh(this.geometry, this.material);
    this.greet.position.z = -60;
    this.greet.position.x = -25;

    this.greet.rotation.x = -0.2;
    this.greet.rotation.y = -0.9;
    this.greet.rotation.z = 0.02;

    this.scene.add(this.greet);
  }
	

	animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.render();
  }

	render() {
    if(this.controls) this.controls.update();

    // Update time
    this.material.uniforms.uTime.value = this.clock.getElapsedTime();

    // Draw Render Target
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(this.rtScene, this.rtCamera);
    this.renderer.setRenderTarget(null);

    this.renderer.render(this.scene, this.camera);
  }

	resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

new App();