// scripts/check-supabase-config.js
// Run this script to check your current OAuth configuration

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔍 Supabase OAuth Configuration Checker');
console.log('=====================================\n');

console.log('Please verify the following settings in your Supabase Dashboard:');
console.log('(Go to: Authentication > Settings > URL Configuration)\n');

console.log('1. Site URL should be:');
console.log('   Production: https://sukull.com');
console.log('   Development: http://localhost:3000\n');

console.log('2. Redirect URLs should include:');
console.log('   Production: https://sukull.com/api/auth/callback');
console.log('   Development: http://localhost:3000/api/auth/callback\n');

console.log('3. Additional Redirect URLs (add all of these):');
console.log('   - https://sukull.com/api/auth/callback');
console.log('   - https://www.sukull.com/api/auth/callback');
console.log('   - http://localhost:3000/api/auth/callback\n');

console.log('4. OAuth Providers configuration:');
console.log('   Go to: Authentication > Providers > Google');
console.log('   Make sure Google OAuth is enabled and configured with:');
console.log('   - Valid Client ID');
console.log('   - Valid Client Secret');
console.log('   - Authorized redirect URIs in Google Console should include:');
console.log('     https://[your-supabase-project].supabase.co/auth/v1/callback\n');

rl.question('Have you verified all the above settings? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log('\n✅ Great! Your configuration should be correct.');
    console.log('If you\'re still getting OAuth errors, try these steps:');
    console.log('1. Clear your browser cache and cookies');
    console.log('2. Try logging in with an incognito/private window');
    console.log('3. Check the browser console for any additional error messages\n');
  } else {
    console.log('\n❌ Please update your Supabase configuration first.');
    console.log('After making changes, it may take a few minutes to take effect.\n');
  }
  rl.close();
}); 