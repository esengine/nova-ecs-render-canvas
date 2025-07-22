# @esengine/nova-ecs-render-canvas

Canvas 2D rendering implementation for NovaECS render core, providing high-performance 2D graphics rendering with world coordinate system support.

NovaECS渲染核心的Canvas 2D渲染实现，提供支持世界坐标系的高性能2D图形渲染。

[![npm version](https://badge.fury.io/js/%40esengine%2Fnova-ecs-render-canvas.svg)](https://badge.fury.io/js/%40esengine%2Fnova-ecs-render-canvas)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features | 特性

- 🎨 **World Coordinate System**: Automatic conversion between world and screen coordinates
  **世界坐标系**: 世界坐标和屏幕坐标的自动转换
- 🚀 **High Performance**: Batch rendering and style caching for optimal performance
  **高性能**: 批量渲染和样式缓存以获得最佳性能
- 📱 **High DPI Support**: Automatic high DPI display support
  **高DPI支持**: 自动高DPI显示支持
- 🐛 **Debug Rendering**: Comprehensive debug visualization tools
  **调试渲染**: 全面的调试可视化工具
- 🎯 **Precise Rendering**: Fixed-point math integration for deterministic rendering
  **精确渲染**: 定点数学集成，实现确定性渲染
- 🔧 **Configurable**: Extensive configuration options for different use cases
  **可配置**: 针对不同用例的广泛配置选项

## Installation | 安装

```bash
npm install @esengine/nova-ecs-render-canvas
```

## API Documentation | API 文档

For complete API documentation, visit: [https://esengine.github.io/nova-ecs-render-canvas/](https://esengine.github.io/nova-ecs-render-canvas/)

完整的API文档请访问：[https://esengine.github.io/nova-ecs-render-canvas/](https://esengine.github.io/nova-ecs-render-canvas/)

## Quick Start | 快速开始

### Basic Usage | 基础使用

```typescript
import { CanvasRenderer } from '@esengine/nova-ecs-render-canvas';
import { Fixed, FixedVector2, FixedRect } from '@esengine/nova-ecs-math';
import { ColorUtils } from '@esengine/nova-ecs-render-core';

// Create canvas element
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

// Create renderer
const renderer = new CanvasRenderer(canvas, {
  pixelsPerUnit: 100, // 1 world unit = 100 pixels
  enableHighDPI: true,
  enableBatchRendering: true
});

// Render a frame
renderer.beginFrame();

// Clear with background color
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
  'Hello World!',
  new FixedVector2(Fixed.ZERO, new Fixed(-2)),
  {
    color: ColorUtils.WHITE,
    fontSize: new Fixed(0.3) // In world units
  }
);

renderer.endFrame();
```

### Debug Rendering | 调试渲染

```typescript
import { CanvasDebugRenderer, DebugMode } from '@esengine/nova-ecs-render-canvas';

const debugRenderer = new CanvasDebugRenderer(canvas);
debugRenderer.setDebugMode(DebugMode.All);

debugRenderer.beginFrame();
debugRenderer.clear({ r: 0.05, g: 0.05, b: 0.1, a: 1.0 });

// Draw debug grid
debugRenderer.drawGrid(Fixed.ONE, {
  lineStyle: { color: { r: 0.3, g: 0.3, b: 0.3, a: 0.5 }, thickness: new Fixed(0.01) }
});

// Draw coordinate axes
debugRenderer.drawAxis(FixedVector2.ZERO, new Fixed(3));

// Draw performance stats
debugRenderer.drawPerformanceStats({
  fps: 60,
  frameTime: 16.67,
  drawCalls: 10,
  triangles: 100,
  vertices: 300
});

debugRenderer.endFrame();
```

### Configuration | 配置

```typescript
import { CanvasRenderer, DEFAULT_CANVAS_CONFIG } from '@esengine/nova-ecs-render-canvas';

const config = {
  ...DEFAULT_CANVAS_CONFIG,
  pixelsPerUnit: 50,           // Pixels per world unit
  enableHighDPI: true,         // High DPI support
  enableStyleCaching: true,    // Style caching optimization
  enableBatchRendering: true,  // Batch rendering optimization
  maxBatchSize: 1000,         // Maximum batch size
  enableAntialiasing: true,    // Antialiasing
  backgroundColor: { r: 0, g: 0, b: 0, a: 1 } // Background color
};

const renderer = new CanvasRenderer(canvas, config);
```

## Architecture | 架构

### Coordinate System | 坐标系

The Canvas renderer uses a world coordinate system where:
- Origin (0,0) is at the center of the canvas
- Y-axis points upward (opposite to Canvas default)
- Units are in world space (converted to pixels automatically)

Canvas渲染器使用世界坐标系：
- 原点(0,0)位于画布中心
- Y轴向上（与Canvas默认相反）
- 单位为世界空间（自动转换为像素）

### Performance Optimizations | 性能优化

1. **Batch Rendering**: Groups similar draw calls to reduce state changes
   **批量渲染**: 将相似的绘制调用分组以减少状态更改

2. **Style Caching**: Caches Canvas styles to avoid redundant state changes
   **样式缓存**: 缓存Canvas样式以避免冗余状态更改

3. **High DPI Support**: Automatic scaling for high DPI displays
   **高DPI支持**: 高DPI显示器的自动缩放

4. **Transform Stack**: Efficient transform management with Canvas save/restore
   **变换栈**: 使用Canvas save/restore的高效变换管理

### Class Hierarchy | 类层次结构

```
BaseRenderer (from render-core)
└── CanvasRenderer
    └── CanvasDebugRenderer
```

## API Reference | API 参考

### CanvasRenderer

Main Canvas 2D renderer implementation.

#### Constructor

```typescript
constructor(canvas: HTMLCanvasElement, config?: Partial<CanvasRendererConfig>)
```

#### Key Methods

- `beginFrame()`: Start frame rendering
- `endFrame()`: End frame rendering and present
- `clear(color?: Color)`: Clear canvas with color
- `drawLine(start, end, style)`: Draw line
- `drawCircle(center, radius, style)`: Draw circle
- `drawRect(bounds, style)`: Draw rectangle
- `drawPolygon(vertices, style)`: Draw polygon
- `drawText(text, position, style)`: Draw text

### CanvasDebugRenderer

Debug renderer with additional debugging features.

#### Additional Methods

- `setDebugMode(mode: DebugMode)`: Set debug mode
- `drawGrid(spacing, style)`: Draw debug grid
- `drawAxis(origin, scale)`: Draw coordinate axes
- `drawPerformanceStats(stats)`: Draw performance overlay
- `takeScreenshot()`: Capture canvas as image

### Utilities | 工具类

#### CoordinateSystem

Handles coordinate conversion between world and screen space.

#### StyleManager

Manages Canvas styles with caching for performance.

#### BatchManager

Handles batch rendering optimization.

## Build Status | 构建状态

✅ **Build Successful** - All files generated successfully!

| File | Size | Description |
|------|------|-------------|
| `nova-ecs-render-canvas.esm.js` | 52KB | ES Module build |
| `nova-ecs-render-canvas.cjs.js` | 53KB | CommonJS build |
| `nova-ecs-render-canvas.umd.js` | 60KB | UMD build (browser) |
| `nova-ecs-render-canvas.d.ts` | 19KB | TypeScript definitions |

**Total Package Size**: ~60KB (UMD), ~52KB (ESM/CJS)
**Dependencies**: 3 peer dependencies
**TypeScript**: Full type definitions included
**Tests**: ✅ Passing
**Lint**: ✅ Clean

## Examples | 示例

See the `examples/` directory for complete examples:

- `usage-example.js`: Complete usage guide and code examples
- `example.html`: Interactive Canvas renderer demo

### Live Demo | 在线演示

Open `examples/example.html` in your browser to see the Canvas renderer in action!

## Browser Support | 浏览器支持

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- IE11: Basic support (no high DPI)

## Performance Tips | 性能提示

1. **Enable Batch Rendering**: Set `enableBatchRendering: true`
2. **Use Style Caching**: Set `enableStyleCaching: true`
3. **Optimize Pixels Per Unit**: Balance between quality and performance
4. **Minimize State Changes**: Group similar drawing operations
5. **Use High DPI Wisely**: Disable on low-end devices if needed

## License | 许可证

MIT License - See [LICENSE](LICENSE) file for details.

## Contributing | 贡献

Issues and Pull Requests are welcome!
欢迎提交 Issue 和 Pull Request！
