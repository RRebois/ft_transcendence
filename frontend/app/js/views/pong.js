import * as THREE from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {initializePongWebSocket} from "@js/functions/websocket.js";
import {DirectionalLight, SpotLight, Clock} from 'three';

export default class PongGame {
    constructor(props) {
    console.log("============ PONG WEBPAGE CONSTRUCTOR ============");
        this.props = props;
        this.user = props?.user;
        this.gameSocket = null;
        this.setUser = this.setUser.bind(this);

        document.addEventListener('DOMContentLoaded', this.setupEventListeners.bind(this));
    }

    setUser(user) {
        this.user = user;
    }

    addProps(newProps) {
		this.props = {...this.props, ...newProps};
	}

    setProps(newProps) {
        console.log("Pong: " + newProps);
        this.props = newProps;
    }

    initializeWs = async (gameCode) => {
		console.log("pong initializeWs called");

		let ws;
		try {
			ws = await initializePongWebSocket(gameCode, this.props?.session_id, this);
		} catch (e) { return ;
//			const errorModal = new bootstrap.Modal(document.getElementById('ErrorModal'));
//			document.getElementById('errorModalBody').innerHTML = `
//				<p>This match is not available. Please try again later.</p>
//			`
//			errorModal.show();
//			return;
		}
		this.gameSocket = ws;
		if (ws)
		    this.init();
    }

    init() { // For responside device check the Resizer class: https://discoverthreejs.com/book/first-steps/world-app/#components-the-cube-module
        document.title = "ft_transcendence | Pong";

        // Load all textures at once
        this.textures = {};
        const   textureLoader = new THREE.TextureLoader();
        const   textStadium = textureLoader.load("/textures/grass/grass_BaseColor.jpg");
        const   textInitBall = textureLoader.load("/textures/football.jpg");
        const   textBlueCube = textureLoader.load("/textures/blue_basecolor.png");
//        const   textBlueCubeR = textureLoader.load("/textures/blue_metallic.png");
//        const   textBlueCubeM = textureLoader.load("/textures/blue_roughness.png");
        const   textRedCube = textureLoader.load("/textures/red_basecolor.png");
        const   textPadBlue = textureLoader.load("/textures/ice/ice_basecolor.png");
//        const   textPadBlueRoughness = textureLoader.load("/textures/ice/ice_roughness.png");
        const   textPadRed = textureLoader.load("/textures/lava/lava_basecolor.jpg");

        const   three = textureLoader.load("three.png")

        this.textures["textStadium"] = textStadium;
        this.textures["textInitBall"] = textInitBall;
        this.textures["textBlueCube"] = textBlueCube;
//        this.textures["textBlueCubeR"] = textBlueCubeR;
//        this.textures["textBlueCubeM"] = textBlueCubeM;
        this.textures["textRedCube"] = textRedCube;
        this.textures["textPadBlue"] = textPadBlue;
//        this.textures["textPadBlueRoughness"] = textPadBlueRoughness;
        this.textures["textPadRed"] = textPadRed;

        this.paddles = {};
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera
        this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1500);
        this.camera.position.set(0, 400, 1000);
        this.scene.fog = new THREE.Fog(0x000000, 250, 1400);
        this.camera.lookAt(0, 250, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const   test = document.getElementById("display");
        test.appendChild(this.renderer.domElement);

        // Create stade group with all objetcs so when rotate everything follows
        const   stadiumGroup = new THREE.Group();
        // stadiumGroup.rotation.set(45, 0, 0);
        const   stadium = new THREE.Object3D();
        stadium.name = "stadium";
        stadiumGroup.add(stadium);
        this.scene.add(stadiumGroup);

        // Display text from the beginning
        const    textGroup = new THREE.Object3D();
        textGroup.position.y = 300;
        textGroup.position.z = 300;
        textGroup.rotation.set(0, Math.PI, 0);
        textGroup.name = "textGroup";
        this.scene.add(textGroup);

        // Controls pad
        window.addEventListener('keydown', this.handleKeyEvent.bind(this));
        window.addEventListener('keyup', this.handleKeyEvent.bind(this));

        // Resize scene
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.animate = this.animate.bind(this);
        this.animate();
    }

    createLightFloor() {
        // Create plane
        const   planeGeometry = new THREE.PlaneGeometry(5000, 5000);
        const   planeMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff
        });
        const   plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = - Math.PI * 0.5;
        plane.position.y = -100;
        plane.receiveShadow = true;
        this.scene.add(plane);

        const   spotLightRight = new SpotLight(0xffffff, 10000000);
        spotLightRight.position.set(920, 400, 100); //y: 300
        spotLightRight.target.position.set(550, 0, 140);
//        spotLightRight.distance = 5000;
        spotLightRight.angle = .45; // change it for higher or lower coverage of the spot
        spotLightRight.penumbra = .8;
        spotLightRight.castShadow = true;
        spotLightRight.shadow.camera.far = 1000;
        spotLightRight.shadow.camera.near = 10;
        spotLightRight.name = "spotR";

        const   spotLightLeft = new SpotLight(0xffffff, 10000000);
        spotLightLeft.position.set(-300, 400, 100);
        spotLightLeft.target.position.set(50, 0, 140);
        spotLightLeft.angle = .45; // change it for higher or lower coverage of the spot
        spotLightLeft.penumbra = .8;
        spotLightLeft.castShadow = true;
        spotLightLeft.shadow.camera.far = 1000;
        spotLightLeft.shadow.camera.near = 10;
        spotLightLeft.name = "spotL";

        this.scene.add(spotLightRight, spotLightLeft, spotLightRight.target, spotLightLeft.target);//, ballLight, ballLight.target);
//        this.scene.add(ballLight, ballLight.target);
    }

    waiting() {
        const   check = this.scene.getObjectByName("light_1");
        if (!check) {
            // Set lights
            const   dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
            dirLight.position.set(0, 0, 1).normalize();
            dirLight.name = "light_1";
            this.scene.add(dirLight);

            const   pointLight = new THREE.PointLight(0xffffff, 4.5, 0, 0);
            pointLight.color.setHSL(Math.random(), 1, 0.5);
            pointLight.position.set(0, 100, 90);
            pointLight.name = "light_2";
            this.scene.add(pointLight);

            const   txt = "Match will start soon!";
            const   waitText = new THREE.Object3D();
    //        const    textGroup = new THREE.Object3D();
            waitText.position.y = 300;
            waitText.name = "waitTxt";
            this.scene.add(waitText);

            // Create plane for mirror text to appear ghosty
            const   planeGeometry = new THREE.PlaneGeometry(10000, 10000);
            const   planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
            const   plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.position.y = 300;
            plane.rotation.x = - Math.PI * 0.5;
            plane.name = "waitPlane";
            this.scene.add(plane);

            // Create Text to display
            const   loader = new FontLoader();
            loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
                const   geometry = new TextGeometry(txt, {
                    font: font,
                    size: 70,
                    depth: 20,
                    curveSegments: 4,
                    bevelEnabled: true,
                    bevelSize: 1.5,
                    bevelThickness: 2,
                });
                const   material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    flatShading: true,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.8
                });
                const   mirrorMat = new THREE.MeshStandardMaterial({
                    color: 0xffffff
                })

                // Create bounding box
                geometry.computeBoundingBox();
                const   boundingBox = geometry.boundingBox;
                const   textWidth = boundingBox.max.x - boundingBox.min.x;

                const   textAdd = new THREE.Mesh(geometry, material);
                textAdd.position.set(-0.5 * textWidth, 30, 0);
                textAdd.rotation.set(0, 2 * Math.PI, 0);

                const   mirror = new THREE.Mesh(geometry, mirrorMat);
                mirror.position.set(-0.5 * textWidth, -30, 20);
                mirror.rotation.set(Math.PI, 2 * Math.PI, 0);

                waitText.add(textAdd, mirror);

            });
            const animate = () => {
                requestAnimationFrame(animate);
                textAdd.material.emissiveIntensity = 3 + Math.sin(Date.now() * 0.005) * 3;
            };
            animate();
        }
    }

    buildGameSet(data) {console.log("buildGameSet: ", data);
        //  remove all from wait message(if any)
        const   dirLight = getObjectByName("light_1");
        const   pointLight = getObjectByName("light_2");
        const   wait = getObjectByName("waitTxt");
        const   planeWait = getObjectByName("waitPlane);
        if (dirLight)
            this.scene.remove(dirLight, pointLight, wait, planeWait);

        // reset camera to have stadium on
        this.camera.position.set(300, 700, -500);
        this.camera.lookAt(300, -100, 300);

        // initial camera setup
//        this.camera.position.set(300, 700, 500);
//        this.camera.lookAt(300, -100, -300);
//        this.camera.rotation.set(0, 2 * Math.PI, 0);

        // Ball initial stats
        this.ball_x = 0;
        this.ball_z = 0;
        this.ball_radius = Object.values(data.game_state.ball)[2];

        // rm previous scene stuff
        this.scene.children;
        for (let i = 0; i < this.scene.children.length; i++) {
            this.scene.children[i].remove();
        }

        // Set players info
        this.xPosition = 0;
        this.score_p1 = 0;
        this.score_p2 = 0;
        this.nameArray = ["p1Nick", "p1Score", "hyphen", "p2Score", "p2Nick"];

        // Set players nick
        this.players_nick = [];
        this.players_nick.push(Object.keys(data.players)[0]);
        this.players_nick.push(Object.keys(data.players)[1]);

        if (Object.keys(data.players).length > 2) {
            this.players_nick.push(Object.keys(data.players)[2]);
            this.players_nick.push(Object.keys(data.players)[4]);
        }

        for (let i = 0; i < this.players_nick.length; i++) {
            if (this.players_nick[i].length > 8) {
                this.players_nick[i] = this.players_nick[i].substr(0, 7) + ".";
            }
        }

        // Adjust this.Array for each case (2 players / 4 players)
        if (this.players_nick.length > 2) {
            this.textArray = [`${this.players_nick[0]} + " " + ${this.players_nick[1]}`,
            "\n" + this.score_p1.toString(), "\n - ", "\n" + this.score_p2.toString(),
            `${this.players_nick[2]} + " " + ${this.players_nick[3]}`];
        }
        else {
            this.textArray = [`${this.players_nick[0]}`,
            "\n" + this.score_p1.toString(), "\n - ", "\n" + this.score_p2.toString(),
            `${this.players_nick[1]}`];
        }
        this.newArray = ["team 1 " + this.textArray[0],
                        this.textArray[1] + this.textArray[2] + this.textArray[3],
                        "team 2 " + this.textArray[4]];
        this.sprite = [];

        // Display scores to the scene
        this.printInitScores();

        // Create floor for game and spotlight purpose
        this.createGameElements(data);
    }

    createGameElements(data) {
        this.createBall(Object.values(data.game_state.ball));
        this.createLightFloor();
        this.createPlanStadium();
        for (let i = 0; i < Object.keys(data.players).length; i++)
            this.createPaddle(Object.values(data.game_state),
                                Object.values(data.game_state.players)[i], i + 1);
        this.createStadium();
    }

    printInitScores() { //https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_ttf.html try it
    //https://discourse.threejs.org/t/different-textures-on-each-face-of-cube/23700 onWResize
    //https://github.com/Fasani/three-js-resources?tab=readme-ov-file#images
    // bloom https://threejs.org/examples/#webgl_postprocessing_unreal_bloom

        const   textGroup = this.scene.getObjectByName("textGroup");
        const   loader = new FontLoader();

        this.xPosition = window.innerWidth;
//        textGroup.rotation.copy(this.camera.rotation);

        // vecto to get coords of text and center it on scene
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            this.textArray.forEach((text, index) => {
                if (index === 0)
                    text = "Team 1\n" + text
                else if (index === 4)
                    text = "Team 2\n" + text
                const textGeometry = new TextGeometry(text, {
                    font: font,
                    size: 45,
                    depth: 5,
                    hover: 30,
                    curveSegments: 4,
                    bevelThickness: 2,
                    bevelSize: 1.5,
                    bevelEnabled: true,
                });

                // Material for nicknames
                const nickTextMaterialP1 = new THREE.MeshStandardMaterial({
                    color: 0xff0000,
                    emissive: 0xff0000,
                    roughness: 0,
                    metalness: 0.555,
                });

                const nickTextMaterialP2 = new THREE.MeshStandardMaterial({
                    color: 0x1f51ff,
                    emissive: 0x0000ff,
                    roughness: 0,
                    metalness: 0.555,
                });

                // Material for scores
                const textMaterial = new THREE.MeshStandardMaterial({
                    color: 0x8cff00,
                    emissive: 0x00ff00,
                    emissiveIntensity: 0.8,
                    metalness: 0.8,
                    roughness: 0,
                });

                let textAdd;
                if (this.nameArray[index] === "p1Nick") {
                    textAdd = new THREE.Mesh(textGeometry, nickTextMaterialP1);
                    textAdd.name = this.nameArray[index];
                }
                else if (this.nameArray[index] === "p2Nick") {
                    textAdd = new THREE.Mesh(textGeometry, nickTextMaterialP2);
                    textAdd.name = this.nameArray[index];
                }
                else {
                    textAdd = new THREE.Mesh(textGeometry, textMaterial);
                    textAdd.name = this.nameArray[index];
                }

                textGeometry.computeBoundingBox();
                const   boundingBox = textGeometry.boundingBox;
                const   textWidth = boundingBox.max.x - boundingBox.min.x;
                const   textHeight = boundingBox.max.y - boundingBox.min.y;
                textGroup.position.y = textHeight + 50;

                textAdd.position.x = this.xPosition;
                if (index === 0 || index === 3)
                    this.xPosition += textWidth + 100;
                else if (index === 2)
                    this.xPosition += 55;
                else
                    this.xPosition += textWidth + 10;
                textGroup.add(textAdd);
                this.updateTextGroup(this.xPosition);

                // Add a pulsing effect
                const animate = () => {
                    requestAnimationFrame(animate);
                    textAdd.material.emissiveIntensity = 1 + Math.sin(Date.now() * 0.005) * 0.8;
                }
                animate();
            });
        });
    }

    updateTextGroup(value) {
        const   textGroup = this.scene.getObjectByName("textGroup");
        if (textGroup)
            textGroup.position.x = value - 95;
    }

     handleKeyEvent(event) {
        const   key = event.key;
        const   isKeyDown = event.type === 'keydown';

        switch (key) {
            case 'w':
                this.gameSocket.send(JSON.stringify({"player_move": { "player": 2, "direction": 1}}));
                break;
            case 's':
                this.gameSocket.send(JSON.stringify({"player_move": { "player": 2, "direction": -1}}));
                break;
            case 'ArrowUp':
                console.log("here");
                this.gameSocket.send(JSON.stringify({"player_move": { "player": 1, "direction": 1}}));
                break;
            case 'ArrowDown':
                this.gameSocket.send(JSON.stringify({"player_move": { "player": 1, "direction": -1}}));
                break;
        }
    }

     createPlanStadium() { // add animation https://threejs.org/examples/#webgl_gpgpu_water
        // Create plane
        const   planeGeometry = new THREE.PlaneGeometry(640, 320, 40, 40);
        const   planeMaterial = new THREE.MeshPhongMaterial({
            map: this.textures["textStadium"],
            wireframe: true
        });

        const   plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = - Math.PI * 0.5;
        plane.position.set(300, -10, 140);
//        plane.castShadow = true;
        plane.receiveShadow = true;
        const   stadium = this.scene.getObjectByName("stadium");
        stadium.add(plane);
     }

    createBall(data) { // animation goutte d'eau idee rolando + un peu felipe
        const   geometry = new THREE.SphereGeometry(this.ball_radius, 48, 48);
        const   material = new THREE.MeshStandardMaterial({map: this.textures["textInitBall"]});
        const   ball = new THREE.Mesh(geometry, material);

        const   stadium = this.scene.getObjectByName("stadium");
        ball.position.set(data[0], 0, data[1]);
        ball.castShadow = true;
        ball.receiveShadow = true;
        ball.name = "ball";
        stadium.add(ball);
    }

//    Bouncing(ball) { //https://discoverthreejs.com/book/first-steps/animation-system/
//        const   center = new THREE.Vector3(-10, 0, 200);
//        const   mvt = [];
//        const   p1 = new THREE.Vector3(-10, 300, 200);
//        const   p2 = new THREE.Vector3(-10, 150, 200);
//        const   p3 = new THREE.Vector3(-10, 50, 200);
//        mvt.push(p1, p2, p3);
////        console.log("Ball init position: "); console.log( ball.position);
////        this.moveBall(ball, center);
//        for (let i = 0; i < mvt.length; i++) {
////            this.moveObjectTrans(ball, mvt[i]);
////             this.moveObjectTrans(ball, center);
//        }
////        this.moveObjectTrans(ball, center);
//
////        console.log("Ball after translation: "); console.log( ball.position);
//    }


    createPaddle(data, player, i) { // correct texture on paddles (long side) player.pos.y must be 140 not 110
        const geometry = new THREE.BoxGeometry(data[6], data[6], data[7]);
        let material;
        if (player.pos.x > 300)
            material = new THREE.MeshStandardMaterial({
                map: this.textures["textPadRed"],
            });
        else
            material = new THREE.MeshStandardMaterial({
                map: this.textures["textPadBlue"],
            });

        const paddle = new THREE.Mesh(geometry, material);
        paddle.position.set(player.pos.x, 0, player.pos.y);
        paddle.castShadow = true;
        paddle.name = `p${i}`;
        this.paddles[paddle.name] = paddle;
        const   stadium = this.scene.getObjectByName("stadium");
        stadium.add(paddle);
    }

    // Create blocks all around + needs floor + animation
    createStadium() {
        // Create gem and material once
        const   geometry = new THREE.BoxGeometry(20, 20, 20);
        const   redMaterial = this.createRedMaterial();
        const   blueMaterial = this.createBlueMaterial();

        // Create stuff needed for cube position
        const   stadium = this.scene.getObjectByName("stadium");
        const   cubes = [];
        const   targetPositions = [];
        let     cube;
        let     end;
        let     x = -30; //600 -> 640center must be x:300 z:140
        let     y = 0;
        let     z = -10;// 14 * 20 280
        let     step = 20;
        let     i = -1;


//        cube = new THREE.Mesh(geometry, redMaterial);
//        cube.position.set(-10, 0, -40);stadium.add(cube);
//        // Create plane
//        const   planeGeometry = new THREE.PlaneGeometry(80, 80, 40, 40);
//        const   planeMaterial = new THREE.MeshPhongMaterial({
//            color: 0xff0000,
//            side: THREE.DoubleSide
//        });
//        const   plane = new THREE.Mesh(planeGeometry, planeMaterial);
//        plane.rotation.x = - Math.PI;
////        plane.rotation.y =  Math.PI * 0.5;
//        plane.position.set(600, 0, 0);
//        stadium.add(plane);


        while (++i < 92) { //96
            if (i < 32) { // 21 -> 29
                x += step;
                cube = this.createCube(x, geometry, redMaterial, blueMaterial);
                end = new THREE.Vector3(x, y, z);
            }
            else if (i >= 32 && i < 47) { // 32 -> 48
                z += step;
                cube = this.createCube(x, geometry, redMaterial, blueMaterial);
                end = new THREE.Vector3(x, y, z);
            }
            else if (i >= 47 && i < 78) { // 54 -> 64
                x -= step;
                cube = this.createCube(x, geometry, redMaterial, blueMaterial);
                end = new THREE.Vector3(x, y, z);
            }
            else { // 24
                z -= step;
                cube = this.createCube(x, geometry, redMaterial, blueMaterial);
                end = new THREE.Vector3(x, y, z);
            }
            cubes.push(cube);
            targetPositions.push(end);
            stadium.add(cube);
        }

        this.moveCubes(cubes, targetPositions);
        console.log("done0");
    }

    moveCubes(cubes, targetPositions) {
        for (let i = 0; i < cubes.length; i++) {
            const cube = cubes[i];
            const targetPosition = targetPositions[i];
            this.moveObjectTrans(cube, targetPosition);
        }
        console.log("done1");
    }

    //            const   animate = () => { //https://dustinpfister.github.io/2022/05/17/threejs-vector3-lerp/
//            //https://codepen.io/prisoner849/pen/qzZaye?editors=0010
//            // https://sbcode.net/threejs/lerp/


    lerp(from, to, speed) {
        const   amount = (1 - speed) * from + speed * to;
        return (Math.abs(from - to) < 0.2 ? to : amount);
}

    moveObjectTrans(object, targetPosition) {
        let lt = new Date(),
        f = 0,
        fm = 300;
//console.log(object, targetPosition);
        const animate = () => {
            const   now = new Date();
            const   secs = (now - lt) / 1000;
            const   p = f / fm;

            requestAnimationFrame(animate);
//            object.position.lerp(targetPosition, 0.03); // positions not being exactly what expected. Check to correct it
            object.position.x = this.lerp(object.position.x, targetPosition.x, 0.03);
            object.position.y = this.lerp(object.position.y, targetPosition.y, 0.03);
            object.position.z = this.lerp(object.position.z, targetPosition.z, 0.03);
            f += 30 * secs;
            f %= fm;
            lt = now;
        }
        animate();
    }

    createBlueMaterial() {
        const   material = new THREE.MeshStandardMaterial({
            map: this.textures["textBlueCube"],
//            metalnessMap: this.textures["textBlueCubeM"],
//            metalness: 1.0,
//            roughnessMap: this.textures["textBlueCubeR"]
        });
        return material;
    }

    createRedMaterial() {
        const   materials = new THREE.MeshStandardMaterial({
            map: this.textures["textRedCube"]
        });
        return materials;
    }

    createCube(i, geometry, red, blue) {
        let cube;
        if (i > 300)
            cube = new THREE.Mesh(geometry, red);
        else
            cube = new THREE.Mesh(geometry, blue);
        cube.castShadow = true;
        cube.receiveShadow = true;

        // Create cubes starting points
        const   startPositions = [];
        const   s1 = new THREE.Vector3(2000,0, 0);
        const   s2 = new THREE.Vector3(0, 2000, 0);
        const   s3 = new THREE.Vector3(0, 0, 2000);
        const   s4 = new THREE.Vector3(2000, 2000, 0);
        startPositions.push(s1, s2, s3, s4);

        const   start = Math.floor(Math.random() * 4);
        cube.position.set(startPositions[start].x, startPositions[start].y, startPositions[start].z);
        return  cube;
    }

    updatePaddlePosition(players) {
        console.log(players);
        for (let i = 0; i < players.length; i++) {console.log("moving: ", this.paddles[`p${i + 1}`].position.z);

        console.log(players[i].pos.x);
        this.paddles[`p${i + 1}`].position.z = players[i].pos.y;
        }
    }
////        let   targetPosition;
//////            this.paddles[`p${i + 1}`].position.z = -players[i].pos[1];
////            if (this.paddles[`p${i + 1}`].position.z != -players[i].pos.y) {
////                targetPosition = new THREE.Vector3(players[i].pos.x, 0, -players[i].pos.y)
////                this.lerp(this.paddles[`p${i + 1}`].position.z, targetPosition.z, 0.03);
////            }
////        }
//    }

    rotateScore(i) {
        return new Promise((resolve) => {
            if (i === 1) {
                this.score = this.scene.getObjectByName('p1Score');
            }
            else {
               this.score = this.scene.getObjectByName('p2Score');
            }
            if (this.score) {
                // Rotation on the X axis
                this.startRotation = this.score.rotation.x;
                this.endRotation = this.startRotation + Math.PI;
                const duration = 700;
                const   startTime = Date.now();

                const animate = () => {
                    const deltaT = Date.now() - startTime;
                    const progress = deltaT / duration;

                    if (progress < 1) {
                        this.score.rotation.x = this.startRotation + progress * (this.endRotation - this.startRotation);
                        requestAnimationFrame(animate);
                    } else {
                        this.score.rotation.x = this.endRotation;
                        resolve();
                    }
                };
             animate();
            }
        });
    }

    updateScores() {
        // Select textGroup
        const   text = this.scene.getObjectByName("textGroup");
        let     toRemove;
        this.nameArray.forEach(value => {
            toRemove = text.getObjectByName(value);
            text.remove(toRemove);
        })
        this.printInitScores();
    }

    animate() {
        requestAnimationFrame(this.animate);


//        this.camera.rotation.y += 0.002;
//        const   textGroup = this.scene.getObjectByName("textGroup");
//        textGroup.rotation.copy(this.camera.rotation);

        const   msg = this.scene.getObjectByName("waitTxt");
        if (msg)
            this.waitMSGMove(msg);
//        const   hyphen = this.scene.getObjectByName("hyphen");
//        if (hyphen) {
//            if (this.camera.position.y > 400) {
//                this.camera.rotation.z -= 0.02;
//                this.camera.position.y -= 0.5;
//            }
//            else {//3000 make rotation to final position smoother
//                this.camera.position.set(0, 400, 1000);
//                this.camera.rotation.z = 0;
//            }
//        }
//        const   textGroup = this.scene.getObjectByName("textGroup");
//        if (textGroup && textGroup.length > 0)
//            this.updateTextPosition();

//        this.updateBallPosition();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    waitMSGMove(msg) {
        msg.rotation.y += 0.001;
    }

    updateBallPosition(x, z) {
        const ball = this.scene.getObjectByName("ball");

        if (ball) {
            ball.position.x = x;
            ball.position.z = z;
        }
    }

//        moveBall(object, targetPosition) {
//        const animate = () => {
//            requestAnimationFrame(animate);
////            object.position.lerp(targetPosition, 0.03); // positions not being exactly what expected. Check to correct it
//            object.position.x = this.lerp(object.position.x, targetPosition.x, 1);
////            object.position.y = this.lerp(object.position.y, targetPosition.y, 0.03);
//            object.position.z = this.lerp(object.position.z, targetPosition.z, 1);
//        }
//        animate();
//    }

//    newRound() {
//        this.ball_x = 0;
//        this.ball_y = 0;
//        this.currentSpeed = this.baseSpeed;
//        this.ball_velocity_x = this.currentSpeed * ((Math.random() - 0.5));
//        this.ball_velocity_y = this.currentSpeed * ((Math.random() - 0.5));
//
////        const ball = this.scene.getObjectByName('ball');
//        ball.position.set(this.ball_x, this.ball_y, 0);
//    }

    // Collecting info from the game logic in the back
    display(data) {
//        console.log(data);
        const   ball = this.scene.getObjectByName("ball");

// ball does not rotate, needs correction
        this.updateBallPosition(Object.values(data.game_state.ball)[0],
                                Object.values(data.game_state.ball)[1]);
        this.updatePaddlePosition(Object.values(data.game_state.players));
    }

    setupEventListeners() {}

    render() {
        this.initializeWs(this.props?.code);
        return `<div id="display"></div>`
    }

}
