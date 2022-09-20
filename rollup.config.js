import typescript from '@rollup/plugin-typescript';
import cleaner from 'rollup-plugin-cleaner';
import dts from 'rollup-plugin-dts';

const external = ['superstruct'];

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: true,
    },
    external,
    plugins: [cleaner({ targets: ['dist/'] }), typescript({ outDir: 'dist' })],
  },
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    external,
    plugins: [typescript({ declaration: false })],
  },
];
