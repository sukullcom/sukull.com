const fs = require('fs');

// Files that need react-use fixes
const filesToFix = [
  'app/lesson/footer.tsx',
  'app/lesson/quiz.tsx',
  'app/(main)/(protected)/lab/journey-of-food/page.tsx',
  'app/(main)/(protected)/lab/human-body/page.tsx'
];

console.log('🔧 Fixing react-use imports...\n');

filesToFix.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove react-use imports
    if (content.includes('react-use')) {
      content = content.replace(/import\s+\{[^}]*\}\s+from\s+["']react-use["'];?\n?/g, '');
      
      // Add React hooks if needed
      if (!content.includes('useRef')) {
        content = content.replace(
          'import { useEffect',
          'import { useEffect, useRef'
        );
      }
      
      modified = true;
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`⚠️ No react-use imports found in ${filePath}`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log('\n🎉 Finished!'); 