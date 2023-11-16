import { EventDispatcher } from "../../EventDispatcher.js";

let sg = new THREE.SphereGeometry(1, 16, 8);
let sgHigh = new THREE.SphereGeometry(1, 64, 32);

let sm = new THREE.MeshBasicMaterial({side: THREE.BackSide});
let smHovered = new THREE.MeshBasicMaterial({side: THREE.BackSide, color: 0xff0000});

let raycaster = new THREE.Raycaster();
let currentlyHovered = null;

let previousView = {
	controls: null,
	position: null,
	target: null,
};

const animationTimeout  = 0;

export class Image360{
	constructor(file, time, longitude, latitude, altitude, course, pitch, roll){
		this.file = file;
		this.time = time;
		this.longitude = longitude;
		this.latitude = latitude;
		this.altitude = altitude;
		this.course = course;
		this.pitch = pitch;
		this.roll = roll;
		this.mesh = null;
	}
};

export class Images360 extends EventDispatcher{
	constructor(viewer, buttons = true){
		super();

		this.viewer = viewer;
		this.selectingEnabled = true;

		this.images = [];
		this.node = new THREE.Object3D();

		const sphereMaterial = sm.clone();
		// no transparency
		sphereMaterial.transparent = false;

		this.sphere = new THREE.Mesh(sgHigh, sphereMaterial);
		this.sphere.visible = false;
		this.sphere.scale.set(1000, 1000, 1000);

		this.node.add(this.sphere);

		this._visible = true;

		this.focusedImage = null;
		this.loading = false;

		this.nextPreviousDirection;
		this.oldFov = 0;
		this.oldSpeed = 0;
		this.oldEdlOpacity = 0;

		this.zoomOn = e => {
			const minFov = 20.0;
			const maxFov = 100.0

			let fov = this.viewer.getFOV() - e.delta;

			if (fov > maxFov) {
				fov = maxFov;
			}

			if (fov < minFov) {
				fov = minFov;
			}

			this.viewer.setFOV(fov);
		};

		this.keyDown = e => {
			const deltaStep = 5;
			const yawStep = Math.PI/18.0;
    		const keyCode = parseInt(e.which);

    		// up, W, down, S
			if (this.isNavigation) {
				if (keyCode === 87 || keyCode === 38 || keyCode == 83 || keyCode === 40) {
					this.viewer.dispatchEvent({
						type: 'key_event',
						payload: {
							eventType: 'key_down',
							keyCode,
						},
					});
				}
			}

			// left
    		if (keyCode == 37) {
				this.viewer.orbitControls.yawDelta -= yawStep;
			// right
    		} else if (keyCode == 39) {
				this.viewer.orbitControls.yawDelta += yawStep;
			// +
    		} else if (keyCode == 187) {
    			e.delta = deltaStep;
        		this.zoomOn(e)
			// -
    		} else if (keyCode == 189) {
    			e.delta = -deltaStep;
        		this.zoomOn(e)
    		}
		};

		let elUnfocus = document.createElement("button");
		elUnfocus.innerHTML = "x";
		elUnfocus.style.position = "absolute";
		elUnfocus.style.right = "10px";
		elUnfocus.style.bottom = "20px";
		elUnfocus.style.zIndex = "10000";
		elUnfocus.style.fontSize = "1.5em";
		elUnfocus.style.cursor = "pointer";
		elUnfocus.style.paddingBottom = "2px";
		elUnfocus.style.visibility = buttons ? 'inherit' : 'hidden';
		elUnfocus.addEventListener("click", () => this.exit());
		this.elUnfocus = elUnfocus;

		let elPrev = document.createElement("button");
		elPrev.innerHTML = "&darr;";
		elPrev.style.position = "absolute";
		elPrev.style.right = "10px";
		elPrev.style.bottom = "60px";
		elPrev.style.zIndex = "10000";
		elPrev.style.fontSize = "1.5em";
		elPrev.style.cursor = "pointer";
		elPrev.style.paddingBottom = "2px";
		elPrev.style.visibility = buttons ? 'inherit' : 'hidden';
		elPrev.addEventListener("click", () => this.focusNearestImage(false));
		this.elPrev = elPrev;

		let elNext = document.createElement("button");
		elNext.innerHTML = "&uarr;";
		elNext.style.position = "absolute";
		elNext.style.right = "10px";
		elNext.style.bottom = "100px";
		elNext.style.zIndex = "10000";
		elNext.style.fontSize = "1.5em";
		elNext.style.cursor = "pointer";
		elNext.style.paddingBottom = "2px";
		elNext.style.visibility = buttons ? 'inherit' : 'hidden';
		elNext.addEventListener("click", () => this.focusNearestImage(true));
		this.elNext = elNext;

		this.domRoot = viewer.renderer.domElement.parentElement;
		this.domRoot.appendChild(elUnfocus);
		this.domRoot.appendChild(elNext);
		this.domRoot.appendChild(elPrev);

		this.elUnfocus.style.display = "none";
		this.elNext.style.display = "none";
		this.elPrev.style.display = "none";

		viewer.addEventListener("update", () => {
			this.update(viewer);
		});
		viewer.inputHandler.addInputListener(this);
	};

	set visible(visible){
		if(this._visible === visible){
			return;
		}


		for(const image of this.images){
			image.mesh.visible = visible && (this.focusedImage == null);
		}

		this.sphere.visible = visible && (this.focusedImage != null);
		this._visible = visible;

		this.dispatchEvent({
			type: "visibility_changed",
			images: this,
		});
	}

	get visible(){
		return this._visible;
	}

	async focusExtern(image360) {
		this.nextPreviousDirection = null;
		await this.focus(image360);
	}

	async focus(image360){
		if (!image360) {
			return false;
		}

		this.isNavigation = image360.style === 'navigation';

		if (this.focusedImage === null) {
			// save old fov
			if (!this.oldFov) {
				this.oldFov = this.viewer.getFOV();
			}

			// save old speed
			if (!this.oldSpeed) {
				this.oldSpeed = this.viewer.getMoveSpeed();
			}

			// save old opacity
			if (!this.oldEdlOpacity) {
				this.oldEdlOpacity = this.viewer.getEDLOpacity();
			}

			this.addEventListener('mousewheel', this.zoomOn);
			document.addEventListener("keydown", this.keyDown, false);

			previousView = {
				controls: this.viewer.controls,
				position: this.viewer.scene.view.position.clone(),
				target: viewer.scene.view.getPivot(),
			};

			this.viewer.setControls(this.viewer.orbitControls);
			this.viewer.orbitControls.doubleClockZoomEnabled = false;
			this.viewer.orbitControls.direction = -1;

			for(let image of this.images){
				image.mesh.visible = false;
			}

			this.selectingEnabled = false;

			this.sphere.visible = false;
		}
		return this.load(image360).then( () => {
			// dispose last used texture
			if (this.focusedImage && this.focusedImage.texture) {
				this.focusedImage.texture.dispose();
				this.focusedImage.texture = null;

				this.sphere.material.map = null;
			}

			this.sphere.visible = true;
			this.sphere.material.map = image360.texture;
			this.sphere.material.needsUpdate = true;

			{ // orientation
				let {course, pitch, roll} = image360;

				// if no rotation data, set the camera course(yaw) to the center of the image
				// 5 x camera; 360 / 5 = 72; 72 / 2 = 36 => 180 + 36
				if (course === 0 && pitch === 0 && roll === 0) {
					course = -(180 + 36);
				}

				this.sphere.rotation.set(
					THREE.Math.degToRad(+roll + 90),
					THREE.Math.degToRad(+pitch),
					THREE.Math.degToRad(-course + 90),
					"ZYX"
				);
			}

			this.sphere.position.set(...image360.position);

			let target = new THREE.Vector3(...image360.position);

			let dir;

			// calculate direction
			if (this.nextPreviousDirection) {
				dir = this.nextPreviousDirection.clone().normalize();
			} else {
				// camera source is image position, optional target is target for camera
				if (image360.target) {
					// if the target has no z coordinate, take it from image position
					const { x, y, z = image360.position[2] } = image360.target;
					// get additional target and viewer settings
					const { panoramaTargetOffsetZ = 0, panoramaTargetZoomIn = false } = image360.targetSettings || {};

					// const optionalTarget = new THREE.Vector3(x, y, z + panoramaTargetOffsetZ);
					const optionalTarget = new THREE.Vector3(x, y, z);
					dir = optionalTarget.clone().sub(target).normalize();

					// set point cloud opacity
                    this.viewer.setEDLOpacity(0);

                    if (panoramaTargetZoomIn && this.viewer.getFOV() > 20) {
						this.viewer.setFOV(20);
					}
				} else {
					const cameraPosition = this.viewer.scene.view.position.clone();
					const cameraTarget = this.viewer.scene.view.getPivot();

					if (!this.focusedImage) {
						cameraPosition.z = 0;
						cameraTarget.z = 0;
					}

					dir = cameraTarget.clone().sub(cameraPosition).normalize();
				}
			}

			let move = dir.multiplyScalar(0.000001);
			let newCamPos = target.clone().sub(move);

			viewer.scene.view.setView(
				newCamPos,
				target,
				animationTimeout
			);

			this.focusedImage = image360;

			this.elUnfocus.style.display = "";
			this.elNext.style.display = "";
			this.elPrev.style.display = "";

			viewer.scene.dispatchEvent({
				type: '360_image_focus',
				scene: viewer.scene,
				image: this.focusedImage,
			});
		});
	}

	unfocus(){
		this.removeEventListener('mousewheel', this.zoomOn);
		document.removeEventListener("keydown", this.keyDown);

		this.selectingEnabled = true;

		let image = this.focusedImage;

		if(image === null){
			return;
		}

		if (image.texture && image.texture) {
			image.texture.dispose();
			image.texture = null;
		}

		this.sphere.material.map = null;
		this.sphere.material.needsUpdate = true;
		this.sphere.visible = false;

		viewer.orbitControls.direction = 1;
		viewer.orbitControls.doubleClockZoomEnabled = true;
		viewer.setControls(previousView.controls);

		/* leave camera as it is
		viewer.scene.view.setView(
			previousView.position,
			previousView.target,
			animationTimeout
		);
		*/

		viewer.scene.dispatchEvent({
			type: '360_image_unfocus',
			scene: viewer.scene,
			image: this.focusedImage,
		});

		this.focusedImage = null;

		for (let image of this.images) {
			image.mesh.visible = this.visible;
		}

		this.elUnfocus.style.display = "none";
		this.elNext.style.display = "none";
		this.elPrev.style.display = "none";

		// restore old fov
		this.viewer.setFOV(this.oldFov);
		this.oldFov = 0;

		// restore old speed
		this.viewer.setMoveSpeed(this.oldSpeed);
		this.oldSpeed = 0;

		// restore old opacity
		this.viewer.setEDLOpacity(this.oldEdlOpacity);
		this.oldEdlOpacity = 0;
	}

	async focusNearestImage(forward) {
		if (this.loading) {
			return;
		}

		this.loading = true;

		const nearestImage = this.getNearestImage(forward);

		if (nearestImage) {
			try {
				await this.focus(nearestImage);
            } catch (e) {}
		}

		this.loading = false;
	}

	distance(point1, point2) {
		return Math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2);
	}

	getNearestImage(forward) {
		const position = this.viewer.scene.view.position.clone();
		const target = this.viewer.scene.view.getPivot();

		let dir = target.clone().sub(position).normalize();
		this.nextPreviousDirection = dir.clone();

		if (!forward) {
			dir.x = -dir.x;
			dir.y = -dir.y;
		}

		let minDistance = -1;
		let minImage;

		for(let image of this.images){
			const imagePosition =  new THREE.Vector3(...image.position);
			let imageDirection = imagePosition.clone().sub(position).normalize();

			const direction = this.getFrontBackDirection(dir, imageDirection);
			const distance = this.distance(image.position, [position.x, position.y]);

			if ((distance > 0.01) && (minDistance === -1 || distance < minDistance) && direction > 0) {
				minDistance = distance;
				minImage = image;
			}
		}

		return minImage;
	}

	getFrontBackDirection(vec1, vec2) {
		const {x: x1, y: y1} = vec1;
		const {x: x2, y: y2} = vec2;

		const ax = x2;
		const ay = y2;
		const bx = x1;
		const by = y1;

		const dotProduct = ax * bx + ay * by;

		// - obtuse angle (topi kot), + acute angle (ostri kot)
		return Math.sign(dotProduct);
	}

	exit(forward) {
		this.nextPreviousDirection = null;

		this.unfocus();
	}

	load(image360){
		return new Promise((resolve, reject) => {
				if (image360.texture) {
					resolve(true);
				} else {
					const loader = new THREE.TextureLoader();

					const onLoad = texture => {
						texture.wrapS = THREE.RepeatWrapping;
						texture.repeat.x = -1;
						image360.texture = texture;
						resolve(true);
					};

					const onError = error => {
						// Create a canvas to draw text "No Image"
						const canvas = document.createElement('canvas');
						canvas.width = 256;  // Size of the canvas
						canvas.height = 256;
						const context = canvas.getContext('2d');

						// Fill background if needed
						context.fillStyle = '#000';  // Background color
						context.fillRect(0, 0, canvas.width, canvas.height);

						const fallbackTexture = new THREE.CanvasTexture(canvas);
						image360.texture = fallbackTexture;

						resolve(true);  // resolve with the fallback texture
					};

					loader.load(image360.file, onLoad, undefined, onError);
				}
			});
	}

	handleHovering(){
		let mouse = viewer.inputHandler.mouse;
		let camera = viewer.scene.getActiveCamera();
		let domElement = viewer.renderer.domElement;

		let ray = Potree.Utils.mouseToRay(mouse, camera, domElement.clientWidth, domElement.clientHeight);

		raycaster.ray.copy(ray);
		let intersections = raycaster.intersectObjects(this.node.children);

		if(intersections.length === 0){
			return;
		}

		let intersection = intersections[0];
		currentlyHovered = intersection.object;
		currentlyHovered.material = smHovered;
	}

	update(){
		let {viewer} = this;

		if(currentlyHovered){
			currentlyHovered.material = sm;
			currentlyHovered = null;
		}

		if(this.selectingEnabled){
			this.handleHovering();
		}

	}

};


export class Images360Loader{

	static async load(url, viewer, params = {}){
		if(!params.transform){
			params.transform = {
				forward: a => a,
			};
		}

		let response = await fetch(`${url}/coordinates.txt`);
		let text = await response.text();

		let lines = text.split(/\r?\n/);
		let coordinateLines = lines.slice(1);

		let images360 = new Images360(viewer);

		for(let line of coordinateLines){

			if(line.trim().length === 0){
				continue;
			}

			let tokens = line.split(/\t/);

			let [filename, time, long, lat, alt, course, pitch, roll] = tokens;
			time = parseFloat(time);
			long = parseFloat(long);
			lat = parseFloat(lat);
			alt = parseFloat(alt);
			course = parseFloat(course);
			pitch = parseFloat(pitch);
			roll = parseFloat(roll);

			filename = filename.replace(/"/g, "");
			let file = `${url}/${filename}`;

			let image360 = new Image360(file, time, long, lat, alt, course, pitch, roll);

			let xy = params.transform.forward([long, lat]);
			let position = [...xy, alt];
			image360.position = position;

			images360.images.push(image360);
		}

		Images360Loader.createSceneNodes(images360, params.transform);

		return images360;

	}

	static createSceneNodes(images360, transform){
		for(let image360 of images360.images){
			let {longitude, latitude, altitude} = image360;
			let xy = transform.forward([longitude, latitude]);

			let mesh = new THREE.Mesh(sg, sm);
			mesh.position.set(...xy, altitude);
			mesh.scale.set(1, 1, 1);
			mesh.material.transparent = true;
			mesh.material.opacity = 0.75;
			mesh.image360 = image360;

			{ // orientation
				var {course, pitch, roll} = image360;
				mesh.rotation.set(
					THREE.Math.degToRad(+roll + 90),
					THREE.Math.degToRad(+pitch),
					THREE.Math.degToRad(-course + 90),
					"ZYX"
				);
			}

			images360.node.add(mesh);

			image360.mesh = mesh;
			image360.mesh.visible = viewer.orbitControls.doubleClockZoomEnabled && images360.visible;
		}
	}
};
