/**
 * Batch rendering manager for Canvas
 * Canvas批量渲染管理器
 */

import { Fixed, FixedVector2, FixedRect } from '@esengine/nova-ecs-math';
import {
  LineStyle,
  ShapeStyle,
  TextStyle
} from '@esengine/nova-ecs-render-core';
import {
  DrawCommand,
  LineDrawData,
  CircleDrawData,
  RectDrawData,
  PolygonDrawData,
  TextDrawData
} from '../types/CanvasTypes';
import { StyleManager } from './StyleManager';
import { CoordinateSystem } from './CoordinateSystem';

/**
 * Batch group for similar draw commands
 * 相似绘制命令的批次组
 */
interface BatchGroup {
  type: DrawCommand['type'];
  style: unknown;
  commands: DrawCommand[];
}

/**
 * Batch rendering manager
 * 批量渲染管理器
 */
export class BatchManager {
  private ctx: CanvasRenderingContext2D;
  private styleManager: StyleManager;
  private coordinateSystem: CoordinateSystem;
  private batchCommands: DrawCommand[] = [];
  private maxBatchSize: number;
  private batchingEnabled: boolean = false;
  private batchedDrawCallCount: number = 0;

  constructor(
    ctx: CanvasRenderingContext2D,
    styleManager: StyleManager,
    coordinateSystem: CoordinateSystem,
    maxBatchSize: number = 1000
  ) {
    this.ctx = ctx;
    this.styleManager = styleManager;
    this.coordinateSystem = coordinateSystem;
    this.maxBatchSize = maxBatchSize;
  }

  /**
   * Start batch rendering
   * 开始批量渲染
   */
  beginBatch(): void {
    this.batchingEnabled = true;
    this.batchCommands = [];
    this.batchedDrawCallCount = 0;
  }

  /**
   * End batch rendering and execute all commands
   * 结束批量渲染并执行所有命令
   */
  endBatch(): void {
    if (this.batchingEnabled) {
      this.executeBatch();
      this.batchingEnabled = false;
      this.batchCommands = [];
    }
  }

  /**
   * Flush current batch immediately
   * 立即刷新当前批次
   */
  flushBatch(): void {
    if (this.batchCommands.length > 0) {
      this.executeBatch();
      this.batchCommands = [];
    }
  }

  /**
   * Add line command to batch
   * 添加线条命令到批次
   */
  addLine(start: FixedVector2, end: FixedVector2, style: LineStyle): void {
    if (!this.batchingEnabled) {
      this.drawLineImmediate(start, end, style);
      return;
    }

    this.addCommand({
      type: 'line',
      data: { start, end } as LineDrawData,
      style
    });
  }

  /**
   * Add circle command to batch
   * 添加圆形命令到批次
   */
  addCircle(center: FixedVector2, radius: Fixed, style: ShapeStyle): void {
    if (!this.batchingEnabled) {
      this.drawCircleImmediate(center, radius, style);
      return;
    }

    this.addCommand({
      type: 'circle',
      data: { center, radius } as CircleDrawData,
      style
    });
  }

  /**
   * Add rectangle command to batch
   * 添加矩形命令到批次
   */
  addRect(bounds: FixedRect, style: ShapeStyle): void {
    if (!this.batchingEnabled) {
      this.drawRectImmediate(bounds, style);
      return;
    }

    this.addCommand({
      type: 'rect',
      data: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } as RectDrawData,
      style
    });
  }

  /**
   * Add polygon command to batch
   * 添加多边形命令到批次
   */
  addPolygon(vertices: FixedVector2[], style: ShapeStyle): void {
    if (!this.batchingEnabled) {
      this.drawPolygonImmediate(vertices, style);
      return;
    }

    this.addCommand({
      type: 'polygon',
      data: { vertices } as PolygonDrawData,
      style
    });
  }

  /**
   * Add text command to batch
   * 添加文本命令到批次
   */
  addText(text: string, position: FixedVector2, style: TextStyle): void {
    if (!this.batchingEnabled) {
      this.drawTextImmediate(text, position, style);
      return;
    }

    this.addCommand({
      type: 'text',
      data: { text, position } as TextDrawData,
      style
    });
  }

  /**
   * Get batched draw call count
   * 获取批量绘制调用次数
   */
  getBatchedDrawCallCount(): number {
    return this.batchedDrawCallCount;
  }

  /**
   * Reset batched draw call count
   * 重置批量绘制调用次数
   */
  resetBatchedDrawCallCount(): void {
    this.batchedDrawCallCount = 0;
  }

  /**
   * Add command to batch
   * 添加命令到批次
   */
  private addCommand(command: DrawCommand): void {
    this.batchCommands.push(command);

    // Auto-flush if batch is full
    if (this.batchCommands.length >= this.maxBatchSize) {
      this.flushBatch();
    }
  }

  /**
   * Execute all batched commands
   * 执行所有批次命令
   */
  private executeBatch(): void {
    if (this.batchCommands.length === 0) return;

    // Group commands by type and style for optimization
    const groups = this.groupCommands(this.batchCommands);

    for (const group of groups) {
      this.executeGroup(group);
    }

    this.batchedDrawCallCount += groups.length;
  }

  /**
   * Group commands by type and style
   * 按类型和样式分组命令
   */
  private groupCommands(commands: DrawCommand[]): BatchGroup[] {
    const groups: BatchGroup[] = [];
    const groupMap = new Map<string, BatchGroup>();

    for (const command of commands) {
      const key = this.getGroupKey(command);
      let group = groupMap.get(key);

      if (!group) {
        group = {
          type: command.type,
          style: command.style,
          commands: []
        };
        groups.push(group);
        groupMap.set(key, group);
      }

      group.commands.push(command);
    }

    return groups;
  }

  /**
   * Get group key for command
   * 获取命令的分组键
   */
  private getGroupKey(command: DrawCommand): string {
    return `${command.type}_${JSON.stringify(command.style)}`;
  }

  /**
   * Execute a group of commands
   * 执行一组命令
   */
  private executeGroup(group: BatchGroup): void {
    switch (group.type) {
      case 'line':
        this.executeLineGroup(group);
        break;
      case 'circle':
        this.executeCircleGroup(group);
        break;
      case 'rect':
        this.executeRectGroup(group);
        break;
      case 'polygon':
        this.executePolygonGroup(group);
        break;
      case 'text':
        this.executeTextGroup(group);
        break;
    }
  }

  /**
   * Execute line group
   * 执行线条组
   */
  private executeLineGroup(group: BatchGroup): void {
    const style = group.style as LineStyle;
    this.styleManager.applyLineStyle(style);

    this.ctx.beginPath();
    for (const command of group.commands) {
      const data = command.data as LineDrawData;
      const start = this.coordinateSystem.worldToScreen(data.start);
      const end = this.coordinateSystem.worldToScreen(data.end);

      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
    }
    this.ctx.stroke();
  }

  /**
   * Execute circle group
   * 执行圆形组
   */
  private executeCircleGroup(group: BatchGroup): void {
    const style = group.style as ShapeStyle;

    for (const command of group.commands) {
      const data = command.data as CircleDrawData;
      this.drawCircleImmediate(data.center, data.radius, style);
    }
  }

  /**
   * Execute rectangle group
   * 执行矩形组
   */
  private executeRectGroup(group: BatchGroup): void {
    const style = group.style as ShapeStyle;

    for (const command of group.commands) {
      const data = command.data as RectDrawData;
      const bounds = new FixedRect(data.x, data.y, data.width, data.height);
      this.drawRectImmediate(bounds, style);
    }
  }

  /**
   * Execute polygon group
   * 执行多边形组
   */
  private executePolygonGroup(group: BatchGroup): void {
    const style = group.style as ShapeStyle;

    for (const command of group.commands) {
      const data = command.data as PolygonDrawData;
      this.drawPolygonImmediate(data.vertices, style);
    }
  }

  /**
   * Execute text group
   * 执行文本组
   */
  private executeTextGroup(group: BatchGroup): void {
    const style = group.style as TextStyle;

    for (const command of group.commands) {
      const data = command.data as TextDrawData;
      this.drawTextImmediate(data.text, data.position, style);
    }
  }

  // Immediate drawing methods - these will be set by the renderer
  public drawLineImmediate: (start: FixedVector2, end: FixedVector2, style: LineStyle) => void = () => {};
  public drawCircleImmediate: (center: FixedVector2, radius: Fixed, style: ShapeStyle) => void = () => {};
  public drawRectImmediate: (bounds: FixedRect, style: ShapeStyle) => void = () => {};
  public drawPolygonImmediate: (vertices: FixedVector2[], style: ShapeStyle) => void = () => {};
  public drawTextImmediate: (text: string, position: FixedVector2, style: TextStyle) => void = () => {};
}
