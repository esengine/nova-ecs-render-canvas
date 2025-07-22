/**
 * Test setup for Canvas renderer
 * Canvas渲染器测试设置
 */

import { vi } from 'vitest';

// Mock Canvas API for testing
class MockCanvasRenderingContext2D {
  canvas = {
    width: 800,
    height: 600,
    toBlob: vi.fn()
  };

  // Drawing state
  fillStyle = '#000000';
  strokeStyle = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign = 'start' as CanvasTextAlign;
  textBaseline = 'alphabetic' as CanvasTextBaseline;
  globalAlpha = 1;
  globalCompositeOperation = 'source-over' as GlobalCompositeOperation;

  // Transform methods
  save = vi.fn();
  restore = vi.fn();
  translate = vi.fn();
  rotate = vi.fn();
  scale = vi.fn();
  setTransform = vi.fn();

  // Drawing methods
  beginPath = vi.fn();
  closePath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  arc = vi.fn();
  ellipse = vi.fn();
  rect = vi.fn();
  fillRect = vi.fn();
  fill = vi.fn();
  stroke = vi.fn();
  clip = vi.fn();
  fillText = vi.fn();
  measureText = vi.fn(() => ({ width: 100 }));
  drawImage = vi.fn();
  setLineDash = vi.fn();
}

class MockHTMLCanvasElement {
  width = 800;
  height = 600;
  style = {
    width: '800px',
    height: '600px'
  };

  getContext = vi.fn(() => new MockCanvasRenderingContext2D());
  getBoundingClientRect = vi.fn(() => ({
    width: 800,
    height: 600,
    left: 0,
    top: 0,
    right: 800,
    bottom: 600
  }));
  toBlob = vi.fn();
}

// Mock DOM globals
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: MockHTMLCanvasElement,
  writable: true
});

Object.defineProperty(global, 'CanvasRenderingContext2D', {
  value: MockCanvasRenderingContext2D,
  writable: true
});

Object.defineProperty(global, 'Image', {
  value: class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src = '';
    width = 100;
    height = 100;

    constructor() {
      // Simulate async loading
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 0);
    }
  },
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    devicePixelRatio: 1
  },
  writable: true
});

Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return new MockHTMLCanvasElement();
      }
      return {};
    })
  },
  writable: true
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  },
  writable: true
});

export { MockCanvasRenderingContext2D, MockHTMLCanvasElement };
