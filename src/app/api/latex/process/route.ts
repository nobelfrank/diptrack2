import { NextRequest, NextResponse } from 'next/server'

function getStageNameByNumber(stage: number): string {
  const stageNames = {
    1: 'Field Latex Collection',
    2: 'Dilution and Stabilization', 
    3: 'Centrifugation',
    4: 'Final Stabilization',
    5: 'Storage & Dispatch'
  }
  return stageNames[stage as keyof typeof stageNames] || `Stage ${stage}`
}

export async function GET(request: NextRequest) {
  try {

    // Return mock process stages
    const mockProcessStages = [
      {
        id: 1,
        batchId: 1,
        stageName: 'Field Latex Collection',
        stageNumber: 1,
        data: JSON.stringify({}),
        status: 'completed',
        completedAt: new Date().toISOString(),
        batch: { batchId: 'LAT001', productType: 'Field Latex' }
      }
    ]
    
    return NextResponse.json(mockProcessStages)
  } catch (error) {
    console.error('Error fetching process stages:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { batchId, stageName, stageNumber, data } = body

    // Return mock response
    return NextResponse.json({
      id: Date.now(),
      batchId,
      stageName,
      stageNumber,
      data: JSON.stringify(data),
      status: 'completed',
      completedAt: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating process stage:', error)
    return NextResponse.json({ error: 'Failed to create stage' }, { status: 500 })
  }
}