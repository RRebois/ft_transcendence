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
        this.score_p1 = 0;
        this.score_p2 = 0;
        this.y_pos_p1 = 0;  // left player
        this.y_pos_p2 = 0;  // right player
        this.stadium_length = 25;
        this.stadium_width = 10;
        this.stadium_height = 1;
        this.stadium_thickness = 0.25;
        this.paddle_length = 2;
        this.ball_x = 0;
        this.ball_y = 0;
        this.ball_radius = 1;
        this.ball_velocity_x = 2 * ((Math.random() - 0.5) / 10);  // Double the speed in x direction
        this.ball_velocity_y = 2 * ((Math.random() - 0.5) / 25);  // Double the speed in y direction

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xbae6fd);
//
//        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, -10, 20); // Elevated and on the long side
        this.camera.lookAt(0, 0, 0);
//
//        // Renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
//
       // Create stade group with all objetcs so when rotate everything follows
        const stadiumGroup = new THREE.Group();
        const stadium = new THREE.Object3D();
        stadium.name = "stadium";
        stadiumGroup.add(stadium);
        this.scene.add(stadiumGroup);

        this.createStadium();
        this.createPaddle('p1');
        this.createPaddle('p2');
        this.createBall();
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
        const loader = new FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            // Players 1 nick name displayed
            const   p1NickTextGeometry = new TextGeometry(`${this.player1_nickname}`, {
                font: font,
                size: 4,
                height: 0.1,
                curveSegments: 12,
                bevelEnabled: false
            });

            // Players 2 nick name displayed
            const   p2NickTextGeometry = new TextGeometry(`${this.player1_nickname}`, {
                font: font,
                size: 4,
                height: 0.1,
                curveSegments: 12,
                bevelEnabled: false
            });

            const   p1ScoreTextGeometry = new TextGeometry(`${this.score_p1}`, {
                font: font,
                size: 4,
                height: 0.1,
                curveSegments: 12,
                bevelEnabled: false
            });

            const   hyphenTextGeometry = new TextGeometry(`\u00A0-\u00A0`, {
                font: font,
                size: 4,
                height: 0.1,
                curveSegments: 12,
                bevelEnabled: false
            });

            const p2ScoreTextGeometry = new TextGeometry(`${this.score_p2}`, {
                font: font,
                size: 4,
                height: 0.1,
                curveSegments: 12,
                bevelEnabled: false
            });

            // Material for nicknames
            const nickTextMaterial = new THREE.MeshStandardMaterial({
                color: 0x284353,
                emissive: 0xc01616,
                roughness: 1,
                metalness: 0.555,
                // wireframe: true,
            });

            // Flashy Material for scores
            const textMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0x33ff33, // Green light
                emissiveIntensity: 0.8,
                metalness: 0.8,
                roughness: 0.5,
            });

            const   p1NickDisplay = new THREE.Mesh(p1NickTextGeometry, nickTextMaterial);
            const   p2NickDisplay = new THREE.Mesh(p2NickTextGeometry, nickTextMaterial);

            const   p1ScoreDisplay = new THREE.Mesh(p1ScoreTextGeometry, textMaterial);
            const   hyphenDisplay = new THREE.Mesh(hyphenTextGeometry, textMaterial);
            const   p2ScoreDisplay = new THREE.Mesh(p2ScoreTextGeometry, textMaterial);

            p1NickDisplay.position.set(-40, 20, 0);
            p2NickDisplay.position.set(20, 20, 0);
            p1ScoreDisplay.position.set(-4.5, 20, 0);
            hyphenDisplay.position.set(-3.5, 20, 0);
            p2ScoreDisplay.position.set(2, 20, 0);

            p1NickDisplay.rotation.set(45,0,0);
            p2NickDisplay.rotation.set(45,0,0);
            p1ScoreDisplay.rotation.set(45,0,0);
            hyphenDisplay.rotation.set(45,0,0);
            p2ScoreDisplay.rotation.set(45,0,0);

            // Add a pulsing effect
            const animate = () => {
                requestAnimationFrame(animate);
                p1NickDisplay.material.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
                p2NickDisplay.material.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
                p1ScoreDisplay.material.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
                hyphenDisplay.material.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
                p2ScoreDisplay.material.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
            };
            animate();

            p1NickDisplay.name = 'p1Nick';
            p2NickDisplay.name = 'p2Nick';
            p1ScoreDisplay.name = 'p1Score';
            hyphenDisplay.name = 'hyphen';
            p2NickDisplay.name = 'p2Score';
            // textGeometry.center();
            this.scene.add(p1NickDisplay, p2NickDisplay, p1ScoreDisplay, hyphenDisplay, p2ScoreDisplay);
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
        const material = new THREE.MeshBasicMaterial({map: ballTexture, roughness:0.2, metalness:0.6});
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
        this.score;
        if (i === 1)
            this.score = this.score_p1;
        else
            this.score = this.score_p2;
        this.duration = 1000;
        this.startRotation = this.score.rotation.x;
        this.endRotation = startRotation + 2 * Math.PI;
        this.startTime = Date.now();

        animateScoreRotation();
    }

    animateScoreRotation() {
        const   deltaT = Date.now() - this.startTime;
        const   progress = deltaT / this.duration;

        if (progress < 1) {
            this.score.rotation.x = this.startRotation + progress * (this.endRotation - this.startRotation);
            requestAnimationFrame(this.animateScoreRotation);
        }
        else
        this.score.rotation.x = this.endRotation;
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
            ball.position.x += this.ball_velocity_x;
            ball.position.y += this.ball_velocity_y;
            ball.rotation.x += this.ball_velocity_x;
            ball.rotation.y += this.ball_velocity_y;

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
            // this.rotateScore(2);
            this.score_p2++;
            this.updateScores();
            this.newRound();
        }
        // Player 1 wins the round
        else if (ball.position.x + this.ball_radius > this.stadium_length / 2) {
            // this.rotateScore(1);
            this.score_p1++;
            this.updateScores();
            this.newRound();
        }
    }

    newRound() {
        this.ball_x = 0;
        this.ball_y = 0;
        this.ball_velocity_x = 2 * ((Math.random() - 0.5) / 10);  // Double the speed in x direction
        this.ball_velocity_y = 2 * ((Math.random() - 0.5) / 25);  // Double the speed in y direction

        const ball = this.scene.getObjectByName('ball');
        ball.position.set(this.ball_x, this.ball_y, 0);
    }

    setupEventListeners() {}

}
