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
        this.textArray = [`${this.player1_nickname}`, "0", "-", "0",
                        `${this.player2_nickname}`];
        this.nameArray = ["p1Nick", "p1Score", "hyphen", "p2Score", "p2Nick"];
        this.score_p1 = 0;
        this.score_p2 = 0;
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
        this.scene.background = new THREE.Color(0xbae6fd);

       // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, -10, 20); // Elevated and on the long side
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

        this.createStadium();
        this.createPaddle('p1');
        this.createPaddle('p2');
        this.createBall();

        // Create textGroup
        const   textGroup = new THREE.Group();
        textGroup.position.set(0, 20, 0);
        textGroup.rotation.set(20, 0, 0);
        textGroup.name = "textGroup";
        this.scene.add(textGroup);
        this.printInitScores();

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

    printInitScores() {
        const   textGroup = this.scene.getObjectByName("textGroup");
        const   loader = new FontLoader();
        let     xPosition = -30;
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            this.textArray.forEach((text, index) => {
                const textGeometry = new TextGeometry(text, {
                    font: font,
                    size: 4,
                    depth: 0.1,
                    curveSegments: 12,
                    bevelEnabled: false
                });

                // Material for nicknames
                const nickTextMaterial = new THREE.MeshStandardMaterial({
                    color: 0x284353,
                    emissive: 0xc01616,
                    roughness: 1,
                    metalness: 0.555,
                });

                // Material for scores
                const textMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0x33ff33, // Green light
                    emissiveIntensity: 0.8,
                    metalness: 0.8,
                    roughness: 0.5,
                });
                let textAdd;
                if (this.nameArray[index] === "p1Nick" || this.nameArray[index] === "p2Nick") {
                    textAdd = new THREE.Mesh(textGeometry, nickTextMaterial);
                    textAdd.name = this.nameArray[index];
                }
                else {
                    textAdd = new THREE.Mesh(textGeometry, textMaterial);
                    textAdd.name = this.nameArray[index];
                }

                textGeometry.computeBoundingBox();
                const boundingBox = textGeometry.boundingBox;
                const textWidth = boundingBox.max.x - boundingBox.min.x;

                textAdd.position.x = xPosition;

                xPosition += textWidth + 1.5;
                textGroup.add(textAdd);

                // Add a pulsing effect
                const animate = () => {
                    requestAnimationFrame(animate);
                    if (textAdd.name === "p1Nick" || textAdd.name === "p2Nick")
                        textAdd.material.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
                    else
                        textAdd.material.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
                };
                animate();

                // this.scene.add(p1NickDisplay, p2NickDisplay, p1ScoreDisplay, hyphenDisplay, p2ScoreDisplay);
            });
        });
    }

    handleKeyEvent(event) {
        const   key = event.key;
        const   isKeyDown = event.type === 'keydown';
        const   speed = 0.1;
        const   stadium = this.scene.getObjectByName("stadium");

        switch (key) {
            case 'z':
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
        const   ballTexture = textureLoader.load('/ball_basecolor.png');

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

    createStadium() {
        this.createWall(0, this.stadium_width / 2, 0, this.stadium_length, this.stadium_thickness, this.stadium_height);  // up
        this.createWall(-this.stadium_length / 2, 0, 0, this.stadium_thickness, this.stadium_width, this.stadium_height);  // left
        this.createWall(this.stadium_length / 2, 0, 0, this.stadium_thickness, this.stadium_width, this.stadium_height);  // right
        this.createWall(0, -this.stadium_width / 2, 0, this.stadium_length, this.stadium_thickness, this.stadium_height);  // down
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
        let score;
        if (i === 1)
            score = this.scene.getObjectByName('p1Score');
        else
           score = this.scene.getObjectByName('p2Score');

        // Rotation on the X axis
        this.startRotation = score.rotation.x;
        this.endRotation = this.startRotation + 2 * Math.PI;

        this.animateScoreRotation(i);
    }

    animateScoreRotation(i) {
        // Getting the correct score to change
        let score;
        if (i === 1)
            score = this.scene.getObjectByName('p1Score');
        else
           score = this.scene.getObjectByName('p2Score');

        const   startTime = Date.now();
        const   deltaT = Date.now() - startTime;
        const   progress = deltaT / 1000;

        if (progress < 1) {
            score.rotation.x = this.startRotation + progress * (this.endRotation - this.startRotation);
            requestAnimationFrame(this.animateScoreRotation);
        }
        else
            score.rotation.x = this.endRotation;
    }

    updateScores() {
        const scoreText = this.scene.getObjectByName('scores');
        if (scoreText) {
            this.scene.remove(scoreText);
        }
        // this.printScores();
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
            this.currentSpeed *= 1.0001;
            this.ball_velocity_x = movementDirection.x * this.currentSpeed;
            this.ball_velocity_y = movementDirection.y * this.currentSpeed;

            if (this.ball_velocity_x == 0)
                this.newRound();

            // Check for collisions
            this.checkCollisions(ball);
        }
    }

    checkCollisions(ball) {
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
            this.rotateScore(2);
            this.score_p2++;
            this.updateScores();
            if (this.score_p2 + 1 == 5)
                return ;
            this.newRound();
        }
        // Player 1 wins the round
        else if (ball.position.x + this.ball_radius > this.stadium_length / 2) {
            this.rotateScore(1);
            this.score_p1++;
            this.updateScores();
            if (this.score_p1 + 1 == 5)
                return ;
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
