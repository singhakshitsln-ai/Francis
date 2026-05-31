// Canvas setup - Responsive
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas sizing
function resizeCanvas() {
    const container = canvas.parentElement;
    const width = container.clientWidth;
    const maxHeight = window.innerHeight * 0.55;
    
    canvas.width = width;
    canvas.height = Math.min(width * 0.5, maxHeight);
    
    // Update game dimensions
    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height;
}

// Game settings
let gameSettings = {
    difficulty: parseFloat(localStorage.getItem('difficulty')) || 0.7,
    soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
    ballSpeedMultiplier: parseFloat(localStorage.getItem('ballSpeed')) || 1.0
};

// Game constants (will be updated on resize)
let PADDLE_WIDTH = 12;
let PADDLE_HEIGHT = 100;
let BALL_SIZE = 10;
let GAME_WIDTH = window.innerWidth;
let GAME_HEIGHT = window.innerHeight * 0.5;

// Game objects
const player = {
    x: 15,
    y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    speed: 7
};

const ai = {
    x: GAME_WIDTH - PADDLE_WIDTH - 15,
    y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 5,
    difficulty: gameSettings.difficulty
};

const ball = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    dx: 5 * gameSettings.ballSpeedMultiplier,
    dy: 5 * gameSettings.ballSpeedMultiplier,
    size: BALL_SIZE,
    maxSpeed: 12 * gameSettings.ballSpeedMultiplier,
    baseSpeed: 5 * gameSettings.ballSpeedMultiplier
};

let score = {
    player: 0,
    ai: 0
};

let gameRunning = false;
let gamePaused = false;
let rallyCount = 0;
let gameStartTime = 0;

// Input handling
const keys = {};
let touchInputs = {
    up: false,
    down: false
};

// Device detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTablet = /iPad|Android/i.test(navigator.userAgent);

// UI Elements
const gameOverlay = document.getElementById('gameOverlay');
const startPlayBtn = document.getElementById('startPlayBtn');
const mobileControls = document.getElementById('mobileControls');
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const pauseArea = document.getElementById('pauseArea');
const restartBtn = document.getElementById('restartBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const difficultySlider = document.getElementById('difficultySlider');
const soundToggle = document.getElementById('soundToggle');
const ballSpeedSlider = document.getElementById('ballSpeedSlider');
const difficultyLabel = document.getElementById('difficultyLabel');
const speedLabel = document.getElementById('speedLabel');

// Keyboard events
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        gameRunning ? pauseGame() : startGame();
    }
    if (e.key === 'r' || e.key === 'R') {
        restartGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Start button
startPlayBtn.addEventListener('click', startGame);

// Settings
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
});

closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
    }
});

difficultySlider.addEventListener('input', (e) => {
    gameSettings.difficulty = parseFloat(e.target.value);
    ai.difficulty = gameSettings.difficulty;
    localStorage.setItem('difficulty', gameSettings.difficulty);
    updateDifficultyLabel();
});

soundToggle.addEventListener('change', (e) => {
    gameSettings.soundEnabled = e.target.checked;
    localStorage.setItem('soundEnabled', gameSettings.soundEnabled);
});

ballSpeedSlider.addEventListener('input', (e) => {
    gameSettings.ballSpeedMultiplier = parseFloat(e.target.value);
    localStorage.setItem('ballSpeed', gameSettings.ballSpeedMultiplier);
    updateSpeedLabel();
});

function updateDifficultyLabel() {
    const difficulty = gameSettings.difficulty;
    if (difficulty < 0.5) difficultyLabel.textContent = 'Easy';
    else if (difficulty < 0.8) difficultyLabel.textContent = 'Medium';
    else difficultyLabel.textContent = 'Hard';
}

function updateSpeedLabel() {
    const speed = gameSettings.ballSpeedMultiplier;
    if (speed < 1) speedLabel.textContent = 'Slow';
    else if (speed < 1.2) speedLabel.textContent = 'Normal';
    else speedLabel.textContent = 'Fast';
}

// Mobile touch controls
if (isMobile) {
    mobileControls.classList.add('active');
    
    upBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchInputs.up = true;
    });
    upBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchInputs.up = false;
    });
    
    downBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchInputs.down = true;
    });
    downBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchInputs.down = false;
    });
    
    pauseArea.addEventListener('click', () => {
        gameRunning ? pauseGame() : startGame();
    });
}

restartBtn.addEventListener('click', restartGame);

// Game functions
function startGame() {
    gameRunning = true;
    gamePaused = false;
    gameOverlay.classList.add('hidden');
    gameStartTime = Date.now();
    updateStatusDisplay();
}

function pauseGame() {
    gamePaused = !gamePaused;
    updateStatusDisplay();
}

function restartGame() {
    score.player = 0;
    score.ai = 0;
    rallyCount = 0;
    gameRunning = false;
    gamePaused = false;
    resetBall();
    updateScore();
    updateStatusDisplay();
    gameOverlay.classList.remove('hidden');
    document.getElementById('overlayTitle').textContent = 'Ready to Play?';
    draw();
}

function resetBall() {
    ball.x = GAME_WIDTH / 2;
    ball.y = GAME_HEIGHT / 2;
    const angle = (Math.random() - 0.5) * Math.PI / 3;
    const speed = ball.baseSpeed * gameSettings.ballSpeedMultiplier;
    ball.dx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = Math.sin(angle) * speed;
    rallyCount = 0;
}

function updateScore() {
    document.getElementById('playerScore').textContent = score.player;
    document.getElementById('aiScore').textContent = score.ai;
}

function updateStatusDisplay() {
    const ballSpd = Math.sqrt(ball.dx ** 2 + ball.dy ** 2).toFixed(1);
    document.getElementById('ballSpeed').textContent = ballSpd;
    document.getElementById('rallyCount').textContent = rallyCount;
    
    const elapsed = gameRunning ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('gameTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Update game state with real pong physics
function update() {
    if (!gameRunning || gamePaused) return;

    updateStatusDisplay();

    // Player paddle movement
    if (keys['ArrowUp'] || keys['w'] || keys['W'] || touchInputs.up) {
        player.y = Math.max(0, player.y - player.speed);
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S'] || touchInputs.down) {
        player.y = Math.min(GAME_HEIGHT - player.height, player.y + player.speed);
    }

    // AI paddle movement with adaptive difficulty
    const aiCenter = ai.y + ai.height / 2;
    const ballCenter = ball.y;
    const predictedBallY = ball.y + (ball.dy * 30); // Predict ball position
    const aiBias = (Math.random() - 0.5) * 30 * (1 - ai.difficulty);

    if (aiCenter < Math.min(predictedBallY, ballCenter) + aiBias) {
        ai.y = Math.min(GAME_HEIGHT - ai.height, ai.y + ai.speed);
    } else if (aiCenter > Math.max(predictedBallY, ballCenter) + aiBias) {
        ai.y = Math.max(0, ai.y - ai.speed);
    }

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom walls
    if (ball.y - ball.size <= 0) {
        ball.y = ball.size;
        ball.dy = Math.abs(ball.dy);
        playSound(200, 50);
    }
    if (ball.y + ball.size >= GAME_HEIGHT) {
        ball.y = GAME_HEIGHT - ball.size;
        ball.dy = -Math.abs(ball.dy);
        playSound(200, 50);
    }

    // Ball collision with paddles - REAL PONG PHYSICS
    // Player paddle
    if (
        ball.x - ball.size <= player.x + player.width &&
        ball.x - ball.size >= player.x &&
        ball.y > player.y &&
        ball.y < player.y + player.height &&
        ball.dx < 0
    ) {
        ball.x = player.x + player.width + ball.size;
        
        // Calculate spin based on paddle contact point
        const contactPoint = (ball.y - player.y) / player.height; // 0 to 1
        const spin = (contactPoint - 0.5) * 8; // Max ±4 spin
        
        const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
        const newSpeed = Math.min(speed * 1.02, ball.maxSpeed);
        
        ball.dx = newSpeed * 0.8;
        ball.dy = spin + (ball.dy * 0.5);
        
        rallyCount++;
        playSound(300, 100);
    }

    // AI paddle
    if (
        ball.x + ball.size >= ai.x &&
        ball.x + ball.size <= ai.x + ai.width &&
        ball.y > ai.y &&
        ball.y < ai.y + ai.height &&
        ball.dx > 0
    ) {
        ball.x = ai.x - ball.size;
        
        // Calculate spin
        const contactPoint = (ball.y - ai.y) / ai.height;
        const spin = (contactPoint - 0.5) * 8;
        
        const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
        const newSpeed = Math.min(speed * 1.02, ball.maxSpeed);
        
        ball.dx = -newSpeed * 0.8;
        ball.dy = spin + (ball.dy * 0.5);
        
        rallyCount++;
        playSound(400, 100);
    }

    // Ball out of bounds - scoring
    if (ball.x < -ball.size) {
        score.ai++;
        playSound(600, 200);
        updateScore();
        resetBall();
        document.getElementById('overlayTitle').textContent = `Francis scores! ${score.ai}`;
        gameOverlay.classList.remove('hidden');
        gameRunning = false;
        setTimeout(() => startGame(), 2000);
    }
    if (ball.x > GAME_WIDTH + ball.size) {
        score.player++;
        playSound(800, 200);
        updateScore();
        resetBall();
        document.getElementById('overlayTitle').textContent = `You score! ${score.player}`;
        gameOverlay.classList.remove('hidden');
        gameRunning = false;
        setTimeout(() => startGame(), 2000);
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([15, 15]);
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

    // Draw score display in game
    drawGameScore();
}

function drawPaddle(paddle, color) {
    // Paddle glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Paddle gradient
    const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y + paddle.height);
    paddleGradient.addColorStop(0, color);
    paddleGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    paddleGradient.addColorStop(1, color);
    
    ctx.fillStyle = paddleGradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Paddle border highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(paddle.x + 1, paddle.y + 1, paddle.width - 2, paddle.height - 2);

    ctx.shadowColor = 'transparent';
}

function drawBall() {
    // Ball glow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Ball gradient
    const ballGradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.size);
    ballGradient.addColorStop(0, '#ffff00');
    ballGradient.addColorStop(0.6, '#ffd700');
    ballGradient.addColorStop(1, '#ff9700');
    
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();

    // Ball highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(ball.x - ball.size / 3, ball.y - ball.size / 3, ball.size / 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
}

function drawGameScore() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = `bold ${GAME_HEIGHT * 0.15}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(score.player, GAME_WIDTH * 0.25, GAME_HEIGHT * 0.4);
    ctx.fillText(score.ai, GAME_WIDTH * 0.75, GAME_HEIGHT * 0.4);
}

// Simple sound synthesis
function playSound(frequency, duration) {
    if (!gameSettings.soundEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
        // Audio not supported
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Handle window resize
window.addEventListener('resize', () => {
    resizeCanvas();
    
    // Update paddle positions proportionally
    player.x = GAME_WIDTH * 0.02;
    ai.x = GAME_WIDTH - PADDLE_WIDTH - GAME_WIDTH * 0.02;
    
    player.y = Math.max(0, Math.min(player.y, GAME_HEIGHT - player.height));
    ai.y = Math.max(0, Math.min(ai.y, GAME_HEIGHT - ai.height));
});

// Prevent zoom on double tap
document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, false);

// Initialize
resizeCanvas();
updateDifficultyLabel();
updateSpeedLabel();
updateScore();
updateStatusDisplay();
gameLoop();

// PWA Install
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installPrompt = document.getElementById('installPrompt');
    installPrompt.classList.add('active');
});

document.getElementById('installBtn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        document.getElementById('installPrompt').classList.remove('active');
    }
});

document.getElementById('installClose')?.addEventListener('click', () => {
    document.getElementById('installPrompt').classList.remove('active');
});
