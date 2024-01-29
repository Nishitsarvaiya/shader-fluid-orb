export function randomNumberInRange(e, t) {
	return e + Math.random() * (t - e);
}

export function lerp(e, t, n, i, r) {
	return i + ((e - t) * (r - i)) / (n - t);
}

export function compareIntersections(a, b) {
	return a.distance - b.distance;
}

export function checkIntersection(object, raycaster, intersects, recursive = true) {
	if (object.layers.test(raycaster.layers) && object.raycast(raycaster, intersects)) {
		if (recursive) {
			const children = object.children;
			for (let i = 0, l = children.length; i < l; i++) {
				checkIntersection(children[i], raycaster, intersects);
			}
		}
	}
}
