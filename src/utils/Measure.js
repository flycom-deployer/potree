
import * as THREE from "../../libs/three.js/build/three.module.js";
import {TextSprite} from "../TextSprite.js";
import {Utils} from "../utils.js";
import {Line2} from "../../libs/three.js/lines/Line2.js";
import {LineGeometry} from "../../libs/three.js/lines/LineGeometry.js";
import {LineMaterial} from "../../libs/three.js/lines/LineMaterial.js";
import calculatePolygonSurfaceArea, {getPolygonTriangulation} from './PolygonAreaPoly2Tri';

function setHoverEvents(object) {
	object.addEventListener('mouseover', () => {
		object.material.opacity = 0.0;
	});
	object.addEventListener('mouseleave',  () => {
		object.material.opacity = 1.0;
	});
}

function createHeightLine(){
	let lineGeometry = new LineGeometry();

	lineGeometry.setPositions([
		0, 0, 0,
		0, 0, 0,
	]);

	let lineMaterial = new LineMaterial({
		color: 0x00ff00,
		dashSize: 5,
		gapSize: 2,
		linewidth: 2,
		resolution:  new THREE.Vector2(1000, 1000),
	});

	lineMaterial.depthTest = false;
	const heightEdge = new Line2(lineGeometry, lineMaterial);
	heightEdge.visible = false;

	//this.add(this.heightEdge);

	return heightEdge;
}

function createHeightLabel(){
	const heightLabel = new TextSprite('');

	heightLabel.setTextColor({r: 140, g: 250, b: 140, a: 1.0});
	heightLabel.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
	heightLabel.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
	heightLabel.fontsize = 16;
	heightLabel.material.depthTest = false;
	heightLabel.material.opacity = 1;
	heightLabel.visible = false;

	setHoverEvents(heightLabel.sprite);

	return heightLabel;
}

function createAreaLabel(){
	const areaLabel = new TextSprite('');

	areaLabel.setTextColor({r: 140, g: 250, b: 140, a: 1.0});
	areaLabel.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
	areaLabel.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
	areaLabel.fontsize = 16;
	areaLabel.material.depthTest = false;
	areaLabel.material.opacity = 1;
	areaLabel.visible = false;

	setHoverEvents(areaLabel.sprite);

	return areaLabel;
}

function createCircleRadiusLabel(){
	const circleRadiusLabel = new TextSprite("");

	circleRadiusLabel.setTextColor({r: 140, g: 250, b: 140, a: 1.0});
	circleRadiusLabel.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
	circleRadiusLabel.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
	circleRadiusLabel.fontsize = 16;
	circleRadiusLabel.material.depthTest = false;
	circleRadiusLabel.material.opacity = 1;
	circleRadiusLabel.visible = false;

	setHoverEvents(circleRadiusLabel.sprite);

	return circleRadiusLabel;
}

function createCircleRadiusLine(){
	const lineGeometry = new LineGeometry();

	lineGeometry.setPositions([
		0, 0, 0,
		0, 0, 0,
	]);

	const lineMaterial = new LineMaterial({
		color: 0xff0000,
		linewidth: 2,
		resolution:  new THREE.Vector2(1000, 1000),
		gapSize: 1,
		dashed: true,
	});

	lineMaterial.depthTest = false;

	const circleRadiusLine = new Line2(lineGeometry, lineMaterial);
	circleRadiusLine.visible = false;

	return circleRadiusLine;
}

function createCircleLine(){
	const coordinates = [];

	let n = 128;
	for(let i = 0; i <= n; i++){
		let u0 = 2 * Math.PI * (i / n);
		let u1 = 2 * Math.PI * (i + 1) / n;

		let p0 = new THREE.Vector3(
			Math.cos(u0),
			Math.sin(u0),
			0
		);

		let p1 = new THREE.Vector3(
			Math.cos(u1),
			Math.sin(u1),
			0
		);

		coordinates.push(
			...p0.toArray(),
			...p1.toArray(),
		);
	}

	const geometry = new LineGeometry();
	geometry.setPositions(coordinates);

	const material = new LineMaterial({
		color: 0xff0000,
		dashSize: 5,
		gapSize: 2,
		linewidth: 2,
		resolution:  new THREE.Vector2(1000, 1000),
	});

	material.depthTest = false;

	const circleLine = new Line2(geometry, material);
	circleLine.visible = false;
	circleLine.computeLineDistances();

	return circleLine;
}

function createCircleCenter(){
	const sg = new THREE.SphereGeometry(1, 32, 32);
	const sm = new THREE.MeshNormalMaterial();

	const circleCenter = new THREE.Mesh(sg, sm);
	circleCenter.visible = false;

	return circleCenter;
}

function createLine(){
	const geometry = new LineGeometry();

	geometry.setPositions([
		0, 0, 0,
		0, 0, 0,
	]);

	const material = new LineMaterial({
		color: 0xff0000,
		linewidth: 2,
		resolution:  new THREE.Vector2(1000, 1000),
		gapSize: 1,
		dashed: true,
	});

	material.depthTest = false;

	const line = new Line2(geometry, material);

	return line;
}

function createCircle(){

	const coordinates = [];

	let n = 128;
	for(let i = 0; i <= n; i++){
		let u0 = 2 * Math.PI * (i / n);
		let u1 = 2 * Math.PI * (i + 1) / n;

		let p0 = new THREE.Vector3(
			Math.cos(u0),
			Math.sin(u0),
			0
		);

		let p1 = new THREE.Vector3(
			Math.cos(u1),
			Math.sin(u1),
			0
		);

		coordinates.push(
			...p0.toArray(),
			...p1.toArray(),
		);
	}

	const geometry = new LineGeometry();
	geometry.setPositions(coordinates);

	const material = new LineMaterial({
		color: 0xff0000,
		dashSize: 5,
		gapSize: 2,
		linewidth: 2,
		resolution:  new THREE.Vector2(1000, 1000),
	});

	material.depthTest = false;

	const line = new Line2(geometry, material);
	line.computeLineDistances();

	return line;

}

function createAzimuth(){

	const azimuth = {
		label: null,
		center: null,
		target: null,
		north: null,
		centerToNorth: null,
		centerToTarget: null,
		centerToTargetground: null,
		targetgroundToTarget: null,
		circle: null,

		node: null,
	};

	const sg = new THREE.SphereGeometry(1, 32, 32);
	const sm = new THREE.MeshNormalMaterial();

	{
		const label = new TextSprite("");

		label.setTextColor({r: 140, g: 250, b: 140, a: 1.0});
		label.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
		label.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
		label.fontsize = 16;
		label.material.depthTest = false;
		label.material.opacity = 1;

		setHoverEvents(label.sprite);

		azimuth.label = label;
	}

	azimuth.center = new THREE.Mesh(sg, sm);
	azimuth.target = new THREE.Mesh(sg, sm);
	azimuth.north = new THREE.Mesh(sg, sm);
	azimuth.centerToNorth = createLine();
	azimuth.centerToTarget = createLine();
	azimuth.centerToTargetground = createLine();
	azimuth.targetgroundToTarget = createLine();
	azimuth.circle = createCircle();

	azimuth.node = new THREE.Object3D();
	azimuth.node.add(
		azimuth.centerToNorth,
		azimuth.centerToTarget,
		azimuth.centerToTargetground,
		azimuth.targetgroundToTarget,
		azimuth.circle,
		azimuth.label,
		azimuth.center,
		azimuth.target,
		azimuth.north,
	);

	return azimuth;
}

function createMultiMaterialObject( geometry, materials ) {
	const group = new THREE.Group();

	for ( let i = 0, l = materials.length; i < l; i ++ ) {
		group.add( new THREE.Mesh( geometry, materials[ i ] ) );
	}

	return group;
}

let triangulationMesh = undefined;

export class Measure extends THREE.Object3D {
	constructor () {
		super();

		this.constructor.counter = (this.constructor.counter === undefined) ? 0 : this.constructor.counter + 1;

		this.name = 'Measure_' + this.constructor.counter;
		this.clip = false;
		this.points = [];
		this._showDistances = true;
		this._showCoordinates = false;
		this._showArea = false;
		this._closed = true;
		this._showAngles = false;
		this._showCircle = false;
		this._showHeight = false;
		this._showEdges = true;
		this._showAzimuth = false;
		this.maxMarkers = Number.MAX_SAFE_INTEGER;
		this.selector = false;

		this.sphereGeometry = new THREE.SphereGeometry(0.4, 10, 10);
		this.touchSphereGeometry = new THREE.SphereGeometry(1, 10, 10);
		this.color = new THREE.Color(0xff0000);
		this.selectedColor = new THREE.Color(0xff7800);

		this.spheres = [];
		this.edges = [];
		this.sphereLabels = [];
		this.edgeLabels = [];
		this.angleLabels = [];
		this.coordinateLabels = [];

		this.heightEdge = createHeightLine();
		this.heightLabel = createHeightLabel();
		this.areaLabel = createAreaLabel();
		this.circleRadiusLabel = createCircleRadiusLabel();
		this.circleRadiusLine = createCircleRadiusLine();
		this.circleLine = createCircleLine();
		this.circleCenter = createCircleCenter();

		this.azimuth = createAzimuth();

		this.add(this.heightEdge);
		this.add(this.heightLabel);
		this.add(this.areaLabel);
		this.add(this.circleRadiusLabel);
		this.add(this.circleRadiusLine);
		this.add(this.circleLine);
		this.add(this.circleCenter);

		this.add(this.azimuth.node);

		this.adding = false;
		this.updating = false;
		this.canUpdate = false;
	}

	drawTriangles(triangles) {
		if (triangulationMesh) {
			this.remove(triangulationMesh);
		}

		const vertices = [];

		triangles.forEach(triangle => {
			triangle.forEach(vertex => {
				vertices.push(vertex[0], vertex[1], vertex[2]); // x, y, z
			});
		});

		const geometry = new THREE.BufferGeometry();
		const verticesArray = new Float32Array(vertices);

		geometry.setAttribute('position', new THREE.BufferAttribute(verticesArray, 3));

		const meshMaterial = new THREE.MeshBasicMaterial({
			color: 0xffff00,
			side: THREE.DoubleSide,
			wireframe: false,
			transparent: true,
			opacity: 0.25,
		});

		const wireFrameMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			side: THREE.DoubleSide,
			wireframe: true,
		});

		triangulationMesh = createMultiMaterialObject(geometry, [meshMaterial, wireFrameMaterial]);

		this.add(triangulationMesh);
	}

	createSphereMaterial () {
		let sphereMaterial = new THREE.MeshLambertMaterial({
			//shading: THREE.SmoothShading,
			color: this.color,
			depthTest: false,
			depthWrite: false}
		);

		return sphereMaterial;
	};

	finish() {
		let name = this.name;

		if (this.selector) {
			name = 'Selector';
		} else if (this.updating ) {
			name = 'Select';
		}

		this.adding = false;

		setTimeout(() => {
			viewer.isMeasuring = false;

			viewer.dispatchEvent({
				type: 'measurement_finished',
				name,
			});

			viewer.inputHandler.canDoubleClick = true;
		}, 0);
	}

	addMarker (point) {
		if (point.x != null) {
			point = {position: point};
		}else if(point instanceof Array){
			point = {position: new THREE.Vector3(...point)};
		}
		this.points.push(point);

		// sphere
/*
		let sphere = new THREE.Mesh(this.sphereGeometry, this.createSphereMaterial());

		this.add(sphere);
		this.spheres.push(sphere);
*/

		let markerSphere = new THREE.Mesh(this.sphereGeometry, this.createSphereMaterial());

		const touchSphereGeometry = this.touchSphereGeometry;
		const touchSphereMaterial = new THREE.MeshBasicMaterial({
		  color: 0xffff00,
		  transparent: true,
		  opacity: 0.0 // Completely transparent
		});
		let sphere = new THREE.Mesh(touchSphereGeometry, touchSphereMaterial);

		sphere.add(markerSphere);
		this.dragObject = sphere;

		this.add(sphere);
		this.spheres.push(sphere);

		{ // edges
			let lineGeometry = new LineGeometry();
			lineGeometry.setPositions( [
					0, 0, 0,
					0, 0, 0,
			]);

			let lineMaterial = new LineMaterial({
				color: 0xff0000,
				linewidth: 2,
				resolution:  new THREE.Vector2(1000, 1000),
			});

			lineMaterial.depthTest = false;

			let edge = new Line2(lineGeometry, lineMaterial);
			edge.visible = true;

			this.add(edge);
			this.edges.push(edge);
		}

		{ // edge labels
			let edgeLabel = new TextSprite();
			edgeLabel.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
			edgeLabel.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
			edgeLabel.material.depthTest = false;
			edgeLabel.visible = false;
			edgeLabel.fontsize = 16;
			this.edgeLabels.push(edgeLabel);
			this.add(edgeLabel);

			setHoverEvents(edgeLabel.sprite);
		}

		{ // angle labels
			let angleLabel = new TextSprite();
			angleLabel.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
			angleLabel.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
			angleLabel.fontsize = 16;
			angleLabel.material.depthTest = false;
			angleLabel.material.opacity = 1;
			angleLabel.visible = false;

			setHoverEvents(angleLabel.sprite);

			this.angleLabels.push(angleLabel);
			this.add(angleLabel);
		}

		{ // coordinate labels
			let coordinateLabel = new TextSprite();
			coordinateLabel.setBorderColor({r: 0, g: 0, b: 0, a: 1.0});
			coordinateLabel.setBackgroundColor({r: 0, g: 0, b: 0, a: 1.0});
			coordinateLabel.fontsize = 16;
			coordinateLabel.material.depthTest = false;
			coordinateLabel.material.opacity = 1;
			coordinateLabel.visible = false;
			this.coordinateLabels.push(coordinateLabel);
			this.add(coordinateLabel);

			setHoverEvents(coordinateLabel.sprite);
		}

		{ // Event Listeners
			let drag = (e) => {
				let I = Utils.getMouseIntersection(
					e.drag.end,
					e.viewer.scene.getActiveCamera(),
					e.viewer,
					e.viewer.scene.pointclouds,
					{pickClipped: true});

				if (!this.adding) {
					this.updating = true;
				}

				this.dragObject = e.drag.object;

				if (I) {
					if (viewer.selectedUuid !== this.uuid) {
            			viewer.selectedUuid = this.uuid;
            			viewer.scene.measurements.forEach(measurement => { measurement.canUpdate = true;	});
        			}

					let i = this.spheres.indexOf(e.drag.object);
					if (i !== -1) {
						let point = this.points[i];

						if (!I.pointcloud) {
							point = {};
						} else {
							// loop through current keys and cleanup ones that will be orphaned
							for (let key of Object.keys(point)) {
								if (!I.point[key]) {
									delete point[key];
								}
							}

							for (let key of Object.keys(I.point).filter(e => e !== 'position')) {
								point[key] = I.point[key];
							}
						}

						this.setPosition(i, I.location);
					}
				}
			};

			let drop = e => {
				// check if point is intersection
				const {x, y, z} = this.points[this.points.length - 1].position.clone();

				if (!x && !y && !z) {
					setTimeout(() => {
						viewer.inputHandler.startDragging(this.spheres[this.spheres.length - 1]);
					}, 50);

					return;
				}

				if (!this.adding && !this.updating) {
					this.updating = true;
				}

				let i = this.spheres.indexOf(this.dragObject ?? e.drag?.object);

				this.dragObject = undefined;

				if (this.points.length >= this.maxMarkers) {
					this.finish();
				}

				if (i !== -1) {
					this.dispatchEvent({
						'type': 'marker_dropped',
						'measurement': this,
						'index': i
					});

				}

				if (!this.adding) {
					this.updating = false;
				}

				// this.triangulate();
			};

			let mouseover = (e) => e.object.children[0].material.emissive.setHex(0x888888);
			let mouseleave = (e) => e.object.children[0].material.emissive.setHex(0x000000);

			sphere.addEventListener('drag', drag);
			sphere.addEventListener('drop', drop);

			let domElement = viewer.renderer.domElement;
			domElement.addEventListener('touchend', drop);

			sphere.addEventListener('mouseover', mouseover);
			sphere.addEventListener('mouseleave', mouseleave);
		}

		let event = {
			type: 'marker_added',
			measurement: this,
			sphere: sphere
		};
		this.dispatchEvent(event);

		this.setMarker(this.points.length - 1, point);
	};

	triangulate() {
		if (this.showArea && this.points.length >= 3) {
			const _vertices = this.points.map(point => [
				point.position.x,
				point.position.y,
				point.position.z
			]);

			const vertices = [];

			// remove duplicates
			_vertices.forEach(vertex => {
				if (!vertices.some(v => v[0] === vertex[0] && v[1] === vertex[1] && v[2] === vertex[2])) {
					vertices.push(vertex);
				}
			});

			const triangles = getPolygonTriangulation(vertices);

			if (triangles) {
				this.drawTriangles(triangles);
			}
		}
	}

	getArea3D() {
		if (!(this.showArea && this.points.length >= 3)) {
			return 0;
		}

		const vertices = this.points.map(point => [
			point.position.x,
			point.position.y,
			point.position.z
		]);

		return calculatePolygonSurfaceArea(vertices);
	}

	removeMarker (index) {
		this.points.splice(index, 1);

		this.remove(this.spheres[index]);

		let edgeIndex = (index === 0) ? 0 : (index - 1);
		this.remove(this.edges[edgeIndex]);
		this.edges.splice(edgeIndex, 1);

		this.remove(this.edgeLabels[edgeIndex]);
		this.edgeLabels.splice(edgeIndex, 1);
		this.coordinateLabels.splice(index, 1);

		this.remove(this.angleLabels[index]);
		this.angleLabels.splice(index, 1);

		this.spheres.splice(index, 1);

		this.update();

		this.dispatchEvent({type: 'marker_removed', measurement: this});
	};

	setMarker (index, point) {
		this.points[index] = point;

		let event = {
			type: 'marker_moved',
			measure:	this,
			index:	index,
			position: point.position.clone()
		};
		this.dispatchEvent(event);

		this.update();
	}

	setPosition (index, position) {
		let point = this.points[index];
		point.position.copy(position);

		let event = {
			type: 'marker_moved',
			measure:	this,
			index:	index,
			position: position.clone()
		};
		this.dispatchEvent(event);

		this.update();
	};

	getArea () {
		let area = 0;
		let j = this.points.length - 1;

		for (let i = 0; i < this.points.length; i++) {
			let p1 = this.points[i].position;
			let p2 = this.points[j].position;
			area += (p2.x + p1.x) * (p1.y - p2.y);
			j = i;
		}

		return Math.abs(area / 2);
	};

	getTotalDistance () {
		if (this.points.length === 0) {
			return 0;
		}

		let distance = 0;

		for (let i = 1; i < this.points.length; i++) {
			let prev = this.points[i - 1].position;
			let curr = this.points[i].position;
			let d = prev.distanceTo(curr);

			distance += d;
		}

		if (this.closed && this.points.length > 1) {
			let first = this.points[0].position;
			let last = this.points[this.points.length - 1].position;
			let d = last.distanceTo(first);

			distance += d;
		}

		return distance;
	}

	getAngleBetweenLines (cornerPoint, point1, point2) {
		let v1 = new THREE.Vector3().subVectors(point1.position, cornerPoint.position);
		let v2 = new THREE.Vector3().subVectors(point2.position, cornerPoint.position);

		// avoid the error printed by threejs if denominator is 0
		const denominator = Math.sqrt( v1.lengthSq() * v2.lengthSq() );
		if(denominator === 0){
			return 0;
		}else{
			return v1.angleTo(v2);
		}
	};

	getAngle (index) {
		if (this.points.length < 3 || index >= this.points.length) {
			return 0;
		}

		let previous = (index === 0) ? this.points[this.points.length - 1] : this.points[index - 1];
		let point = this.points[index];
		let next = this.points[(index + 1) % (this.points.length)];

		return this.getAngleBetweenLines(point, previous, next);
	}

	// updateAzimuth(){
	// 	// if(this.points.length !== 2){
	// 	// 	return;
	// 	// }

	// 	// const azimuth = this.azimuth;

	// 	// const [p0, p1] = this.points;

	// 	// const r = p0.position.distanceTo(p1.position);

	// }

	update () {
		 if (!this.adding && !this.updating && !this.canUpdate) {
			return;
		} else {
			this.canUpdate = true;
		}

		if (this.points.length === 0) {
			return;
		} else if (this.points.length === 1) {
			let point = this.points[0];
			let position = point.position;
			this.spheres[0].position.copy(position);

			const childSphere = this.spheres?.[0]?.children?.[0];

			if (childSphere) {
				childSphere.material.color = viewer?.selectedUuid === this?.uuid ? this.selectedColor : this.color;
			}

			{ // coordinate labels
				let coordinateLabel = this.coordinateLabels[0];

				let msg = position.toArray().map(p => Utils.addCommas2(p.toFixed(2))).join(" / ");
				coordinateLabel.setText(msg);

				// coordinateLabel.visible = this.showCoordinates;
				// ADDED: check point visibility in camera frustum
				const camera = viewer.scene.getActiveCamera();
				const frustum = new THREE.Frustum()
				const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
				frustum.setFromProjectionMatrix(matrix)
				coordinateLabel.visible = this.showCoordinates && frustum.containsPoint(position);
			}

			return;
		}

		let lastIndex = this.points.length - 1;

		let centroid = new THREE.Vector3();
		for (let i = 0; i <= lastIndex; i++) {
			let point = this.points[i];
			centroid.add(point.position);
		}
		centroid.divideScalar(this.points.length);

		for (let i = 0; i <= lastIndex; i++) {
			let index = i;
			let nextIndex = (i + 1 > lastIndex) ? 0 : i + 1;
			let previousIndex = (i === 0) ? lastIndex : i - 1;

			let point = this.points[index];
			let nextPoint = this.points[nextIndex];
			let previousPoint = this.points[previousIndex];

			let sphere = this.spheres[index];

			// spheres
			sphere.position.copy(point.position);
			sphere.material.color = this.color;
			const childSphere = sphere.children?.[0];

			if (childSphere) {
				childSphere.material.color = viewer?.selectedUuid === this?.uuid ? this.selectedColor : this.color;
			}

			{ // edges
				let edge = this.edges[index];

				edge.material.color = viewer?.selectedUuid === this?.uuid ? this.selectedColor : this.color;

				edge.position.copy(point.position);

				edge.geometry.setPositions([
					0, 0, 0,
					...nextPoint.position.clone().sub(point.position).toArray(),
				]);

				edge.geometry.verticesNeedUpdate = true;
				edge.geometry.computeBoundingSphere();
				edge.computeLineDistances();
				edge.visible = index < lastIndex || this.closed;

				if(!this.showEdges){
					edge.visible = false;
				}
			}

			{ // edge labels
				let edgeLabel = this.edgeLabels[i];

				let center = new THREE.Vector3().add(point.position);
				center.add(nextPoint.position);
				center = center.multiplyScalar(0.5);
				let distance = point.position.distanceTo(nextPoint.position);

				edgeLabel.position.copy(center);

				let suffix = "";
				if(this.lengthUnit != null && this.lengthUnitDisplay != null){
					distance = distance / this.lengthUnit.unitspermeter * this.lengthUnitDisplay.unitspermeter;  //convert to meters then to the display unit
					suffix = this.lengthUnitDisplay.code;
				}

				let txtLength = Utils.addCommas2(distance.toFixed(2));
				edgeLabel.setText(`${txtLength} ${suffix}`);

				edgeLabel.visible = !this.clip && this.showDistances && (index < lastIndex || this.closed) && this.points.length >= 2 && distance > 0;
			}

			{ // angle labels
				let angleLabel = this.angleLabels[i];
				let angle = this.getAngleBetweenLines(point, previousPoint, nextPoint);

				let dir = nextPoint.position.clone().sub(previousPoint.position);
				dir.multiplyScalar(0.5);
				dir = previousPoint.position.clone().add(dir).sub(point.position).normalize();

				let dist = Math.min(point.position.distanceTo(previousPoint.position), point.position.distanceTo(nextPoint.position));
				dist = dist / 9;

				let labelPos = point.position.clone().add(dir.multiplyScalar(dist));
				angleLabel.position.copy(labelPos);

				let msg = Utils.addCommas2((angle * (180.0 / Math.PI)).toFixed(1)) + '\u00B0';
				angleLabel.setText(msg);

				angleLabel.visible = this.showAngles && (index < lastIndex || this.closed) && this.points.length >= 3 && angle > 0;
			}
		}

		{ // update height stuff
			let heightEdge = this.heightEdge;
			heightEdge.visible = this.showHeight;
			this.heightLabel.visible = this.showHeight;

			if (this.showHeight) {
				let sorted = this.points.slice().sort((a, b) => a.position.z - b.position.z);
				let lowPoint = sorted[0].position.clone();
				let highPoint = sorted[sorted.length - 1].position.clone();
				let min = lowPoint.z;
				let max = highPoint.z;
				let height = max - min;

				let start = new THREE.Vector3(highPoint.x, highPoint.y, min);
				let end = new THREE.Vector3(highPoint.x, highPoint.y, max);

				heightEdge.position.copy(lowPoint);

				heightEdge.geometry.setPositions([
					0, 0, 0,
					...start.clone().sub(lowPoint).toArray(),
					...start.clone().sub(lowPoint).toArray(),
					...end.clone().sub(lowPoint).toArray(),
				]);

				heightEdge.geometry.verticesNeedUpdate = true;
				// heightEdge.geometry.computeLineDistances();
				// heightEdge.geometry.lineDistancesNeedUpdate = true;
				heightEdge.geometry.computeBoundingSphere();
				heightEdge.computeLineDistances();

				// heightEdge.material.dashSize = height / 40;
				// heightEdge.material.gapSize = height / 40;

				let heightLabelPosition = start.clone().add(end).multiplyScalar(0.5);
				this.heightLabel.position.copy(heightLabelPosition);

				let suffix = "";
				if(this.lengthUnit != null && this.lengthUnitDisplay != null){
					height = height / this.lengthUnit.unitspermeter * this.lengthUnitDisplay.unitspermeter;  //convert to meters then to the display unit
					suffix = this.lengthUnitDisplay.code;
				}

				let txtHeight = Utils.addCommas2(height.toFixed(2));
				let msg = `${txtHeight} ${suffix}`;
				this.heightLabel.setText(msg);
			}
		}

		{ // update circle stuff
			const circleRadiusLabel = this.circleRadiusLabel;
			const circleRadiusLine = this.circleRadiusLine;
			const circleLine = this.circleLine;
			const circleCenter = this.circleCenter;

			const circleOkay = this.points.length === 3;

			circleRadiusLabel.visible = this.showCircle && circleOkay;
			circleRadiusLine.visible = this.showCircle && circleOkay;
			circleLine.visible = this.showCircle && circleOkay;
			circleCenter.visible = this.showCircle && circleOkay;

			if(this.showCircle && circleOkay){

				const A = this.points[0].position;
				const B = this.points[1].position;
				const C = this.points[2].position;
				const AB = B.clone().sub(A);
				const AC = C.clone().sub(A);
				const N = AC.clone().cross(AB).normalize();

				const center = Potree.Utils.computeCircleCenter(A, B, C);
				const radius = center.distanceTo(A);


				const scale = radius / 20;
				circleCenter.position.copy(center);
				circleCenter.scale.set(scale, scale, scale);

				//circleRadiusLine.geometry.vertices[0].set(0, 0, 0);
				//circleRadiusLine.geometry.vertices[1].copy(B.clone().sub(center));

				circleRadiusLine.geometry.setPositions( [
					0, 0, 0,
					...B.clone().sub(center).toArray()
				] );

				circleRadiusLine.geometry.verticesNeedUpdate = true;
				circleRadiusLine.geometry.computeBoundingSphere();
				circleRadiusLine.position.copy(center);
				circleRadiusLine.computeLineDistances();

				const target = center.clone().add(N);
				circleLine.position.copy(center);
				circleLine.scale.set(radius, radius, radius);
				circleLine.lookAt(target);

				circleRadiusLabel.visible = true;
				circleRadiusLabel.position.copy(center.clone().add(B).multiplyScalar(0.5));
				circleRadiusLabel.setText(`${radius.toFixed(3)}`);

			}
		}

		{ // update area label
			this.areaLabel.position.copy(centroid);
			this.areaLabel.visible = !this.clip && this.showArea && this.points.length >= 3;
			let area = this.getArea();
			let area3D = this.getArea3D();

			let suffix = "";
			if(this.lengthUnit != null && this.lengthUnitDisplay != null){
				area = area / Math.pow(this.lengthUnit.unitspermeter, 2) * Math.pow(this.lengthUnitDisplay.unitspermeter, 2);  //convert to square meters then to the square display unit
				suffix = this.lengthUnitDisplay.code;
			}

			//let txtArea = Utils.addCommas2(area.toFixed(1));
			//let txtArea3D = Utils.addCommas2(area3D.toFixed(1));
			this.userData = {
				...(this.userData || {}),
				area2d: area,
				area3d: area3D,
				suffix: `${suffix}\u00B2`,
			};

			const msgArea = area3D || area || 0;
			let txtArea = Utils.addCommas2(msgArea.toFixed(1));

			// let msg =  `${txtArea}/${txtArea3D} ${suffix}\u00B2`;
			let msg =  `${txtArea} ${suffix}\u00B2`;
			this.areaLabel.setText(msg);
		}

		if (!this.adding && !this.updating) {
			this.canUpdate = false;
			// this.triangulate();
		}

		// this.updateAzimuth();
	};

	raycast (raycaster, intersects) {
		for (let i = 0; i < this.points.length; i++) {
			let sphere = this.spheres[i];

			sphere.raycast(raycaster, intersects);
		}

		// recalculate distances because they are not necessarely correct
		// for scaled objects.
		// see https://github.com/mrdoob/three.js/issues/5827
		// TODO: remove this once the bug has been fixed
		for (let i = 0; i < intersects.length; i++) {
			let I = intersects[i];
			I.distance = raycaster.ray.origin.distanceTo(I.point);
		}
		intersects.sort(function (a, b) { return a.distance - b.distance; });
	};

	get showCoordinates () {
		return this._showCoordinates;
	}

	set showCoordinates (value) {
		this._showCoordinates = value;
		this.update();
	}

	get showAngles () {
		return this._showAngles;
	}

	set showAngles (value) {
		this._showAngles = value;
		this.update();
	}

	get showCircle () {
		return this._showCircle;
	}

	set showCircle (value) {
		this._showCircle = value;
		this.update();
	}

	get showAzimuth(){
		return this._showAzimuth;
	}

	set showAzimuth(value){
		this._showAzimuth = value;
		this.update();
	}

	get showEdges () {
		return this._showEdges;
	}

	set showEdges (value) {
		this._showEdges = value;
		this.update();
	}

	get showHeight () {
		return this._showHeight;
	}

	set showHeight (value) {
		this._showHeight = value;
		this.update();
	}

	get showArea () {
		return this._showArea;
	}

	set showArea (value) {
		this._showArea = value;
		this.update();
	}

	get closed () {
		return this._closed;
	}

	set closed (value) {
		this._closed = value;
		this.update();
	}

	get showDistances () {
		return this._showDistances;
	}

	set showDistances (value) {
		this._showDistances = value;
		this.update();
	}

}
