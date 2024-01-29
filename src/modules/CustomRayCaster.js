import { Layers, Ray } from "three";
import { checkIntersection, compareIntersections } from "../helpers";

export default class CustomRayCaster {
	constructor(origin, direction, near = 0, far = Infinity) {
		this.ray = new Ray(origin, direction);
		this.near = near;
		this.far = far;
		this.camera = null;
		this.layers = new Layers();
		this.params = {
			Mesh: {},
			Line: { threshold: 1 },
			LOD: {},
			Points: { threshold: 1 },
			Sprite: {},
		};
	}

	set(origin, direction) {
		this.ray.set(origin, direction);
	}

	setFromCamera(coords, camera) {
		if (camera.isPerspectiveCamera) {
			this.ray.origin.setFromMatrixPosition(camera.matrixWorld);
			this.ray.direction.set(coords.x, coords.y, 0.5).unproject(camera).sub(this.ray.origin).normalize();
			this.camera = camera;
		} else if (camera.isOrthographicCamera) {
			this.ray.origin
				.set(coords.x, coords.y, (camera.near + camera.far) / (camera.near - camera.far))
				.unproject(camera);
			this.ray.direction.set(0, 0, -1).transformDirection(camera.matrixWorld);
			this.camera = camera;
		} else {
			console.error("THREE.Raycaster: Unsupported camera type: " + camera.type);
		}
	}

	intersectObject(object, recursive = true, intersections = []) {
		checkIntersection(object, this, intersections, recursive);
		intersections.sort(compareIntersections);
		return intersections;
	}

	intersectObjects(objects, recursive = true, intersections = []) {
		for (let i = 0, l = objects.length; i < l; i++) {
			checkIntersection(objects[i], this, intersections, recursive);
		}
		intersections.sort(compareIntersections);
		return intersections;
	}
}
