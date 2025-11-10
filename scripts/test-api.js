const fetch = require('node-fetch')

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...')
    
    // Test GET batches
    console.log('\n📡 Testing GET /api/batches')
    const getResponse = await fetch('http://localhost:3000/api/batches')
    const getBatches = await getResponse.json()
    console.log(`Status: ${getResponse.status}`)
    console.log(`Response:`, getBatches)
    
    // Test POST batch
    console.log('\n📡 Testing POST /api/batches')
    const postResponse = await fetch('http://localhost:3000/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productType: 'Test Batch',
        latexBatchId: 'LAT001',
        shift: 'Day'
      })
    })
    
    const postResult = await postResponse.json()
    console.log(`Status: ${postResponse.status}`)
    console.log(`Response:`, postResult)
    
  } catch (error) {
    console.error('❌ API test failed:', error.message)
    console.log('Make sure the development server is running: npm run dev')
  }
}

testAPI()