const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function minifyFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const result = await minify(code, {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
        pure_funcs: ['console.debug']
      },
      mangle: true,
      format: {
        comments: false
      }
    });
    
    if (result.code) {
      fs.writeFileSync(filePath, result.code);
      console.log(`Minified: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error minifying ${filePath}:`, error.message);
  }
}

async function minifyDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await minifyDirectory(filePath);
    } else if (file.endsWith('.js') && !file.endsWith('.min.js')) {
      await minifyFile(filePath);
    }
  }
}

async function main() {
  const distDir = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.error('dist directory not found. Run build first.');
    process.exit(1);
  }
  
  console.log('Minifying JavaScript files in dist/...');
  await minifyDirectory(distDir);
  console.log('Minification complete!');
}

main().catch(console.error);
