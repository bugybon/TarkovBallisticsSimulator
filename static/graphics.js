import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const manager = new THREE.LoadingManager();

let camera, scene, renderer, stats, object, loader, guiMorphsFolder;
let mixer;

const clock = new THREE.Clock();
const widthAspect=0.5;

const params = {
    asset: 'body_allHitboxes'
};

const assets = [
    'body_allHitboxes',
];


init();

function init() {

    const container = document.createElement( 'div' );
    container.setAttribute("id", "canvas");
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth*widthAspect / window.innerHeight, 1, 2000 );
    camera.position.set( 10, 20, 30);

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xa0a0a0 );
    scene.fog = new THREE.Fog( 0xa0a0a0, 200, 1000 );

    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444, 5 );
    hemiLight.position.set( 0, 200, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 5 );
    dirLight.position.set( 0, 200, 100 );
    dirLight.castShadow = false;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = - 100;
    dirLight.shadow.camera.left = - 120;
    dirLight.shadow.camera.right = 120;
    scene.add( dirLight );

    // scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

    // ground
    const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 200, 200), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
    mesh.rotation.x = - Math.PI / 2;
    //mesh.receiveShadow = true;
    scene.add( mesh );

    const grid = new THREE.GridHelper( 200, 20, 0x000000, 0x000000 );
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add( grid );

    loader = new GLTFLoader( manager );
    loadAsset( params.asset, 'hitbox' );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth*widthAspect, window.innerHeight );
    renderer.setAnimationLoop( animate );
    //renderer.shadowMap.enabled = true;
    container.appendChild( renderer.domElement );

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set( 0, 10, 0 );
    controls.update();

    window.addEventListener( 'resize', onWindowResize );

    // stats
    stats = new Stats();
    container.appendChild( stats.dom );

    const gui = new GUI();
    gui.add( params, 'asset', assets ).onChange( function ( value ) {

        loadAsset( value );

    } );

    guiMorphsFolder = gui.addFolder( 'Morphs' ).hide();

}

function loadAsset( asset, name ) {
    loader.load( 'models/' + asset + '.gltf', async function ( gltf ) {

    const model = gltf.scene;
    model.name = name;

    model.traverse((node) => {
        if (node.name.includes("Hitbox")) {
            node.visible = false;
        }
    });
    // #!!! RABOTI !!!! maha rendera na hitboxovete
    model.traverse ( ( o ) => {
		// if ( o.isMesh ) {
		// o.material.metalness = true;
		// o.material.wireframe = true;
		// }
        // fuck wireframe ne ni trqbva rn
	} );

    // wait until the model can be added to the scene without blocking due to shader compilation

    await renderer.compileAsync( model, camera, scene );

    scene.add( model );

    //render();

    });
}

function onWindowResize() {

    camera.aspect = window.innerWidth*widthAspect / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth*widthAspect, window.innerHeight );

}


// function render() {

//     renderer.render( scene, camera );

// }

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
// const camera = YOUR_CAMERA; // Replace with your camera
// const scene = YOUR_SCENE; // Replace with your scene

// On mouse click
window.addEventListener('click', (event) => {
    // Update pointer coordinates
    pointer.x = ((event.clientX / window.innerWidth) * 2 - 1)/widthAspect;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Cast a ray from the camera through the pointer
    raycaster.setFromCamera(pointer, camera);

    // Intersect with the scene
    const hitbox = scene.children.filter((group) => group.name == "hitbox");
    const intersects = raycaster.intersectObjects(hitbox, true); // Use 'true' to check children
    //scene.add(new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 300, 0xff0000) );
    for (let i = 0; i < intersects.length; i++){
        const clickedObject = intersects[i].object;
        if(clickedObject.name.toLowerCase().includes("hitbox")){
            console.log('Clicked object:', clickedObject.name, clickedObject);
        }
    }
});

//

function animate() {

    const delta = clock.getDelta();

    if ( mixer ) mixer.update( delta );

    renderer.render( scene, camera );

    stats.update();

}