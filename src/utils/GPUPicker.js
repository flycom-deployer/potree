/**
 * Fast GPU picker that handles dynamic scenes and objects for Three.JS
 *
 * @author bzztbomb https://github.com/bzztbomb
 * @author jfaust https://github.com/jfaust
 */
import * as THREE from "../../libs/three.js/build/three.module.js";

var GPUPicker = function (renderer, scene, camera) {
    // This is the 1x1 pixel render target we use to do the picking
    var pickingTarget = new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        encoding: THREE.LinearEncoding
    });
    // We need to be inside of .render in order to call renderBufferDirect in renderList() so create an empty scene
    // and use the onAfterRender callback to actually render geometry for picking.
    var emptyScene = new THREE.Scene();
    emptyScene.onAfterRender = renderList;
    // RGBA is 4 channels.
    var pixelBuffer = new Uint8Array(4 * pickingTarget.width * pickingTarget.height);
    var clearColor = new THREE.Color(0xffffff);
    var materialCache = [];
    var shouldPickObjectCB = undefined;

    var currClearColor = new THREE.Color();

    this.pick = function (x, y, shouldPickObject) {
        shouldPickObjectCB = shouldPickObject;
        var w = renderer.domElement.width;
        var h = renderer.domElement.height;
        // Set the projection matrix to only look at the pixel we are interested in.
        camera.setViewOffset(w, h, x, y, 1, 1);

        var currRenderTarget = renderer.getRenderTarget();
        var currAlpha = renderer.getClearAlpha();
        renderer.getClearColor(currClearColor);
        renderer.setRenderTarget(pickingTarget);
        renderer.setClearColor(clearColor);
        renderer.clear();
        renderer.render(emptyScene, camera);
        renderer.readRenderTargetPixels(pickingTarget, 0, 0, pickingTarget.width, pickingTarget.height, pixelBuffer);
        renderer.setRenderTarget(currRenderTarget);
        renderer.setClearColor(currClearColor, currAlpha);
        camera.clearViewOffset();

        var val = (pixelBuffer[0] << 24) + (pixelBuffer[1] << 16) + (pixelBuffer[2] << 8) + pixelBuffer[3];
        return val;
    }

    this.raycastPick = function (rayOrigin, rayDirection, viewer, shouldPickObject) {
        shouldPickObjectCB = shouldPickObject;

        // Step 1: Create an offscreen camera that mimics the main camera
        var offscreenCamera = new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near, camera.far);
        offscreenCamera.position.copy(rayOrigin);  // Set the camera's position to the ray's origin

        // Step 2: Adjust the offscreen camera to point along the ray's direction
        // Instead of using lookAt, calculate the correct direction vector
        var targetPoint = rayOrigin.clone().add(rayDirection);  // Calculate the target point in the world
        offscreenCamera.lookAt(targetPoint);  // Point the camera towards this direction

        // Step 3: Set up the picking render target (1x1 pixel)
        var pickingTarget = new THREE.WebGLRenderTarget(1, 1, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            encoding: THREE.LinearEncoding
        });

        var pixelBuffer = new Uint8Array(4);  // Buffer to store the pixel data

        // Step 4: Render the scene for picking with the offscreen camera
        renderer.setRenderTarget(pickingTarget);
        renderer.setClearColor(0xffffff);
        renderer.clear();

        // Step 5: Traverse the scene and replace materials with picking materials
        scene.traverse(function (object) {
            if (object.isMesh) {
                // Save the original material
                object.userData.originalMaterial = object.material;

                // Create a special picking material that encodes the object ID
                object.material = new THREE.ShaderMaterial({
                    vertexShader: THREE.ShaderChunk.meshbasic_vert,
                    fragmentShader: `
                        uniform vec4 objectId;
                        void main() {
                            gl_FragColor = objectId;
                        }
                    `,
                    uniforms: {
                        objectId: {
                            value: [
                                (object.id >> 24 & 255) / 255,
                                (object.id >> 16 & 255) / 255,
                                (object.id >> 8 & 255) / 255,
                                (object.id & 255) / 255
                            ]
                        }
                    }
                });
            }
        });

        renderer.render(scene, offscreenCamera);  // Render the scene with the offscreen camera

        // Step 5: Read the pixel from the picking render target
        renderer.readRenderTargetPixels(pickingTarget, 0, 0, 1, 1, pixelBuffer);
        renderer.setRenderTarget(null);  // Reset the render target

        // Step 6: Convert pixelBuffer to object ID
        var val = (pixelBuffer[0] << 24) | (pixelBuffer[1] << 16) | (pixelBuffer[2] << 8) | pixelBuffer[3];
        if (val === 0xffffffff) {
            return -1;  // No object was picked, return -1
        }

        return val;  // Return the object ID
    };

    function renderList() {
        // This is the magic, these render lists are still filled with valid data.  So we can
        // submit them again for picking and save lots of work!
        var renderList = renderer.renderLists.get(scene, camera);
        renderList.opaque.forEach(processItem);
        // renderList.transmissive.forEach(processItem);
        renderList.transparent.forEach(processItem);
    }

    function processItem(renderItem) {
        var object = renderItem.object;
        if (shouldPickObjectCB && !shouldPickObjectCB(object)) {
            return;
        }
        var objId = object.id;
        var material = renderItem.material;
        var geometry = renderItem.geometry;

        var useMorphing = 0;

        if (material.morphTargets === true) {
            if (geometry.isBufferGeometry === true) {
                useMorphing =
                    geometry.morphAttributes && geometry.morphAttributes.position && geometry.morphAttributes.position.length > 0
                        ? 1
                        : 0;
            } else if (geometry.isGeometry === true) {
                useMorphing = geometry.morphTargets && geometry.morphTargets.length > 0 ? 1 : 0;
            }
        }

        var useSkinning = object.isSkinnedMesh ? 1 : 0;
        var useInstancing = object.isInstancedMesh === true ? 1 : 0;
        var frontSide = material.side === THREE.FrontSide ? 1 : 0;
        var backSide = material.side === THREE.BackSide ? 1 : 0;
        var doubleSide = material.side === THREE.DoubleSide ? 1 : 0;
        var sprite = material.type === 'SpriteMaterial' ? 1 : 0;
        var sizeAttenuation = material.sizeAttenuation ? 1 : 0;
        var index =
            (useMorphing << 0) |
            (useSkinning << 1) |
            (useInstancing << 2) |
            (frontSide << 3) |
            (backSide << 4) |
            (doubleSide << 5) |
            (sprite << 6) |
            (sizeAttenuation << 7);
        var renderMaterial = renderItem.object.pickingMaterial ? renderItem.object.pickingMaterial : materialCache[index];
        if (!renderMaterial) {
            let vertexShader = THREE.ShaderChunk.meshbasic_vert;
            if (sprite) {
                vertexShader = THREE.ShaderChunk.sprite_vert;
                if (sizeAttenuation) vertexShader = '#define USE_SIZEATTENUATION\n\n' + vertexShader;
            }
            renderMaterial = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: `
                    uniform vec4 objectId;
                    void main() {
                        gl_FragColor = objectId;
                    }
                `,
                side: material.side,
            });
            renderMaterial.skinning = useSkinning > 0,
                renderMaterial.morphTargets = useMorphing > 0,
                renderMaterial.uniforms = {
                    objectId: {value: [1.0, 1.0, 1.0, 1.0]},
                };
            materialCache[index] = renderMaterial;
        }
        if (sprite) {
            renderMaterial.uniforms.rotation = {value: material.rotation}
            renderMaterial.uniforms.center = {value: object.center}
        }
        renderMaterial.uniforms.objectId.value = [
            (objId >> 24 & 255) / 255,
            (objId >> 16 & 255) / 255,
            (objId >> 8 & 255) / 255,
            (objId & 255) / 255,
        ];
        renderMaterial.uniformsNeedUpdate = true;
        renderer.renderBufferDirect(camera, null, geometry, renderMaterial, object, null);
    }
}

export {GPUPicker};
