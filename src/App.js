import {
	Color,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
	PlaneGeometry,
	DirectionalLight,
	ShaderMaterial,
	Mesh,
	DoubleSide,
	RawShaderMaterial,
	Vector2,
	Raycaster,
	Clock,
	Vector3,
	WebGLRenderTarget,
	RGBAFormat,
	RepeatWrapping,
	SphereGeometry,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons";
import intVertex from "./shaders/interaction/vertex.glsl";
import simVertex from "./shaders/simulation/vertex.glsl";
import renVertex from "./shaders/rendering/vertex.glsl";
import intFragment from "./shaders/interaction/fragment.glsl";
import simFragment from "./shaders/simulation/fragment.glsl";
import renFragment from "./shaders/rendering/fragment.glsl";

export default class App {
	constructor() {
		this.init();
	}

	init() {
		console.log("App initialised");
		// viewport
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.mouse = new Vector2(-1, -1);
		this.normalisedMouse = new Vector2(-1, -1);

		this.createComponents();
		this.resize();
		window.addEventListener("resize", () => this.resize());
		this.render();
	}

	createComponents() {
		this.createRenderer();
		this.createCamera();
		this.createControls();
		this.createScene();
		this.createRaycaster();
		this.createObjects();
		this.createOrb();
	}

	createRenderer() {
		// renderer
		this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
		this.canvas = this.renderer.domElement;
		this.renderer.setClearColor(0x1d1d1d, 1);
		this.renderer.setSize(this.width, this.height);
		this.renderer.setPixelRatio(window.devicePixelRatio || 1);
		document.getElementById("app").appendChild(this.canvas);
	}

	createCamera() {
		// camera
		this.camera = new PerspectiveCamera(60, this.width / this.height, 0.1, 2);
		this.camera.position.set(0, 0, 2.5);
	}

	createControls() {
		// controls
		this.controls = new OrbitControls(this.camera, this.canvas);
		this.controls.enableDamping = true;
		this.controls.update();
	}

	createScene() {
		// scene
		this.scene = new Scene();
		this.scene.background = null;
		this.scene.environment = null;
		this.scene.fog = null;
		this.scene.backgroundBlurriness = 0;
		this.scene.backgroundIntensity = 1;
		this.scene.overrideMaterial = null;
	}

	createRaycaster() {
		this.raycaster = new Raycaster();
	}

	createLights() {
		// lights
		this.lights = [];
		this.lights[0] = new DirectionalLight(0xffffff, 5);
		this.lights[1] = new DirectionalLight(0xffffff, 5);
		this.lights[2] = new DirectionalLight(0xffffff, 5);
		this.lights[0].position.set(0, 20, 0);
		this.lights[1].position.set(10, 20, 10);
		this.lights[2].position.set(-10, -20, -10);

		this.scene.add(this.lights[0]);
		this.scene.add(this.lights[1]);
		this.scene.add(this.lights[2]);
	}

	createObjects() {
		this.clock = new Clock();
		this.createMaterials();
	}

	createMaterials() {
		this.intMaterial = new RawShaderMaterial({
			side: DoubleSide,
			vertexShader: intVertex,
			fragmentShader: intFragment,
			uniforms: {
				time: {
					value: 0,
				},
				texture: {
					value: null,
				},
				center: {
					value: new Vector2(),
				},
				center2: {
					value: new Vector2(),
				},
				radius: {
					value: 0,
				},
				strength: {
					value: 0,
				},
				noiseSpeed: {
					value: 0,
				},
				noiseAmplitude: {
					value: 0,
				},
				noiseFrequency: {
					value: 0,
				},
				mouseDown: {
					value: false,
				},
			},
		});
		this.simMaterial = new RawShaderMaterial({
			side: DoubleSide,
			vertexShader: simVertex,
			fragmentShader: simFragment,
			uniforms: {
				texture: {
					value: null,
				},
				size: {
					value: new Vector2(0, 0),
				},
			},
		});
		this.renMaterial = new RawShaderMaterial({
			side: DoubleSide,
			vertexShader: intVertex,
			fragmentShader: intFragment,
			uniforms: {
				texture: {
					value: null,
				},
				matcapTexture: {
					value: null,
				},
				matcapTexture2: {
					value: null,
				},
				textureMix: {
					value: 0,
				},
				size: {
					value: new Vector2(),
				},
				eye: {
					value: new Vector3(),
				},
				lightDirection: {
					value: new Vector3(),
				},
				angle: {
					value: 0,
				},
			},
		});
	}

	createOrb() {
		this.fbos = [256, 128].map(
			(e) =>
				new WebGLRenderTarget(e, e, {
					format: RGBAFormat,
					wrapS: RepeatWrapping,
					wrapT: RepeatWrapping,
				})
		);
		this.fboScene = new Scene();
		this.fboPlane = new Mesh(new PlaneGeometry(2, 2));
		this.intMaterial.uniforms.center.value.set(-1, -1);
		this.intMaterial.uniforms.center2.value.set(-1, -1);
		this.intMaterial.uniforms.radius.value = 0.05;
		this.intMaterial.uniforms.strength.value = 0.05;
		this.intMaterial.uniforms.noiseSpeed.value = 0.1;
		this.intMaterial.uniforms.noiseAmplitude.value = 0.005;
		this.intMaterial.uniforms.noiseFrequency.value = 3;
		this.intMaterial.uniforms.texture.value = this.fbos[1].texture;
		this.simMaterial.uniforms.texture.value = this.fbos[0].texture;
		this.simMaterial.uniforms.size.value.set(this.fbos[0].width / 2, this.fbos[0].height / 2);
		this.renMaterial.uniforms.texture.value = this.fbos[1].texture;
		this.renMaterial.uniforms.size.value.set(this.fbos[1].width, this.fbos[1].height);
		this.renMaterial.uniforms.eye.value.copy(this.camera.position).normalize();
		this.scene.add(this.fboPlane);

		this.sphere = new Mesh(new SphereGeometry(1, 156, 156, 0, Math.PI), this.renMaterial);
		this.sphere.scale.setScalar(1);
		this.scene.add(this.sphere);
	}

	addListeners() {
		window.addEventListener("resize", this.resize);
		window.addEventListener("mousedown", this.onMouseDown);
		window.addEventListener("mousemove", this.onMouseMove);
	}

	resize() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;

		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.width, this.height);
		this.camera.updateProjectionMatrix();
	}

	render() {
		requestAnimationFrame(() => this.render());
		this.renderer.render(this.scene, this.camera);
		this.controls.update();
	}
}
