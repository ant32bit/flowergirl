// Browser globals mock for Node.js testing environment

// Mock window object
(global as any).window = {
    settings: {},
    requestAnimationFrame: (callback: (time: number) => void) => {
        setTimeout(() => callback(Date.now()), 16);
    },
    devicePixelRatio: 1,
    pageXOffset: 0,
    pageYOffset: 0,
    setInterval: global.setInterval,
    clearInterval: global.clearInterval
};

// Mock location object
(global as any).location = {
    href: 'http://localhost:3000?debug=false&fps=8&algorithm=closest'
};

// Mock document object
(global as any).document = {
    documentElement: {
        scrollLeft: 0,
        scrollTop: 0,
        clientLeft: 0,
        clientTop: 0
    },
    getElementById: () => ({
        clientWidth: 800,
        clientHeight: 600,
        width: 800,
        height: 600,
        addEventListener: () => {},
        getContext: () => ({
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            strokeStyle: '',
            stroke: () => {},
            rect: () => {},
            fillStyle: '',
            fill: () => {},
            strokeRect: () => {},
            arc: () => {}
        })
    })
};

// Mock Image constructor
(global as any).Image = class MockImage {
    src: string = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    
    constructor() {
        // Simulate immediate load for testing
        setTimeout(() => {
            if (this.onload) {
                this.onload();
            }
        }, 0);
    }
};

// Mock console for cleaner test output
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
    // Only log if it's not a game-related message
    if (!args.some(arg => typeof arg === 'string' && arg.includes('Could not start'))) {
        originalConsoleLog(...args);
    }
};