// Test script for offline system (run in browser console)
const testOfflineSystem = async () => {
  console.log('🧪 Testing offline system...')
  
  try {
    // Test IndexedDB initialization
    const { offlineDB } = await import('../src/lib/offline-db.js')
    await offlineDB.init()
    console.log('✅ IndexedDB initialized')
    
    // Test storing offline action
    const actionId = await offlineDB.storeOfflineAction('batches', 'create', {
      productType: 'Test Batch',
      latexBatchId: 'TEST001',
      shift: 'Day'
    })
    console.log('✅ Offline action stored:', actionId)
    
    // Test caching data
    await offlineDB.cacheData('test_cache', [{ id: 1, name: 'Test Data' }])
    console.log('✅ Data cached')
    
    // Test retrieving cached data
    const cachedData = await offlineDB.getCachedData('test_cache')
    console.log('✅ Cached data retrieved:', cachedData)
    
    // Test getting unsynced actions
    const unsyncedActions = await offlineDB.getUnsyncedActions()
    console.log('✅ Unsynced actions:', unsyncedActions.length)
    
    console.log('🎉 Offline system test completed successfully!')
    
  } catch (error) {
    console.error('❌ Offline system test failed:', error)
  }
}

// Instructions for manual testing
console.log(`
📋 Manual Testing Instructions:

1. Open browser DevTools (F12)
2. Run: testOfflineSystem()
3. Go to Application tab > IndexedDB > DipTrackOfflineDB
4. Verify tables: offline_actions, cached_data
5. Test offline mode:
   - Go to Network tab
   - Set to "Offline"
   - Try creating a batch
   - Check IndexedDB for stored action
6. Go back online and verify sync

Run this in console: testOfflineSystem()
`)

// Export for browser console
if (typeof window !== 'undefined') {
  window.testOfflineSystem = testOfflineSystem
}