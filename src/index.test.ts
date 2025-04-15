import { jest } from '@jest/globals';
import RaindropFX from './index'; // Import the default export

// Mock dependencies
const mockRendererDestroy = jest.fn();
const mockRendererLoadAssets = jest.fn<() => Promise<void>>().mockResolvedValue(void 0);
const mockRendererReloadBackground = jest.fn<() => Promise<void>>().mockResolvedValue(void 0);
const mockRendererResize = jest.fn();
const mockRendererRender = jest.fn();

jest.mock('./renderer', () => {
  return {
    RaindropRenderer: jest.fn().mockImplementation(() => {
      return {
        destroy: mockRendererDestroy,
        loadAssets: mockRendererLoadAssets,
        reloadBackground: mockRendererReloadBackground,
        resize: mockRendererResize,
        render: mockRendererRender,
        options: { background: '' }, // Mock nested property used in setBackground
        // Mock the base renderer instance if accessed directly (it was previously)
        // renderer: {
        //     destroy: jest.fn() // Keep this if RaindropFX directly accesses it
        // }
      };
    }),
  };
});

const mockSimulatorUpdate = jest.fn();
const mockSimulatorDestroy = jest.fn(); // Add if simulator gets a destroy method

jest.mock('./simulator', () => {
  return {
    RaindropSimulator: jest.fn().mockImplementation(() => {
      return {
        update: mockSimulatorUpdate,
        destroy: mockSimulatorDestroy, // Add if simulator gets a destroy method
        raindrops: [], // Mock property used in RaindropFX.update
      };
    }),
  };
});

// Mock Time utility if necessary, or ensure it doesn't break tests
// jest.mock('./utils', () => ({
//     Time: jest.fn() // Or provide a mock implementation
// }));

describe('RaindropFX', () => {
  let canvas: HTMLCanvasElement;
  let raindropFx: RaindropFX;
  const options = { canvas: null as any, background: 'test.png' }; // Basic options

  let rafSpy: jest.SpiedFunction<typeof global.requestAnimationFrame>;
  let cafSpy: jest.SpiedFunction<typeof global.cancelAnimationFrame>;

  // Use fake timers for RAF control
  beforeAll(() => {
      jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    options.canvas = canvas;
    raindropFx = new RaindropFX(options);

    // Spy on animation frame functions (no mockImplementation needed with fake timers)
    rafSpy = jest.spyOn(global, 'requestAnimationFrame');
    cafSpy = jest.spyOn(global, 'cancelAnimationFrame');
  });

  afterEach(() => {
      if (!(raindropFx as any).isDestroyed) {
          raindropFx.destroy();
      }
      rafSpy.mockRestore();
      cafSpy.mockRestore();
      // jest.clearAllTimers(); // Clear timers if needed, but usually handled by useFakeTimers
  });

  // Clean up fake timers
  afterAll(() => {
      jest.useRealTimers();
  });

  test('should be importable using ES Module syntax', () => {
    expect(RaindropFX).toBeDefined();
    expect(typeof RaindropFX).toBe('function'); // It's a class constructor
  });

  test('constructor should initialize renderer and simulator', () => {
    // Access the mocked constructors via .mock property
    const { RaindropRenderer } = require('./renderer');
    const { RaindropSimulator } = require('./simulator');

    expect(RaindropRenderer).toHaveBeenCalledTimes(1);
    expect(RaindropSimulator).toHaveBeenCalledTimes(1);
    expect(raindropFx.renderer).toBeDefined();
    expect(raindropFx.simulator).toBeDefined();
  });

  test('start should load assets and begin animation loop', async () => {
    // Needs await because loadAssets is async
    await raindropFx.start(); 
    expect(mockRendererLoadAssets).toHaveBeenCalledTimes(1);
    // RAF should have been called once to schedule the first update
    expect(rafSpy).toHaveBeenCalledTimes(1);

    // Advance time slightly to trigger the first RAF callback
    // Use a small, non-zero time like 16ms (approx 60fps)
    jest.advanceTimersByTime(16);

    // Now the update method should have been called exactly once
    expect(mockSimulatorUpdate).toHaveBeenCalledTimes(1);
    expect(mockRendererRender).toHaveBeenCalledTimes(1);
    // And RAF should have been called again to schedule the *next* frame
    expect(rafSpy).toHaveBeenCalledTimes(2);
  });

  test('stop should cancel animation frame', async () => {
      await raindropFx.start();
      // Let one frame execute
      jest.advanceTimersByTime(16);
      expect(mockSimulatorUpdate).toHaveBeenCalledTimes(1);
      expect(rafSpy).toHaveBeenCalledTimes(2);

      const initialRafCalls = rafSpy.mock.calls.length;
      raindropFx.stop();
      // Check that cancelAnimationFrame was called with the handle returned by the last RAF call
      expect(cafSpy).toHaveBeenCalledTimes(1);
      expect(cafSpy).toHaveBeenCalledWith(rafSpy.mock.results[initialRafCalls - 1].value);

      // Advance time again - shouldn't trigger any more updates
      mockSimulatorUpdate.mockClear();
      mockRendererRender.mockClear();
      jest.advanceTimersByTime(100);
      expect(mockSimulatorUpdate).not.toHaveBeenCalled();
      expect(mockRendererRender).not.toHaveBeenCalled();
      // Ensure RAF wasn't called again after stop
      expect(rafSpy).toHaveBeenCalledTimes(initialRafCalls);
  });

   test('resize should update options and call renderer.resize', () => {
        const newWidth = 1024;
        const newHeight = 768;
        raindropFx.resize(newWidth, newHeight);

        expect((raindropFx as any).options.width).toBe(newWidth);
        expect((raindropFx as any).options.height).toBe(newHeight);
        expect((raindropFx as any).options.viewport.width).toBe(newWidth);
        expect((raindropFx as any).options.viewport.height).toBe(newHeight);
        expect(mockRendererResize).toHaveBeenCalledTimes(1);
    });

    test('setBackground should update options and call renderer.reloadBackground', async () => {
        const newBg = 'new_bg.jpg';
        await raindropFx.setBackground(newBg);
        // Need to access the *mocked* renderer's options instance
        expect(raindropFx.renderer.options.background).toBe(newBg);
        expect(mockRendererReloadBackground).toHaveBeenCalledTimes(1);
    });


  test('destroy should call stop and renderer.destroy, and set isDestroyed flag', () => {
    const stopSpy = jest.spyOn(raindropFx, 'stop');

    raindropFx.destroy();

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(mockRendererDestroy).toHaveBeenCalledTimes(1);
    expect((raindropFx as any).isDestroyed).toBe(true);
    stopSpy.mockRestore(); // Restore spy specifically created in this test
  });

  test('methods should do nothing after destroy is called', async () => {
      raindropFx.destroy();
      jest.clearAllMocks();

      await raindropFx.start();
      // Try advancing timers - should do nothing
      jest.advanceTimersByTime(100);

      raindropFx.stop();
      raindropFx.resize(100, 100);
      await raindropFx.setBackground('another.png');
      (raindropFx as any).update({ dt: 0.016, total: 1 });

      expect(mockRendererLoadAssets).not.toHaveBeenCalled();
      expect(rafSpy).not.toHaveBeenCalled();
      expect(cafSpy).not.toHaveBeenCalled();
      expect(mockRendererResize).not.toHaveBeenCalled();
      expect(mockRendererReloadBackground).not.toHaveBeenCalled();
      expect(mockSimulatorUpdate).not.toHaveBeenCalled();
      expect(mockRendererRender).not.toHaveBeenCalled();
  });

  test('destroy should be callable multiple times without error', () => {
      const stopSpy = jest.spyOn(raindropFx, 'stop');
      expect(() => {
          raindropFx.destroy();
          raindropFx.destroy();
          raindropFx.destroy();
      }).not.toThrow();

      expect(stopSpy).toHaveBeenCalledTimes(1);
      expect(mockRendererDestroy).toHaveBeenCalledTimes(1);
      // Check cafSpy was called by the first destroy
      expect(cafSpy).toHaveBeenCalledTimes(1);
      stopSpy.mockRestore();
  });

}); 