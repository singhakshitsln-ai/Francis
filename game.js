// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 8;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;

// Game objects
const player = {
    x: 10,
    y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    speed: 6
};

const ai = {
    x: GAME_WIDTH - PADDLE_WIDTH - 10,
    y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 4,
    difficulty: 0.7
};

const ball = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    dx: 5,
    dy: 5,
    size: BALL_SIZE,
    maxSpeed: 8
};

let score = {
    player: 0,
    ai: 0
};

let gameRunning = false;
let gamePaused = false;

// Input handling
const keys = {};
const mouse = {
    y: GAME_HEIGHT / 2
};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === ' ') {
        e.preventDefault();
        gameRunning ? pauseGame() : startGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.y = e.clientY - rect.top;
});

document.getElementById('restartBtn').addEventListener('click', restartGame);

// Game functions
function startGame() {
    gameRunning = true;
    gamePaused = false;
    updateStatusText('Game Started! Use ⬆️⬇️ to move');
    gameLoop();
}

function pauseGame() {
    gamePaused = !gamePaused;
    updateStatusText(gamePaused ? '⏸️ PAUSED - Press SPACEBAR to resume' : '▶️ RESUMED');
}

function restartGame() {
    score.player = 0;
    score.ai = 0;
    gameRunning = false;
    gamePaused = false;
    resetBall();
    updateScore();
    updateStatusText('Press SPACEBAR to Start');
    draw();
}

function resetBall() {
    ball.x = GAME_WIDTH / 2;
    ball.y = GAME_HEIGHT / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.dy = (Math.random() - 0.5) * 6;
}

function updateStatusText(text) {
    document.getElementById('statusText').textContent = text;
}

function updateScore() {
    document.getElementById('playerScore').textContent = score.player;
    document.getElementById('aiScore').textContent = score.ai;
}

// Update game state
function update() {
    if (!gameRunning || gamePaused) return;

    // Player paddle movement
    if (keys['ArrowUp'] || keys['w']) {
        player.y = Math.max(0, player.y - player.speed);
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.y = Math.min(GAME_HEIGHT - player.height, player.y + player.speed);
    }

    // Player paddle follows mouse (optional alternative)
    if (mouse.y > player.y && mouse.y < player.y + player.height) {
        // Mouse is over paddle, no auto-movement
    } else {
        // Gentle mouse following (optional)
        const mouseFollowSpeed = 2;
        if (mouse.y < player.y + player.height / 2) {
            player.y = Math.max(0, player.y - mouseFollowSpeed);
        } else if (mouse.y > player.y + player.height / 2) {
            player.y = Math.min(GAME_HEIGHT - player.height, player.y + mouseFollowSpeed);
        }
    }

    // AI paddle movement with difficulty
    const aiCenter = ai.y + ai.height / 2;
    const ballCenter = ball.y;
    const aiBias = (Math.random() - 0.5) * 20 * (1 - ai.difficulty);

    if (aiCenter < ballCenter + aiBias) {
        ai.y = Math.min(GAME_HEIGHT - ai.height, ai.y + ai.speed);
    } else if (aiCenter > ballCenter + aiBias) {
        ai.y = Math.max(0, ai.y - ai.speed);
    }

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom walls
    if (ball.y - ball.size < 0) {
        ball.y = ball.size;
        ball.dy = -ball.dy;
    }
    if (ball.y + ball.size > GAME_HEIGHT) {
        ball.y = GAME_HEIGHT - ball.size;
        ball.dy = -ball.dy;
    }

    // Ball collision with paddles
    // Player paddle
    if (
        ball.x - ball.size < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.x = player.x + player.width + ball.size;
        ball.dx = -ball.dx;
        
        // Add spin based on paddle position
        const deltaY = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
        ball.dy += deltaY * 3;
        
        // Increase speed slightly
        const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
        if (speed < ball.maxSpeed) {
            ball.dx *= 1.05;
            ball.dy *= 1.05;
        }
    }

    // AI paddle
    if (
        ball.x + ball.size > ai.x &&
        ball.y > ai.y &&
        ball.y < ai.y + ai.height
    ) {
        ball.x = ai.x - ball.size;
        ball.dx = -ball.dx;
        
        // Add spin based on paddle position
        const deltaY = (ball.y - (ai.y + ai.height / 2)) / (ai.height / 2);
        ball.dy += deltaY * 3;
        
        // Increase speed slightly
        const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
        if (speed < ball.maxSpeed) {
            ball.dx *= 1.05;
            ball.dy *= 1.05;
        }
    }

    // Ball out of bounds - scoring
    if (ball.x < 0) {
        score.ai++;
        updateScore();
        resetBall();
        updateStatusText('🎯 Francis scores! Score: ' + score.ai);
    }
    if (ball.x > GAME_WIDTH) {
        score.player++;
        updateScore();
        resetBall();
        updateStatusText('🎉 You score! Score: ' + score.player);
    }
}

// Drawing functions
function draw() {
    // Clear canvas with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH / 2, 0);
    ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles with gradient
    drawPaddle(player, '#667eea');
    drawPaddle(ai, '#764ba2');

    // Draw ball with glow
    drawBall();
}

function drawPaddle(paddle, color) {
    // Paddle glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Paddle gradient
    const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
    paddleGradient.addColorStop(0, color);
    paddleGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
    
    ctx.fillStyle = paddleGradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Paddle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);

    ctx.shadowColor = 'transparent';
}

function drawBall() {
    // Ball glow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Ball gradient
    const ballGradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.size);
    ballGradient.addColorStop(0, '#ffff00');
    ballGradient.addColorStop(1, '#ffd700');
    
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();

    // Ball highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(ball.x - ball.size / 3, ball.y - ball.size / 3, ball.size / 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize
updateScore();
updateStatusText('Press SPACEBAR to Start');
draw();