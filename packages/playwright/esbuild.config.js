import esbuild from 'esbuild';
import { join } from 'path';
import { readFileSync, statSync } from 'fs';

const config = {
  entryPoints: ['src/bundle-entry.ts'],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  platform: 'browser',
  outfile: 'dist/bundle.js',
  minify: true, // Enable minification for size reduction
  sourcemap: false,
  treeShaking: true, // Enable tree shaking
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  external: [], // Bundle everything
  logLevel: 'info',
  drop: ['console'], // Remove console.log statements
  keepNames: false, // Allow name mangling for smaller size
  // Handle Node.js specific modules that might cause issues
  inject: [],
  // Polyfills for Node.js specific APIs if needed
  banner: {
    js: `
// Bundled Headless Wallet for Playwright
// This bundle contains all dependencies needed for wallet injection
`,
  },
  // Resolve configuration
  resolveExtensions: ['.ts', '.js', '.json'],
  loader: {
    '.ts': 'ts',
  },
};

async function build() {
  try {
    console.log('🔨 Building bundled headless wallet...');

    const result = await esbuild.build(config);

    if (result.warnings.length > 0) {
      console.warn('⚠️  Build warnings:');
      result.warnings.forEach(warning => console.warn(warning));
    }

    console.log('✅ Bundle built successfully at dist/bundle.js');

    // Log bundle size
    const stats = statSync('dist/bundle.js');
    console.log(`📦 Bundle size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build();
}

export { build, config };