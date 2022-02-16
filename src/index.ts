import './style/main.css';
import * as GSAP from "gsap";
import * as EASE from "gsap/EasePack"
import * as THREE from 'three';
import { Geometry } from 'three';
// Get window dimension
var ww = document.documentElement.clientWidth || document.body.clientWidth;
var wh = window.innerHeight;

// Save half window dimension
var ww2 = ww * 0.5, wh2 = wh * 0.5;

// Constructor function
class Tunnel {

    speed: number;
    mouse: { position: THREE.Vector2; target: THREE.Vector2; };
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    curve: THREE.CatmullRomCurve3;
    splineMesh: THREE.Line;
    tubeMaterial: THREE.MeshBasicMaterial;
    tubeGeometry: THREE.TubeGeometry;
    tubeMesh: THREE.Mesh;
    tubeGeometry_o: any;
    textureParams: { offsetX: number; offsetY: number; repeatX: number; repeatY: number; };
    cameraShake: { x: number; y: number; };
    constructor() {
        // Init the scene and the
        this.init();
        // Create the shape of the tunnel
        this.createMesh();

        // Mouse events & window resize
        this.handleEvents();

        this.initAnimation();

        // Start loop animation
        window.requestAnimationFrame(this.render.bind(this));
    }
    
    init() {
        // Define the speed of the tunnel
        this.speed = 0.15;

        // Store the position of the mouse
        // Default is center of the screen
        this.mouse = {
            position: new THREE.Vector2(0, 0),
            target: new THREE.Vector2(0, 0)
        };

        // Create a WebGL renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: document.querySelector('canvas.webgl')
        });
        // Set size of the renderer and its background color
        this.renderer.setSize(ww, wh);
        this.renderer.setClearColor(0x222222);

        // Create a camera and move it along Z axis
        this.camera = new THREE.PerspectiveCamera(15, ww / wh, 0.01, 1000);
        this.camera.position.z = 0.35;

        // Create an empty scene and define a fog for it
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x222222, 0.6, 2.8);
    }
    createMesh() {
        // Empty array to store the points along the path
        var points = [];

        // Define points along Z axis to create a curve
        for (var i = 0; i < 5; i += 1) {
            points.push(new THREE.Vector3(0, 0, 2.5 * (i / 4)));
        }
        // Set custom Y position for the last point
        points[4].y = -0.06;

        // Create a curve based on the points
        this.curve = new THREE.CatmullRomCurve3(points);
        // Define the curve type
        // Empty geometry
        var geometry = new THREE.Geometry();
        // Create vertices based on the curve
        geometry.vertices = this.curve.getPoints(70);
        // Create a line from the points with a basic line material
        this.splineMesh = new THREE.Line(geometry, new THREE.LineBasicMaterial());

        // Create a material for the tunnel with a custom texture
        // Set side to BackSide since the camera is inside the tunnel
        this.tubeMaterial = new THREE.MeshBasicMaterial({
            side: THREE.BackSide,
            map: textures.galaxy.texture
        });

        // Add two lights in the scene
        // An hemisphere light, to add different light from sky and ground
        var light = new THREE.HemisphereLight(0xffffbb, 0x887979, 0.9);
        this.scene.add(light);
        // Add a directional light for the bump
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.scene.add(directionalLight);
        // Repeat the pattern
        this.tubeMaterial.map.wrapS = THREE.MirroredRepeatWrapping;
        this.tubeMaterial.map.wrapT = THREE.MirroredRepeatWrapping;
        // this.tubeMaterial.map.repeat.set(30, 6);
        // this.tubeMaterial.map.repeat.set(
        //     this.tubeMaterial.repx,
        //     this.tubeMaterial.repy
        // );

        // Create a tube geometry based on the curve
        this.tubeGeometry = new THREE.TubeGeometry(this.curve, 70, 0.02, 50, false);
        // Create a mesh based on the tube geometry and its material
        this.tubeMesh = new THREE.Mesh(this.tubeGeometry, this.tubeMaterial);
        // Push the tube into the scene
        this.scene.add(this.tubeMesh);

        // Clone the original tube geometry
        // Because we will modify the visible one but we need to keep track of the original position of the vertices
        this.tubeGeometry_o = this.tubeGeometry.clone();
    }
    handleEvents() {
        // When user resize window
        window.addEventListener("resize", this.onResize.bind(this), false);
        // When user move the mouse
        document.body.addEventListener(
            "mousemove",
            this.onMouseMove.bind(this),
            false
        );
    }
    onResize() {
        // On resize, get new width & height of window
        ww = document.documentElement.clientWidth || document.body.clientWidth;
        wh = window.innerHeight;
        ww2 = ww * 0.5;
        wh2 = wh * 0.5;

        // Update camera aspect
        this.camera.aspect = ww / wh;
        // Reset aspect of the camera
        this.camera.updateProjectionMatrix();
        // Update size of the canvas
        this.renderer.setSize(ww, wh);
    }
    onMouseMove(e: MouseEvent) {
        // Save mouse X & Y position
        this.mouse.target.x = (e.clientX - ww2) / ww2;
        this.mouse.target.y = (wh2 - e.clientY) / wh2;
    }
    initAnimation() {
        // Timeline animation
        this.textureParams = {
            offsetX: 0,
            offsetY: 0,
            repeatX: 10,
            repeatY: 4
        };
        this.cameraShake = {
            x: 0,
            y: 0
        };
        var hyperSpace = GSAP.gsap.timeline({ repeat: -1 });
        hyperSpace.to(this.textureParams, {
            duration: 4,
            repeatX: 0.3,
            ease: GSAP.Power1.easeInOut
        });
        hyperSpace.to(
            this.textureParams,
            {
                duration: 12,
                offsetX: 8,
                ease: GSAP.Power2.easeIn
            },
            0
        );
        hyperSpace.to(
            this.textureParams,
            {
                duration: 12,
                repeat: -1,
                offsetX: 8,
                ease: GSAP.Linear.easeInOut
            },
            0
        );
        var shake = GSAP.gsap.timeline({ repeat: -1, repeatDelay: 5 });
        shake.to(
            this.cameraShake,
            2,
            {
                x: -0.01,
                ease: EASE.RoughEase.ease.config({
                    template: GSAP.Power0.easeNone,
                    strength: 0.5,
                    points: 100,
                    taper: "none",
                    randomize: true,
                    clamp: false
                })
            },
            4
        );
        shake.to(this.cameraShake, 2, {
            x: 0,
            ease: EASE.RoughEase.ease.config({
                template: GSAP.Power0.easeNone,
                strength: 0.5,
                points: 100,
                taper: "none",
                randomize: true,
                clamp: false
            })
        });
    }
    updateCameraPosition() {
        // Update the mouse position with some lerp
        this.mouse.position.x += (this.mouse.target.x - this.mouse.position.x) / 30;
        this.mouse.position.y += (this.mouse.target.y - this.mouse.position.y) / 30;

        // Rotate Z & Y axis
        this.camera.rotation.z = this.mouse.position.x * 0.2;
        this.camera.rotation.y = Math.PI - this.mouse.position.x * 0.06;
        // Move a bit the camera horizontally & vertically
        this.camera.position.x = this.mouse.position.x * 0.015;
        this.camera.position.y = -this.mouse.position.y * 0.015;
    }
    updateMaterialOffset() {
        // Update the offset of the material
        this.tubeMaterial.map.offset.x = this.textureParams.offsetX;
        this.tubeMaterial.map.offset.y += 0.001;
        this.tubeMaterial.map.repeat.set(
            this.textureParams.repeatX,
            this.textureParams.repeatY
        );
    }
    updateCurve() {
        var index = 0, vertice_o = null, vertice = null;
        // For each vertice of the tube, move it a bit based on the spline
        for (var i = 0, j = this.tubeGeometry.vertices.length; i < j; i += 1) {
            // Get the original tube vertice
            vertice_o = this.tubeGeometry_o.vertices[i];
            // Get the visible tube vertice
            vertice = this.tubeGeometry.vertices[i];
            // Calculate index of the vertice based on the Z axis
            // The tube is made of 50 rings of vertices
            index = Math.floor(i / 50);
            // Update tube vertice
            vertice.x +=
                (vertice_o.x + (this.splineMesh.geometry as Geometry).vertices[index].x - vertice.x) /
                10;
            vertice.y +=
                (vertice_o.y + (this.splineMesh.geometry as Geometry).vertices[index].y - vertice.y) /
                5;
        }
        // Warn ThreeJs that the points have changed
        this.tubeGeometry.verticesNeedUpdate = true;

        // Update the points along the curve base on mouse position
        this.curve.points[2].x = -this.mouse.position.x * 0.1;
        this.curve.points[4].x = -this.mouse.position.x * 0.1;
        this.curve.points[2].y = this.mouse.position.y * 0.1;

        // Warn ThreeJs that the spline has changed
        (this.splineMesh.geometry as Geometry).verticesNeedUpdate = true;
        (this.splineMesh.geometry as Geometry).vertices = this.curve.getPoints(70);
    }
    render() {
        // Update material offset
        this.updateMaterialOffset();

        // Update camera position & rotation
        this.updateCameraPosition();

        // Update the tunnel
        this.updateCurve();

        // render the scene
        this.renderer.render(this.scene, this.camera);

        // Animation loop
        window.requestAnimationFrame(this.render.bind(this));
    }
}
export let tunnel: Tunnel;
// All needed textures
type TextureMap = {
    [key: string]: {
        url: string,
        texture: THREE.Texture
    }
}
var textures: TextureMap = {
    "galaxy": {
        url: "img/galaxyTexture.jpg",
        texture: null
    }
}
// Create a new loader
var loader = new THREE.TextureLoader();
// Prevent crossorigin issue
loader.crossOrigin = "Anonymous";
// Load all textures
for (const name in textures) {
    (function (name) {
        loader.load(textures[name].url, function (texture) {
            textures[name].texture = texture;
            checkTextures();
        });
    })(name)
}

var texturesLoaded = 0;
function checkTextures() {
    texturesLoaded++;
    if (texturesLoaded === Object.keys(textures).length) {
        document.body.classList.remove("loading");
        // window.tunnel = new Tunnel();
        tunnel = new Tunnel();
    }
}
