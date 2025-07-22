/**
 * Coordinate system conversion utilities
 * 坐标系转换工具
 */

import { Fixed, FixedVector2, FixedRect } from '@esengine/nova-ecs-math';
import { ScreenPoint, ScreenSize, VisibleBounds } from '../types/CanvasTypes';

/**
 * Coordinate system manager for Canvas rendering
 * Canvas渲染的坐标系管理器
 */
export class CoordinateSystem {
  private pixelsPerUnit: number;
  private canvasSize: ScreenSize;
  private cameraPosition: FixedVector2;
  private cameraZoom: Fixed;
  private devicePixelRatio: number;

  constructor(
    pixelsPerUnit: number = 100,
    canvasSize: ScreenSize = { width: 800, height: 600 },
    devicePixelRatio: number = 1
  ) {
    this.pixelsPerUnit = pixelsPerUnit;
    this.canvasSize = canvasSize;
    this.cameraPosition = FixedVector2.ZERO;
    this.cameraZoom = Fixed.ONE;
    this.devicePixelRatio = devicePixelRatio;
  }

  /**
   * Update canvas size
   * 更新画布尺寸
   */
  setCanvasSize(size: ScreenSize): void {
    this.canvasSize = size;
  }

  /**
   * Update camera position
   * 更新相机位置
   */
  setCameraPosition(position: FixedVector2): void {
    this.cameraPosition = position;
  }

  /**
   * Update camera zoom
   * 更新相机缩放
   */
  setCameraZoom(zoom: Fixed): void {
    this.cameraZoom = zoom;
  }

  /**
   * Update pixels per unit
   * 更新每单位像素数
   */
  setPixelsPerUnit(pixelsPerUnit: number): void {
    this.pixelsPerUnit = pixelsPerUnit;
  }

  /**
   * Update device pixel ratio
   * 更新设备像素比
   */
  setDevicePixelRatio(ratio: number): void {
    this.devicePixelRatio = ratio;
  }

  /**
   * Convert world coordinates to screen coordinates
   * 将世界坐标转换为屏幕坐标
   */
  worldToScreen(worldPos: FixedVector2): ScreenPoint {
    // Apply camera transform
    const relative = worldPos.subtract(this.cameraPosition);
    const scaled = new FixedVector2(
      relative.x.multiply(this.cameraZoom),
      relative.y.multiply(this.cameraZoom)
    );

    // Convert to pixels
    const pixelX = scaled.x.toNumber() * this.pixelsPerUnit;
    const pixelY = scaled.y.toNumber() * this.pixelsPerUnit;

    // Convert to screen coordinates (origin at center, Y-axis up)
    const screenX = pixelX + this.canvasSize.width / 2;
    const screenY = this.canvasSize.height / 2 - pixelY; // Flip Y-axis

    return { x: screenX, y: screenY };
  }

  /**
   * Convert screen coordinates to world coordinates
   * 将屏幕坐标转换为世界坐标
   */
  screenToWorld(screenPos: ScreenPoint): FixedVector2 {
    // Convert from screen coordinates to pixels (origin at center, Y-axis up)
    const pixelX = screenPos.x - this.canvasSize.width / 2;
    const pixelY = this.canvasSize.height / 2 - screenPos.y; // Flip Y-axis

    // Convert to world units
    const worldX = pixelX / this.pixelsPerUnit;
    const worldY = pixelY / this.pixelsPerUnit;

    // Apply inverse camera transform
    const worldPos = new FixedVector2(
      new Fixed(worldX).divide(this.cameraZoom),
      new Fixed(worldY).divide(this.cameraZoom)
    );

    return worldPos.add(this.cameraPosition);
  }

  /**
   * Convert world distance to screen pixels
   * 将世界距离转换为屏幕像素
   */
  worldToScreenDistance(worldDistance: Fixed): number {
    return worldDistance.toNumber() * this.pixelsPerUnit * this.cameraZoom.toNumber();
  }

  /**
   * Convert screen pixels to world distance
   * 将屏幕像素转换为世界距离
   */
  screenToWorldDistance(screenPixels: number): Fixed {
    return new Fixed(screenPixels / (this.pixelsPerUnit * this.cameraZoom.toNumber()));
  }

  /**
   * Convert world rectangle to screen rectangle
   * 将世界矩形转换为屏幕矩形
   */
  worldToScreenRect(worldRect: FixedRect): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const topLeft = this.worldToScreen(new FixedVector2(worldRect.x, worldRect.y.add(worldRect.height)));
    const bottomRight = this.worldToScreen(new FixedVector2(worldRect.x.add(worldRect.width), worldRect.y));

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  }

  /**
   * Get visible world bounds
   * 获取可见的世界边界
   */
  getVisibleBounds(): VisibleBounds {
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({
      x: this.canvasSize.width,
      y: this.canvasSize.height
    });

    return {
      left: topLeft.x.toNumber(),
      right: bottomRight.x.toNumber(),
      top: topLeft.y.toNumber(),
      bottom: bottomRight.y.toNumber(),
      width: bottomRight.x.subtract(topLeft.x).toNumber(),
      height: topLeft.y.subtract(bottomRight.y).toNumber()
    };
  }

  /**
   * Check if world point is visible
   * 检查世界点是否可见
   */
  isPointVisible(worldPos: FixedVector2, margin: Fixed = Fixed.ZERO): boolean {
    const screenPos = this.worldToScreen(worldPos);
    const marginPixels = this.worldToScreenDistance(margin);

    return (
      screenPos.x >= -marginPixels &&
      screenPos.x <= this.canvasSize.width + marginPixels &&
      screenPos.y >= -marginPixels &&
      screenPos.y <= this.canvasSize.height + marginPixels
    );
  }

  /**
   * Check if world rectangle is visible
   * 检查世界矩形是否可见
   */
  isRectVisible(worldRect: FixedRect, margin: Fixed = Fixed.ZERO): boolean {
    const screenRect = this.worldToScreenRect(worldRect);
    const marginPixels = this.worldToScreenDistance(margin);

    return (
      screenRect.x + screenRect.width >= -marginPixels &&
      screenRect.x <= this.canvasSize.width + marginPixels &&
      screenRect.y + screenRect.height >= -marginPixels &&
      screenRect.y <= this.canvasSize.height + marginPixels
    );
  }

  /**
   * Get current camera info
   * 获取当前相机信息
   */
  getCameraInfo(): {
    position: FixedVector2;
    zoom: Fixed;
    pixelsPerUnit: number;
    visibleBounds: VisibleBounds;
  } {
    return {
      position: this.cameraPosition,
      zoom: this.cameraZoom,
      pixelsPerUnit: this.pixelsPerUnit,
      visibleBounds: this.getVisibleBounds()
    };
  }

  /**
   * Apply high DPI scaling
   * 应用高DPI缩放
   */
  applyHighDPIScaling(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    if (this.devicePixelRatio === 1) return;

    const rect = canvas.getBoundingClientRect();

    // Set actual resolution
    canvas.width = rect.width * this.devicePixelRatio;
    canvas.height = rect.height * this.devicePixelRatio;

    // Set display size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Scale drawing context
    ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

    // Update canvas size
    this.setCanvasSize({ width: rect.width, height: rect.height });
  }
}
