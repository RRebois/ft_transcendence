import * as THREE from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {initializePongWebSocket} from "@js/functions/websocket.js";
import {SpotLight} from 'three';
import * as bootstrap from "bootstrap";
import {getCookie} from "@js/functions/cookie.js";
import ToastComponent from "@js/components/Toast.js";
import {appRouter} from "@js/spa-router/initializeRouter.js";
import {remove_modal_backdrops} from "../functions/display.js";
import {DDSLoader} from 'three/examples/jsm/loaders/DDSLoader';

export default class PongGame {
    constructor(props) {
        this.props = props;
        this.user = props?.user;
        this.winner = null;
        this.setUser = this.setUser.bind(this);
        this.removeUser = this.removeUser.bind(this);
        this.sceneWidth = 600;
        this.prevWidth = window.innerWidth;
        this.prevHeight = window.innerHeight;

        this.setupEventListeners();
    }

    setUser(user) {
        this.user = user;
    }

    removeUser() {
        if (this.user) this.user = null;
    }

    addProps(newProps) {
		this.props = {...this.props, ...newProps};
	}

    setProps(newProps) {
        this.props = newProps;
    }

    initializeWs = async (data) => { console.log(data);
        let ws;
		try {
			ws = await initializePongWebSocket(data, this);
		} catch (e) {
			const errorModal = new bootstrap.Modal(document.getElementById('ErrorModal'));
			document.getElementById('errorModalBody').innerHTML = `
				<p>This match is not available. Please try again later.</p>
			`
			errorModal.show();
			return;
		}
    }

    init() {

        // limit 60 fps
        this.lastFrameTime = 0;  // Store the time of the last frame
        this.fpsInterval = 1000 / 60;

        // document.title = "ft_transcendence | Pong";
        modal.hidden = true;
        this.userIndex = 0;

        // Load all textures at once
        this.textures = {};
        this.load_textures();

        // Load all materials
        this.materials = {};
        this.load_materials();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 7000);
        const aspectRatio = window.innerWidth / window.innerHeight;
        const verticalFOV = this.camera.fov * (Math.PI / 180);
        const horizontalFOV = 2 * Math.atan(Math.tan(verticalFOV * 0.5) * aspectRatio);
        const distance = (this.sceneWidth * 0.5) / Math.tan(horizontalFOV * 0.5);
        this.camera.position.set(300, ((distance * 3) * Math.tan(verticalFOV * 0.5)), -distance);
//        this.scene.fog = new THREE.Fog(0x000000, -300, 1500);
        this.scene.fog = new THREE.Fog(0x000000, -300, 3500);
        this.camera.lookAt(300, -100, 300);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const   container = document.getElementById("display");
        container.appendChild(this.renderer.domElement);

        // Get the WebGL rendering context
        this.gl = this.renderer.getContext();

        // Get the lose context extension
        this.loseContextExtension = this.gl.getExtension('WEBGL_lose_context');

        this.animate = this.animate.bind(this);

        this.gameFinished = false;
        this.gameHasStarted = false;
        this.animate();
    }

    load_textures() {
//    requestIdleCallback(() => {
        const   textureLoader = new DDSLoader();

        const   textStadium = textureLoader.load("/textures/grass/grass_BaseColor.dds");
        const   textInitBall = textureLoader.load("/textures/football.dds");
        const   textBlueCube = textureLoader.load("/textures/blue_basecolor.dds");
        const   textRedCube = textureLoader.load("/textures/red_basecolor.dds");
        const   textPadBlue = textureLoader.load("/textures/ice/ice_basecolor.dds");
        const   textPadRed = textureLoader.load("/textures/lava/lava_basecolor.dds");

        this.textures = {
            textStadium,
            textInitBall,
            textBlueCube,
            textRedCube,
            textPadBlue,
            textPadRed
        };
//        });
    }

    load_materials() {
//    requestIdleCallback(() => {
        // Load all materials
        this.materials["wait"] = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            flatShading: true,
            emissive: 0xffffff,
            emissiveIntensity: 0.8
        });
        this.materials["mirror"] = new THREE.MeshStandardMaterial({
            color: 0xffffff
        });
        this.materials["p1"] = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            roughness: 0,
            metalness: 0.555,
        });

        this.materials["p2"] = new THREE.MeshStandardMaterial({
            color: 0x1f51ff,
            emissive: 0x0000ff,
            roughness: 0,
            metalness: 0.555,
        });

        // Material for scores
        this.materials["scores"] = new THREE.MeshStandardMaterial({
            color: 0x8cff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.8,
            metalness: 0.8,
            roughness: 0,
        });
//        });
    }

    onKeyDown(event) {
        if (window.location.pathname === "/pong")
            if (event.key === 'w' || event.key === 's' || event.key === 'ArrowUp'
            || event.key === 'ArrowDown')
                this.keyMap[event.key] = true;
    }

    onKeyUp(event) {
        if (window.location.pathname === "/pong")
            if (event.key === 'w' || event.key === 's' || event.key === 'ArrowUp'
            || event.key === 'ArrowDown')
                delete this.keyMap[event.key];
    }

     handleKeyEvent() {
        if (window.location.pathname === "/pong") {
            if (this.props?.code === "20") {
                if (this.keyMap['w'] === true)
                    window.myPongSocket.send(JSON.stringify({"player_move": {"player": 2, "direction": 1}}));
                if (this.keyMap['s'] === true)
                    window.myPongSocket.send(JSON.stringify({"player_move": {"player": 2, "direction": -1}}));
                if (this.keyMap['ArrowUp'] === true)
                    window.myPongSocket.send(JSON.stringify({"player_move": {"player": 1, "direction": 1}}));
                if (this.keyMap['ArrowDown'] === true)
                    window.myPongSocket.send(JSON.stringify({"player_move": {"player": 1, "direction": -1}}));
            }
            else if (this.props?.code !== "40" && this.props?.code !== "20") { //console.log("1vsbot or 1v1 online");
                if (this.keyMap['ArrowUp'] === true)
                    window.myPongSocket.send(JSON.stringify({"player_move": {"player": 1, "direction": 1}}));
                if (this.keyMap['ArrowDown'] === true)
                    window.myPongSocket.send(JSON.stringify({"player_move": {"player": 1, "direction": -1}}));
            }
            else { //console.log("2v2");
                if (this.keyMap['ArrowUp'] === true)
                    window.myPongSocket.send(JSON.stringify({"player_move": {"player": this.userIndex, "direction": 1}}));
                if (this.keyMap['ArrowDown'] === true)
                    window.myPongSocket.send(JSON.stringify({"player_move": {"player": this.userIndex, "direction": -1}}));
            }
        }
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

        const   spotLightRight = new SpotLight(0xffffff, 1000000);
        spotLightRight.position.set(920, 400, 100); //y: 300
        spotLightRight.target.position.set(550, 0, 140);
        spotLightRight.angle = .45; // change it for higher or lower coverage of the spot
        spotLightRight.penumbra = .8;
        spotLightRight.castShadow = true;
        spotLightRight.shadow.camera.far = 1000;
        spotLightRight.shadow.camera.near = 10;
        spotLightRight.name = "spotR";

        const   spotLightLeft = new SpotLight(0xffffff, 1000000);
        spotLightLeft.position.set(-300, 400, 100);
        spotLightLeft.target.position.set(50, 0, 140);
        spotLightLeft.angle = .45; // change it for higher or lower coverage of the spot
        spotLightLeft.penumbra = .8;
        spotLightLeft.castShadow = true;
        spotLightLeft.shadow.camera.far = 1000;
        spotLightLeft.shadow.camera.near = 10;
        spotLightLeft.name = "spotL";

        this.scene.add(spotLightRight, spotLightLeft, spotLightRight.target, spotLightLeft.target);
    }

    waiting() {
        const   check = this.scene.getObjectByName("light_1");
        if (!check) {
            // Set lights
            const   dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
            dirLight.position.set(300, 0, 1).normalize();
            dirLight.name = "light_1";
            this.scene.add(dirLight);

            const   pointLight = new THREE.PointLight(0xffffff, 4.5, 0, 0);
            pointLight.color.setHSL(Math.random(), 1, 0.5);
            pointLight.position.set(300, 100, 90);
            pointLight.name = "light_2";
            this.scene.add(pointLight);

            const   txt = "Match will start soon!";
            const   waitText = new THREE.Object3D();
            waitText.position.set(300, -100, 300);
            waitText.name = "waitTxt";
            this.scene.add(waitText);

            // Create plane for mirror text to appear ghosty
            const   planeGeometry = new THREE.PlaneGeometry(10000, 10000);
            const   planeMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0.5, transparent: true});
            const   plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.position.set(300, 40, 0);
            plane.rotation.x = - Math.PI * 0.5;
            plane.rotation.z = Math.PI;
            plane.name = "waitPlane";
            this.scene.add(plane);

            // Create Text to display
            const   loader = new FontLoader();
            loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
                const   geometry = new TextGeometry(txt, {
                    font: font,
                    size: 75,
                    depth: 20,
                    curveSegments: 4,
                    bevelEnabled: true,
                    bevelSize: 1.5,
                    bevelThickness: 2,
                });

                // Create bounding box
                geometry.computeBoundingBox();
                const   boundingBox = geometry.boundingBox;
                const   textWidth = boundingBox.max.x - boundingBox.min.x;

                const   textAdd = new THREE.Mesh(geometry, this.materials["wait"]);
                textAdd.position.set(textWidth * 0.5, 150, 0);
                textAdd.rotation.set(0, Math.PI, 0);

                const   mirror = new THREE.Mesh(geometry, this.materials["mirror"]);
                mirror.position.set(textWidth * 0.5, 90, -20);
                mirror.rotation.set(Math.PI, - Math.PI, 0);

                waitText.add(textAdd, mirror);
            });
        }
    }

    buildGameSet(data) {
        //  remove all from wait message(if any)
        const   dirLight = this.scene.getObjectByName("light_1");
        const   pointLight = this.scene.getObjectByName("light_2");
        const   wait = this.scene.getObjectByName("waitTxt");
        const   planeWait = this.scene.getObjectByName("waitPlane");
        this.scene.fog.near = 0.1;
        this.scene.fog.far = 0;

        if (dirLight)
            this.scene.remove(dirLight, pointLight, wait, planeWait);

        // Create stade group with all objetcs so when rotate everything follows
        const   stadiumGroup = new THREE.Group();
        const   stadium = new THREE.Object3D();
        stadium.name = "stadium";
        stadiumGroup.add(stadium);
        this.scene.add(stadiumGroup);

        // Display text from the beginning
        const    textGroup = new THREE.Object3D();//textGroup.position.set(300, 100, 300);
        textGroup.position.x = 300;
        textGroup.position.y = 300;
        textGroup.position.z = 300;
        textGroup.rotation.set(0, Math.PI, 0);
        textGroup.name = "textGroup";
        this.scene.add(textGroup);

        this.keyMap = {};
        this.paddles = {};

        // Ball initial stats
        this.ball_x = 0;
        this.ball_z = 0;
        this.ball_radius = data.game_state.ball["radius"];

        // rm previous scene stuff
        this.scene.children;
        for (let i = 0; i < this.scene.children.length; i++) {
            this.scene.children[i].remove();
        }

        // Set players info
        this.xPosition = 0;
        this.score_p1 = 0;
        this.score_p2 = 0;
        this.nameArray = ["p2Nick", "p2Score", "hyphen", "p1Score", "p1Nick"];

        // Set players nick
        this.players_nick = []; //p2, p1, p4, p3
        this.players_nick.push({
            "username": data.game_state.players.player2["name"],
            "truncUser": null,
        });
        this.players_nick.push({
            "username": data.game_state.players.player1["name"],
            "truncUser": null,
        });

        if (Object.keys(data.players).length > 2) {
            this.players_nick.push({
                "username": data.game_state.players.player4["name"],
                "truncUser": null,
            });
            this.players_nick.push({
                "username": data.game_state.players.player3["name"],
                "truncUser": null,
            });
        }

        this.sprite = [];

        // Display scores to the scene
        this.printInitScores();

        // Create floor for game and spotlight purpose
        this.createGameElements(data);
    }

    createGameElements(data) {
        const   ball = this.scene.getObjectByName("ball");
        const   spot = this.scene.getObjectByName("SpotR");
        const   field = this.scene.getObjectByName("field");
        if (!ball)
            this.createBall(data.game_state.ball, this.textures["textInitBall"]);
        if (!spot)
            this.createLightFloor();
        if (!field)
            this.createPlanStadium();
        for (let i = 0; i < Object.keys(data.players).length; i++)
            this.createPaddle(data.game_state, Object.values(data.game_state.players)[i], i + 1);
        this.createStadium();
    }

    printInitScores() {
        for (let i = 0; i < this.players_nick.length; i++) {
            if (this.players_nick[i].username.length > 8)
                this.players_nick[i].truncUser = this.players_nick[i].username.substr(0, 7) + ".";
            else
                 this.players_nick[i].truncUser = this.players_nick[i].username;
        }

        // Adjust this.Array for each case (2 players / 4 players)
        if (this.players_nick.length > 2) {
            this.textArray = [`${this.players_nick[2].truncUser}` + "\n" + `${this.players_nick[3].truncUser}`,
            this.score_p2.toString(), " - ", this.score_p1.toString(),
            `${this.players_nick[0].truncUser}` + "\n" + `${this.players_nick[1].truncUser}`];
        }
        else {
            this.textArray = [`${this.players_nick[0].truncUser}`,
            this.score_p2.toString(), " - ", this.score_p1.toString(),
            `${this.players_nick[1].truncUser}`];
        }
        this.newArray = [this.textArray[0],
                        this.textArray[1] + this.textArray[2] + this.textArray[3],
                        this.textArray[4]];

        const   textGroup = this.scene.getObjectByName("textGroup");
        const   loader = new FontLoader();

        this.xPosition = 0;

        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            this.textArray.forEach((text, index) => {
                text = text
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

                let textAdd;
                if (this.nameArray[index] === "p1Nick") {
                    textAdd = new THREE.Mesh(textGeometry, this.materials["p1"]);
                    textAdd.name = this.nameArray[index];
                }
                else if (this.nameArray[index] === "p2Nick") {
                    textAdd = new THREE.Mesh(textGeometry, this.materials["p2"]);
                    textAdd.name = this.nameArray[index];
                }
                else {
                    textAdd = new THREE.Mesh(textGeometry, this.materials["scores"]);
                    textAdd.name = this.nameArray[index];
                }

                textGeometry.computeBoundingBox();
                const   boundingBox = textGeometry.boundingBox;
                const   textWidth = boundingBox.max.x - boundingBox.min.x;
                const   textHeight = boundingBox.max.y - boundingBox.min.y;
                if (this.props?.code === "40")
                    textGroup.position.y = textHeight + 25;
                else
                    textGroup.position.y = textHeight + 100;

                textAdd.position.x = this.xPosition;
                if (index === 0 || index === 3)
                    this.xPosition += textWidth + 100;
                else if (index === 2)
                    this.xPosition += 55;
                else
                    this.xPosition += textWidth + 10;
                textGroup.add(textAdd);
            });
            this.updateTextGroup();
        });
    }

    updateTextGroup(value) {
        const   textGroup = this.scene.getObjectByName("textGroup");

        if (textGroup) {
            const   box = new THREE.Box3().setFromObject(textGroup);
                textGroup.position.x = 300 + (-box.min.x + box.max.x) * 0.5;
        }
    }

     createPlanStadium() {
        // Create plane
        const   planeGeometry = new THREE.PlaneGeometry(640, 320, 40, 40);
        const   planeMaterial = new THREE.MeshPhongMaterial({
            map: this.textures["textStadium"],
            wireframe: true
        });

        const   plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = - Math.PI * 0.5;
        plane.position.set(300, -10, 140);
        plane.receiveShadow = true;
        plane.name = "field";
        const   stadium = this.scene.getObjectByName("stadium");
        stadium.add(plane);
     }

    createBall(data, texture) {
        const   geometry = new THREE.SphereGeometry(this.ball_radius, 48, 48);
        const   material = new THREE.MeshStandardMaterial({map: texture});
        const   ball = new THREE.Mesh(geometry, material);

        const   stadium = this.scene.getObjectByName("stadium");
        ball.position.set(data["x"], 0, data["y"]);
        ball.castShadow = true;
        ball.receiveShadow = true;
        ball.name = "ball";
        stadium.add(ball);
    }

    createPaddle(data, player, i) {
        const geometry = new THREE.BoxGeometry(data["paddle_width"], data["paddle_width"], data["paddle_height"]);
        let material;
        if (player.pos.x < 300) {
            material = new THREE.MeshStandardMaterial({
                map: this.textures["textPadRed"],
            });
            this.textures["textPadRed"].wrapS = THREE.RepeatWrapping;
            this.textures["textPadRed"].wrapT = THREE.RepeatWrapping;
            this.textures["textPadRed"].repeat.set(1, 6);
        }
        else {
            material = new THREE.MeshStandardMaterial({
                map: this.textures["textPadBlue"],
            });
            this.textures["textPadBlue"].wrapS = THREE.RepeatWrapping;
            this.textures["textPadBlue"].wrapT = THREE.RepeatWrapping;
            this.textures["textPadBlue"].repeat.set(1, 6);
        }
        const paddle = new THREE.Mesh(geometry, material);
        paddle.position.set(player.pos.x, 0, player.pos.y + data["paddle_height"] * 0.5);
        paddle.castShadow = true;
        paddle.name = `p${i}`;
        this.paddles[paddle.name] = paddle;
        const   stadium = this.scene.getObjectByName("stadium");
        stadium.add(paddle);
    }

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
        let     x = -30;
        let     y = 0;
        let     z = -10;
        let     step = 20;
        let     i = -1;

        while (++i < 92) {
            if (i < 32) {
                x += step;
                cube = this.createCube(x, geometry, redMaterial, blueMaterial);
                end = new THREE.Vector3(x, y, z);
            }
            else if (i >= 32 && i < 47) {
                z += step;
                cube = this.createCube(x, geometry, redMaterial, blueMaterial);
                end = new THREE.Vector3(x, y, z);
            }
            else if (i >= 47 && i < 78) {
                x -= step;
                cube = this.createCube(x, geometry, redMaterial, blueMaterial);
                end = new THREE.Vector3(x, y, z);
            }
            else {
                z -= step;
                cube = this.createCube(x, geometry, redMaterial, blueMaterial);
                end = new THREE.Vector3(x, y, z);
            }
            cubes.push(cube);
            targetPositions.push(end);
            stadium.add(cube);
        }
        this.moveCubes(cubes, targetPositions);
    }

    moveCubes(cubes, targetPositions) {
        for (let i = 0; i < cubes.length; i++) {
            const   cube = cubes[i];
            const   targetPosition = targetPositions[i];
            this.moveObjectTrans(cube, targetPosition);
            if (i === cubes.length - 1) {
                const   check = () => {
                    if (Math.abs(cube.position.x - targetPosition.x) < 0.1 &&
                    Math.abs(cube.position.y - targetPosition.y) < 0.1 &&
                    Math.abs(cube.position.z - targetPosition.z) < 0.1 && window.myPongSocket)
                        window.myPongSocket.send(JSON.stringify({"game_status": true}));
                    else
                        requestAnimationFrame(check);
                }
                check();
            }
        }
    }

    lerp(from, to, speed) {
        const   amount = (1 - speed) * from + speed * to;
        return (Math.abs(from - to) < 0.2 ? to : amount);
    }

    moveObjectTrans(object, targetPosition) {
        //    console.log("Anim not ended: ", this.cubeAnimationEnded[i]);
        let lt = new Date(),
        f = 0,
        fm = 300;

        const animate = () => {
            const   now = new Date();
            const   secs = (now - lt) / 1000;
            const   p = f / fm;

            requestAnimationFrame(animate);

            object.position.x = this.lerp(object.position.x, targetPosition.x, 0.03);
            object.position.y = this.lerp(object.position.y, targetPosition.y, 0.03);
            object.position.z = this.lerp(object.position.z, targetPosition.z, 0.03);
            f += 30 * secs;
            f %= fm;
            lt = now;
        }
        animate();
//console.log("Anim end: ", this.cubeAnimationEnded[i]);
    }

    createBlueMaterial() {
        const   material = new THREE.MeshStandardMaterial({
            map: this.textures["textBlueCube"],
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
        if (i < 300)
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

    updatePaddlePosition(data, players) {
        for (let i = 0; i < players.length; i++) {
            this.paddles[`p${i + 1}`].position.z = players[i].pos.y + data["paddle_height"] * 0.5;
        }
    }

    updateScores(gameState) {
        // Select objects
        const   text = this.scene.getObjectByName("textGroup");
        const   ball = this.scene.getObjectByName("ball");
        let     toRemove;
        this.nameArray.forEach(value => {
            toRemove = text.getObjectByName(value);
            text.remove(toRemove);
        })

        if (gameState["right_score"] != this.score_p2.toString()) {
            this.score_p2++;
            ball.material.map = this.textures["textPadBlue"];
            ball.material.needsUpdate = true;
        }
        else {
            this.score_p1++;
            ball.material.map = this.textures["textPadRed"];
            ball.material.needsUpdate = true;
        }
        this.printInitScores();
    }

    // Game loop
    animate(currentTime) { //animate()
        // exits game loop
        if (this.gameFinished || window.location.pathname !== "/pong")
            return ;

        // Calculate the time since the last frame (60fps)
        if (!this.lastFrameTime) this.lastFrameTime = currentTime; // Initialize at first call
        const elapsed = currentTime - this.lastFrameTime;

        if (elapsed > this.fpsInterval) {
            this.lastFrameTime = currentTime - (elapsed % this.fpsInterval);
                const   msg = this.scene.getObjectByName("waitTxt");
                if (msg)
                    this.waitMSGMove(msg);

                const   ball = this.scene.getObjectByName("ball");
                if (ball) {
                    this.materials["p1"].emissiveIntensity = 1 + Math.sin(Date.now() * 0.005) * 0.8;
                    this.materials["p2"].emissiveIntensity = 1 + Math.sin(Date.now() * 0.005) * 0.8;
                    this.materials["scores"].emissiveIntensity = 1 + Math.sin(Date.now() * 0.005) * 0.8;

                    if (this.gameHasStarted === true)
                        this.handleKeyEvent();
                }

            // Render scene
            this.renderer.render(this.scene, this.camera);
        }
        requestAnimationFrame(this.animate);
    }

    waitMSGMove(msg) {
        msg.rotation.y += 0.001;
        this.materials["wait"].emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.8;
    }

     onWindowResize() {
         if (window.location.pathname === "/pong") {
             const newWidth = window.innerWidth;
             const newHeight = window.innerHeight;
             const aspectRatio = newWidth / newHeight;
             this.camera.aspect = aspectRatio;

             if ((newWidth !== this.prevWidth && aspectRatio < 1.5) || (newHeight !== this.prevHeight && aspectRatio < 1.5)) {
                 const verticalFOV = this.camera.fov * (Math.PI / 180);
                 const horizontalFOV = 2 * Math.atan(Math.tan(verticalFOV * 0.5) * aspectRatio);
                 const distance = (this.sceneWidth * 0.5) / Math.tan(horizontalFOV * 0.5);
                 this.camera.position.z = -distance;
                 this.camera.position.y = ((distance * 3) * Math.tan(verticalFOV * 0.5));
                 this.camera.position.x = 300;
             }
             this.camera.updateProjectionMatrix();
             this.renderer.setSize(newWidth, newHeight);
             this.prevHeight = newHeight;
             this.prevWidth = newWidth;
         }
    }

    updateBallPosition(gameState) {
        const   ball = this.scene.getObjectByName("ball");
        const   prevPosition = new THREE.Vector3(ball.position.x, ball.position.y, ball.position.z);
        const   v = new THREE.Vector3(gameState.ball["x_vel"], 0, gameState.ball["y_vel"]);
        const   newPosition = new THREE.Vector3(gameState.ball["x"], 0, gameState.ball["y"]);

        ball.position.x = gameState.ball["x"];
        ball.position.z = gameState.ball["y"];
        if (gameState["new_round"] ||
            (prevPosition.x === newPosition.x &&
            prevPosition.z === newPosition.z)) {
            ball.rotation.x = 0;
            ball.rotation.z = 0;
            return ;
        }

        const movementVector = new THREE.Vector3(
            newPosition.x - prevPosition.x,
            newPosition.y - prevPosition.y,
            newPosition.z - prevPosition.z
        ).normalize();

        const axis = new THREE.Vector3();
        axis.crossVectors(movementVector, new THREE.Vector3(0, 1, 0)).normalize();

        const totalVelocity = Math.sqrt(gameState.ball["x_vel"] * gameState.ball["x_vel"] + gameState.ball["y_vel"] * gameState.ball["y_vel"]);

        const angle = -totalVelocity / (Math.PI * this.ball_radius) * Math.PI;

        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(axis, angle);
        ball.quaternion.multiplyQuaternions(quaternion, ball.quaternion);
    }

    // Collecting info from the game logic in the back
    display(data) {
        if (this.userIndex === 0 && this.props?.code === "40") {
            for (let i = 0; i < this.players_nick.length; i++) {
                if (this.players_nick[i].username === this.user.username) {
                    if (i % 2 === 0)
                        this.userIndex = i + 2;
                    else
                         this.userIndex = i;
                }
            }
        }
        if (data["status"] === "started") {
            this.gameHasStarted = true;
            const   ball = this.scene.getObjectByName("ball");

            this.updateBallPosition(data.game_state);
            this.updatePaddlePosition(data.game_state, Object.values(data.game_state.players));
            if (data.game_state["new_round"])
                this.updateScores(data.game_state);
        }
        else {
            this.gameHasStarted = false;
            this.winner = data["winner"];

            // Select modal message to display
            const   modal = document.getElementById("modal");
            var     msg;

            if (this.props?.code === "22" || this.props?.code === "23" || this.props?.code === "40") {//[10, 20, 22, 23, 40] 10 bot,
                if (this.winner.includes(this.user["username"]))
                    msg = `Congratulations ${this.user["username"]}, you won!`;
                else
                    msg = `${this.user["username"]} you are such a loser!`;
            }
            else {
                if (this.winner.includes(this.user["username"]))
                    msg = `Congratulations ${this.user["username"]}, you won!`;
                else if (this.props?.code === "20")
                    msg = `${this.user["username"]} you are such a loser. However, you have a very talented friend!`;
                else
                    msg = `${this.user["username"]} you are such a loser. Machines will soon dominate the world!`;
            }
            if (this.winner.includes(this.user["username"]))
                modal.style.background = "#3e783e";
            else
                modal.style.background = "#bc7575";
            modal.innerHTML = `<p>${msg}</p>`;

            if (data["tournament_name"]) {
                modal.innerHTML +=`
                <button id="back-home-btn" route="/" class="btn btn-primary">Back to dashboard</button>
                <button id="back-tournament-btn" class="btn btn-primary">Back to tournament view</button>
            `;
            }
            else {
                modal.innerHTML +=`
                    <button id="back-home-btn" route="/" class="btn btn-primary">Back to dashboard</button>
                    <button id="new-game-btn" class="btn btn-primary">Play again</button>
                `;
            }
            const   homeBtn = document.getElementById("back-home-btn");
            if (homeBtn) {
                homeBtn.addEventListener("click", () => {
                    this.gameFinished = true;
                    this.loseContextExtension.loseContext();
                });
            }
            const   backTournamentView = document.getElementById("back-tournament-btn");
            if (backTournamentView) {
                backTournamentView.addEventListener("click", () => {
                    this.gameFinished = true;
                    this.loseContextExtension.loseContext();
                    appRouter.navigate(`/tournament/${data['tournament_name']}`);
                });
            }
            const   restart = document.getElementById("new-game-btn");
            if (restart) {
                restart.addEventListener("click", () => {
                    const csrfToken = getCookie('csrftoken');
                    fetch(`https://${window.location.hostname}:8443/game/${this.props?.game}/${this.props?.code}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken
                        },
			            credentials: 'include'
		            })
                    .then(response => response.json().then(data => ({ok: response.ok, data})))
                    .then(({ok, data}) => { console.log("data fetch replay: ", data);
                        if (!ok) {
                            const toastComponent = new ToastComponent();
                            toastComponent.throwToast("Error", data.message || "Something went wrong", 5000, "error");
                        } else {
                            // Lose the context to free up resources
                            data.code = `${this.props?.code}`;
                            const params = new URLSearchParams(data).toString();
                            this.loseContextExtension.loseContext();
                            this.gameFinished = true;
                            appRouter.navigate(`/${this.props?.game}?${params}`);
                            const socket = window.mySocket;
                            socket.send(JSON.stringify({
                                'type': 'join_match',
                                'user_id': this.user.id
					        }));
				        }
			        })
                    .catch(error => {
                        console.error("Error fetching new game request: ", error);
                        const toastComponent = new ToastComponent();
                        toastComponent.throwToast("Error", "Network error or server is unreachable", 5000, "error");
                    });
                });
            }

            // remove event listeners + close socket
            this.removeEventListeners();
            window.myPongSocket.close();
            window.myPongSocket = null;

            modal.classList.add("rounded", "border", "border-dark", "border-3");
			modal.hidden = false;
        }
    }

    removeEventListeners() {
        window.removeEventListener("keydown", this.onKeyDown.bind(this));
        window.removeEventListener("keyup", this.onKeyUp.bind(this));
        window.removeEventListener("resize", this.onWindowResize.bind(this));
    }

    setupEventListeners() {
        this.removeEventListeners(); // Remove existing event listeners
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));
        window.addEventListener("resize", this.onWindowResize.bind(this));
        const returnBtn = document.getElementById('returnHomeBtn')
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                console.log("click on return home");
                const errorModal = bootstrap.Modal.getInstance(document.getElementById('ErrorModal'));
                if (errorModal) {
                    console.log("hide error modal");
                    errorModal.hide();
                }
                appRouter.navigate("/dashboard");
            });
        }
    }

    render() {
        this.initializeWs(this.props);

        return `
            <div style="width: 100%; height: 100%; position: relative;" id="display">
                <div id="modal" class="w-fit h-fit div-centered text-center p-3">
                </div>
            </div>
            
            <!-- Unauthorized modal -->
			<div class="modal fade" id="ErrorModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-hidden="true">
				<div class="modal-dialog">
					<div class="modal-content">
						<div id="errorModalBody" class="modal-body"></div>
						<div class="modal-footer">
							<button id="returnHomeBtn" type="button" class="btn btn-outline-primary" data-bs-dismiss="modal">Return home</button>
						</div>
					</div>
				</div>
			</div>
        `;
    }
}
