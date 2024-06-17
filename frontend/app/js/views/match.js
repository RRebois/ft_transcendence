import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import {FontLoader} from "three/addons";

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
        this.ball_radius = 0.3;
        this.ball_velocity_x = 0.05;
        this.ball_velocity_y = 0.05;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xbae6fd);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, -10, 10); // Elevated and on the long side
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.createStadium();
        this.createPaddle('p1');
        this.createPaddle('p2');
        this.createBall();

        // Controls
        window.addEventListener('keydown', this.handleKeyEvent.bind(this));
        window.addEventListener('keyup', this.handleKeyEvent.bind(this));


        // Resize scene
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // const loader = new FontLoader();
        // loader.load( 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function ( font )
        // {
        //
        //     const matLite = new THREE.MeshBasicMaterial(
        //         {
        //             color: 0x2c3e50,
        //             transparent: true,
        //             opacity: 0.8,
        //             side: THREE.DoubleSide
        //         } );
        //
        //     const message = " Three.js\nUniversity";
        //
        //     const shapes = font.generateShapes( message, 100 );
        //
        //     const geometry = new THREE.ShapeGeometry( shapes );
        //     geometry.computeBoundingBox();
        //
        //     const xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
        //     geometry.translate( xMid, 0, 0 );
        //
        //     const text = new THREE.Mesh( geometry, matLite );
        //
        //     text.position.z = 1;
        //     this.scene.add( text );
        //
        //
        // } ); //end load function

        // Animate
        this.animate = this.animate.bind(this);
        this.animate();
    }

    handleKeyEvent(event) {
        const key = event.key;
        const isKeyDown = event.type === 'keydown';
        const speed = 0.1;

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
        const geometry = new THREE.SphereGeometry(this.ball_radius, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const ball = new THREE.Mesh(geometry, material);
        ball.position.set(this.ball_x, this.ball_y, 0);
        ball.name = 'ball';
        this.scene.add(ball);
    }

    createPaddle(player = 'p1')  {
        const geometry = new THREE.BoxGeometry(0.2, this.paddle_length, 1);
        let x = Math.round(-this.stadium_length/2 + 1);
        let color = 0xff0000;
        if (player === 'p2') {
            x = Math.round(this.stadium_length/2 - 2);

            color = 0x0000ff;
        }
        const material = new THREE.MeshBasicMaterial({ color: color});
        const paddle = new THREE.Mesh(geometry, material);
        paddle.position.set(x, 0, 0);
        paddle.name = player;
        this.scene.add(paddle);
    }

    createStadium() {
        this.createWall(0, this.stadium_width/2, 0, this.stadium_length, this.stadium_thickness, this.stadium_height);  // up
        this.createWall(-this.stadium_length/2, 0, 0, this.stadium_thickness, this.stadium_width, this.stadium_height);  // left
        this.createWall(this.stadium_length/2, 0, 0, this.stadium_thickness, this.stadium_width, this.stadium_height);  // right
        this.createWall(0, -this.stadium_width/2, 0, this.stadium_length, this.stadium_thickness, this.stadium_height);  // down
    }

    createWall(x, y, z, width, height, depth) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, y, z);
        this.scene.add(wall);
    }

    updatePaddlePosition(player, y_pos) {
        const paddle = this.scene.getObjectByName(player);
        if (paddle) {
            const offset = this.paddle_length/2;
            if ((paddle.position.y + y_pos + offset) > this.stadium_width/2 || (paddle.position.y + y_pos - offset) < -this.stadium_width/2) {
                return;
            }

            paddle.position.y += y_pos;
        }
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

            // Check for collisions
            this.checkCollisions(ball);
        }
    }

    checkCollisions(ball) {
        // Check for collisions with paddles
        const paddle1 = this.scene.getObjectByName('p1');
        const paddle2 = this.scene.getObjectByName('p2');
        if (paddle1 && paddle2) {
            if (ball.position.x - this.ball_radius < paddle1.position.x + 0.2 && ball.position.y <= paddle1.position.y + this.paddle_length/2 && ball.position.y >= paddle1.position.y - this.paddle_length/2) {
                this.ball_velocity_x = -this.ball_velocity_x;
            }
            if (ball.position.x + this.ball_radius > paddle2.position.x - 0.2 && ball.position.y <= paddle2.position.y + this.paddle_length/2 && ball.position.y >= paddle2.position.y - this.paddle_length/2) {
                this.ball_velocity_x = -this.ball_velocity_x;
            }
        }

        // Check for collisions with walls
        if (ball.position.y + this.ball_radius > this.stadium_width/2 || ball.position.y - this.ball_radius < -this.stadium_width/2) {
            this.ball_velocity_y = -this.ball_velocity_y;
        }
        // Player 2 wins the round
        if (ball.position.x - this.ball_radius < -this.stadium_length/2) {
            this.score_p2++;

            this.ball_velocity_x = -this.ball_velocity_x;
        }
        // Player 1 wins the round
        else if (ball.position.x + this.ball_radius > this.stadium_length/2) {
            // this.ball.position.set(0, 0, 0);
            this.score_p1++;
            this.ball_velocity_x = -this.ball_velocity_x;
        }
    }

}
