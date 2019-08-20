
var scene, camera, renderer, controls;
var meshFloor, ambientLight, light;
var weapon;

var crate, crateTexture, crateNormalMap, crateBumpMap;
//Zombie mesh global vars
var model,zombieAnimated ;

var keyboard = {};
var player = { height: 1.8, speed: 0.2, turnSpeed: Math.PI * 0.02 };
var USE_WIREFRAME = false;

var objects = [];

var raycaster;

var moveForward = false;
			var moveBackward = false;
			var moveLeft = false;
			var moveRight = false;
			var canJump = false;

			var prevTime = performance.now();
			var velocity = new THREE.Vector3();
			var direction = new THREE.Vector3();
			var vertex = new THREE.Vector3();
			var color = new THREE.Color();

function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(90, 1280 / 720, 0.1, 1000);


	meshFloor = new THREE.Mesh(
		new THREE.PlaneGeometry(20, 20, 10, 10),
		new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: USE_WIREFRAME })
	);
	meshFloor.rotation.x -= Math.PI / 2;
	meshFloor.receiveShadow = true;
	scene.add(meshFloor);

	ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
	scene.add(ambientLight);

	light = new THREE.PointLight(0xffffff, 0.8, 18);
	light.position.set(-3, 6, -3);
	light.castShadow = true;
	light.shadow.camera.near = 0.1;
	light.shadow.camera.far = 25;
	scene.add(light);


	camera.position.set(0, player.height, -5);
	camera.lookAt(new THREE.Vector3(0, player.height, 0));

	renderer = new THREE.WebGLRenderer({ antialias: false });
	//renderer.setSize(1280, 720);
	renderer.setSize( window.innerWidth, window.innerHeight );

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;



	controls = new THREE.PointerLockControls( camera );



	var instructions = document.getElementById( 'instructions' );

	instructions.addEventListener( 'click', function () {

		controls.lock();

	}, false );

	controls.addEventListener( 'lock', function () {

		instructions.style.display = 'none';
//		blocker.style.display = 'none';

	} );

	controls.addEventListener( 'unlock', function () {

//		blocker.style.display = 'block';
		instructions.style.display = '';

	} );

	scene.add( controls.getObject() );


	var onKeyDown = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true;
				break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;

			case 32: // space
				if ( canJump === true ) velocity.y += 100;
				canJump = false;
				break;

		}

	};

	var onKeyUp = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;

		}

	};

	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );








	// var loader = new THREE.FBXLoader();
	// loader.load( './scene/wolf/Wolf.fbx ', function ( object ) {
	// 	//object.scaling.set(0.8,0.8,0.8)
	// 	//object.position.y-= 6
	// 	object.scale.set(0.1,0.1,0.1)
	// 	scene.add( object );

	// } );
	var mm = new MyMeshes();
	// model=mm.importZombie();
	// console.log("model è dopo importZombie",model)


	var loaderGLTF = new THREE.GLTFLoader();

	// Load a glTF resource
	loaderGLTF.load(
		// resource URL
		//'scenes/zombie_character/scene.gltf'
		'scenes/the_perfect_steve_rigged/scene.gltf'
		,
		// called when the resource is loaded
		function (gltf) {

			gltf.scene.scale.set(0.001, 0.001, 0.001);
			bones = gltf.scene.children[0]
				.children[0].children[0].children[0].children[0]
				.children[1].children[0].children[2].skeleton.bones
			console.log(bones)


			gltf.scene.position.y += 1.0

			gltf.scene.children[0].children.forEach(element => {
				if (element.name.includes("Left") || element.name.includes("Right")) {
					element.rotateZ(1.5)
					console.log("->", element)
				};
			});
			model = gltf.scene
			scene.add(gltf.scene);

			console.log("gltd scene", gltf.scene)
			gltf.animations; // Array<THREE.AnimationClip>
			gltf.scene; // THREE.Scene
			gltf.scenes; // Array<THREE.Scene>
			gltf.cameras; // Array<THREE.Camera>

			zombieAnimated = new ZombieAnimation(bones);
			zombieAnimated.raisingArmsPose()


		},
		// called while loading is progressing
		function (xhr) {

			console.log((xhr.loaded / xhr.total * 100) + '% loaded');

		},

	);

	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.load("./scenes/weapon/uziGold.mtl", function(materials){

		materials.preload();
		var objLoader = new THREE.OBJLoader();
		objLoader.setMaterials(materials);

		objLoader.load("./scenes/weapon/uziGold.obj", function(mesh){
			weapon=mesh;

			weapon.traverse(function(node){
				if( node instanceof THREE.Mesh ){
					node.castShadow = true;
					node.receiveShadow = false;
				}
			});

			camera.add(weapon);
			weapon.position.set(0.4, -0.4, -0.5);
			weapon.scale.set(10,10,10);
			weapon.rotation.y = -Math.PI;
			//weapon.rotation.= Math.PI/4;
		});

	});




	raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );


	document.body.appendChild(renderer.domElement);

	animate();

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}



//var clock = new THREE.Clock();

const walkSpeed = 1.0

let then = 0;
function animate(now) {

	requestAnimationFrame(animate);

	now *= 0.001;  // make it seconds

	const myDelta = now - then;
  	then = now;


	if ( controls.isLocked === true ) {

		raycaster.ray.origin.copy( controls.getObject().position );
		raycaster.ray.origin.y -= 10;

		var intersections = raycaster.intersectObjects( objects );

		var onObject = intersections.length > 0;

		var time = performance.now();
		var delta = ( time - prevTime ) / 1000.0 ;
		prevTime = time;


		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

		direction.z = Number( moveForward ) - Number( moveBackward );
		direction.x = Number( moveLeft ) - Number( moveRight );
		direction.normalize(); // this ensures consistent movements in all directions

		if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
		if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

		if ( onObject === true ) {

			velocity.y = Math.max( 0, velocity.y );
			canJump = true;

		}
		controls.getObject().translateX( velocity.x * delta );
		controls.getObject().position.y += ( velocity.y * delta ); // new behavior
		controls.getObject().translateZ( velocity.z * delta );

		if ( controls.getObject().position.y < 1.5 ) {

			velocity.y = 0;
			controls.getObject().position.y = 1.5;

			canJump = true;

		}

	}



	// if (keyboard[87]) { // W key
	// 	camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
	// 	camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
	// }
	// if (keyboard[83]) { // S key
	// 	camera.position.x += Math.sin(camera.rotation.y) * player.speed;
	// 	camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
	// }
	// if (keyboard[65]) { // A key
	// 	camera.position.x += Math.sin(camera.rotation.y + Math.PI / 2) * player.speed;
	// 	camera.position.z += -Math.cos(camera.rotation.y + Math.PI / 2) * player.speed;
	// }
	// if (keyboard[68]) { // D key
	// 	camera.position.x += Math.sin(camera.rotation.y - Math.PI / 2) * player.speed;
	// 	camera.position.z += -Math.cos(camera.rotation.y - Math.PI / 2) * player.speed;
	// }

	// if (keyboard[37]) { // left arrow key
	// 	camera.rotation.y -= player.turnSpeed;
	// }
	// if (keyboard[39]) { // right arrow key
	// 	camera.rotation.y += player.turnSpeed;
	// }


	if (model) {
		zombieAnimated.walkingAnimate(myDelta,walkSpeed)
	}

	renderer.render(scene, camera);
}


window.onload = init;
