// __mocks__/zogra-renderer.js

// Mock the vec2 function/object
const vec2 = (x, y) => ({ x, y });
vec2.zero = () => ({ x: 0, y: 0 });
// Add other vec2 static methods if needed (e.g., one(), create(), etc.)

// Mock the Rect class constructor
const Rect = jest.fn().mockImplementation((pos, size) => {
  return {
    x: pos.x,
    y: pos.y,
    width: size.x,
    height: size.y,
    // Mock any methods of Rect if they are called directly in RaindropFX
  };
});

// Mock TextureData (as a type, just needs to exist)
const TextureData = class TextureDataMock {};

// Export the individual mocks
module.exports = {
  vec2,
  Rect,
  TextureData,
  // Add mocks for any other zogra-renderer exports if needed by RaindropFX
}; 