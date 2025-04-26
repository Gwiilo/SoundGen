const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const UglifyJS = require('uglify-js');

// Directories
const sourceDir = path.join(__dirname);
const outputDir = path.join(__dirname, 'public');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to obfuscate and minify JavaScript
function processJavaScript(filePath, outputPath) {
  console.log(`Processing ${filePath}...`);
  
  // Read the source file
  const code = fs.readFileSync(filePath, 'utf8');
  
  // First minify with UglifyJS
  const minified = UglifyJS.minify(code, {
    compress: {
      dead_code: true,
      drop_debugger: true,
      drop_console: true,
      passes: 3
    },
    mangle: true
  });
  
  // Then obfuscate with JavaScript Obfuscator
  const obfuscated = JavaScriptObfuscator.obfuscate(minified.code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.7,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: true,
    debugProtectionInterval: true,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: true,
    shuffleStringArray: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.8,
    transformObjectKeys: true,
    unicodeEscapeSequence: true
  });
  
  // Write the result to the output directory
  fs.writeFileSync(outputPath, obfuscated.getObfuscatedCode());
  console.log(`Written to ${outputPath}`);
}

// Function to copy HTML/CSS files
function copyFile(source, destination) {
  console.log(`Copying ${source} to ${destination}`);
  fs.copyFileSync(source, destination);
}

// Process script.js
processJavaScript(
  path.join(sourceDir, 'script.js'),
  path.join(outputDir, 'script.js')
);

// Copy HTML and CSS files
copyFile(
  path.join(sourceDir, 'index.html'),
  path.join(outputDir, 'index.html')
);

copyFile(
  path.join(sourceDir, 'styles.css'),
  path.join(outputDir, 'styles.css')
);

copyFile(
  path.join(sourceDir, 'event-handlers.js'),
  path.join(outputDir, 'event-handlers.js')
);

console.log('Build completed successfully.');
