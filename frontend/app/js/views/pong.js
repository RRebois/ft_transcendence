import * as THREE from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {initializePongWebSocket} from "@js/functions/websocket.js";
import {SpotLight} from 'three';
import * as bootstrap from "bootstrap";

export default class PongGame {
    constructor(props) {
        this.game_finished = false;
        this.props = props;
        this.user = props?.user;
        this.winner = null;
        this.gameSocket = null;
        this.setUser = this.setUser.bind(this);
        this.sceneWidth = 600;
        this.prevWidth = window.innerWidth;
        this.prevHeight = window.innerHeight;

        document.addEventListener('DOMContentLoaded', this.setupEventListeners.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    setUser(user) {
        this.user = user;
    }

    addProps(newProps) {
		this.props = {...this.props, ...newProps};
	}

    setProps(newProps) {
        this.props = newProps;
    }

    initializeWs = async (gameCode) => {
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

    init() {
        document.title = "ft_transcendence | Pong";
        modal.hidden = true;

        // Load all textures at once
        this.textures = {};
        const   textureLoader = new THREE.TextureLoader();
        const   textStadium = textureLoader.load("/textures/grass/grass_BaseColor.jpg");
        const   textInitBall = textureLoader.load("/textures/football.jpg");
        const   textBlueCube = textureLoader.load("/textures/blue_basecolor.png");
        const   textRedCube = textureLoader.load("/textures/red_basecolor.png");
        const   textPadBlue = textureLoader.load("/textures/ice/ice_basecolor.png");
        const   textPadRed = textureLoader.load("/textures/lava/lava_basecolor.jpg");

        const   three = textureLoader.load("three.png")

        this.textures["textStadium"] = textStadium;
        this.textures["textInitBall"] = textInitBall;
        this.textures["redBall"] = textInitBall;
        this.textures["blueBall"] = textInitBall;
        this.textures["textBlueCube"] = textBlueCube;
        this.textures["textRedCube"] = textRedCube;
        this.textures["textPadBlue"] = textPadBlue;
        this.textures["textPadRed"] = textPadRed;

        // Load all materials
        this.materials = {};
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

        this.paddles = {};
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 7000);
        const aspectRatio = window.innerWidth / window.innerHeight;
        const verticalFOV = this.camera.fov * (Math.PI / 180);
        const horizontalFOV = 2 * Math.atan(Math.tan(verticalFOV * 0.5) * aspectRatio);
        const distance = (this.sceneWidth * 0.5) / Math.tan(horizontalFOV * 0.5);
        this.camera.position.set(300, ((distance * 3) * Math.tan(verticalFOV * 0.5)), -distance);
        this.scene.fog = new THREE.Fog(0x000000, -300, 1500);
        this.camera.lookAt(300, -100, 300);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const   container = document.getElementById("display");
        container.appendChild(this.renderer.domElement);

        // Create stade group with all objetcs so when rotate everything follows
        const   stadiumGroup = new THREE.Group();
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
        this.keyMap = {};

        this.animate = this.animate.bind(this);
        this.animate();
    }

    onKeyDown(event) {
        if (window.location.pathname === "/pong") {
            this.keyMap[event.key] = true;
        }
    }

    onKeyUp(event) {
        if (window.location.pathname === "/pong") {
            delete this.keyMap[event.key];
        }
    }

     handleKeyEvent() {
        if (this.keyMap['w'] === true)
            this.gameSocket.send(JSON.stringify({"player_move": { "player": 2, "direction": 1}}));
        if (this.keyMap['s'] === true)
            this.gameSocket.send(JSON.stringify({"player_move": { "player": 2, "direction": -1}}));
        if (this.keyMap['ArrowUp'] === true)
            this.gameSocket.send(JSON.stringify({"player_move": { "player": 1, "direction": 1}}));
        if (this.keyMap['ArrowDown'] === true)
            this.gameSocket.send(JSON.stringify({"player_move": { "player": 1, "direction": -1}}));
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
            const   planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
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
                    size: 85,
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
        this.players_nick.push(data.game_state.players.player2["name"]);
        this.players_nick.push(data.game_state.players.player1["name"]);

        if (Object.keys(data.players).length > 2) {
            this.players_nick.push(data.game_state.players.player4["name"]);
            this.players_nick.push(data.game_state.players.player3["name"]);
        }

        this.sprite = [];

        // Display scores to the scene
        this.printInitScores();

        // Create floor for game and spotlight purpose
        this.createGameElements(data);
    }

    createGameElements(data) {
        this.createBall(data.game_state.ball, this.textures["textInitBall"]);
        this.createLightFloor();
        this.createPlanStadium();
        for (let i = 0; i < Object.keys(data.players).length; i++)
            this.createPaddle(data.game_state, Object.values(data.game_state.players)[i], i + 1);
        this.createStadium();
    }

    printInitScores() {
        for (let i = 0; i < this.players_nick.length; i++) {
            if (this.players_nick[i].length > 8) {
                this.players_nick[i] = this.players_nick[i].substr(0, 7) + ".";
            }
        }

        // Adjust this.Array for each case (2 players / 4 players)
        if (this.players_nick.length > 2) {
            this.textArray = [`${this.players_nick[2]}` + "\n" + `${this.players_nick[3]}`,
            this.score_p2.toString(), " - ", this.score_p1.toString(),
            `${this.players_nick[0]}` + "\n" + `${this.players_nick[1]}`];
        }
        else {
            this.textArray = [`${this.players_nick[0]}`,
            this.score_p2.toString(), " - ", this.score_p1.toString(),
            `${this.players_nick[1]}`];
        }
        this.newArray = [this.textArray[0],
                        this.textArray[1] + this.textArray[2] + this.textArray[3],
                        this.textArray[4]];

        const   textGroup = this.scene.getObjectByName("textGroup");
        const   loader = new FontLoader();

        this.xPosition = window.innerWidth;

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
                this.updateTextGroup(this.xPosition);
            });
        });
    }

    updateTextGroup(value) {
        const   textGroup = this.scene.getObjectByName("textGroup");
        if (textGroup)
            textGroup.position.x = value - 100;
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
            const cube = cubes[i];
            const targetPosition = targetPositions[i];
            this.moveObjectTrans(cube, targetPosition);
        }
    }

    lerp(from, to, speed) {
        const   amount = (1 - speed) * from + speed * to;
        return (Math.abs(from - to) < 0.2 ? to : amount);
}

    moveObjectTrans(object, targetPosition) {
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

    animate() {
        requestAnimationFrame(this.animate);

        const   msg = this.scene.getObjectByName("waitTxt");
        if (msg) {
            this.waitMSGMove(msg);
            this.materials["wait"].emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.8;
        }

        this.materials["p1"].emissiveIntensity = 1 + Math.sin(Date.now() * 0.005) * 0.8;
        this.materials["p2"].emissiveIntensity = 1 + Math.sin(Date.now() * 0.005) * 0.8;
        this.materials["scores"].emissiveIntensity = 1 + Math.sin(Date.now() * 0.005) * 0.8;

        this.handleKeyEvent();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    waitMSGMove(msg) {
        msg.rotation.y += 0.001;
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
//         console.log(data);
        const   ball = this.scene.getObjectByName("ball");

        this.updateBallPosition(data.game_state);
        this.updatePaddlePosition(data.game_state, Object.values(data.game_state.players));
        if (data.game_state["new_round"])
            this.updateScores(data.game_state);
        if (this.score_p2 === data.game_state["winning_score"] || this.score_p1 === data.game_state["winning_score"]) {
            console.log("game finished");
            this.winner = ["superuser", "rrebois"];//data.game_status["winner"];
//            this.game_finished = true;

            // Select modal message to display
            const   modal = document.getElementById("modal");
            console.log(this.winner);
            console.log(this.user["username"]);
            console.log("code: ", this.props?.code);
            var     msg;

            if (this.props?.code === 22 || this.props?.code === 40) {
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
                    msg = `${this.user["username"]} you are such a loser!`;
            }
            if (this.winner.includes(this.user["username"]))
                modal.style.background = "#3e783e";
            else
                modal.style.background = "#bc7575";
            modal.innerHTML = `<p>${msg}</p>`;

            // Add buttons to modal + listeners
// gameCode, this.props?.session_id, this

            if (data.game_state["tournament"]) {
                modal.innerHTML +=`
                <button id="back-home-btn" route="/" class="btn btn-primary">Back to dashboard</button>
                <button id="new-game-btn" route="/" class="btn btn-primary">Back to tournament view</button> // to complete
            `;
            }
            else {
                modal.innerHTML +=`
                    <button id="back-home-btn" route="/" class="btn btn-primary">Back to dashboard</button>
                    <button id="new-game-btn" class="btn btn-primary">Play again</button>
                `;
            }
            const   restart = document.getElementById("new-game-btn");
            restart.addEventListener("click", () => { console.log("data sent");
                this.gameSocket.send(JSON.stringify({"restart": true}));
            });
            modal.style.border = "5px solid black";
			modal.hidden = false;
        }
    }

    setupEventListeners() {
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));
    }

    render() { //https://en.threejs-university.com/2021/08/03/chapter-7-sprites-and-particles-in-three-js/
        this.initializeWs(this.props?.code);

        return `
            <div style="width: 100%; height: 100%; position: relative;" id="display">
                <div id="modal" class="w-fit h-fit div-centered">
                </div>
            </div>
        `;
    }
}
