/**
 * @esengine/nova-ecs-render-canvas - Canvas 2D rendering implementation for NovaECS
 * NovaECS的Canvas 2D渲染实现
 *
 * @packageDocumentation
 */

// ===== Core Renderer =====
// 核心渲染器

export { CanvasRenderer } from './CanvasRenderer';
export { CanvasDebugRenderer } from './CanvasDebugRenderer';

// ===== Types and Interfaces =====
// 类型和接口

export type {
  ScreenPoint,
  ScreenSize,
  CanvasRendererConfig,
  DrawCommand,
  LineDrawData,
  CircleDrawData,
  RectDrawData,
  PolygonDrawData,
  TextDrawData,
  TextureDrawData,
  StyleCacheEntry,
  VisibleBounds,
  CanvasRenderStats,
  HighDPIConfig
} from './types/CanvasTypes';

export {
  DEFAULT_CANVAS_CONFIG,
  CanvasTexture,
  CoordinateSystem as CanvasCoordinateSystem
} from './types/CanvasTypes';

// ===== Utilities =====
// 工具类

export { CoordinateSystem } from './utils/CoordinateSystem';
export { StyleManager } from './utils/StyleManager';
export { BatchManager } from './utils/BatchManager';

// ===== Re-export Core Dependencies =====
// 重新导出核心依赖

export type {
  IRenderer,
  IDebugRenderer,
  Color,
  LineStyle,
  ShapeStyle,
  TextStyle,
  TextureStyle,
  Transform2D,
  ITexture,
  RenderStatistics,
  Viewport,
  RenderState,
  RenderLayer,
  DebugMode,
  DebugInfo,
  PerformanceStats,
  DebugConfig
} from '@esengine/nova-ecs-render-core';

export {
  ColorUtils,
  BlendMode,
  DEFAULT_DEBUG_CONFIG
} from '@esengine/nova-ecs-render-core';

export type {
  Fixed,
  FixedVector2,
  FixedRect,
  FixedMatrix2x2
} from '@esengine/nova-ecs-math';
