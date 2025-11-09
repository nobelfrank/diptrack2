import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Return mock batch data
    const mockBatch = {
      id: params.id,
      batchId: `B${params.id.padStart(3, '0')}`,
      productType: 'Latex Gloves',
      latexBatchId: 'LAT001',
      startDate: new Date().toISOString(),
      shift: 'Day',
      status: 'active',
      currentStage: 2,
      stagesCompleted: 1,
      progressPercentage: 40,
      operator: {
        id: '1',
        fullName: 'John Doe',
        email: 'john@example.com'
      },
      batchStages: [
        {
          id: '1',
          stage: 1,
          data: JSON.stringify({ temperature: 25, humidity: 60 }),
          createdAt: new Date().toISOString()
        }
      ],
      qcResults: [
        {
          id: '1',
          testType: 'Tensile Strength',
          result: '25.5 MPa',
          passed: true,
          testedAt: new Date().toISOString()
        }
      ]
    }

    return NextResponse.json(mockBatch)
  } catch (error) {
    console.error('Error fetching batch details:', error)
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
  }
}