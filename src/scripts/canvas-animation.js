// Get canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Color state management
let currentColorIndex = 0;
let targetColorIndex = 0;
let colorTransition = 0; // 0 to 1, for smooth transitions
let hoverState = { black: false, white: false };
const colorPairs = [
	{ color1: 'hsl(13, 91%, 59%)', color2: 'hsl(187, 100%, 60%)' },     // Red vs Blue
	{ color1: 'hsl(280, 100%, 65%)', color2: 'hsl(65, 100%, 55%)' },    // Purple vs Lime
	{ color1: 'hsl(340, 100%, 60%)', color2: 'hsl(160, 100%, 50%)' },   // Magenta vs Teal
	{ color1: 'hsl(25, 100%, 60%)', color2: 'hsl(205, 100%, 65%)' },    // Orange vs Sky Blue
	{ color1: 'hsl(300, 90%, 65%)', color2: 'hsl(120, 90%, 50%)' },     // Hot Pink vs Green
	{ color1: 'hsl(240, 100%, 70%)', color2: 'hsl(60, 100%, 60%)' },    // Electric Blue vs Yellow
];

// Function to resize canvas and redraw
function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	drawGeometricDesign();
}

// Function to check if point is inside triangle
function isPointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
	const denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
	const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denom;
	const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denom;
	const c = 1 - a - b;
	return a >= 0 && b >= 0 && c >= 0;
}

// Get scaled canvas coordinates from mouse event
function getCanvasCoordinates(event) {
	const rect = canvas.getBoundingClientRect();
	const scaleX = canvas.width / rect.width;
	const scaleY = canvas.height / rect.height;
	return {
		x: (event.clientX - rect.left) * scaleX,
		y: (event.clientY - rect.top) * scaleY
	};
}

// Check if coordinates are in either triangle
function checkTriangleHit(canvasX, canvasY) {
	const width = canvas.width;
	const height = canvas.height;
	const centerX = width / 2;
	const centerY = height / 2;
	const overlayWidth = width * 0.15;
	
	const inBlackTriangle = isPointInTriangle(
		canvasX, canvasY,
		centerX, centerY,
		centerX - overlayWidth, 0,
		centerX + overlayWidth, 0
	);
	
	const inWhiteTriangle = isPointInTriangle(
		canvasX, canvasY,
		centerX, centerY,
		centerX - overlayWidth, height,
		centerX + overlayWidth, height
	);
	
	return { inBlackTriangle, inWhiteTriangle };
}

// Handle canvas clicks
function handleCanvasClick(event) {
	const { x: canvasX, y: canvasY } = getCanvasCoordinates(event);
	const { inBlackTriangle, inWhiteTriangle } = checkTriangleHit(canvasX, canvasY);
	
	if (inBlackTriangle || inWhiteTriangle) {
		targetColorIndex = (currentColorIndex + 1) % colorPairs.length;
		colorTransition = 0;
		animateColorTransition();
	}
}

// Handle mouse movement for hover detection
function handleMouseMove(event) {
	const { x: canvasX, y: canvasY } = getCanvasCoordinates(event);
	const { inBlackTriangle, inWhiteTriangle } = checkTriangleHit(canvasX, canvasY);
	
	const prevHoverState = { ...hoverState };
	hoverState.black = inBlackTriangle;
	hoverState.white = inWhiteTriangle;
	
	// Pointer cursor when hovering over triangles that change the colours
	canvas.style.cursor = (inBlackTriangle || inWhiteTriangle) ? 'pointer' : 'default';
	
	if (prevHoverState.black !== hoverState.black || prevHoverState.white !== hoverState.white) {
		drawGeometricDesign();
	}
}

// Color transition animation function
function animateColorTransition() {
	function animate() {
		colorTransition += 0.04;
		
		if (colorTransition >= 1) {
			colorTransition = 1;
			currentColorIndex = targetColorIndex;
		}
		
		drawGeometricDesign();
		
		if (colorTransition < 1) {
			requestAnimationFrame(animate);
		}
	}
	
	animate();
}


// Add event listeners
canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('mousemove', handleMouseMove);

// Function to draw the geometric design
function drawGeometricDesign() {
	const width = canvas.width;
	const height = canvas.height;
	const centerX = width / 2;
	const centerY = height / 2;
	const overlayWidth = width * 0.15; // 15% each side = 30% total width
	
	// Calculate transparency based on hover state
	const blackOpacity = hoverState.black ? 0.8 : 1.0; // Semi-transparent on hover
	const whiteOpacity = hoverState.white ? 0.8 : 1.0; // Semi-transparent on hover
	
	// Clear canvas
	ctx.clearRect(0, 0, width, height);
	
	// Helper function to draw triangle
	function drawTriangle(color, points) {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.moveTo(points[0][0], points[0][1]);
		for (let i = 1; i < points.length; i++) {
			ctx.lineTo(points[i][0], points[i][1]);
		}
		ctx.closePath();
		ctx.fill();
	}
	
	// Define triangle shapes
	const leftTriangle = [[centerX, centerY], [0, height], [0, 0], [centerX, centerY], [width, height], [0, height]];
	const rightTriangle = [[centerX, centerY], [0, 0], [width, 0], [width, height]];
	
	// Get current and target colors for crossfading
	const currentColors = colorPairs[currentColorIndex];
	const targetColors = colorPairs[targetColorIndex];
	
	// Draw base layer (current colors)
	drawTriangle(currentColors.color1, leftTriangle);
	drawTriangle(currentColors.color2, rightTriangle);
	
	// Crossfade with target colors during transition
	if (colorTransition > 0 && colorTransition < 1) {
		const easeT = colorTransition * colorTransition * (3 - 2 * colorTransition);
		ctx.globalAlpha = easeT;
		
		drawTriangle(targetColors.color1, leftTriangle);
		drawTriangle(targetColors.color2, rightTriangle);
		
		ctx.globalAlpha = 1.0;
	}
	
	// Black triangle overlay (top center) with opacity
	ctx.globalAlpha = blackOpacity;
	drawTriangle('#000000', [
		[centerX, centerY],                // Center point
		[centerX - overlayWidth, 0],      // Left point
		[centerX + overlayWidth, 0]       // Right point
	]);
	
	// White triangle overlay (bottom center) with opacity
	ctx.globalAlpha = whiteOpacity;
	drawTriangle('#FFFFFF', [
		[centerX, centerY],                   // Center point
		[centerX - overlayWidth, height],    // Left point
		[centerX + overlayWidth, height]     // Right point
	]);
	
	// Reset global alpha
	ctx.globalAlpha = 1.0;
}

// Initial setup
resizeCanvas();

// Handle window resize
window.addEventListener('resize', resizeCanvas);
