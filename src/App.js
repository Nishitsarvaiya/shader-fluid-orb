import { Tween } from "gsap/gsap-core";
import {
	Clock,
	DirectionalLight,
	DoubleSide,
	FloatType,
	HalfFloatType,
	Mesh,
	PerspectiveCamera,
	PlaneGeometry,
	RGBAFormat,
	RawShaderMaterial,
	RepeatWrapping,
	Scene,
	SphereGeometry,
	TextureLoader,
	Vector2,
	Vector3,
	WebGLRenderTarget,
	WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons";
import { lerp, randomNumberInRange } from "./helpers";
import CustomRayCaster from "./modules/CustomRayCaster";
import intFragment from "./shaders/interaction/fragment.glsl";
import intVertex from "./shaders/interaction/vertex.glsl";
import renFragment from "./shaders/rendering/fragment.glsl";
import renVertex from "./shaders/rendering/vertex.glsl";
import simFragment from "./shaders/simulation/fragment.glsl";
import simVertex from "./shaders/simulation/vertex.glsl";
import GUI from "lil-gui";
import gsap from "gsap";

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
		this.angleChangeSpeed = 1;
		this.angle = Math.PI / 2;
		this.scale = 1;
		this.textureIndex = 0;
		this.textureTween = null;
		this.config = {
			background: "#f6f6f6",
			orb: "colorful",
		};

		this.createComponents();
	}

	createComponents() {
		this.createRenderer();
		this.createCamera();
		// this.createControls();
		this.createScene();
		this.createRaycaster();
		this.createObjects();
		this.createOrb();
		this.addListeners();
		this.resize();
		this.clock.start();
		this.intervalId = setInterval(() => {
			this.intMaterial.uniforms.center2.value.set(randomNumberInRange(0.5, 1), randomNumberInRange(0, 1));
			setTimeout(() => this.intMaterial.uniforms.center2.value.set(-1, -1), 10);
		}, 200);
		this.raf = window.requestAnimationFrame(() => this.update());
		this.createGUI();
	}

	createRenderer() {
		// renderer
		this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
		this.canvas = this.renderer.domElement;
		this.renderer.setClearColor(this.config.background, 1);
		this.renderer.setSize(this.width, this.height);
		this.renderer.setPixelRatio(window.devicePixelRatio || 1);
		document.getElementById("app").appendChild(this.canvas);
	}

	createCamera() {
		// camera
		this.camera = new PerspectiveCamera(60, this.width / this.height, 0.1, 2);
		this.camera.position.set(0, 0, 2.4);
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
		this.raycaster = new CustomRayCaster();
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
			vertexShader: renVertex,
			fragmentShader: renFragment,
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
		// Get supported WebGL extensions
		const supportedExtensions = this.renderer.getContext().getSupportedExtensions();

		let textureType;

		// Check if EXT_color_buffer_float extension is supported
		if (supportedExtensions?.includes("EXT_color_buffer_float")) {
			textureType = FloatType; // Assign texture type P
		} else {
			// Check if EXT_color_buffer_half_float extension is supported
			if (!supportedExtensions?.includes("EXT_color_buffer_half_float")) {
				throw new Error("Float textures not supported");
			}
			textureType = HalfFloatType; // Assign texture type U
		}
		this.fbos = [256, 128].map(
			(e) =>
				new WebGLRenderTarget(e, e, {
					format: RGBAFormat,
					type: textureType,
					wrapS: RepeatWrapping,
					wrapT: RepeatWrapping,
				})
		);
		this.fboScene = new Scene();
		this.fboPlane = new Mesh(new PlaneGeometry(2, 2));
		this.intMaterial.uniforms.center.value.set(-1, -1);
		this.intMaterial.uniforms.center2.value.set(-1, -1);
		this.intMaterial.uniforms.radius.value = 0.036;
		this.intMaterial.uniforms.strength.value = 0.04;
		this.intMaterial.uniforms.noiseSpeed.value = 0.1;
		this.intMaterial.uniforms.noiseAmplitude.value = 0.005;
		this.intMaterial.uniforms.noiseFrequency.value = 8;
		this.intMaterial.uniforms.texture.value = this.fbos[1].texture;
		this.simMaterial.uniforms.texture.value = this.fbos[0].texture;
		this.simMaterial.uniforms.size.value.set(this.fbos[0].width / 2, this.fbos[0].height / 2);
		this.renMaterial.uniforms.texture.value = this.fbos[1].texture;
		this.renMaterial.uniforms.size.value.set(this.fbos[1].width, this.fbos[1].height);
		this.renMaterial.uniforms.eye.value.copy(this.camera.position).normalize();
		this.fboScene.add(this.fboPlane);

		this.sphere = new Mesh(new SphereGeometry(1, 156, 156, 0, Math.PI), this.renMaterial);
		this.sphere.scale.setScalar(this.scale);
		this.setTexture(this.config.orb === "grayscale" ? "/texture-black.png" : "/texture.png");
		this.scene.add(this.sphere);
	}

	setTexture(url) {
		new TextureLoader().load(url, (texture) => {
			// Check if the matcapTexture value is set in the rendering material
			if (this.renMaterial.uniforms.matcapTexture.value) {
				// If matcapTexture is already set, switch between two textures
				let n, i;
				this.textureIndex = (this.textureIndex + 1) % 2;
				if (this.textureIndex === 0) {
					// If textureIndex is 0, set matcapTexture value to the loaded texture
					this.renMaterial.uniforms.matcapTexture.value = texture;
					n = 1; // Set texture indices for tweening
					i = 0;
				} else {
					// If textureIndex is not 0, set matcapTexture2 value to the loaded texture
					this.renMaterial.uniforms.matcapTexture2.value = texture;
					n = 0; // Set texture indices for tweening
					i = 1;
				}
				// Kill the current texture tween if it exists
				if (this.textureTween !== null) {
					this.textureTween.kill();
				}
				// Create a new tween to smoothly transition between textures
				this.textureTween = gsap.fromTo(
					this.renMaterial.uniforms.textureMix,
					{ value: n },
					{ value: i, duration: 0.5, ease: "power3.out" }
				);
			} else {
				// If matcapTexture value is not set, directly assign the loaded texture
				this.renMaterial.uniforms.matcapTexture.value = texture;
			}
		});
	}

	update = () => {
		const bounds = this.canvas.getBoundingClientRect();
		this.normalisedMouse.set(
			lerp(this.mouse.x - bounds.left, 0, bounds.width, -1, 1),
			lerp(this.mouse.y - bounds.top, 0, bounds.height, 1, -1)
		);
		this.raf = window.requestAnimationFrame(this.update);

		if (this.normalisedMouse.x !== -1 && this.normalisedMouse.y !== -1) {
			this.raycaster.setFromCamera(this.normalisedMouse, this.camera);
			const intersection = this.raycaster.intersectObject(this.sphere)[0];
			if (intersection && intersection.uv) {
				this.intMaterial.uniforms.center.value.copy(intersection.uv);
			} else {
				this.intMaterial.uniforms.center.value.set(-1, -1);
			}
		}

		const elapsedTime = this.clock.getElapsedTime();
		this.intMaterial.uniforms.time.value = elapsedTime;
		// Tween.update();
		this.angle += 0.01 * this.angleChangeSpeed;

		const threshold = 0.5;
		if (this.angle > Math.PI - threshold) {
			this.angleChangeSpeed *= -1;
			this.angle = Math.PI - threshold;
		} else if (this.angle < threshold) {
			this.angleChangeSpeed *= -1;
			this.angle = threshold;
		}

		const lightX = 1 * Math.cos(this.angle);
		const lightY = 1 * Math.sin(this.angle);
		this.renMaterial.uniforms.lightDirection.value.set(lightX, lightY, 1);
		this.renMaterial.uniforms.angle.value = this.angle;

		this.render();
	};

	onMouseDown = () => {
		this.intMaterial.uniforms.mouseDown.value = true;
		window.addEventListener("mouseup", this.onMouseUp);
	};

	onMouseUp = () => {
		this.intMaterial.uniforms.mouseDown.value = !1;
		window.removeEventListener("mouseup", this.onMouseUp);
	};

	onMouseMove = (e) => this.mouse.set(e.clientX, e.clientY);

	addListeners() {
		window.addEventListener("resize", () => this.resize());
		window.addEventListener("mousedown", () => this.onMouseDown());
		window.addEventListener("mousemove", (e) => this.onMouseMove(e));
	}

	removeListeners() {
		window.removeEventListener("resize", this.resize);
		window.removeEventListener("mousedown", this.onMouseDown);
		window.removeEventListener("mouseup", this.onMouseUp);
		window.removeEventListener("mousemove", this.onMouseMove);
	}

	resize() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;

		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.width, this.height);
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
	}

	render() {
		this.fboPlane.material = this.intMaterial;
		this.renderer.setRenderTarget(this.fbos[0]);
		this.renderer.render(this.fboScene, this.camera);
		this.fboPlane.material = this.simMaterial;
		this.renderer.setRenderTarget(this.fbos[1]);
		this.renderer.render(this.fboScene, this.camera);
		this.renderer.setRenderTarget(null);
		this.renderer.render(this.scene, this.camera);
	}

	createGUI() {
		this.gui = new GUI();

		this.gui
			.addColor(this.config, "background")
			.listen()
			.onChange((v) => {
				this.renderer.setClearColor(v, 1);
			});

		this.gui
			.add(this.config, "orb", ["grayscale", "colorful"])
			.listen()
			.onChange((v) => {
				this.setTexture(this.config.orb === "grayscale" ? "/texture-black.png" : "/texture.png");
			});
	}

	dispose() {
		this.clock.stop();
		this.removeListeners();
		window.clearInterval(this.intervalId);
		window.cancelAnimationFrame(this.raf);
	}
}
