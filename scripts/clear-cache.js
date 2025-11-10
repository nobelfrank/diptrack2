// Clear all cache data
console.log('🧹 Clearing all cache data...')

// This would run in browser console to clear localStorage
const clearScript = `
// Clear localStorage cache
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('cache_') || key.includes('batch')) {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  }
});
console.log('✅ Cache cleared');
`

console.log('Run this in your browser console:')
console.log(clearScript)