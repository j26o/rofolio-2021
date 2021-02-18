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
    this.rotateHTMLList()
    this.initFont()
    
		this.addListeners()
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
        text: "hello world! i'm ro"
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
    this.controls.enablePan = false;
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

	createRenderTarget() {
    // Render Target setup
    this.rt = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );

    this.rtCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this.rtCamera.position.z = 4;

    this.rtScene = new THREE.Scene();
    this.rtScene.background = new THREE.Color("#000000");

    // Create text mesh with font geometry and material
    this.text = new THREE.Mesh(this.fontGeometry, this.fontMaterial);

    // Adjust dimensions
    this.text.position.set(-0.88, -0.525, 0);
    this.text.rotation.set(Math.PI, 0, 0);
    this.text.scale.set(0.0075, 0.07, 1);

    // Add text mesh to buffer scene
    this.rtScene.add(this.text);
  }

  createGreetMesh() {
    this.geometry = new THREE.BoxGeometry(150, 10, 10, 32, 32, 32);
    this.geometry.receiveShadow = true;

    let uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib[ "lights" ]
    ])

    uniforms.uTime = { value: 0 }
    uniforms.uTexture = { value: this.rt.texture }

    
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      receiveShadow: true,
      lights: true,
      // wireframe: true
    });

    this.greet = new THREE.Mesh(this.geometry, this.material);
    this.greet.castShadow = true;
    this.greet.receiveShadow = true;
    this.greet.position.z = -60;
    this.greet.position.x = -25;

    this.greet.rotation.x = -0.2;
    this.greet.rotation.y = -0.8;
    this.greet.rotation.z = 0;

    this.scene.add(this.greet);
  }

	animate() {
    requestAnimationFrame(this.animate.bind(this));
    // this.greet.rotation.y += 0.001;

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

  addListeners() {
    window.addEventListener('resize', this.resize.bind(this))
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