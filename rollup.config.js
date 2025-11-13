import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import polyfillNode from 'rollup-plugin-polyfill-node';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import svg from 'rollup-plugin-svg';
import json from '@rollup/plugin-json';
import url from '@rollup/plugin-url';
import inject from '@rollup/plugin-inject';
import terser from '@rollup/plugin-terser';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export default {
  input: 'D:/Devops testing file and folders/Milk/test-phase-6/client/src/main.jsx', // Updated input path to absolute path
  output: {
    dir: 'dist',
    format: 'cjs',
  },
  context: 'window',
  plugins: [
    replace({
      'preventAssignment': true,
      "use client": "" // Remove "use client" directives
    }),
    commonjs(),
    polyfillNode(),
    resolve({
      browser: true,
      preferBuiltins: false, // Disable built-in module preference
      extensions: ['.js', '.jsx', '.json'] // Ensure .jsx files are resolved
    }),
    babel({
      exclude: 'node_modules/**',
      presets: ['@babel/preset-react'],
      babelHelpers: 'bundled'
    }),
    postcss(),
    svg(), // Add this plugin to handle SVG imports
    json(), // Add this plugin to handle JSON imports
    url({
      include: ['**/*.svg'],
      limit: 0 // Always include SVGs as separate files
    }), // Add this plugin to handle SVG imports
    inject({
      global: 'globalThis', // Ensure global is injected
      crypto: ['crypto-browserify', 'crypto'] // Ensure crypto is injected
    }),
    inject({
      global: 'src/polyfills.js',
    }),
    terser(), // Add this plugin for build optimization
    nodePolyfills(), // Add this plugin to polyfill Node.js modules
  ],
};