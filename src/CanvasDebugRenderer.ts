/**
 * Canvas debug renderer implementation
 * Canvas调试渲染器实现
 */

import { Fixed, FixedVector2, FixedRect } from '@esengine/nova-ecs-math';
import {
  DebugMode,
  DebugInfo,
  PerformanceStats,
  DebugConfig,
  Color,
  ColorUtils,
  GridStyle,
  IDebugRenderer
} from '@esengine/nova-ecs-render-core';

import { CanvasRenderer } from './CanvasRenderer';
import { CanvasRendererConfig } from './types/CanvasTypes';

/**
 * Canvas debug renderer extending the base Canvas renderer
 * 扩展基础Canvas渲染器的Canvas调试渲染器
 */
export class CanvasDebugRenderer extends CanvasRenderer implements IDebugRenderer {
  private debugMode: DebugMode = DebugMode.Normal;
  private debugConfig: DebugConfig;
  private performanceCounters = new Map<string, number>();
  private performanceMeasurements = new Map<string, number>();
  private debugLoggingEnabled = false;

  constructor(canvas: HTMLCanvasElement, config: Partial<CanvasRendererConfig> = {}) {
    super(canvas, config);
    
    // Initialize debug config with Canvas-specific defaults
    this.debugConfig = {
      showGrid: true,
      showAxis: true,
      showBounds: false,
      showPerformance: true,
      showWireframe: false,
      gridSpacing: new Fixed(1),
      axisLength: new Fixed(2),
      colors: {
        grid: { r: 0.3, g: 0.3, b: 0.3, a: 0.5 },
        gridMajor: { r: 0.5, g: 0.5, b: 0.5, a: 0.7 },
        axis: { r: 0.8, g: 0.8, b: 0.8, a: 1.0 },
        axisX: { r: 1.0, g: 0.2, b: 0.2, a: 1.0 },
        axisY: { r: 0.2, g: 1.0, b: 0.2, a: 1.0 },
        bounds: { r: 1.0, g: 1.0, b: 0.0, a: 0.8 },
        wireframe: { r: 0.0, g: 1.0, b: 1.0, a: 0.8 },
        text: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
        background: { r: 0.0, g: 0.0, b: 0.0, a: 0.7 }
      }
    };
  }

  // ===== Debug Mode Management =====
  // 调试模式管理

  setDebugMode(mode: DebugMode): void {
    this.debugMode = mode;
  }

  getDebugMode(): DebugMode {
    return this.debugMode;
  }

  setDebugConfig(config: Partial<DebugConfig>): void {
    this.debugConfig = { ...this.debugConfig, ...config };
    if (config.colors) {
      this.debugConfig.colors = { ...this.debugConfig.colors, ...config.colors };
    }
  }

  getDebugConfig(): DebugConfig {
    return { ...this.debugConfig };
  }

  // ===== Debug Drawing Functions =====
  // 调试绘制功能

  drawDebugOverlay(info: DebugInfo): void {
    const position = info.position || new FixedVector2(new Fixed(10), new Fixed(10));
    let currentY = position.y;
    
    // Draw background
    const backgroundRect = this.calculateOverlayBounds(info, position);
    this.drawRect(backgroundRect, {
      fillColor: this.debugConfig.colors.background
    });

    // Draw title
    this.drawText(info.title, new FixedVector2(position.x, currentY), {
      color: this.debugConfig.colors.text,
      fontSize: new Fixed(16),
      fontWeight: 'bold'
    });
    currentY = currentY.add(new Fixed(20));

    // Draw items
    for (const item of info.items) {
      const text = `${item.label}: ${item.value}`;
      const color = item.color || this.debugConfig.colors.text;
      
      this.drawText(text, new FixedVector2(position.x, currentY), {
        color,
        fontSize: new Fixed(12)
      });
      currentY = currentY.add(new Fixed(16));
    }
  }

  drawGrid(spacing: Fixed, style: GridStyle): void {
    if (!this.debugConfig.showGrid) return;

    const bounds = this.coordinateSystem.getVisibleBounds();
    const startX = Math.floor(bounds.left / spacing.toNumber()) * spacing.toNumber();
    const startY = Math.floor(bounds.bottom / spacing.toNumber()) * spacing.toNumber();

    let lineCount = 0;

    // Draw vertical lines
    for (let x = startX; x <= bounds.right; x += spacing.toNumber()) {
      const isMainLine = style.majorLineStyle && 
                        style.majorLineInterval && 
                        lineCount % style.majorLineInterval === 0;
      
      const lineStyle = isMainLine && style.majorLineStyle ? style.majorLineStyle : style.lineStyle;
      
      this.drawLine(
        new FixedVector2(new Fixed(x), new Fixed(bounds.bottom)),
        new FixedVector2(new Fixed(x), new Fixed(bounds.top)),
        lineStyle
      );
      lineCount++;
    }

    lineCount = 0;

    // Draw horizontal lines
    for (let y = startY; y <= bounds.top; y += spacing.toNumber()) {
      const isMainLine = style.majorLineStyle && 
                        style.majorLineInterval && 
                        lineCount % style.majorLineInterval === 0;
      
      const lineStyle = isMainLine && style.majorLineStyle ? style.majorLineStyle : style.lineStyle;
      
      this.drawLine(
        new FixedVector2(new Fixed(bounds.left), new Fixed(y)),
        new FixedVector2(new Fixed(bounds.right), new Fixed(y)),
        lineStyle
      );
      lineCount++;
    }
  }

  drawAxis(origin: FixedVector2, scale: Fixed): void {
    if (!this.debugConfig.showAxis) return;

    // X-axis (red)
    this.drawArrow(
      origin,
      origin.add(new FixedVector2(scale, Fixed.ZERO)),
      this.debugConfig.colors.axisX,
      scale.divide(new Fixed(10))
    );

    // Y-axis (green)
    this.drawArrow(
      origin,
      origin.add(new FixedVector2(Fixed.ZERO, scale)),
      this.debugConfig.colors.axisY,
      scale.divide(new Fixed(10))
    );
  }

  drawCrosshair(position: FixedVector2, size: Fixed, color: Color): void {
    const halfSize = size.divide(new Fixed(2));
    
    // Horizontal line
    this.drawLine(
      new FixedVector2(position.x.subtract(halfSize), position.y),
      new FixedVector2(position.x.add(halfSize), position.y),
      { color, thickness: Fixed.ONE }
    );

    // Vertical line
    this.drawLine(
      new FixedVector2(position.x, position.y.subtract(halfSize)),
      new FixedVector2(position.x, position.y.add(halfSize)),
      { color, thickness: Fixed.ONE }
    );
  }

  drawBounds(bounds: FixedRect, color: Color): void {
    if (!this.debugConfig.showBounds) return;

    this.drawRect(bounds, {
      strokeColor: color,
      strokeThickness: Fixed.ONE
    });
  }

  drawArrow(start: FixedVector2, end: FixedVector2, color: Color, headSize?: Fixed): void {
    const arrowHeadSize = headSize || this.debugConfig.axisLength.divide(new Fixed(10));
    
    // Draw main line
    this.drawLine(start, end, { color, thickness: Fixed.ONE });

    // Calculate arrow head
    const direction = end.subtract(start);
    const length = direction.magnitude();
    
    if (length.greaterThan(Fixed.ZERO)) {
      const normalizedDir = direction.divide(length);
      const perpendicular = new FixedVector2(normalizedDir.y.negate(), normalizedDir.x);
      
      const headBase = end.subtract(normalizedDir.multiply(arrowHeadSize));
      const headLeft = headBase.add(perpendicular.multiply(arrowHeadSize.divide(new Fixed(2))));
      const headRight = headBase.subtract(perpendicular.multiply(arrowHeadSize.divide(new Fixed(2))));

      // Draw arrow head
      this.drawLine(end, headLeft, { color, thickness: Fixed.ONE });
      this.drawLine(end, headRight, { color, thickness: Fixed.ONE });
    }
  }

  // ===== Performance Monitoring =====
  // 性能监控

  drawPerformanceStats(stats: PerformanceStats): void {
    if (!this.debugConfig.showPerformance) return;

    const debugInfo: DebugInfo = {
      title: 'Performance Stats',
      items: [
        { label: 'FPS', value: stats.fps.toFixed(1) },
        { label: 'Frame Time', value: `${stats.frameTime.toFixed(2)}ms` },
        { label: 'Draw Calls', value: stats.drawCalls },
        { label: 'Triangles', value: stats.triangles },
        { label: 'Vertices', value: stats.vertices }
      ],
      position: new FixedVector2(new Fixed(10), new Fixed(10))
    };

    if (stats.memoryUsage) {
      const memoryMB = (stats.memoryUsage.used / (1024 * 1024)).toFixed(1);
      const totalMB = (stats.memoryUsage.total / (1024 * 1024)).toFixed(1);
      debugInfo.items.push({
        label: 'Memory',
        value: `${memoryMB}/${totalMB} MB`
      });
    }

    if (stats.customCounters) {
      for (const [name, value] of stats.customCounters) {
        debugInfo.items.push({
          label: name,
          value: typeof value === 'number' ? value.toFixed(2) : value
        });
      }
    }

    this.drawDebugOverlay(debugInfo);
  }

  startPerformanceMeasure(name: string): void {
    this.performanceCounters.set(name, performance.now());
  }

  endPerformanceMeasure(name: string): void {
    const startTime = this.performanceCounters.get(name);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      this.performanceMeasurements.set(name, duration);
      this.performanceCounters.delete(name);
    }
  }

  getPerformanceMeasurements(): Map<string, number> {
    return new Map(this.performanceMeasurements);
  }

  clearPerformanceMeasurements(): void {
    this.performanceMeasurements.clear();
    this.performanceCounters.clear();
  }

  // ===== Debug Utilities =====
  // 调试工具

  async takeScreenshot(): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        resolve(blob);
      });
    });
  }

  setDebugLogging(enabled: boolean): void {
    this.debugLoggingEnabled = enabled;
  }

  debugLog(message: string, color?: Color): void {
    if (this.debugLoggingEnabled) {
      const colorStr = color ? ColorUtils.toHex(color) : '#FFFFFF';
      // eslint-disable-next-line no-console
      console.log(`%c[DEBUG] ${message}`, `color: ${colorStr}`);
    }
  }

  drawDebugText(text: string, position: FixedVector2, color?: Color): void {
    this.drawText(text, position, {
      color: color || this.debugConfig.colors.text,
      fontSize: new Fixed(12)
    });
  }

  drawDebugTextScreen(text: string, x: number, y: number, color?: Color): void {
    const worldPos = this.coordinateSystem.screenToWorld({ x, y });
    this.drawDebugText(text, worldPos, color);
  }

  // ===== Private Helper Methods =====
  // 私有辅助方法

  private calculateOverlayBounds(info: DebugInfo, position: FixedVector2): FixedRect {
    // Calculate approximate bounds for the overlay background
    const lineHeight = new Fixed(16);
    const titleHeight = new Fixed(20);
    const padding = new Fixed(8);
    
    const width = new Fixed(200); // Approximate width
    const height = titleHeight.add(lineHeight.multiply(new Fixed(info.items.length))).add(padding.multiply(new Fixed(2)));
    
    return new FixedRect(
      position.x.subtract(padding),
      position.y.subtract(padding),
      width,
      height
    );
  }
}
