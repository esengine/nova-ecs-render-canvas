/**
 * Canvas style management for performance optimization
 * Canvas样式管理，用于性能优化
 */

/// <reference lib="dom" />

import {
  ColorUtils,
  LineStyle,
  ShapeStyle,
  TextStyle,
  BlendMode
} from '@esengine/nova-ecs-render-core';
import { StyleCacheEntry } from '../types/CanvasTypes';

/**
 * Style manager for Canvas rendering
 * Canvas渲染的样式管理器
 */
export class StyleManager {
  private ctx: CanvasRenderingContext2D;
  private currentStyle: StyleCacheEntry = {};
  private styleChangeCount: number = 0;
  private enableCaching: boolean;

  constructor(ctx: CanvasRenderingContext2D, enableCaching: boolean = true) {
    this.ctx = ctx;
    this.enableCaching = enableCaching;
  }

  /**
   * Get style change count for statistics
   * 获取样式更改次数用于统计
   */
  getStyleChangeCount(): number {
    return this.styleChangeCount;
  }

  /**
   * Reset style change count
   * 重置样式更改次数
   */
  resetStyleChangeCount(): void {
    this.styleChangeCount = 0;
  }

  /**
   * Apply line style to canvas context
   * 将线条样式应用到Canvas上下文
   */
  applyLineStyle(style: LineStyle): void {
    const colorStr = ColorUtils.toHex(style.color);
    const lineWidth = style.thickness.toNumber();

    this.setStrokeStyle(colorStr);
    this.setLineWidth(lineWidth);

    // Apply dash pattern if specified
    if (style.dashPattern && style.dashPattern.length > 0) {
      const dashArray = style.dashPattern.map(d => d.toNumber());
      this.ctx.setLineDash(dashArray);
    } else {
      this.ctx.setLineDash([]);
    }
  }

  /**
   * Apply shape style to canvas context
   * 将形状样式应用到Canvas上下文
   */
  applyShapeStyle(style: ShapeStyle): void {
    if (style.fillColor) {
      const fillColorStr = ColorUtils.toHex(style.fillColor);
      this.setFillStyle(fillColorStr);
    }

    if (style.strokeColor) {
      const strokeColorStr = ColorUtils.toHex(style.strokeColor);
      this.setStrokeStyle(strokeColorStr);

      if (style.strokeThickness) {
        this.setLineWidth(style.strokeThickness.toNumber());
      }

      // Apply dash pattern if specified
      if (style.dashPattern && style.dashPattern.length > 0) {
        const dashArray = style.dashPattern.map(d => d.toNumber());
        this.ctx.setLineDash(dashArray);
      } else {
        this.ctx.setLineDash([]);
      }
    }
  }

  /**
   * Apply text style to canvas context
   * 将文本样式应用到Canvas上下文
   */
  applyTextStyle(style: TextStyle): void {
    const colorStr = ColorUtils.toHex(style.color);
    this.setFillStyle(colorStr);

    // Build font string
    const fontWeight = style.fontWeight || 'normal';
    const fontStyle = style.fontStyle || 'normal';
    const fontSize = style.fontSize.toNumber();
    const fontFamily = style.fontFamily || 'Arial';
    const fontStr = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

    this.setFont(fontStr);

    // Set text alignment
    if (style.textAlign) {
      this.setTextAlign(style.textAlign);
    }

    if (style.textBaseline) {
      this.setTextBaseline(style.textBaseline);
    }
  }

  /**
   * Apply blend mode to canvas context
   * 将混合模式应用到Canvas上下文
   */
  applyBlendMode(blendMode: BlendMode): void {
    const canvasBlendMode = this.blendModeToCanvas(blendMode);
    this.setGlobalCompositeOperation(canvasBlendMode);
  }

  /**
   * Apply opacity to canvas context
   * 将透明度应用到Canvas上下文
   */
  applyOpacity(opacity: number): void {
    this.setGlobalAlpha(opacity);
  }

  /**
   * Set stroke style with caching
   * 设置描边样式（带缓存）
   */
  private setStrokeStyle(style: string): void {
    if (!this.enableCaching || this.currentStyle.strokeStyle !== style) {
      this.ctx.strokeStyle = style;
      this.currentStyle.strokeStyle = style;
      this.styleChangeCount++;
    }
  }

  /**
   * Set fill style with caching
   * 设置填充样式（带缓存）
   */
  private setFillStyle(style: string): void {
    if (!this.enableCaching || this.currentStyle.fillStyle !== style) {
      this.ctx.fillStyle = style;
      this.currentStyle.fillStyle = style;
      this.styleChangeCount++;
    }
  }

  /**
   * Set line width with caching
   * 设置线宽（带缓存）
   */
  private setLineWidth(width: number): void {
    if (!this.enableCaching || this.currentStyle.lineWidth !== width) {
      this.ctx.lineWidth = width;
      this.currentStyle.lineWidth = width;
      this.styleChangeCount++;
    }
  }

  /**
   * Set font with caching
   * 设置字体（带缓存）
   */
  private setFont(font: string): void {
    if (!this.enableCaching || this.currentStyle.font !== font) {
      this.ctx.font = font;
      this.currentStyle.font = font;
      this.styleChangeCount++;
    }
  }

  /**
   * Set text align with caching
   * 设置文本对齐（带缓存）
   */
  private setTextAlign(align: CanvasTextAlign): void {
    if (!this.enableCaching || this.currentStyle.textAlign !== align) {
      this.ctx.textAlign = align;
      this.currentStyle.textAlign = align;
      this.styleChangeCount++;
    }
  }

  /**
   * Set text baseline with caching
   * 设置文本基线（带缓存）
   */
  private setTextBaseline(baseline: CanvasTextBaseline): void {
    if (!this.enableCaching || this.currentStyle.textBaseline !== baseline) {
      this.ctx.textBaseline = baseline;
      this.currentStyle.textBaseline = baseline;
      this.styleChangeCount++;
    }
  }

  /**
   * Set global alpha with caching
   * 设置全局透明度（带缓存）
   */
  private setGlobalAlpha(alpha: number): void {
    if (!this.enableCaching || this.currentStyle.globalAlpha !== alpha) {
      this.ctx.globalAlpha = alpha;
      this.currentStyle.globalAlpha = alpha;
      this.styleChangeCount++;
    }
  }

  /**
   * Set global composite operation with caching
   * 设置全局合成操作（带缓存）
   */
  private setGlobalCompositeOperation(operation: GlobalCompositeOperation): void {
    if (!this.enableCaching || this.currentStyle.globalCompositeOperation !== operation) {
      this.ctx.globalCompositeOperation = operation;
      this.currentStyle.globalCompositeOperation = operation;
      this.styleChangeCount++;
    }
  }

  /**
   * Convert blend mode to Canvas composite operation
   * 将混合模式转换为Canvas合成操作
   */
  private blendModeToCanvas(blendMode: BlendMode): GlobalCompositeOperation {
    switch (blendMode) {
      case BlendMode.Normal: return 'source-over';
      case BlendMode.Add: return 'lighter';
      case BlendMode.Multiply: return 'multiply';
      case BlendMode.Screen: return 'screen';
      case BlendMode.Overlay: return 'overlay';
      case BlendMode.Darken: return 'darken';
      case BlendMode.Lighten: return 'lighten';
      default: return 'source-over';
    }
  }

  /**
   * Save current style state
   * 保存当前样式状态
   */
  saveState(): void {
    this.ctx.save();
  }

  /**
   * Restore previous style state
   * 恢复之前的样式状态
   */
  restoreState(): void {
    this.ctx.restore();
    // Clear cache since we don't know what the restored state is
    this.currentStyle = {};
  }

  /**
   * Reset all cached styles
   * 重置所有缓存的样式
   */
  resetCache(): void {
    this.currentStyle = {};
  }
}
