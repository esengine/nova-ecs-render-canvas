/**
 * Canvas-specific types and interfaces
 * Canvas特定的类型和接口
 */

/// <reference lib="dom" />

import { Fixed, FixedVector2 } from '@esengine/nova-ecs-math';
import { Color } from '@esengine/nova-ecs-render-core';

/**
 * Screen coordinates (pixels)
 * 屏幕坐标（像素）
 */
export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Screen size (pixels)
 * 屏幕尺寸（像素）
 */
export interface ScreenSize {
  width: number;
  height: number;
}

/**
 * Canvas renderer configuration
 * Canvas渲染器配置
 */
export interface CanvasRendererConfig {
  /** Pixels per world unit (default: 100) */
  pixelsPerUnit: number;
  
  /** Enable high DPI support (default: true) */
  enableHighDPI: boolean;
  
  /** Enable style caching for performance (default: true) */
  enableStyleCaching: boolean;
  
  /** Enable batch rendering (default: true) */
  enableBatchRendering: boolean;
  
  /** Maximum batch size (default: 1000) */
  maxBatchSize: number;
  
  /** Background color (default: transparent) */
  backgroundColor?: Color;
  
  /** Enable antialiasing (default: true) */
  enableAntialiasing: boolean;
}

/**
 * Default canvas renderer configuration
 * 默认Canvas渲染器配置
 */
export const DEFAULT_CANVAS_CONFIG: CanvasRendererConfig = {
  pixelsPerUnit: 100,
  enableHighDPI: true,
  enableStyleCaching: true,
  enableBatchRendering: true,
  maxBatchSize: 1000,
  enableAntialiasing: true
};

/**
 * Draw command for batch rendering
 * 批量渲染的绘制命令
 */
export interface DrawCommand {
  type: 'line' | 'circle' | 'rect' | 'polygon' | 'text' | 'texture';
  data: unknown;
  style: unknown;
}

/**
 * Line draw command data
 * 线条绘制命令数据
 */
export interface LineDrawData {
  start: FixedVector2;
  end: FixedVector2;
}

/**
 * Circle draw command data
 * 圆形绘制命令数据
 */
export interface CircleDrawData {
  center: FixedVector2;
  radius: Fixed;
}

/**
 * Rectangle draw command data
 * 矩形绘制命令数据
 */
export interface RectDrawData {
  x: Fixed;
  y: Fixed;
  width: Fixed;
  height: Fixed;
}

/**
 * Polygon draw command data
 * 多边形绘制命令数据
 */
export interface PolygonDrawData {
  vertices: FixedVector2[];
}

/**
 * Text draw command data
 * 文本绘制命令数据
 */
export interface TextDrawData {
  text: string;
  position: FixedVector2;
}

/**
 * Texture draw command data
 * 纹理绘制命令数据
 */
export interface TextureDrawData {
  texture: CanvasTexture;
  position: FixedVector2;
  sourceRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  destRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Canvas texture implementation
 * Canvas纹理实现
 */
export class CanvasTexture {
  public readonly width: number;
  public readonly height: number;
  public readonly isLoaded: boolean = true;
  public readonly source: HTMLImageElement | HTMLCanvasElement | ImageBitmap;

  constructor(source: HTMLImageElement | HTMLCanvasElement | ImageBitmap) {
    this.source = source;
    this.width = source.width;
    this.height = source.height;
  }

  /**
   * Create texture from image URL
   * 从图片URL创建纹理
   */
  static async fromURL(url: string): Promise<CanvasTexture> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(new CanvasTexture(img));
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Create texture from canvas
   * 从Canvas创建纹理
   */
  static fromCanvas(canvas: HTMLCanvasElement): CanvasTexture {
    return new CanvasTexture(canvas);
  }

  /**
   * Create texture from ImageBitmap
   * 从ImageBitmap创建纹理
   */
  static fromImageBitmap(bitmap: ImageBitmap): CanvasTexture {
    return new CanvasTexture(bitmap);
  }
}

/**
 * Style cache entry
 * 样式缓存条目
 */
export interface StyleCacheEntry {
  strokeStyle?: string;
  fillStyle?: string;
  lineWidth?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  font?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  globalAlpha?: number;
  globalCompositeOperation?: GlobalCompositeOperation;
}

/**
 * Visible bounds in world coordinates
 * 世界坐标中的可见边界
 */
export interface VisibleBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Canvas renderer statistics
 * Canvas渲染器统计信息
 */
export interface CanvasRenderStats {
  drawCalls: number;
  batchedDrawCalls: number;
  styleChanges: number;
  transformChanges: number;
  textureBinds: number;
  pixelsDrawn: number;
  frameTime: number;
}

/**
 * High DPI configuration
 * 高DPI配置
 */
export interface HighDPIConfig {
  devicePixelRatio: number;
  backingStoreRatio: number;
  scaleFactor: number;
}

/**
 * Canvas coordinate system type
 * Canvas坐标系类型
 */
export enum CoordinateSystem {
  /** Screen coordinates: origin at top-left, Y-axis down */
  Screen = 'screen',
  /** World coordinates: origin at bottom-left, Y-axis up */
  World = 'world'
}
