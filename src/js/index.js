// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

global.THREE = require("three");
const THREE = global.THREE;
const OrbitControls = require("three-orbit-controls")(THREE);
const loadFont = require("load-bmfont");
const createGeometry = require("three-bmfont-text");
const MSDFShader = require("three-bmfont-text/shaders/msdf");

const shaders = require("./shaders.js");

import fontFile from '../assets/PatuaOne-Regular.fnt';
import fontAtlas from '../assets/PatuaOne-Regular.png';

class App {
	constructor() {
		this.turn = 0;

		this.renderer = new THREE.WebGL1Renderer({
      alpha: true,
			antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );

    this.camera.position.z = 60;

    this.scene = new THREE.Scene();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);    

    this.clock = new THREE.Clock();

		const canvas = this.renderer.domElement;
    const container = document.querySelector('#webgl');
    container.appendChild(canvas);

		this.init();
	}

	init() {

		loadFont(fontFile, (err, font) => {
      this.fontGeometry = createGeometry({
        font,
        text: "ro baldovino"
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
            color: 0xffffff
          })
        );

        this.createRenderTarget();
        this.createMesh();
        this.animate();
      });
    });

		window.addEventListener('resize', this.resize.bind(this));
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
    this.text.position.set(-0.965, -0.525, 0);
    this.text.rotation.set(Math.PI, 0, 0);
    this.text.scale.set(0.008, 0.04, 1);

    // Add text mesh to buffer scene
    this.rtScene.add(this.text);
  }

  createMesh() {
    this.geometry = new THREE.TorusKnotGeometry(9, 3, 768, 3, 4, 3);
    this.material = new THREE.ShaderMaterial({
      vertexShader: shaders.vert,
      fragmentShader: shaders.frag,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: this.rt.texture }
      },
			extensions: {
				derivatives: true
			},
			// glslVersion: THREE.GLSL1
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.scene.add(this.mesh);
  }
	

	animate() {
    requestAnimationFrame(this.animate.bind(this));

		// this.cube.rotation.x += 0.01;
		// this.cube.rotation.y += 0.01;

    this.render();
  }

	render() {
    this.controls.update();

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