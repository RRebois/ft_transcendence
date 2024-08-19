import * as THREE from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';

export default class Match {
    constructor(props) {
        this.props = props;
        this.init();
    }

    init() {

        this.player1_nickname = 'player1';
        this.player2_nickname = 'player2';
        this.xPosition = 0;
        this.score_p1 = 0;
        this.score_p2 = 0;
        this.textArray = [`${this.player1_nickname}`, this.score_p1.toString(), "-", this.score_p2.toString(),
                        `${this.player2_nickname}`];
        this.nameArray = ["p1Nick", "p1Score", "hyphen", "p2Score", "p2Nick"];
        this.y_pos_p1 = 0;  // left player
        this.y_pos_p2 = 0;  // right player
        this.stadium_length = 25;
        this.stadium_width = 10;
        this.stadium_height = 1;
        this.stadium_thickness = 0.25;
        this.paddle_length = 2;

        // Ball initial stats
        this.ball_x = 0;
        this.ball_y = 0;
        this.ball_radius = 1;
        const   initialSpeed = 0.2;
        this.baseSpeed = initialSpeed;
        this.currentSpeed = this.baseSpeed;
        this.ball_velocity_x = this.currentSpeed * ((Math.random() - 0.5));
        this.ball_velocity_y = this.currentSpeed * ((Math.random() - 0.5));

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

       // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 50);
//        this.camera.rotation
        this.camera.lookAt(0, 0, 0);

       // Renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

       // Create stade group with all objetcs so when rotate everything follows
        const   stadiumGroup = new THREE.Group();
        const   stadium = new THREE.Object3D();
        stadium.name = "stadium";
        stadiumGroup.add(stadium);
        this.scene.add(stadiumGroup);

        // Create Euler for saving initial rotation values of stadium
//        this.initialStadiumRotation = new THREE.Euler();
//        this.initialStadiumRotation.z = stadium.rotation.z;

        this.createStadium();
        this.createPaddle('p1');
        this.createPaddle('p2');
        this.createBall();

        const   textGroup = new THREE.Group();
        textGroup.rotation.set(20, 0, 0);
        textGroup.name = "textGroup";
        this.scene.add(textGroup);
        this.printInitScores();

        textGroup.position.y = 30;

        // Controls pad
        window.addEventListener('keydown', this.handleKeyEvent.bind(this));
        window.addEventListener('keyup', this.handleKeyEvent.bind(this));

        // Resize scene
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Animate
        this.animate = this.animate.bind(this);
        this.animate();
    }

    printInitScores() { //https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_ttf.html try it
    //https://discourse.threejs.org/t/different-textures-on-each-face-of-cube/23700 onWResize
    //https://github.com/Fasani/three-js-resources?tab=readme-ov-file#images
    // bloom https://threejs.org/examples/#webgl_postprocessing_unreal_bloom
        const   textGroup = this.scene.getObjectByName("textGroup");
        const   loader = new FontLoader();
        this.xPosition = 0;

        // vecto to get coords of text and center it on scene
        var center= new THREE.Vector3();
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            this.textArray.forEach((text, index) => {
                if (index === 0)
                    text = "Team 1\n" + text
                else if (index === 4)
                    text = "Team 2\n" + text
                const textGeometry = new TextGeometry(text, {
                    font: font,
                    size: 7,
                    depth: .8,
                    hover: 30,
                    curveSegments: 4,
                    bevelThickness: 2,
                    bevelSize: 1.5,
                });

                // Material for nicknames
                const nickTextMaterialP1 = new THREE.MeshStandardMaterial({
                    color: 0xdc143c,
                    emissive: 0xff0000,
                    roughness: 0,
                    metalness: 0.555,
                });

                const nickTextMaterialP2 = new THREE.MeshStandardMaterial({
                    color: 0x1f51ff,
                    emissive: 0x009afa,
                    roughness: 0,
                    metalness: 0.555,
                });

                // Material for scores
                const textMaterial = new THREE.MeshStandardMaterial({
                    color: 0x8cff00,
                    emissive: 0x00ff00, // Green light
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
                const boundingBox = textGeometry.boundingBox;
                const textWidth = boundingBox.max.x - boundingBox.min.x;

                textAdd.position.x = this.xPosition;
                if (index === 0 || index === 3)
                    this.xPosition += textWidth + 5;
                else
                    this.xPosition += textWidth + 1.5;
                textGroup.add(textAdd);

                if (index === 4)
                    textGroup.position.x = -(this.xPosition / 2);

                // Add a pulsing effect
                const animate = () => {
                    requestAnimationFrame(animate);
                    if (textAdd.name === "p1Nick" || textAdd.name === "p2Nick")
                        textAdd.material.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
                    else
                        textAdd.material.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
                };
                animate();
            });
        });
    }

//    reset_stadium_view() {
//        // return new Promise((resolve) => {
//            const   stadium = this.scene.getObjectByName("stadium");
//            const   stadiumSpeed = 0.05;
//            // Check if the stadium is in initial pos
//            if (Math.abs(stadium.rotation.z - this.initialStadiumRotation.z) > 0.01) {
//                stadium.rotation.z += (this.initialStadiumRotation.z - stadium.rotation.z) * stadiumSpeed;
//
//                // Ensure the stadium stops exactly at the target rotation
//                if (Math.abs(this.initialStadiumRotation.z - stadium.rotation.z) < 0.01) {
//                    stadium.rotation.z = this.initialStadiumRotation.z;
//                    resolve();
//                }
//                requestAnimationFrame(animate);
//            }
//            // Start the animation
//            animate();
//        // });
//    }

     handleKeyEvent(event) {
        const   key = event.key;
        const   isKeyDown = event.type === 'keydown';
        const   speed = 0.2;
        const   stadium = this.scene.getObjectByName("stadium");

        switch (key) {
            case 'z':
                this.y_pos_p1 = isKeyDown ? speed : 0;
                break;
//            case 'r': // Stop reseting on keyup
//                this.reset_stadium_view();
//                break;
            case 'q':
                this.y_pos_p1 = isKeyDown ? speed : 0;
                break;
            case 's':
                this.y_pos_p1 = isKeyDown ? -speed : 0;
                break;
            case '-':
                break;
            case 'a':
                stadium.rotation.z += 0.03;
                break;
            case 'e':
                stadium.rotation.z -= 0.03;
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
        const material = new THREE.MeshBasicMaterial({map: ballTexture});
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
        const material = new THREE.MeshBasicMaterial({color: color});
        const paddle = new THREE.Mesh(geometry, material);
        paddle.position.set(x, 0, 0);
        paddle.name = player;
        const   stadium = this.scene.getObjectByName("stadium");
        stadium.add(paddle);
    }

        // const pointA = new THREE.Vector3(-5, 0, 0); // Starting point
        // const pointB = new THREE.Vector3(5, 0, 0);  // Ending point

        // // Create an object to move
        // const geometry = new THREE.BoxGeometry(1, 1, 1);
        // const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
        // const cube = new THREE.Mesh(geometry, material);
        // cube.position.copy(pointA); // Start at point A
        // scene.add(cube);

        // // Animation variables
        // let progress = 0; // Progress from 0 (start) to 1 (end)
        // const speed = 0.01; // Adjust speed as needed

        // function animate() {
        //     requestAnimationFrame(animate);

        //     // Update progress
        //     progress += speed;
        //     if (progress > 1) progress = 1; // Clamp progress at 1

        //     // Linearly interpolate between point A and point B
        //     cube.position.lerpVectors(pointA, pointB, progress);

        //     // Render the scene
        //     renderer.render(scene, camera);
        // }

        // // Start the animation
        // animate();

        // or
//         let t = 0; // Time variable

// function animate() {
//     requestAnimationFrame(animate);

//     // Increase t by the speed
//     t += speed;

//     // Clamp t between 0 and 1
//     t = Math.min(t, 1);

//     // Lerp position
//     cube.position.lerpVectors(pointA, pointB, t);

//     // Render the scene
//     renderer.render(scene, camera);
// }

    // Create blocks all around + needs floor + animation
    createStadium() {
//        return new Promise((resolve) => {
            const   stadium = this.scene.getObjectByName("stadium");
            let i = -1;
            let x = -16;
            let y = -8;
            while (++i < 48) {
                const   cube = this.createCube(x);
                if (i <= 16) {
                    cube.position.set(x, y, 0);
//                    cube.rotation.set(60,0,0);
                    x += 2;
                }
                if (i > 16 && i <= 24) {
                    cube.position.set(x, y, 0);
//                    cube.rotation.set(60,0,0);
                    y += 2;
                }
                if (i > 24 && i <= 40) {
                    cube.position.set(x, y, 0);
//                    cube.rotation.set(60,0,0);
                    x -= 2;
                }
//                else {
//                    cube.position.set(x, y, 0);
////                    cube.rotation.set(60,0,0);
//                    y -= 2;
//                }
                stadium.add(cube);
            }
//            resolve();
//        }
//        this.createWall(0, this.stadium_width / 2, 0, this.stadium_length, this.stadium_thickness, this.stadium_height);  // up
//        this.createWall(-this.stadium_length / 2, 0, 0, this.stadium_thickness, this.stadium_width, this.stadium_height);  // left
//        this.createWall(this.stadium_length / 2, 0, 0, this.stadium_thickness, this.stadium_width, this.stadium_height);  // right
//        this.createWall(0, -this.stadium_width / 2, 0, this.stadium_length, this.stadium_thickness, this.stadium_height);  // down
    }


    createBlueMaterial() {
        // create a texture loader.
        const   textureLoader = new THREE.TextureLoader();

        // load a texture
        const   texture = textureLoader.load("/blue_wall.jpg");
        const   material = new THREE.MeshBasicMaterial({map: texture});

        return material;
    }

    createRedMaterial() {
        // create a texture loader.
        const   textureLoader = new THREE.TextureLoader();

        // load a texture
        const   texture = textureLoader.load("/red_wall.png");
        const   material = new THREE.MeshBasicMaterial({map: texture});

        return material;
    }

    createCube(i) {
        const   geometry = new THREE.BoxGeometry(2, 2, 2);
        let     material;
        if (i > 0) {
            material = this.createBlueMaterial();
        }
        else {
            material = this.createRedMaterial();
        }

        const   cube = new THREE.Mesh(geometry, material);
//        const   stadium = this.scene.getObjectByName("stadium");
        return  cube;
//        cube.position.set(15,15,5);
//        stadium.add(cube);
    }

    createWall(x, y, z, width, height, depth) {
        const   textureLoader = new THREE.TextureLoader();
        const   wallTexture = textureLoader.load('/ball_basecolor.png');

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshBasicMaterial({map: wallTexture, reflectivity: 1});
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, y, z);
        const   stadium = this.scene.getObjectByName("stadium");
        stadium.add(wall);
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

        this.updateBallPosition();

        // Render scene
        this.renderer.render(this.scene, this.camera);
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
