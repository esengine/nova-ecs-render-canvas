/**
 * Usage example for NovaECS Canvas Renderer
 * 展示如何在实际项目中使用NovaECS Canvas渲染器
 */

// This is how you would use the Canvas Renderer in a real Node.js/browser application
// 这是在真实的Node.js/浏览器应用中使用Canvas渲染器的方式

console.log('NovaECS Canvas Renderer Usage Example');
console.log('=====================================\n');

// 1. Installation 安装
console.log('1. Installation 安装:');
console.log('npm install @esengine/nova-ecs-render-canvas');
console.log('npm install @esengine/nova-ecs-math');
console.log('npm install @esengine/nova-ecs-render-core\n');

// 2. Import 导入
console.log('2. Import 导入:');
console.log(`
// ES Modules
import { 
  CanvasRenderer, 
  CanvasDebugRenderer, 
  CanvasTexture,
  DEFAULT_CANVAS_CONFIG 
} from '@esengine/nova-ecs-render-canvas';

import { Fixed, FixedVector2, FixedRect } from '@esengine/nova-ecs-math';
import { ColorUtils, Transform2D } from '@esengine/nova-ecs-render-core';

// CommonJS
const { 
  CanvasRenderer, 
  CanvasDebugRenderer 
} = require('@esengine/nova-ecs-render-canvas');
`);

// 3. Basic Usage 基础使用
console.log('3. Basic Usage 基础使用:');
console.log(`
// Create canvas element
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

// Create renderer with configuration
const renderer = new CanvasRenderer(canvas, {
  pixelsPerUnit: 100,        // 1 world unit = 100 pixels
  enableHighDPI: true,       // Support high DPI displays
  enableBatchRendering: true, // Enable batch optimization
  enableStyleCaching: true,   // Enable style caching
  backgroundColor: { r: 0.1, g: 0.1, b: 0.3, a: 1.0 }
});

// Render a frame
function renderFrame() {
  renderer.beginFrame();
  
  // Clear background
  renderer.clear({ r: 0.1, g: 0.1, b: 0.3, a: 1.0 });
  
  // Draw shapes in world coordinates
  renderer.drawRect(
    new FixedRect(new Fixed(-1), new Fixed(-1), new Fixed(2), new Fixed(2)),
    { fillColor: ColorUtils.RED }
  );
  
  renderer.drawCircle(
    new FixedVector2(new Fixed(2), Fixed.ZERO),
    Fixed.ONE,
    { fillColor: ColorUtils.GREEN }
  );
  
  renderer.drawText(
    'Hello NovaECS!',
    new FixedVector2(Fixed.ZERO, new Fixed(-2)),
    {
      color: ColorUtils.WHITE,
      fontSize: new Fixed(0.3), // In world units
      fontFamily: 'Arial'
    }
  );
  
  renderer.endFrame();
}

renderFrame();
`);

// 4. Debug Rendering 调试渲染
console.log('4. Debug Rendering 调试渲染:');
console.log(`
// Create debug renderer
const debugRenderer = new CanvasDebugRenderer(canvas, {
  pixelsPerUnit: 100,
  enableHighDPI: true
});

// Set debug mode
debugRenderer.setDebugMode(DebugMode.All);

function renderDebugFrame() {
  debugRenderer.beginFrame();
  debugRenderer.clear({ r: 0.05, g: 0.05, b: 0.1, a: 1.0 });
  
  // Draw debug grid
  debugRenderer.drawGrid(Fixed.ONE, {
    lineStyle: { 
      color: { r: 0.3, g: 0.3, b: 0.3, a: 0.5 }, 
      thickness: new Fixed(0.01) 
    }
  });
  
  // Draw coordinate axes
  debugRenderer.drawAxis(FixedVector2.ZERO, new Fixed(3));
  
  // Draw performance stats
  debugRenderer.drawPerformanceStats({
    fps: 60,
    frameTime: 16.67,
    drawCalls: 10,
    triangles: 100
  });
  
  debugRenderer.endFrame();
}

renderDebugFrame();
`);

// 5. Animation Example 动画示例
console.log('5. Animation Example 动画示例:');
console.log(`
let time = 0;

function animate() {
  time += 0.016; // ~60 FPS
  
  renderer.beginFrame();
  renderer.clear({ r: 0.1, g: 0.1, b: 0.2, a: 1.0 });
  
  // Rotating circle
  const angle = time * 2;
  const radius = 2;
  const circlePos = new FixedVector2(
    new Fixed(Math.cos(angle) * radius),
    new Fixed(Math.sin(angle) * radius)
  );
  
  renderer.drawCircle(circlePos, new Fixed(0.3), {
    fillColor: { r: 1, g: 0.5, b: 0.5, a: 0.8 }
  });
  
  // Pulsing rectangle with transform
  const scale = 1 + Math.sin(time * 4) * 0.3;
  renderer.pushTransform(new Transform2D(
    FixedVector2.ZERO,
    new Fixed(time),
    new FixedVector2(new Fixed(scale), new Fixed(scale))
  ));
  
  renderer.drawRect(
    new FixedRect(new Fixed(-0.5), new Fixed(-0.5), Fixed.ONE, Fixed.ONE),
    { fillColor: { r: 0.5, g: 1, b: 0.5, a: 0.8 } }
  );
  
  renderer.popTransform();
  
  renderer.endFrame();
  
  requestAnimationFrame(animate);
}

animate();
`);

// 6. Texture Rendering 纹理渲染
console.log('6. Texture Rendering 纹理渲染:');
console.log(`
// Load texture from URL
const texture = await CanvasTexture.fromURL('path/to/image.png');

// Or create from canvas
const offscreenCanvas = document.createElement('canvas');
const texture2 = CanvasTexture.fromCanvas(offscreenCanvas);

// Draw texture
renderer.drawTexture(texture, position, {
  scale: new FixedVector2(new Fixed(2), new Fixed(2)),
  rotation: new Fixed(Math.PI / 4),
  anchor: new FixedVector2(new Fixed(0.5), new Fixed(0.5)),
  tint: { r: 1, g: 0.8, b: 0.8, a: 1 },
  flipX: false,
  flipY: false
});

// Draw texture region
renderer.drawTextureRegion(
  texture,
  new FixedRect(new Fixed(0), new Fixed(0), new Fixed(64), new Fixed(64)), // source
  new FixedRect(new Fixed(-1), new Fixed(-1), new Fixed(2), new Fixed(2)), // destination
  { opacity: 0.8 }
);
`);

// 7. Performance Tips 性能提示
console.log('7. Performance Tips 性能提示:');
console.log(`
// Enable batch rendering for better performance
const config = {
  ...DEFAULT_CANVAS_CONFIG,
  enableBatchRendering: true,
  maxBatchSize: 1000,
  enableStyleCaching: true
};

// Use batch rendering manually
renderer.beginBatch();

// Draw many similar objects
for (let i = 0; i < 1000; i++) {
  renderer.drawCircle(
    new FixedVector2(new Fixed(Math.random() * 10), new Fixed(Math.random() * 10)),
    new Fixed(0.1),
    { fillColor: ColorUtils.RED }
  );
}

renderer.endBatch(); // Executes all batched commands efficiently

// Get performance statistics
const stats = renderer.getStatistics();
console.log('Draw calls:', stats.drawCalls);
console.log('Frame time:', stats.frameTime);
`);

// 8. TypeScript Usage TypeScript使用
console.log('8. TypeScript Usage TypeScript使用:');
console.log(`
import { 
  CanvasRenderer, 
  CanvasRendererConfig,
  CanvasRenderStats 
} from '@esengine/nova-ecs-render-canvas';

// Type-safe configuration
const config: CanvasRendererConfig = {
  pixelsPerUnit: 100,
  enableHighDPI: true,
  enableBatchRendering: true,
  enableStyleCaching: true,
  maxBatchSize: 1000,
  enableAntialiasing: true
};

// Create renderer with full type safety
const renderer: CanvasRenderer = new CanvasRenderer(canvas, config);

// Type-safe statistics
const stats: CanvasRenderStats = renderer.getStatistics();
`);

// 9. Integration with ECS ECS集成
console.log('9. Integration with ECS ECS集成:');
console.log(`
// In a real ECS system, you would use the renderer in render systems
class RenderSystem extends System {
  private renderer: CanvasRenderer;
  
  constructor(canvas: HTMLCanvasElement) {
    super();
    this.renderer = new CanvasRenderer(canvas);
  }
  
  update(entities: Entity[]): void {
    this.renderer.beginFrame();
    this.renderer.clear({ r: 0.1, g: 0.1, b: 0.3, a: 1.0 });
    
    // Render all entities with render components
    for (const entity of entities) {
      const transform = entity.getComponent(TransformComponent);
      const sprite = entity.getComponent(SpriteComponent);
      
      if (transform && sprite) {
        this.renderer.pushTransform(transform.getTransform2D());
        this.renderer.drawTexture(sprite.texture, FixedVector2.ZERO, sprite.style);
        this.renderer.popTransform();
      }
    }
    
    this.renderer.endFrame();
  }
}
`);

console.log('\n=====================================');
console.log('For more examples and documentation, visit:');
console.log('https://github.com/esengine/nova-ecs-render-canvas');
console.log('=====================================\n');

// Show build information
console.log('Build Information:');
console.log('- UMD build: dist/nova-ecs-render-canvas.umd.js');
console.log('- ES Module: dist/nova-ecs-render-canvas.esm.js');
console.log('- CommonJS: dist/nova-ecs-render-canvas.cjs.js');
console.log('- TypeScript definitions: dist/nova-ecs-render-canvas.d.ts');
console.log('- Package size: ~50KB (minified)');
console.log('- Dependencies: @esengine/nova-ecs, @esengine/nova-ecs-math, @esengine/nova-ecs-render-core');
