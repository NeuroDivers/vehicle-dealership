#!/usr/bin/env node

/**
 * Post-build script to inline CSS into HTML files
 * This eliminates render-blocking CSS requests for better PageSpeed scores
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const OUT_DIR = path.join(__dirname, '..', 'out');
const CSS_DIR = path.join(OUT_DIR, '_next', 'static', 'css');

async function inlineCSS() {
  console.log('🎨 Inlining CSS into HTML files...');
  
  try {
    // Find all CSS files
    const cssFiles = await glob(path.join(CSS_DIR, '*.css').replace(/\\/g, '/'));
    
    if (cssFiles.length === 0) {
      console.log('⚠️  No CSS files found to inline');
      return;
    }
    
    console.log(`📄 Found ${cssFiles.length} CSS file(s)`);
    
    // Read all CSS content
    let allCSS = '';
    for (const cssFile of cssFiles) {
      const cssContent = fs.readFileSync(cssFile, 'utf-8');
      allCSS += cssContent;
      console.log(`   - ${path.basename(cssFile)} (${(cssContent.length / 1024).toFixed(2)} KB)`);
    }
    
    console.log(`📦 Total CSS size: ${(allCSS.length / 1024).toFixed(2)} KB`);
    
    // Find all HTML files
    const htmlFiles = await glob(path.join(OUT_DIR, '**', '*.html').replace(/\\/g, '/'));
    console.log(`📝 Found ${htmlFiles.length} HTML file(s) to process`);
    
    let processedCount = 0;
    
    // Process each HTML file
    for (const htmlFile of htmlFiles) {
      let html = fs.readFileSync(htmlFile, 'utf-8');
      
      // Remove CSS link tags
      const originalHtml = html;
      html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '');
      
      // Only process if CSS links were found
      if (html !== originalHtml) {
        // Inject inlined CSS before </head>
        const styleTag = `<style data-inlined="true">${allCSS}</style>`;
        html = html.replace('</head>', `${styleTag}</head>`);
        
        // Write modified HTML
        fs.writeFileSync(htmlFile, html, 'utf-8');
        processedCount++;
      }
    }
    
    console.log(`✅ Successfully inlined CSS into ${processedCount} HTML file(s)`);
    console.log(`🚀 CSS is now embedded - no external CSS requests!`);
    
    // Optionally remove CSS files (commented out for safety)
    // console.log('🗑️  Removing external CSS files...');
    // for (const cssFile of cssFiles) {
    //   fs.unlinkSync(cssFile);
    // }
    
  } catch (error) {
    console.error('❌ Error inlining CSS:', error.message);
    process.exit(1);
  }
}

// Check if glob is available
try {
  require.resolve('glob');
  inlineCSS();
} catch (e) {
  console.error('❌ Error: "glob" package is required. Install it with: npm install --save-dev glob');
  process.exit(1);
}
