import * as THREE from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {initializePongWebSocket} from "../functions/websocket.js";
import {DirectionalLight, SpotLight, Clock} from 'three';

export default class MatchPong {
    constructor(props) {
        this.props = props;
        initializePongWebSocket(this);
    }

    init () {
    //-------- ----------
// SCENE, CAMERA, RENDERER, LIGHT    https://dustinpfister.github.io/2022/05/17/threejs-vector3-lerp/
//-------- ---------- Use lerpPow to add speed to some cubes
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 4 / 3, 0.5, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(640, 480, false);
(document.getElementById('demo') || document.body).appendChild(renderer.domElement);
scene.add(camera);
const light = new THREE.PointLight(0xffffff);
light.position.set(1, 2, 4);
scene.add(light);
//-------- ----------
// SCENE CHILDREN
//-------- ----------
scene.add(new THREE.GridHelper(10, 10, 0xffffff, 0xffffff));
const geo = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00
    });
const mesh = new THREE.Mesh(geo, material);
const mesh1 = new THREE.Mesh(geo, material);
scene.add(mesh, mesh1);
//-------- ----------
// LOOP
//-------- ----------
camera.position.set(8, 8, 8);
camera.lookAt(0, 0, 0);
let lt = new Date(),
f = 0,
fm = 200;
const loop = function () {
    const now = new Date();
    const secs = (now - lt) / 1000;
    const p = f / fm,
    b = 1 - Math.abs(0.5 - p) / 0.5;
    requestAnimationFrame(loop);
    // BASIC LERP EXPRESSION between 5,0,0 and -5,0,0
    mesh.position.set(5, 0, 0).lerp(new THREE.Vector3(-5, 0, 0), b);
    mesh1.position.set(5, 0, -1).lerp(new THREE.Vector3(-5, 0, 1), b);

    // render
    renderer.render(scene, camera);
    f += 30 * secs;
    f %= fm;
    lt = now;
};
loop();

    }

//    init() { // For responside device check the Resizer class: https://discoverthreejs.com/book/first-steps/world-app/#components-the-cube-module
//
////        this.y_pos_p1 = 0;  // left player
////        this.y_pos_p2 = 0;  // right player
////        this.stadium_length = 25;
////        this.stadium_width = 10;
////        this.stadium_height = 1;
////        this.stadium_thickness = 0.25;
////        this.paddle_length = 2;
//
//        // Ball initial stats
////        this.ball_x = 0;
////        this.ball_y = 0;
////        this.ball_radius = 1;
////        const   initialSpeed = 0.2;
////        this.baseSpeed = initialSpeed;
////        this.currentSpeed = this.baseSpeed;
////        this.ball_velocity_x = this.currentSpeed * ((Math.random() - 0.5));
////        this.ball_velocity_y = this.currentSpeed * ((Math.random() - 0.5));
//
//        this.scene = new THREE.Scene();
//        this.scene.background = new THREE.Color(0x000000);
//
//        // Camera
//        this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1500);
//        this.camera.position.set(0, 400, 1000);
//        this.scene.fog = new THREE.Fog(0x000000, 250, 1400);
//        this.camera.lookAt(0, 250, 0);
//
//        // Renderer
//        this.renderer = new THREE.WebGLRenderer();
//        this.renderer.setSize(window.innerWidth, window.innerHeight);
//        this.renderer.shadowMap.enabled = true;
//        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
//        document.body.appendChild(this.renderer.domElement);
//
//        // Create stade group with all objetcs so when rotate everything follows
//        const   stadiumGroup = new THREE.Group();
//        // stadiumGroup.rotation.set(45, 0, 0);
//        const   stadium = new THREE.Object3D();
//        stadium.name = "stadium";
//        stadiumGroup.add(stadium);
//        this.scene.add(stadiumGroup);
//
//        // Display text from the beginning
//        const    textGroup = new THREE.Group();
//        textGroup.rotation.set(0, 0, 0);
//        textGroup.name = "textGroup";
//        this.scene.add(textGroup);
//
//        // Resize scene
//        window.addEventListener('resize', () => {
//            this.camera.aspect = window.innerWidth / window.innerHeight;
//            this.camera.updateProjectionMatrix();
//            this.renderer.setSize(window.innerWidth, window.innerHeight);
//        });
//
//        this.animate = this.animate.bind(this);
//        this.animate();
//    }

    createLightFloor() {
        // Create plane
        const   planeGeometry = new THREE.PlaneGeometry(2000, 2000);
        const   planeMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff
        });
        const   plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = - Math.PI * 0.5;
        plane.position.y = 200;
        plane.receiveShadow = true;
        this.scene.add(plane);

        const   spotLight = new SpotLight(0xffffff, 5000000)
        spotLight.position.set(0, 600, 700)
        spotLight.lookAt(0, 250, 0);
        spotLight.angle = .5; // change it for higher or lower coverage of the spot
        spotLight.penumbra = 0.75;
        spotLight.castShadow = true;
        spotLight.shadow.radius = 10;
        spotLight.shadow.blurSamples = 10;
        spotLight.shadow.camera.far = 1500;
        spotLight.shadow.camera.near = 10;
        // spotLight.shadow.camera.fov = 30;

        this.scene.add(spotLight);
    }


    waiting() {
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
        const   textGroup = new THREE.Group();
        textGroup.position.y = 300;
        textGroup.name = "waitTxt";
        this.scene.add(textGroup);

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

            textGroup.add(textAdd, mirror);

            const animate = () => {
                requestAnimationFrame(animate);
                textAdd.material.emissiveIntensity = 3 + Math.sin(Date.now() * 0.005) * 3;
            };
            animate();
        });
    }

    builGameSet(data) {
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
            if (this.players_nick[i].length > 6) {
                this.players_nick[i] = this.players_nick[i].substr(0, 5) + ".";
            }
        }

        // Adjust this.Array for each case (2 players / 4 players)
        if (this.players_nick.length > 2) {
            this.textArray = [`${this.players_nick[0]} + "\n" + ${this.players_nick[1]}`,
            this.score_p1.toString(), "-", this.score_p2.toString(),
            `${this.players_nick[2]} + "\n" + ${this.players_nick[3]}`];
        }
        else {
            this.textArray = [`${this.players_nick[0]}`,
            this.score_p1.toString(), "-", this.score_p2.toString(),
            `${this.players_nick[1]}`];
        }

        // Display scores to the scene
        this.printInitScores();

        // Create floor for game and spotlight purpose
        this.createLightFloor();
        this.createGameElements();

        // rotate stadium
        const   stadium = this.scene.getObjectByName("stadium");
        stadium.rotation.set(0.5, 0 ,0);
    }

    async createGameElements() { //3000

        await this.createStadium();

//        this.createPaddle('p1');
//        this.createPaddle('p2');
//        this.createBall();
    }

    printInitScores() { //https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_ttf.html try it
    //https://discourse.threejs.org/t/different-textures-on-each-face-of-cube/23700 onWResize
    //https://github.com/Fasani/three-js-resources?tab=readme-ov-file#images
    // bloom https://threejs.org/examples/#webgl_postprocessing_unreal_bloom

        const   textGroup = this.scene.getObjectByName("textGroup");
        const   loader = new FontLoader();

        this.xPosition = 0;

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
                textGroup.position.y = 130 + (0.5 * window.innerHeight) - textHeight;

                textAdd.position.x = this.xPosition;
                if (index === 0 || index === 3)
                    this.xPosition += textWidth + 250;
                else
                    this.xPosition += textWidth + 10;
                textGroup.add(textAdd);

                if (index === 4)
                    textGroup.position.x = -(this.xPosition / 2);

                // Add a pulsing effect
                const animate = () => {
                    requestAnimationFrame(animate);
                    if (textAdd.name === "p1Nick" || textAdd.name === "p2Nick")
                        textAdd.material.emissiveIntensity = 1 + Math.sin(Date.now() * 0.005) * 0.8;
                    else
                        textAdd.material.emissiveIntensity = 1 + Math.sin(Date.now() * 0.005) * 0.8;
                };
                animate();
            });
        });
    }

     handleKeyEvent(event) {
        const   key = event.key;
        const   isKeyDown = event.type === 'keydown';
        const   speed = 0.2;
        const   stadium = this.scene.getObjectByName("stadium");

        switch (key) {
            case 'z':
                this.y_pos_p1 = isKeyDown ? speed : 0;
                break;
            case 's':
                this.y_pos_p1 = isKeyDown ? -speed : 0;
                break;
            case 'ArrowUp':
                this.y_pos_p2 = isKeyDown ? speed : 0;
                break;
            case 'ArrowDown':
                this.y_pos_p2 = isKeyDown ? -speed : 0;
                break;
        }
    }

    createBall() {
        const   textureLoader = new THREE.TextureLoader();
        const   ballTexture = textureLoader.load('/football.jpg');

        const geometry = new THREE.SphereGeometry(this.ball_radius, 48, 48);
        const material = new THREE.MeshStandardMaterial({map: ballTexture});
        const ball = new THREE.Mesh(geometry, material);
        ball.position.set(this.ball_x, this.ball_y, 0);
        ball.name = 'ball';
        const   stadium = this.scene.getObjectByName("stadium");
        stadium.add(ball);
    }

    createPaddle(player = 'p1') {
        const geometry = new THREE.BoxGeometry(0.2, this.paddle_length, 1);
        let x = Math.round(-this.stadium_length / 2);
        let color = 0xff0000;
        if (player === 'p2') {
            x = Math.round(this.stadium_length / 2 - 1);
            color = 0x0000ff;
        }
        const material = new THREE.MeshStandardMaterial({color: color});
        const paddle = new THREE.Mesh(geometry, material);
        paddle.position.set(x, 0, 0);
        paddle.name = player;
        const   stadium = this.scene.getObjectByName("stadium");
        stadium.add(paddle);
    }

    // Create blocks all around + needs floor + animation
    createStadium() {
        return new Promise(async (resolve) => {
            const   stadium = this.scene.getObjectByName("stadium");
            const   cubes = [];
            const   targetPositions = [];
            let     cube;
            let     end;
            let     x = -160;
            let     y = 450;
            let     z = 150;
            let     step = 10;

            for (let i = 0; i < 96; i++) {
                if (i < 36) {
                    cube = this.createCube(x);
                    end = new THREE.Vector3(x, y, z);
                    x += step;
                }
                else if (i >= 36 && i < 48) { // 12
                    cube = this.createCube(x);
                    end = new THREE.Vector3(x, y, z);
                    z -= step;
                }
                else if (i >= 48 && i < 84) {
                    cube = this.createCube(x);
                    end = new THREE.Vector3(x, y, z);
                    x -= step;
                }
                else {
                    cube = this.createCube(x);
                    end = new THREE.Vector3(x, y, z);
                    z += step;
                }
                cubes.push(cube);
                targetPositions.push(end);
                stadium.add(cube);
            }

            await this.stadiumCreation(cubes, targetPositions);
            // stadium.rotation.x = Math.PI * 0.25;
            // if needed for the backend regroup cubes in a mesh for boxBounding and detect colisions in here
            resolve();
        });
    }

    //            const   animate = () => { //https://dustinpfister.github.io/2022/05/17/threejs-vector3-lerp/
//            //https://codepen.io/prisoner849/pen/qzZaye?editors=0010
//            // https://sbcode.net/threejs/lerp/


    stadiumCreation(cubes, targetPositions) {
        return new Promise((resolve) => {
            // Array of ending positions
            // const targetPositions = [
            //     new THREE.Vector3(-100, 350, 400), // z variation => profondeur
            //     new THREE.Vector3(-100, 350, 390),
            //     new THREE.Vector3(-80, 330, 380), // y variation => hauteur
            //     new THREE.Vector3(-80, 320, 380),
            //     new THREE.Vector3(-60, 310, 360),
            // ];

            for (let i = 0; i < cubes.length; i++) { // cubes.legnth
                const cube = cubes[i];
                const targetPosition = targetPositions[i];
                const delay = i * 500; // 0.5s delay between each cube's movement

                setTimeout(() => {
                    this.moveCube(cube, targetPosition, 2000);
                }, delay);
            }
            resolve();
        });
    }

    moveCube(cube, targetPosition, duration) {
        const startPosition = cube.position.clone();
        const startTime = performance.now();

        const animate = () => {
            const elapsedTime = performance.now() - startTime;
            const t = Math.min(elapsedTime / duration, 1);
            cube.position.lerpVectors(startPosition, targetPosition, t);
            if (t < 1) {
                requestAnimationFrame(animate);
            }
        }
        animate();
    }

    createBlueMaterial() {
        // create a texture loader.
        const   textureLoader = new THREE.TextureLoader();

        // load a texture
        const   texture = textureLoader.load("/blue_wall.jpg");
        const   material = new THREE.MeshStandardMaterial({map: texture});

        return material;
    }

    createRedMaterial() {
        // create a texture loader.
        const   textureLoader = new THREE.TextureLoader();

        // load a texture
        const   texture = textureLoader.load("/red_wall.png");
        const   material = new THREE.MeshStandardMaterial({map: texture});

        return material;
    }

    createCube(i) {
        const   geometry = new THREE.BoxGeometry(10, 10, 10);
        let     material;
        if (i >= 0) {
            material = this.createBlueMaterial();
        }
        else {
            material = this.createRedMaterial();
        }

        const   cube = new THREE.Mesh(geometry, material);
        cube.castShadow = true;
        cube.receiveShadow = true;

        // Create cubes starting points
        const   startPositions = [];
        const   s1 = new THREE.Vector3(1500,0, 0);
        const   s2 = new THREE.Vector3(0, 1500, 0);
        const   s3 = new THREE.Vector3(0, 0, 1500);
        startPositions.push(s1, s2, s3);

        const   start = Math.floor(Math.random() * 3);
        cube.position.set(startPositions[start].x, startPositions[start].y, startPositions[start].z);
        return  cube;
    }

    updatePaddlePosition(player, y_pos) {
        const paddle = this.scene.getObjectByName(player);
        if (paddle) {
            const offset = this.paddle_length / 2;
            if ((paddle.position.y + y_pos + offset) > this.stadium_width / 2 || (paddle.position.y + y_pos - offset) < -this.stadium_width / 2) {
                return;
            }
            paddle.position.y += y_pos;
        }
    }

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
        this.updatePaddlePosition('p1', this.y_pos_p1);
        this.updatePaddlePosition('p2', this.y_pos_p2);

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


        this.updateBallPosition();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }


    waitMSGMove(msg) {
        msg.rotation.y += 0.001;
    }

    updateBallPosition() {
        const ball = this.scene.getObjectByName('ball');

        if (ball) {
            // Update position
            if (this.ball_velocity_x !== 0 || this.ball_velocity_y !== 0) {
                ball.position.x += this.ball_velocity_x;
                ball.position.y += this.ball_velocity_y;

                // Calculate the direction of movement
                const movementDirection = new THREE.Vector2(this.ball_velocity_x, this.ball_velocity_y);
                const movementLength = movementDirection.length();

                // Normalize the direction vector to get the direction of rotation
                movementDirection.normalize();

                // Ball rotation towards its movement
                const rotationAxis = new THREE.Vector3(-movementDirection.y, movementDirection.x, 0);
                const rotationAngle = movementLength / ball.geometry.parameters.radius;

                // Apply the rotation to the ball
                ball.rotateOnWorldAxis(rotationAxis, rotationAngle);

                // Increase ball speed over time
                this.currentSpeed *= 1.0005;
                this.ball_velocity_x = movementDirection.x * this.currentSpeed;
                this.ball_velocity_y = movementDirection.y * this.currentSpeed;

                if (this.ball_velocity_x === 0)
                    this.newRound();

                // Check for collisions
                this.checkCollisions(ball);
            }
        }
    }

    async checkCollisions(ball) {
        // Check for collisions with paddles
        const paddle1 = this.scene.getObjectByName('p1');
        const paddle2 = this.scene.getObjectByName('p2');
        if (paddle1 && paddle2) {
            if (ball.position.x - this.ball_radius < paddle1.position.x + 0.2 && ball.position.y <= paddle1.position.y + this.paddle_length / 2 && ball.position.y >= paddle1.position.y - this.paddle_length / 2) {
                this.ball_velocity_x = -this.ball_velocity_x;
            }
            if (ball.position.x + this.ball_radius > paddle2.position.x - 0.2 && ball.position.y <= paddle2.position.y + this.paddle_length / 2 && ball.position.y >= paddle2.position.y - this.paddle_length / 2) {
                this.ball_velocity_x = -this.ball_velocity_x;
            }
        }

        // Check for collisions with walls
        if (ball.position.y + this.ball_radius > this.stadium_width / 2 || ball.position.y - this.ball_radius < -this.stadium_width / 2) {
            this.ball_velocity_y = -this.ball_velocity_y;
        }
        // Player 2 wins the round
        if (ball.position.x - this.ball_radius < -this.stadium_length / 2) {
            ball.position.set(0, 0, 0);
            this.ball_velocity_x = 0;
            this.ball_velocity_y = 0;
            await this.rotateScore(2);
            this.score_p2++;
            this.textArray[3] = this.score_p2.toString();
            this.updateScores();
            // // if (this.score_p2 === 5)
            // //     ;
            this.newRound();
        }
        // Player 1 wins the round
        else if (ball.position.x + this.ball_radius > this.stadium_length / 2) {
            ball.position.set(0, 0, 0);
            this.ball_velocity_x = 0;
            this.ball_velocity_y = 0;
            await this.rotateScore(1);
            this.score_p1++;
            this.textArray[1] = this.score_p1.toString();
            this.updateScores();
            // // if (this.score_p1 === 5)
            // //     this.scene.remove(ball);
            // //    ;
            this.newRound();
        }
    }

    newRound() {
        this.ball_x = 0;
        this.ball_y = 0;
        this.currentSpeed = this.baseSpeed;
        this.ball_velocity_x = this.currentSpeed * ((Math.random() - 0.5));
        this.ball_velocity_y = this.currentSpeed * ((Math.random() - 0.5));

        const ball = this.scene.getObjectByName('ball');
        ball.position.set(this.ball_x, this.ball_y, 0);
    }

    setupEventListeners() {}

}








var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');

	context.font = "bold 20px Serif";
	context.textAlign = "left";
	context.textBaseline = "top";
	context.fillStyle = "#ff0000";
	context.fillText("Sample Text", 0, 0);

	var texture = new THREE.Texture(canvas);
	texture.needsUpdate = true;

	var material = new THREE.SpriteMaterial({
		map: texture,
		useScreenCoordinates: false,
	 	alignment: THREE.SpriteAlignment.center,
	 	transparent: true
	});
	var sprite = new THREE.Sprite(material);

	sprite.scale.set(100, 100, 1);
	scene.add(sprite);
















