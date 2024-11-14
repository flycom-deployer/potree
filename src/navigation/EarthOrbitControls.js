import * as THREE from "../../libs/three.js/build/three.module.js";
import {MOUSE} from "../defines.js";
import {Utils} from "../utils.js";
import {EventDispatcher} from "../EventDispatcher.js";

const UNDEFINED_CONTROLLER = 0;
const EARTH_CONTROLLER = 1;
const ORBIT_CONTROLLER = 2;

export class EarthOrbitControls extends EventDispatcher {
	constructor (viewer) {
		super(viewer);

		this.controlerType = UNDEFINED_CONTROLLER;
		this.viewer = viewer;
		this.renderer = viewer.renderer;
		this.scene = null;
		this.sceneControls = new THREE.Scene();

		this.rotationSpeed = 20;
		this.fadeFactor = 20;
		this.startHandled = undefined;

		this.tweens = [];

		this.isPivotIndicator = false;
		this.previousTouch = null;

		this.initControllers();
		this.setupEventListeners();
	}

	initControllers() {
        this.initEarthController();
        this.initOrbitController();
    }

	initEarthController() {
		this.wheelDelta = 0;
		this.zoomDelta = new THREE.Vector3();
		this.camStart = null;

		this.panDelta = new THREE.Vector2(0, 0);

		let sg = new THREE.SphereGeometry(1, 16, 16);
		let sm = new THREE.MeshNormalMaterial();

		if (this.isPivotIndicator) {
			this.pivotIndicator = new THREE.Mesh(sg, sm);
			this.pivotIndicator.visible = false;
			this.sceneControls.add(this.pivotIndicator);
		}
	}

	initOrbitController() {
		this.direction = 1;

		this.yawDelta = 0;
		this.pitchDelta = 0;
		this.panDelta = new THREE.Vector2(0, 0);
		this.radiusDelta = 0;
	}

	setupEventListeners() {
        this.addEventListener('mousedown', this.onMouseDown);
        this.addEventListener('mouseup', this.onMouseUp);
        this.addEventListener('drag', this.onDrag);
        this.addEventListener('drop', this.onDrop);
        this.addEventListener('dblclick', this.onDoubleClick);
        this.addEventListener('mousewheel', this.onScroll);
        this.addEventListener('touchstart', this.onTouchStart);
        this.addEventListener('touchend', this.onTouchEnd);
        this.addEventListener('touchmove', this.onTouchMove);
    }

	onMouseDown = e => {
		let I = Utils.getMouseIntersection(
			e.mouse,
			this.scene.getActiveCamera(),
			this.viewer,
			this.scene.pointclouds,
			{pickClipped: false});

		if (I) {
			this.controlerType = EARTH_CONTROLLER;
			this.pivot = I.location;
			this.camStart = this.scene.getActiveCamera().clone();

			if (this.isPivotIndicator) {
				this.pivotIndicator.visible = true;
				this.pivotIndicator.position.copy(I.location);
			}
		} else {
			this.controlerType = ORBIT_CONTROLLER;
		}
	};

	onMouseUp = e => {
		this.I = undefined;
		this.controlerType = UNDEFINED_CONTROLLER;
		this.camStart = null;
		this.pivot = null;

		if (this.isPivotIndicator) {
			this.pivotIndicator.visible = false;
		}

		this.panDelta.set(0, 0);
	};

	onDrag = (e) => {
		if (this.controlerType === EARTH_CONTROLLER) {
			this.earthDrag(e);
		} else {
			this.orbitDrag(e);
		}
	};

	onDrop = e => {
		this.dispatchEvent({type: 'end'});
	};

	onDoubleClick = (e) => {
		let I = Utils.getMouseIntersection(
			this.viewer.inputHandler.mouse,
			this.scene.getActiveCamera(),
			this.viewer,
			this.scene.pointclouds,
			{pickClipped: false});

		if (I) {
			this.controlerType = EARTH_CONTROLLER;
		} else {
			this.controlerType = ORBIT_CONTROLLER;
		}

		this.zoomToLocation(e.mouse);
	};

	onScroll = (e) => {
		if (!this.lastMouse) {
			this.lastMouse = new THREE.Vector2(0,0);
		}

		const distance = this.lastMouse ? this.lastMouse.distanceTo(this.viewer.inputHandler.mouse) : 0;
		this.lastMouse = this.viewer.inputHandler.mouse.clone();

		if (!this.I || distance > 10) {
			this.I = Utils.getMouseIntersection(
				this.viewer.inputHandler.mouse,
				this.scene.getActiveCamera(),
				this.viewer,
				this.scene.pointclouds,
				{pickClipped: false});
		}

		if (this.I) {
			this.controlerType = EARTH_CONTROLLER;
			this.earthScroll(e);
		} else {
			this.controlerType = ORBIT_CONTROLLER;
			this.orbitScroll(e);
		}
	};

	onTouchStart = e => {
		const I = this.getTouchesPivot(e, this.scene, this.viewer);
		if (I) {
			this.controlerType = EARTH_CONTROLLER;
			this.pivot = I.location;
			this.camStart = this.scene.getActiveCamera().clone();

			if (this.isPivotIndicator) {
				this.pivotIndicator.visible = true;
				this.pivotIndicator.position.copy(I.location);
			}
		} else {
			this.controlerType = ORBIT_CONTROLLER;
		}

		this.previousTouch = e;
	};

	onTouchEnd = e => {
		this.controlerType = UNDEFINED_CONTROLLER;
		this.startHandled = undefined;

		this.previousTouch = e;
	};

	onTouchMove = e => {
		if (e.touches.length === 2 && this.previousTouch.touches.length === 2){
			let prev = this.previousTouch;
			let curr = e;

			let prevDX = prev.touches[0].pageX - prev.touches[1].pageX;
			let prevDY = prev.touches[0].pageY - prev.touches[1].pageY;
			let prevDist = Math.sqrt(prevDX * prevDX + prevDY * prevDY);

			let currDX = curr.touches[0].pageX - curr.touches[1].pageX;
			let currDY = curr.touches[0].pageY - curr.touches[1].pageY;
			let currDist = Math.sqrt(currDX * currDX + currDY * currDY);

			let prevMeanX = (prev.touches[0].pageX + prev.touches[1].pageX) / 2;
			let prevMeanY = (prev.touches[0].pageY + prev.touches[1].pageY) / 2;

			let currMeanX = (curr.touches[0].pageX + curr.touches[1].pageX) / 2;
			let currMeanY = (curr.touches[0].pageY + curr.touches[1].pageY) / 2;

			let ndrag = {
				x: (currMeanX - prevMeanX) / this.renderer.domElement.clientWidth,
				y: (currMeanY - prevMeanY) / this.renderer.domElement.clientHeight
			};

			// Detect if the change in distance is significant (indicating zoom)
			let delta = currDist / prevDist;
			if (Math.abs(delta - 1) < 0.01) { // Threshold to distinguish between zoom and pan
				if (this.controlerType === EARTH_CONTROLLER) {
					this.earthDrag({
						drag: {
							object: null,
							mouse:  MOUSE.RIGHT,
							startHandled: this.startHandled,
							lastDrag: {
								x: (currMeanX - prevMeanX),
								y: (currMeanY - prevMeanY),
							},
							end: {
								x: (currMeanX - prevMeanX),
								y: (currMeanY - prevMeanY),
							},
						}
					});

					this.startHandled = true;
				} else {
					this.orbitDrag({
						drag: {
							object: null,
							mouse:  MOUSE.RIGHT,
							startHandled: this.startHandled,
							lastDrag: {
								x: (currMeanX - prevMeanX),
								y: (currMeanY - prevMeanY),
							},
						}
					});

					this.startHandled = true;
				}
			} else {
				if (this.controlerType === EARTH_CONTROLLER) {
					this.earthScroll({
						delta: (delta > 1 ? delta : -delta),
					});
				} else {
					this.orbitScroll({
						delta: (delta > 1 ? delta : -delta),
					});
				}
			}

			this.stopTweens();
		}

		this.previousTouch = e;
	};

	getTouchesPivot = (e, scene, viewer) => {
		const touches = e.touches;
		const touchCount = Math.min(touches.length, 2);
		let intersections = [];

		for (let i = 0; i < touchCount; i++) {
			let intersection = Utils.getMouseIntersection(
				{
					x: touches[i].pageX,
					y: touches[i].pageY,
				},
				scene.getActiveCamera(),
				viewer,
				scene.pointclouds,
				{ pickClipped: false }
			);
			intersections.push(intersection);
		}

		let result;

		if (touchCount === 1 || (intersections[0] && !intersections[1]) || (!intersections[0] && intersections[1])) {
			// Single touch or only one touch intersects
			result = intersections.find(intersection => intersection) || intersections[0];
		} else if(intersections.length === 2 && intersections[0] && intersections[1]) {
			// Both touches intersect or both don't intersect
			result = {
				location: new THREE.Vector3().addVectors(
					intersections[0].location,
					intersections[1].location
				).multiplyScalar(0.5)
			};
		}

		return result;
	}

	update(delta) {
		if (this.controlerType === EARTH_CONTROLLER) {
			this.earthUpdate(delta);
		} else if (this.controlerType === ORBIT_CONTROLLER) {
			this.orbitUpdate(delta);
		}
	}

	zoomToLocation(mouse){
		let camera = this.scene.getActiveCamera();

		let I = Utils.getMouseIntersection(
			mouse,
			camera,
			this.viewer,
			this.scene.pointclouds);

		if (I === null) {
			return;
		}

		let targetRadius = 0;
		let minimumJumpDistance = 0.2;
		let radius;

		if (!I.pointcloud) {
			radius = 0;

			if (I.point && I.point.geometry && I.point.geometry.boundingSphere) {
				radius = I.point.geometry.boundingSphere.radius;
			}
		} else {
			let domElement = this.renderer.domElement;
			let ray = Utils.mouseToRay(mouse, camera, domElement.clientWidth, domElement.clientHeight);

			let nodes = I.pointcloud.nodesOnRay(I.pointcloud.visibleNodes, ray);
			let lastNode = nodes[nodes.length - 1];
			radius = lastNode.getBoundingSphere(new THREE.Sphere()).radius;
		}

		targetRadius = Math.min(this.scene.view.radius, radius);
		targetRadius = Math.max(minimumJumpDistance, targetRadius);

		let d = this.scene.view.direction.multiplyScalar(-1);
		let cameraTargetPosition = new THREE.Vector3().addVectors(I.location, d.multiplyScalar(targetRadius));

		let animationDuration = 600;
		let easing = TWEEN.Easing.Quartic.Out;

		{
			let value = {x: 0};
			let tween = new TWEEN.Tween(value).to({x: 1}, animationDuration);
			tween.easing(easing);
			this.tweens.push(tween);

			let startPos = this.scene.view.position.clone();
			let targetPos = cameraTargetPosition.clone();
			let startRadius = this.scene.view.radius;
			let targetRadius = cameraTargetPosition.distanceTo(I.location);

			tween.onUpdate(() => {
				let t = value.x;
				this.scene.view.position.x = (1 - t) * startPos.x + t * targetPos.x;
				this.scene.view.position.y = (1 - t) * startPos.y + t * targetPos.y;
				this.scene.view.position.z = (1 - t) * startPos.z + t * targetPos.z;

				this.scene.view.radius = (1 - t) * startRadius + t * targetRadius;
				this.viewer.setMoveSpeed(this.scene.view.radius / 2.5);
			});

			tween.onComplete(() => {
				this.tweens = this.tweens.filter(e => e !== tween);
			});

			tween.start();
		}
	}

	earthUpdate (delta) {
		let view = this.scene.view;
		let fade = Math.pow(0.5, this.fadeFactor * delta);
		let progression = 1 - fade;
		let camera = this.scene.getActiveCamera();

		// compute zoom
		if (this.wheelDelta !== 0) {
			let I = (this.pivot || this.I)
				? {location: this.pivot  || this.I.location}
				: Utils.getMouseIntersection(
				// TODO ??
				this.viewer.inputHandler.mouse,
				this.scene.getActiveCamera(),
				this.viewer,
				this.scene.pointclouds);

			if (I) {
				let resolvedPos = new THREE.Vector3().addVectors(view.position, this.zoomDelta);
				let distance = I.location.distanceTo(resolvedPos);
				let jumpDistance = distance * 0.2 * this.wheelDelta;
				let targetDir = new THREE.Vector3().subVectors(I.location, view.position);
				targetDir.normalize();

				resolvedPos.add(targetDir.multiplyScalar(jumpDistance));
				this.zoomDelta.subVectors(resolvedPos, view.position);

				{
					let distance = resolvedPos.distanceTo(I.location);
					view.radius = distance;
					let speed = view.radius / 2.5;
					this.viewer.setMoveSpeed(speed);
				}
			}
		}

		// apply zoom
		if (this.zoomDelta.length() !== 0) {
			let p = this.zoomDelta.clone().multiplyScalar(progression);

			let newPos = new THREE.Vector3().addVectors(view.position, p);
			view.position.copy(newPos);
		}

		if (this.isPivotIndicator && this.pivotIndicator.visible) {
			let distance = this.pivotIndicator.position.distanceTo(view.position);
			let pixelwidth = this.renderer.domElement.clientwidth;
			let pixelHeight = this.renderer.domElement.clientHeight;
			let pr = Utils.projectedRadius(1, camera, distance, pixelwidth, pixelHeight);
			let scale = (10 / pr);
			this.pivotIndicator.scale.set(scale, scale, scale);
		}

		this.zoomDelta.multiplyScalar(fade);
		this.wheelDelta = 0;
	}

	orbitUpdate (delta) {
		let view = this.scene.view;

		{
			let progression = Math.min(1, this.fadeFactor * delta);

			let yaw = view.yaw;
			let pitch = view.pitch;
			let pivot = view.getPivot();

			yaw -= this.direction * progression * this.yawDelta;
			pitch -= this.direction * progression * this.pitchDelta;

			view.yaw = yaw;
			view.pitch = pitch;

			let V = this.scene.view.direction.multiplyScalar(-view.radius);
			let position = new THREE.Vector3().addVectors(pivot, V);

			view.position.copy(position);
		}

		{
			let progression = Math.min(1, this.fadeFactor * delta);
			let panDistance = progression * view.radius * 3;

			let px = -this.panDelta.x * panDistance;
			let py = this.panDelta.y * panDistance;

			view.pan(px, py);
		}

		{
			let progression = Math.min(1, this.fadeFactor * delta);

			// let radius = view.radius + progression * this.radiusDelta * view.radius * 0.1;
			let radius = view.radius + progression * this.radiusDelta;

			let V = view.direction.multiplyScalar(-radius);
			let position = new THREE.Vector3().addVectors(view.getPivot(), V);
			view.radius = radius;

			view.position.copy(position);
		}

		{
			let speed = view.radius;
			this.viewer.setMoveSpeed(speed);
		}

		{
			let progression = Math.min(1, this.fadeFactor * delta);
			let attenuation = Math.max(0, 1 - this.fadeFactor * delta);

			this.yawDelta *= attenuation;
			this.pitchDelta *= attenuation;
			this.panDelta.multiplyScalar(attenuation);
			// this.radiusDelta *= attenuation;
			this.radiusDelta -= progression * this.radiusDelta;
		}
	}

	earthDrag(e) {
		if (e.drag.object !== null) {
			return;
		}

		if (!this.pivot) {
			return;
		}

		if (e.drag.startHandled === undefined) {
			e.drag.startHandled = true;

			this.dispatchEvent({type: 'start'});
		}

		let camStart = this.camStart;
		let camera = this.scene.getActiveCamera();
		let view = this.viewer.scene.view;

		let mouse = e.drag.end;
		let domElement = this.viewer.renderer.domElement;

		if (e.drag.mouse === MOUSE.LEFT) {

			let ray = Utils.mouseToRay(mouse, camera, domElement.clientWidth, domElement.clientHeight);

			if ( camera.isPerspectiveCamera ) {
				let plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
					new THREE.Vector3(0, 0, 1),
					this.pivot);

				let distanceToPlane = ray.distanceToPlane(plane);

				if (distanceToPlane > 0) {
					let I = new THREE.Vector3().addVectors(
						camStart.position,
						ray.direction.clone().multiplyScalar(distanceToPlane));
					let movedBy = new THREE.Vector3().subVectors(
						I, this.pivot);

					let newCamPos = camStart.position.clone().sub(movedBy);
					view.position.copy(newCamPos);

					{
						let distance = newCamPos.distanceTo(this.pivot);
						view.radius = distance;
						let speed = view.radius / 2.5;
						this.viewer.setMoveSpeed(speed);
					}
				}
			} else if ( camera.isOrthographicCamera ) {
				let ndrag = {
					x: e.drag.lastDrag.x / this.renderer.domElement.clientWidth,
					y: e.drag.lastDrag.y / this.renderer.domElement.clientHeight
				};
				this.panDelta.x += ndrag.x;
				this.panDelta.y += ndrag.y;
				this.panDelta.x = ndrag.x;
				this.panDelta.y = ndrag.y;


				let V = new THREE.Vector3().subVectors(this.pivot.clone(), ray.origin.clone());
				let D_normalized = ray.direction.clone().normalize();
				let V_proj = D_normalized.multiplyScalar(V.dot(D_normalized));
				let V_perp = new THREE.Vector3().subVectors(V, V_proj);

				let panDistance = view.radius * 2;
				let px = -this.panDelta.x * panDistance;
				let py = this.panDelta.y * panDistance;

				view.pan(px, py);
			}

		} else if (e.drag.mouse === MOUSE.RIGHT) {
			let ndrag = {
				x: e.drag.lastDrag.x / this.renderer.domElement.clientWidth,
				y: e.drag.lastDrag.y / this.renderer.domElement.clientHeight
			};

			let yawDelta = -ndrag.x * this.rotationSpeed * 0.5;
			let pitchDelta = -ndrag.y * this.rotationSpeed * 0.2;

			let originalPitch = view.pitch;
			let tmpView = view.clone();
			tmpView.pitch = tmpView.pitch + pitchDelta;
			pitchDelta = tmpView.pitch - originalPitch;

			let pivotToCam = new THREE.Vector3().subVectors(view.position, this.pivot);
			let pivotToCamTarget = new THREE.Vector3().subVectors(view.getPivot(), this.pivot);
			let side = view.getSide();

			pivotToCam.applyAxisAngle(side, pitchDelta);
			pivotToCamTarget.applyAxisAngle(side, pitchDelta);

			pivotToCam.applyAxisAngle(new THREE.Vector3(0, 0, 1), yawDelta);
			pivotToCamTarget.applyAxisAngle(new THREE.Vector3(0, 0, 1), yawDelta);

			let newCam = new THREE.Vector3().addVectors(this.pivot, pivotToCam);

			view.position.copy(newCam);
			view.yaw += yawDelta;
			view.pitch += pitchDelta;
		}
	}

	orbitDrag(e) {
		if (e.drag.object !== null) {
			return;
		}

		if (e.drag.startHandled === undefined) {
			e.drag.startHandled = true;

			this.dispatchEvent({type: 'start'});
		}

		let ndrag = {
			x: e.drag.lastDrag.x / this.renderer.domElement.clientWidth,
			y: e.drag.lastDrag.y / this.renderer.domElement.clientHeight
		};

		if (e.drag.mouse === MOUSE.RIGHT) {
			this.yawDelta += ndrag.x * this.rotationSpeed;
			this.pitchDelta += ndrag.y * this.rotationSpeed;

			this.stopTweens();
		} else if (e.drag.mouse === MOUSE.LEFT ) {
			this.panDelta.x += ndrag.x;
			this.panDelta.y += ndrag.y;

			this.stopTweens();
		}
	}

	earthScroll(e) {
		this.wheelDelta += (e.delta * .5);
	}

	orbitScroll(e) {
		let resolvedRadius = this.scene.view.radius + this.radiusDelta;

		this.radiusDelta += -e.delta * resolvedRadius * 0.05;

		this.stopTweens();
	}

	setScene (scene) {
		this.scene = scene;
	}

	stop(){
		this.wheelDelta = 0;
		this.zoomDelta.set(0, 0, 0);
		this.yawDelta = 0;
		this.pitchDelta = 0;
		this.radiusDelta = 0;
		this.panDelta.set(0, 0);
	}

	stopTweens () {
		this.tweens.forEach(e => e.stop());
		this.tweens = [];
	}
};
