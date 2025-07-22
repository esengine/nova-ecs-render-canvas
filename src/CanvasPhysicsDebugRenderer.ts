/**
 * Canvas-based physics debug renderer implementation
 * 基于Canvas的物理调试渲染器实现
 */

import { Fixed, FixedVector2, FixedRect } from '@esengine/nova-ecs-math';
import {
  BasePhysicsDebugRenderer,
  IPhysicsDebugRenderer,
  ContactPoint,
  Color,
  LineStyle,
  ShapeStyle,
  TextStyle,
  Transform2D
} from '@esengine/nova-ecs-render-core';

import { CanvasRenderer } from './CanvasRenderer';
import { CanvasRendererConfig } from './types/CanvasTypes';

/**
 * Canvas physics debug renderer configuration
 * Canvas物理调试渲染器配置
 */
export interface CanvasPhysicsDebugConfig extends CanvasRendererConfig {
  /** Show debug overlay UI panel | 显示调试覆盖UI面板 */
  showDebugPanel: boolean;
  /** Debug panel position | 调试面板位置 */
  debugPanelPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Debug panel opacity | 调试面板透明度 */
  debugPanelOpacity: Fixed;
  /** Auto-hide UI when no data | 无数据时自动隐藏UI */
  autoHideWhenEmpty: boolean;
}

/**
 * Default Canvas physics debug configuration
 * 默认Canvas物理调试配置
 */
export const DEFAULT_CANVAS_PHYSICS_DEBUG_CONFIG: CanvasPhysicsDebugConfig = {
  pixelsPerUnit: 100,
  enableHighDPI: true,
  enableAntialiasing: true,
  enableStyleCaching: true,
  enableBatchRendering: true,
  maxBatchSize: 1000,
  showDebugPanel: true,
  debugPanelPosition: 'top-left',
  debugPanelOpacity: new Fixed(0.8),
  autoHideWhenEmpty: false
};

/**
 * Canvas physics debug renderer implementation
 * Canvas物理调试渲染器实现
 */
export class CanvasPhysicsDebugRenderer extends BasePhysicsDebugRenderer implements IPhysicsDebugRenderer {
  private canvasRenderer: CanvasRenderer;
  private canvasConfig: CanvasPhysicsDebugConfig;
  private uiCanvas?: HTMLCanvasElement;
  private uiCtx?: CanvasRenderingContext2D;

  constructor(
    canvas: HTMLCanvasElement, 
    config: Partial<CanvasPhysicsDebugConfig> = {}
  ) {
    super();
    
    this.canvasConfig = { ...DEFAULT_CANVAS_PHYSICS_DEBUG_CONFIG, ...config };
    this.canvasRenderer = new CanvasRenderer(canvas, this.canvasConfig);

    // Create UI overlay canvas if debug panel is enabled
    if (this.canvasConfig.showDebugPanel) {
      this.setupUIOverlay(canvas);
    }
  }

  // ===== Lifecycle Management =====
  // 生命周期管理

  beginFrame(): void {
    this.canvasRenderer.beginFrame();
    if (this.uiCtx && this.canvasConfig.showDebugPanel) {
      this.clearUIOverlay();
    }
  }

  endFrame(): void {
    this.canvasRenderer.endFrame();
  }

  clear(): void {
    this.canvasRenderer.clear();
    if (this.uiCtx && this.canvasConfig.showDebugPanel) {
      this.clearUIOverlay();
    }
  }



  // ===== Rigid Body Visualization =====
  // 刚体可视化

  drawRigidBody(_body: unknown): void {
    // This would integrate with specific physics engine types
    // For now, we provide generic body drawing capabilities
    console.warn('drawRigidBody requires specific physics engine integration');
  }

  drawCenterOfMass(position: FixedVector2): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showCenterOfMass) return;

    const color = config.colors.centerOfMass;
    const size = config.centerOfMassSize;

    // Draw center of mass as a cross
    const halfSize = size.divide(new Fixed(2));
    
    this.drawVector(
      position.subtract(new FixedVector2(halfSize, Fixed.ZERO)),
      new FixedVector2(size, Fixed.ZERO),
      color
    );
    
    this.drawVector(
      position.subtract(new FixedVector2(Fixed.ZERO, halfSize)),
      new FixedVector2(Fixed.ZERO, size),
      color
    );
  }

  drawBodyTransform(position: FixedVector2, rotation: Fixed): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showTransforms) return;

    const axisLength = new Fixed(0.5);

    // X-axis (red)
    const xAxis = new FixedVector2(rotation.cos(), rotation.sin()).multiply(axisLength);
    this.drawVector(position, xAxis, { r: 1.0, g: 0.0, b: 0.0, a: 1.0 });

    // Y-axis (green)
    const yAxis = new FixedVector2(-rotation.sin(), rotation.cos()).multiply(axisLength);
    this.drawVector(position, yAxis, { r: 0.0, g: 1.0, b: 0.0, a: 1.0 });
  }

  drawBodyAABB(min: FixedVector2, max: FixedVector2): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showAABBs) return;

    const bounds = new FixedRect(
      min.x,
      min.y,
      max.x.subtract(min.x),
      max.y.subtract(min.y)
    );

    const style: ShapeStyle = {
      strokeColor: config.colors.aabb,
      strokeThickness: Fixed.ONE
    };

    this.canvasRenderer.drawRect(bounds, style);
  }

  // ===== Collider Visualization =====
  // 碰撞器可视化

  drawCollider(_collider: unknown): void {
    // This would integrate with specific physics engine collider types
    console.warn('drawCollider requires specific physics engine integration');
  }

  drawCircleCollider(center: FixedVector2, radius: Fixed, filled: boolean): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showShapes) return;

    const style: ShapeStyle = {
      strokeColor: config.showWireframes ? config.colors.wireframe : config.colors.shape,
      strokeThickness: Fixed.ONE,
      ...(filled && { fillColor: config.colors.shape })
    };

    this.canvasRenderer.drawCircle(center, radius, style);
  }

  drawBoxCollider(center: FixedVector2, size: FixedVector2, rotation: Fixed, filled: boolean): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showShapes) return;

    // Create rectangle bounds
    const bounds = new FixedRect(
      center.x.subtract(size.x.divide(new Fixed(2))),
      center.y.subtract(size.y.divide(new Fixed(2))),
      size.x,
      size.y
    );

    const style: ShapeStyle = {
      strokeColor: config.showWireframes ? config.colors.wireframe : config.colors.shape,
      strokeThickness: Fixed.ONE,
      ...(filled && { fillColor: config.colors.shape })
    };

    // Apply rotation if needed
    if (!rotation.equals(Fixed.ZERO)) {
      this.canvasRenderer.pushTransform(new Transform2D(
        center,
        rotation,
        new FixedVector2(Fixed.ONE, Fixed.ONE)
      ));
      
      // Draw at origin since we've transformed
      const centeredBounds = new FixedRect(
        size.x.divide(new Fixed(-2)),
        size.y.divide(new Fixed(-2)),
        size.x,
        size.y
      );
      this.canvasRenderer.drawRect(centeredBounds, style);
      this.canvasRenderer.popTransform();
    } else {
      this.canvasRenderer.drawRect(bounds, style);
    }
  }

  drawPolygonCollider(vertices: FixedVector2[], filled: boolean): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showShapes) return;

    const style: ShapeStyle = {
      strokeColor: config.showWireframes ? config.colors.wireframe : config.colors.shape,
      strokeThickness: Fixed.ONE,
      ...(filled && { fillColor: config.colors.shape })
    };

    this.canvasRenderer.drawPolygon(vertices, style);
  }

  drawEdgeCollider(start: FixedVector2, end: FixedVector2): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showShapes) return;

    const style: LineStyle = {
      color: config.colors.shape,
      thickness: new Fixed(2)
    };

    this.canvasRenderer.drawLine(start, end, style);
  }

  // ===== Joint Visualization =====
  // 关节可视化

  drawJoint(_joint: unknown): void {
    // This would integrate with specific physics engine joint types
    console.warn('drawJoint requires specific physics engine integration');
  }

  drawJointAnchors(anchorA: FixedVector2, anchorB: FixedVector2): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showJointAnchors) return;

    const anchorSize = config.jointAnchorSize;
    const color = config.colors.jointAnchor;

    // Draw anchors as small circles
    const anchorStyle: ShapeStyle = {
      fillColor: color
    };

    this.canvasRenderer.drawCircle(anchorA, anchorSize, anchorStyle);
    this.canvasRenderer.drawCircle(anchorB, anchorSize, anchorStyle);

    // Draw connection line if joints are enabled
    if (config.showJoints) {
      const jointStyle: LineStyle = {
        color: config.colors.joint,
        thickness: Fixed.ONE
      };
      this.canvasRenderer.drawLine(anchorA, anchorB, jointStyle);
    }
  }

  drawJointLimits(center: FixedVector2, minAngle: Fixed, maxAngle: Fixed, radius: Fixed): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showJointLimits) return;

    // Draw limit arc (simplified implementation)
    const limitStyle: LineStyle = {
      color: config.colors.jointLimit,
      thickness: new Fixed(2)
    };

    // Calculate arc endpoints
    const startPoint = center.add(new FixedVector2(
      radius.multiply(minAngle.cos()),
      radius.multiply(minAngle.sin())
    ));
    
    const endPoint = center.add(new FixedVector2(
      radius.multiply(maxAngle.cos()),
      radius.multiply(maxAngle.sin())
    ));

    // Draw radius lines to show limits
    this.canvasRenderer.drawLine(center, startPoint, limitStyle);
    this.canvasRenderer.drawLine(center, endPoint, limitStyle);
  }

  // ===== Contact Visualization =====
  // 接触可视化

  drawContactPoints(contacts: ContactPoint[]): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showContacts) return;

    for (const contact of contacts) {
      this.drawContactPoint(contact);
    }
  }

  drawContactPoint(contact: ContactPoint): void {
    const config = this.getPhysicsDebugConfig();
    
    if (config.showContacts) {
      // Draw contact point
      const pointStyle: ShapeStyle = {
        fillColor: config.colors.contact
      };
      
      this.canvasRenderer.drawCircle(contact.position, config.contactPointSize, pointStyle);
    }

    if (config.showContactNormals) {
      // Draw contact normal
      this.drawContactNormal(contact.position, contact.normal, new Fixed(0.5));
    }

    if (config.showContactImpulses) {
      // Draw normal impulse
      const impulse = contact.normal.multiply(contact.normalImpulse.multiply(config.impulseScale));
      this.drawContactImpulse(contact.position, impulse);
    }
  }

  drawContactNormal(point: FixedVector2, normal: FixedVector2, length: Fixed): void {
    const config = this.getPhysicsDebugConfig();

    this.drawVector(point, normal.multiply(length), config.colors.contactNormal);
  }

  drawContactImpulse(point: FixedVector2, impulse: FixedVector2): void {
    const config = this.getPhysicsDebugConfig();
    this.drawVector(point, impulse, config.colors.contactImpulse);
  }

  // ===== Force and Motion Visualization =====
  // 力和运动可视化

  drawForces(_body: unknown): void {
    // This would integrate with specific physics engine force data
    console.warn('drawForces requires specific physics engine integration');
  }

  drawVelocity(position: FixedVector2, velocity: FixedVector2): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showVelocities) return;

    const scaledVelocity = velocity.multiply(config.velocityScale);
    this.drawVector(position, scaledVelocity, config.colors.velocity);
  }

  drawAcceleration(position: FixedVector2, acceleration: FixedVector2): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showAccelerations) return;

    const scaledAcceleration = acceleration.multiply(config.accelerationScale);
    this.drawVector(position, scaledAcceleration, config.colors.acceleration);
  }

  drawAngularVelocity(position: FixedVector2, angularVelocity: Fixed): void {
    const config = this.getPhysicsDebugConfig();
    if (!config.showVelocities) return;

    // Draw angular velocity as a circular indicator
    const radius = new Fixed(0.3);
    const color = config.colors.velocity;
    
    // Draw circle outline
    const circleStyle: ShapeStyle = {
      strokeColor: color,
      strokeThickness: Fixed.ONE
    };
    
    this.canvasRenderer.drawCircle(position, radius, circleStyle);

    // Draw arrow to indicate direction and magnitude
    const arrowLength = angularVelocity.abs().multiply(config.velocityScale);
    const arrowDirection = angularVelocity.greaterThan(Fixed.ZERO) ? Fixed.ONE : new Fixed(-1);

    const arrowEnd = position.add(new FixedVector2(
      arrowLength.multiply(arrowDirection),
      Fixed.ZERO
    ));

    this.drawVector(position, arrowEnd.subtract(position), color);
  }

  // ===== Utility Drawing Functions =====
  // 实用绘制功能

  drawVector(start: FixedVector2, vector: FixedVector2, color: Color, scale?: Fixed): void {
    const actualScale = scale || Fixed.ONE;
    const scaledVector = vector.multiply(actualScale);
    const end = start.add(scaledVector);

    // Draw line
    const lineStyle: LineStyle = {
      color: color,
      thickness: new Fixed(2)
    };
    
    this.canvasRenderer.drawLine(start, end, lineStyle);

    // Draw arrow head
    const arrowLength = this.getPhysicsDebugConfig().arrowHeadSize;
    const vectorLength = scaledVector.magnitude();
    
    if (vectorLength.greaterThan(arrowLength.multiply(new Fixed(2)))) {
      const direction = scaledVector.normalize();
      const perpendicular = direction.perpendicular();
      
      const arrowLeft = end.subtract(direction.multiply(arrowLength))
                          .subtract(perpendicular.multiply(arrowLength.divide(new Fixed(2))));
      const arrowRight = end.subtract(direction.multiply(arrowLength))
                           .add(perpendicular.multiply(arrowLength.divide(new Fixed(2))));

      this.canvasRenderer.drawLine(end, arrowLeft, lineStyle);
      this.canvasRenderer.drawLine(end, arrowRight, lineStyle);
    }
  }

  drawPhysicsStats(stats: { bodyCount: number; contactCount: number; jointCount: number; stepTime: number; [key: string]: number; }): void {
    if (!this.canvasConfig.showDebugPanel || !this.uiCtx) return;

    const lines = [
      `Bodies: ${stats.bodyCount}`,
      `Contacts: ${stats.contactCount}`,
      `Joints: ${stats.jointCount}`,
      `Step Time: ${stats.stepTime.toFixed(2)}ms`,
      `FPS: ${stats.fps || 60}`
    ];

    this.drawDebugPanel(lines);
  }

  // ===== Private Helper Methods =====
  // 私有辅助方法

  private setupUIOverlay(canvas: HTMLCanvasElement): void {
    // Create overlay canvas for UI elements
    this.uiCanvas = document.createElement('canvas');
    this.uiCanvas.width = canvas.width;
    this.uiCanvas.height = canvas.height;
    this.uiCanvas.style.position = 'absolute';
    this.uiCanvas.style.top = canvas.offsetTop + 'px';
    this.uiCanvas.style.left = canvas.offsetLeft + 'px';
    this.uiCanvas.style.pointerEvents = 'none';
    this.uiCanvas.style.zIndex = '1000';

    // Insert after the main canvas
    if (canvas.parentNode) {
      canvas.parentNode.insertBefore(this.uiCanvas, canvas.nextSibling);
    }

    const ctx = this.uiCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get UI overlay 2D context');
    }
    this.uiCtx = ctx;
  }

  private clearUIOverlay(): void {
    if (!this.uiCtx || !this.uiCanvas) return;
    
    this.uiCtx.clearRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);
  }

  private drawDebugPanel(lines: string[]): void {
    if (!this.uiCtx || !this.uiCanvas) return;

    const padding = 10;
    const lineHeight = 16;
    const fontSize = 12;
    
    // Calculate panel size
    const maxLineWidth = Math.max(...lines.map(line => this.uiCtx!.measureText(line).width));
    const panelWidth = maxLineWidth + padding * 2;
    const panelHeight = lines.length * lineHeight + padding * 2;

    // Calculate position
    let x = padding;
    let y = padding;
    
    switch (this.canvasConfig.debugPanelPosition) {
      case 'top-right':
        x = this.uiCanvas.width - panelWidth - padding;
        break;
      case 'bottom-left':
        y = this.uiCanvas.height - panelHeight - padding;
        break;
      case 'bottom-right':
        x = this.uiCanvas.width - panelWidth - padding;
        y = this.uiCanvas.height - panelHeight - padding;
        break;
    }

    // Draw panel background
    this.uiCtx.save();
    this.uiCtx.globalAlpha = this.canvasConfig.debugPanelOpacity.toNumber();
    this.uiCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.uiCtx.fillRect(x, y, panelWidth, panelHeight);

    // Draw panel border
    this.uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.uiCtx.strokeRect(x, y, panelWidth, panelHeight);

    // Draw text
    this.uiCtx.globalAlpha = 1.0;
    this.uiCtx.fillStyle = 'white';
    this.uiCtx.font = `${fontSize}px monospace`;
    this.uiCtx.textAlign = 'left';
    this.uiCtx.textBaseline = 'top';

    for (let i = 0; i < lines.length; i++) {
      const textY = y + padding + i * lineHeight;
      this.uiCtx.fillText(lines[i], x + padding, textY);
    }

    this.uiCtx.restore();
  }

  // ===== Configuration Methods =====
  // 配置方法

  setCanvasConfig(config: Partial<CanvasPhysicsDebugConfig>): void {
    this.canvasConfig = { ...this.canvasConfig, ...config };
  }

  getCanvasConfig(): CanvasPhysicsDebugConfig {
    return { ...this.canvasConfig };
  }



  // ===== Abstract Methods Implementation =====
  // 抽象方法实现

  protected extractBodyInfo(_body: unknown): any {
    // This would extract body information from specific physics engine
    // For now, return null to indicate no specific physics engine integration
    return null;
  }

  protected extractFixtureInfo(_fixture: unknown): any {
    // This would extract fixture information from specific physics engine
    // For now, return null to indicate no specific physics engine integration
    return null;
  }

  protected extractJointInfo(_joint: unknown): any {
    // This would extract joint information from specific physics engine
    // For now, return null to indicate no specific physics engine integration
    return null;
  }

  protected onTakeScreenshot(): Promise<Blob | null> {
    // Take screenshot of the main canvas
    return new Promise((resolve) => {
      const canvas = this.canvasRenderer.getRenderTarget() as HTMLCanvasElement;
      canvas.toBlob((blob) => {
        resolve(blob);
      });
    });
  }

  // Additional missing methods from BaseDebugRenderer
  protected onSetDebugMode(_mode: any): void {
    // Implementation for debug mode changes
  }

  protected onSetDebugConfig(_config: any): void {
    // Implementation for debug config changes
  }

  protected onDrawDebugOverlay(_info: any): void {
    // Implementation for debug overlay drawing
  }

  protected onDrawGrid(_spacing: Fixed, _style: any): void {
    // Implementation for grid drawing
  }

  protected onDrawAxis(_origin: FixedVector2, _scale: Fixed): void {
    // Implementation for axis drawing
  }

  protected onDrawCrosshair(_position: FixedVector2, _size: Fixed, _color: Color): void {
    // Implementation for crosshair drawing
  }

  protected onDrawBounds(_bounds: FixedRect, _color: Color): void {
    // Implementation for bounds drawing
  }

  protected onDrawArrow(_start: FixedVector2, _end: FixedVector2, _color: Color, _headSize?: Fixed): void {
    // Implementation for arrow drawing
  }

  protected onDrawPerformanceStats(_stats: any): void {
    // Implementation for performance stats drawing
  }

  protected onStartPerformanceMeasure(_name: string): void {
    // Implementation for performance measurement start
  }

  protected onEndPerformanceMeasure(_name: string): void {
    // Implementation for performance measurement end
  }

  protected onGetPerformanceMeasurements(): Map<string, number> {
    // Implementation for getting performance measurements
    return new Map();
  }

  protected onClearPerformanceMeasurements(): void {
    // Implementation for clearing performance measurements
  }

  protected onSetDebugLogging(_enabled: boolean): void {
    // Implementation for debug logging
  }

  protected onDebugLog(_message: string, _color?: Color): void {
    // Implementation for debug logging
  }

  protected onDrawDebugText(_text: string, _position: FixedVector2, _color?: Color): void {
    // Implementation for debug text drawing
  }

  protected onDrawDebugTextScreen(_text: string, _x: number, _y: number, _color?: Color): void {
    // Implementation for debug text drawing in screen coordinates
  }

  // ===== BaseRenderer Abstract Methods =====
  // BaseRenderer抽象方法

  setRenderTarget(_target: unknown): void {
    // Canvas renderer doesn't support render target switching in this implementation
    console.warn('Render target switching not supported in CanvasPhysicsDebugRenderer');
  }

  protected onBeginFrame(): void {
    this.canvasRenderer.beginFrame();
  }

  protected onEndFrame(): void {
    this.canvasRenderer.endFrame();
  }

  protected onClear(color?: Color): void {
    if (color) {
      this.canvasRenderer.clear(color);
    } else {
      this.canvasRenderer.clear({ r: 0, g: 0, b: 0, a: 1 });
    }
  }

  protected onSetViewMatrix(_matrix: any): void {
    // Implementation for view matrix setting
  }

  protected onApplyTransform(_transform: Transform2D): void {
    this.canvasRenderer.pushTransform(_transform);
  }

  protected applyTransform(transform: Transform2D): void {
    this.canvasRenderer.pushTransform(transform);
  }

  protected onPopTransform(): void {
    this.canvasRenderer.popTransform();
  }

  protected onDrawLine(start: FixedVector2, end: FixedVector2, style: LineStyle): void {
    this.canvasRenderer.drawLine(start, end, style);
  }

  protected onDrawCircle(center: FixedVector2, radius: Fixed, style: ShapeStyle): void {
    this.canvasRenderer.drawCircle(center, radius, style);
  }

  protected onDrawRect(bounds: FixedRect, style: ShapeStyle): void {
    this.canvasRenderer.drawRect(bounds, style);
  }

  protected onDrawPolygon(vertices: FixedVector2[], style: ShapeStyle): void {
    this.canvasRenderer.drawPolygon(vertices, style);
  }

  protected onDrawText(text: string, position: FixedVector2, style: TextStyle): void {
    this.canvasRenderer.drawText(text, position, style);
  }

  protected onDrawEllipse(bounds: FixedRect, style: ShapeStyle): void {
    // Use the canvas renderer's ellipse drawing if available
    // For now, approximate with a circle
    const center = new FixedVector2(
      bounds.x.add(bounds.width.divide(new Fixed(2))),
      bounds.y.add(bounds.height.divide(new Fixed(2)))
    );
    const radius = bounds.width.divide(new Fixed(2));
    this.canvasRenderer.drawCircle(center, radius, style);
  }

  protected onMeasureText(text: string, style: TextStyle): FixedVector2 {
    return this.canvasRenderer.measureText(text, style);
  }

  protected onDrawTexture(_texture: any, _position: FixedVector2, _style?: any): void {
    // Texture drawing not typically used in physics debug rendering
    console.warn('Texture drawing not implemented in CanvasPhysicsDebugRenderer');
  }

  protected onDrawTextureRegion(_texture: any, _sourceRect: FixedRect, _destRect: FixedRect, _style?: any): void {
    // Texture region drawing not typically used in physics debug rendering
    console.warn('Texture region drawing not implemented in CanvasPhysicsDebugRenderer');
  }

  protected onSetRenderState(_state: any): void {
    // Implementation for render state setting
  }

  protected onSetViewport(_viewport: any): void {
    // Implementation for viewport setting
  }

  protected onSupportsFeature(feature: string): boolean {
    return this.canvasRenderer.supportsFeature(feature);
  }

  protected onGetRendererInfo(): any {
    return {
      ...this.canvasRenderer.getRendererInfo(),
      name: 'CanvasPhysicsDebugRenderer',
      type: 'physics-debug'
    };
  }

  getRenderTarget(): unknown {
    return this.canvasRenderer.getRenderTarget();
  }

  dispose(): void {
    this.canvasRenderer.dispose();
  }
}