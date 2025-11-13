import { Buffer } from 'buffer';

import crypto from 'crypto-browserify';

// Use window or globalThis for browser polyfills
const globalObject = typeof globalThis !== 'undefined' ? globalThis : window;

if (!globalObject.Buffer) {
  globalObject.Buffer = Buffer;
}
if (!globalObject.crypto) {
  globalObject.crypto = crypto;
}

// Polyfill globalThis if not defined
if (typeof globalThis === 'undefined') {
  window.globalThis = window;
}

if (typeof globalObject.crypto === 'undefined') {
  globalObject.crypto = {
    getRandomValues: (array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
  };
}

console.log('Polyfills loaded:', { Buffer: !!globalObject.Buffer, crypto: !!globalObject.crypto, globalThis: !!globalObject.globalThis });