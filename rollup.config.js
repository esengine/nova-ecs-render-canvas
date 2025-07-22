import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

const external = [
  '@esengine/nova-ecs',
  '@esengine/nova-ecs-math',
  '@esengine/nova-ecs-render-core'
];

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/nova-ecs-render-canvas.esm.js',
      format: 'es',
      sourcemap: true
    },
    external,
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false
      })
    ]
  },
  
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/nova-ecs-render-canvas.cjs.js',
      format: 'cjs',
      sourcemap: true
    },
    external,
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false
      })
    ]
  },
  
  // UMD build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/nova-ecs-render-canvas.umd.js',
      format: 'umd',
      name: 'NovaECSRenderCanvas',
      sourcemap: true,
      globals: {
        '@esengine/nova-ecs': 'NovaECS',
        '@esengine/nova-ecs-math': 'NovaECSMath',
        '@esengine/nova-ecs-render-core': 'NovaECSRenderCore'
      }
    },
    external,
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false
      })
    ]
  },
  
  // Type definitions
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/nova-ecs-render-canvas.d.ts',
      format: 'es'
    },
    external,
    plugins: [dts()]
  }
];
