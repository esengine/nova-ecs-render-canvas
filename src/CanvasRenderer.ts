/**
 * Canvas 2D renderer implementation
 * Canvas 2D渲染器实现
 */

import { Fixed, FixedVector2, FixedRect, FixedMatrix2x2 } from '@esengine/nova-ecs-math';
import {
  BaseRenderer,
  Color,
  ColorUtils,
  LineStyle,
  ShapeStyle,
  TextStyle,
  TextureStyle,
  Transform2D,
  ITexture,
  Viewport,
  RenderState
} from '@esengine/nova-ecs-render-core';

import {
  CanvasRendererConfig,
  DEFAULT_CANVAS_CONFIG,
  CanvasTexture,
  CanvasRenderStats
} from './types/CanvasTypes';
import { CoordinateSystem } from './utils/CoordinateSystem';
import { StyleManager } from './utils/StyleManager';
import { BatchManager } from './utils/BatchManager';

/**
 * Canvas 2D renderer implementation
 * Canvas 2D渲染器实现
 */
export class CanvasRenderer extends BaseRenderer {
  protected canvas: HTMLCanvasElement; // Make protected for subclass access
  private ctx: CanvasRenderingContext2D;
  private config: CanvasRendererConfig;
  protected coordinateSystem: CoordinateSystem; // Make protected for subclass access
  private styleManager: StyleManager;
  private batchManager: BatchManager;
  private transformStackDepth: number = 0;
  private canvasStats: CanvasRenderStats = {
    drawCalls: 0,
    batchedDrawCalls: 0,
    styleChanges: 0,
    transformChanges: 0,
    textureBinds: 0,
    pixelsDrawn: 0,
    frameTime: 0
  };

  constructor(canvas: HTMLCanvasElement, config: Partial<CanvasRendererConfig> = {}) {
    super();
    
    this.canvas = canvas;
    this.config = { ...DEFAULT_CANVAS_CONFIG, ...config };
    
    // Get 2D context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;

    // Initialize coordinate system
    const devicePixelRatio = this.config.enableHighDPI ? (window.devicePixelRatio || 1) : 1;
    this.coordinateSystem = new CoordinateSystem(
      this.config.pixelsPerUnit,
      { width: canvas.width, height: canvas.height },
      devicePixelRatio
    );

    // Initialize style manager
    this.styleManager = new StyleManager(this.ctx, this.config.enableStyleCaching);

    // Initialize batch manager
    this.batchManager = new BatchManager(
      this.ctx,
      this.styleManager,
      this.coordinateSystem,
      this.config.maxBatchSize
    );

    // Set up batch manager immediate drawing methods
    this.setupBatchManager();

    // Setup canvas
    this.setupCanvas();
  }

  /**
   * Setup canvas for rendering
   * 设置Canvas用于渲染
   */
  private setupCanvas(): void {
    // Apply high DPI scaling
    if (this.config.enableHighDPI) {
      this.coordinateSystem.applyHighDPIScaling(this.ctx, this.canvas);
    }

    // Set antialiasing
    if (!this.config.enableAntialiasing) {
      this.ctx.imageSmoothingEnabled = false;
    }

    // Set initial coordinate system (world coordinates: origin at center, Y-axis up)
    this.setupCoordinateSystem();
  }

  /**
   * Setup coordinate system
   * 设置坐标系
   */
  private setupCoordinateSystem(): void {
    // Move origin to center of canvas
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    // Flip Y-axis to make Y-axis point up
    this.ctx.scale(1, -1);
  }

  /**
   * Setup batch manager with immediate drawing methods
   * 设置批量管理器的立即绘制方法
   */
  private setupBatchManager(): void {
    this.batchManager.drawLineImmediate = this.drawLineImmediate.bind(this);
    this.batchManager.drawCircleImmediate = this.drawCircleImmediate.bind(this);
    this.batchManager.drawRectImmediate = this.drawRectImmediate.bind(this);
    this.batchManager.drawPolygonImmediate = this.drawPolygonImmediate.bind(this);
    this.batchManager.drawTextImmediate = this.drawTextImmediate.bind(this);
  }

  // ===== Lifecycle Management =====
  // 生命周期管理

  protected onBeginFrame(): void {
    this.ctx.save();
    this.transformStackDepth = 0;
    this.resetCanvasStats();

    // Apply camera transform if needed
    this.applyCameraTransform();
  }

  protected onEndFrame(): void {
    // Flush any remaining batched commands
    this.batchManager.flushBatch();

    // Restore to initial state
    while (this.transformStackDepth > 0) {
      this.popTransform();
    }
    this.ctx.restore();

    // Update statistics
    this.updateStatistics();
  }

  protected onClear(color: Color): void {
    // Save current transform
    this.ctx.save();
    
    // Reset transform to clear entire canvas
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Clear with background color
    this.ctx.fillStyle = ColorUtils.toHex(color);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Restore transform
    this.ctx.restore();
  }

  dispose(): void {
    // Clean up resources
    this.batchManager.endBatch();
    this.styleManager.resetCache();
  }

  // ===== Transform Management =====
  // 变换管理

  protected onSetViewMatrix(_matrix: FixedMatrix2x2): void {
    // For Canvas, view matrix is handled through coordinate system
    // This could be implemented if needed for advanced camera controls
  }

  protected applyTransform(transform: Transform2D): void {
    this.ctx.save();
    this.transformStackDepth++;
    this.canvasStats.transformChanges++;

    // Convert world position to screen coordinates for translation
    const screenPos = this.coordinateSystem.worldToScreen(transform.position);
    
    // Apply translation (relative to current origin)
    this.ctx.translate(
      screenPos.x - this.canvas.width / 2,
      -(screenPos.y - this.canvas.height / 2) // Flip Y for Canvas coordinate system
    );

    // Apply rotation
    this.ctx.rotate(transform.rotation.toNumber());

    // Apply scale
    this.ctx.scale(transform.scale.x.toNumber(), transform.scale.y.toNumber());
  }

  popTransform(): void {
    if (this.transformStackDepth > 0) {
      this.ctx.restore();
      this.transformStackDepth--;
    }
    super.popTransform();
  }

  // ===== Basic Drawing Primitives =====
  // 基础绘制原语

  protected onDrawLine(start: FixedVector2, end: FixedVector2, style: LineStyle): void {
    if (this.config.enableBatchRendering) {
      this.batchManager.addLine(start, end, style);
    } else {
      this.drawLineImmediate(start, end, style);
    }
    this.canvasStats.drawCalls++;
  }

  protected onDrawCircle(center: FixedVector2, radius: Fixed, style: ShapeStyle): void {
    if (this.config.enableBatchRendering) {
      this.batchManager.addCircle(center, radius, style);
    } else {
      this.drawCircleImmediate(center, radius, style);
    }
    this.canvasStats.drawCalls++;
  }

  protected onDrawRect(bounds: FixedRect, style: ShapeStyle): void {
    if (this.config.enableBatchRendering) {
      this.batchManager.addRect(bounds, style);
    } else {
      this.drawRectImmediate(bounds, style);
    }
    this.canvasStats.drawCalls++;
  }

  protected onDrawPolygon(vertices: FixedVector2[], style: ShapeStyle): void {
    if (this.config.enableBatchRendering) {
      this.batchManager.addPolygon(vertices, style);
    } else {
      this.drawPolygonImmediate(vertices, style);
    }
    this.canvasStats.drawCalls++;
  }

  protected onDrawEllipse(bounds: FixedRect, style: ShapeStyle): void {
    this.drawEllipseImmediate(bounds, style);
    this.canvasStats.drawCalls++;
  }

  // ===== Text Rendering =====
  // 文本渲染

  protected onDrawText(text: string, position: FixedVector2, style: TextStyle): void {
    if (this.config.enableBatchRendering) {
      this.batchManager.addText(text, position, style);
    } else {
      this.drawTextImmediate(text, position, style);
    }
    this.canvasStats.drawCalls++;
  }

  protected onMeasureText(text: string, style: TextStyle): FixedVector2 {
    // Apply text style temporarily
    this.styleManager.applyTextStyle(style);
    
    // Measure text
    const metrics = this.ctx.measureText(text);
    const width = new Fixed(metrics.width / this.config.pixelsPerUnit);
    const height = style.fontSize.divide(new Fixed(this.config.pixelsPerUnit));
    
    return new FixedVector2(width, height);
  }

  // ===== Texture Rendering =====
  // 纹理渲染

  protected onDrawTexture(texture: ITexture, position: FixedVector2, style?: TextureStyle): void {
    if (!(texture instanceof CanvasTexture)) {
      // eslint-disable-next-line no-console
      console.warn('Invalid texture type for Canvas renderer');
      return;
    }

    this.drawTextureImmediate(texture, position, style);
    this.canvasStats.drawCalls++;
    this.canvasStats.textureBinds++;
  }

  protected onDrawTextureRegion(
    texture: ITexture,
    sourceRect: FixedRect,
    destRect: FixedRect,
    style?: TextureStyle
  ): void {
    if (!(texture instanceof CanvasTexture)) {
      // eslint-disable-next-line no-console
      console.warn('Invalid texture type for Canvas renderer');
      return;
    }

    this.drawTextureRegionImmediate(texture, sourceRect, destRect, style);
    this.canvasStats.drawCalls++;
    this.canvasStats.textureBinds++;
  }

  // ===== State Management =====
  // 状态管理

  protected onSetRenderState(state: RenderState): void {
    this.styleManager.applyBlendMode(state.blendMode);
    this.styleManager.applyOpacity(state.opacity);

    // Handle clipping if specified
    if (state.clipRect) {
      this.applyClipRect(state.clipRect);
    }
  }

  protected onSetViewport(viewport: Viewport): void {
    // Update canvas size if needed
    if (this.canvas.width !== viewport.width || this.canvas.height !== viewport.height) {
      this.canvas.width = viewport.width;
      this.canvas.height = viewport.height;
      
      // Update coordinate system
      this.coordinateSystem.setCanvasSize({ width: viewport.width, height: viewport.height });
      
      // Reapply high DPI scaling if enabled
      if (this.config.enableHighDPI) {
        this.coordinateSystem.applyHighDPIScaling(this.ctx, this.canvas);
      }
      
      // Reset coordinate system
      this.setupCoordinateSystem();
    }
  }

  // ===== Utility Methods =====
  // 工具方法

  protected onSupportsFeature(feature: string): boolean {
    const supportedFeatures = [
      '2d',
      'canvas',
      'basic-shapes',
      'text',
      'textures',
      'transforms',
      'clipping',
      'batch-rendering',
      'high-dpi'
    ];
    return supportedFeatures.includes(feature);
  }

  protected onGetRendererInfo() {
    return {
      name: 'CanvasRenderer',
      version: '1.0.0',
      vendor: 'HTML5 Canvas 2D',
      capabilities: [
        '2d',
        'canvas',
        'basic-shapes',
        'text',
        'textures',
        'transforms',
        'clipping',
        'batch-rendering',
        'high-dpi'
      ]
    };
  }

  getRenderTarget(): unknown {
    return this.canvas;
  }

  setRenderTarget(_target: unknown): void {
    // For Canvas, render target switching would require different canvas elements
    // This could be implemented for off-screen rendering
    // eslint-disable-next-line no-console
    console.warn('Render target switching not implemented for Canvas renderer');
  }

  // ===== Private Helper Methods =====
  // 私有辅助方法

  private applyCameraTransform(): void {
    // Camera transform is handled by the coordinate system
    // Additional camera effects could be applied here
  }

  private applyClipRect(clipRect: FixedRect): void {
    const screenRect = this.coordinateSystem.worldToScreenRect(clipRect);
    
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(screenRect.x, screenRect.y, screenRect.width, screenRect.height);
    this.ctx.clip();
  }

  private resetCanvasStats(): void {
    this.canvasStats = {
      drawCalls: 0,
      batchedDrawCalls: 0,
      styleChanges: 0,
      transformChanges: 0,
      textureBinds: 0,
      pixelsDrawn: 0,
      frameTime: 0
    };
    this.styleManager.resetStyleChangeCount();
    this.batchManager.resetBatchedDrawCallCount();
  }

  private updateStatistics(): void {
    this.canvasStats.styleChanges = this.styleManager.getStyleChangeCount();
    this.canvasStats.batchedDrawCalls = this.batchManager.getBatchedDrawCallCount();
    this.canvasStats.pixelsDrawn = this.canvas.width * this.canvas.height;
  }

  // ===== Immediate Drawing Methods =====
  // 立即绘制方法

  private drawLineImmediate(start: FixedVector2, end: FixedVector2, style: LineStyle): void {
    this.styleManager.applyLineStyle(style);

    const startScreen = this.coordinateSystem.worldToScreen(start);
    const endScreen = this.coordinateSystem.worldToScreen(end);

    this.ctx.beginPath();
    this.ctx.moveTo(startScreen.x, startScreen.y);
    this.ctx.lineTo(endScreen.x, endScreen.y);
    this.ctx.stroke();
  }

  private drawCircleImmediate(center: FixedVector2, radius: Fixed, style: ShapeStyle): void {
    const centerScreen = this.coordinateSystem.worldToScreen(center);
    const radiusPixels = this.coordinateSystem.worldToScreenDistance(radius);

    this.ctx.beginPath();
    this.ctx.arc(centerScreen.x, centerScreen.y, radiusPixels, 0, 2 * Math.PI);

    if (style.fillColor) {
      this.styleManager.applyShapeStyle(style);
      this.ctx.fill();
    }

    if (style.strokeColor) {
      this.styleManager.applyShapeStyle(style);
      this.ctx.stroke();
    }
  }

  private drawRectImmediate(bounds: FixedRect, style: ShapeStyle): void {
    const screenRect = this.coordinateSystem.worldToScreenRect(bounds);

    this.ctx.beginPath();
    this.ctx.rect(screenRect.x, screenRect.y, screenRect.width, screenRect.height);

    if (style.fillColor) {
      this.styleManager.applyShapeStyle(style);
      this.ctx.fill();
    }

    if (style.strokeColor) {
      this.styleManager.applyShapeStyle(style);
      this.ctx.stroke();
    }
  }

  private drawPolygonImmediate(vertices: FixedVector2[], style: ShapeStyle): void {
    if (vertices.length < 3) return;

    this.ctx.beginPath();

    const firstPoint = this.coordinateSystem.worldToScreen(vertices[0]);
    this.ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < vertices.length; i++) {
      const point = this.coordinateSystem.worldToScreen(vertices[i]);
      this.ctx.lineTo(point.x, point.y);
    }

    this.ctx.closePath();

    if (style.fillColor) {
      this.styleManager.applyShapeStyle(style);
      this.ctx.fill();
    }

    if (style.strokeColor) {
      this.styleManager.applyShapeStyle(style);
      this.ctx.stroke();
    }
  }

  private drawEllipseImmediate(bounds: FixedRect, style: ShapeStyle): void {
    const screenRect = this.coordinateSystem.worldToScreenRect(bounds);
    const centerX = screenRect.x + screenRect.width / 2;
    const centerY = screenRect.y + screenRect.height / 2;
    const radiusX = screenRect.width / 2;
    const radiusY = screenRect.height / 2;

    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

    if (style.fillColor) {
      this.styleManager.applyShapeStyle(style);
      this.ctx.fill();
    }

    if (style.strokeColor) {
      this.styleManager.applyShapeStyle(style);
      this.ctx.stroke();
    }
  }

  private drawTextImmediate(text: string, position: FixedVector2, style: TextStyle): void {
    // Text needs special handling for Y-axis flip
    this.ctx.save();

    // Flip Y-axis for text rendering
    this.ctx.scale(1, -1);

    this.styleManager.applyTextStyle(style);

    const screenPos = this.coordinateSystem.worldToScreen(position);

    // Note: Y coordinate is negated due to the scale(-1) above
    this.ctx.fillText(text, screenPos.x, -screenPos.y);

    this.ctx.restore();
  }

  private drawTextureImmediate(texture: CanvasTexture, position: FixedVector2, style?: TextureStyle): void {
    const screenPos = this.coordinateSystem.worldToScreen(position);

    this.ctx.save();

    // Apply texture style if provided
    if (style) {
      this.applyTextureStyle(style, screenPos, texture);
    }

    // Draw texture
    this.ctx.drawImage(texture.source, screenPos.x, screenPos.y);

    this.ctx.restore();
  }

  private drawTextureRegionImmediate(
    texture: CanvasTexture,
    sourceRect: FixedRect,
    destRect: FixedRect,
    style?: TextureStyle
  ): void {
    const destScreenRect = this.coordinateSystem.worldToScreenRect(destRect);

    this.ctx.save();

    // Apply texture style if provided
    if (style) {
      this.applyTextureStyle(style, { x: destScreenRect.x, y: destScreenRect.y }, texture);
    }

    // Draw texture region
    this.ctx.drawImage(
      texture.source,
      sourceRect.x.toNumber(),
      sourceRect.y.toNumber(),
      sourceRect.width.toNumber(),
      sourceRect.height.toNumber(),
      destScreenRect.x,
      destScreenRect.y,
      destScreenRect.width,
      destScreenRect.height
    );

    this.ctx.restore();
  }

  private applyTextureStyle(style: TextureStyle, position: { x: number; y: number }, texture: CanvasTexture): void {
    // Apply tint if specified
    if (style.tint) {
      // For Canvas, tinting requires creating a temporary canvas or using composite operations
      // This is a simplified implementation
      this.ctx.globalAlpha = style.tint.a;
    }

    // Apply opacity
    if (style.opacity !== undefined) {
      this.ctx.globalAlpha *= style.opacity;
    }

    // Apply scale
    if (style.scale) {
      this.ctx.scale(style.scale.x.toNumber(), style.scale.y.toNumber());
    }

    // Apply rotation
    if (style.rotation && !style.rotation.equals(Fixed.ZERO)) {
      this.ctx.translate(position.x, position.y);
      this.ctx.rotate(style.rotation.toNumber());
      this.ctx.translate(-position.x, -position.y);
    }

    // Apply anchor offset
    if (style.anchor) {
      const offsetX = texture.width * style.anchor.x.toNumber();
      const offsetY = texture.height * style.anchor.y.toNumber();
      this.ctx.translate(-offsetX, -offsetY);
    }

    // Apply flip
    if (style.flipX || style.flipY) {
      const scaleX = style.flipX ? -1 : 1;
      const scaleY = style.flipY ? -1 : 1;
      this.ctx.scale(scaleX, scaleY);

      if (style.flipX) {
        this.ctx.translate(-texture.width, 0);
      }
      if (style.flipY) {
        this.ctx.translate(0, -texture.height);
      }
    }
  }
}
