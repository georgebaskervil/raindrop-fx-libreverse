// jest.setup.js

// Setup WebGL mock
require('jest-webgl-canvas-mock');

// Mock TextEncoder/TextDecoder which might be used by dependencies
const util = require('util');
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;

// Mock URL.createObjectURL for TextureImporter potentially
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Rewritten Image mock in plain JS
global.Image = class {
    constructor() {
        this.src = '';
        this.onload = () => {};
        this.onerror = () => {};
        // Simulate async loading completion
        setTimeout(() => {
            if (typeof this.onload === 'function') {
                this.onload();
            }
        }, 0);
    }
    get width() { return 100; } // Property getter
    get height() { return 100; } // Property getter
}; 