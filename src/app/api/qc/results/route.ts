import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Return mock QC results
    const mockQcResults = [
      {
        id: 1,
        batchId: 1,
        testType: 'Tensile Strength',
        result: '25.5 MPa',
        passed: true,
        notes: 'Within acceptable range',
        testedAt: new Date().toISOString(),
        batch: { batchId: 'B001', productType: 'Latex Gloves' }
      }
    ]
    
    return NextResponse.json(mockQcResults)
  } catch (error) {
    console.error('Error fetching QC results:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { batchId, testType, result, passed, notes } = body

    // Return mock response
    return NextResponse.json({
      id: Date.now(),
      batchId,
      testType,
      result,
      passed,
      notes,
      testedAt: new Date().toISOString(),
      batch: { batchId: 'B001', productType: 'Latex Gloves' }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating QC result:', error)
    return NextResponse.json({ error: 'Failed to create QC result' }, { status: 500 })
  }
}