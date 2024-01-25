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
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

export default class App {
	constructor() {
		this.init();
	}

	init() {
		console.log("App initialised");
		// viewport
		this.width = window.innerWidth;
		this.height = window.innerHeight;

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
		this.createObjects();
	}

	createRenderer() {
		// renderer
		this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
		this.canvas = this.renderer.domElement;
		document.getElementById("app").appendChild(this.canvas);
		this.renderer.setClearColor(0x242424, 1);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.width, this.height);
	}

	createCamera() {
		// camera
		this.cameraProps = {
			fov: 75,
			aspectRatio: this.width / this.height,
			near: 0.1,
			far: 100,
		};
		this.camera = new PerspectiveCamera(
			this.cameraProps.fov,
			this.cameraProps.aspectRatio,
			this.cameraProps.near,
			this.cameraProps.far
		);
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
		this.scene.background = new Color(0x242424);
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
		this.planeProps = {
			width: 2,
			height: 2,
			widthSegments: 36,
			heightSegments: 36,
		};
		this.geometry = new PlaneGeometry(
			this.planeProps.width,
			this.planeProps.height,
			this.planeProps.widthSegments,
			this.planeProps.heightSegments
		);
		this.material = new ShaderMaterial({
			side: DoubleSide,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
		});
		this.plane = new Mesh(this.geometry, this.material);
		this.scene.add(this.plane);
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
