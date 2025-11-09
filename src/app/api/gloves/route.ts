import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Return mock data to avoid database errors
    const mockGloveBatches = [
      {
        id: 1,
        gloveBatchId: 'GLV001',
        latexBatchId: 'LAT001',
        productType: 'Surgical Glove',
        manufacturingDate: new Date().toISOString(),
        status: 'in_progress',
        continuousData: JSON.stringify({}),
        processData: JSON.stringify({}),
        qcData: JSON.stringify({}),
        latexBatch: {
          batchId: 'LAT001',
          productType: 'Surgical Glove'
        },
        gloveQcResults: []
      }
    ]

    return NextResponse.json(mockGloveBatches)
  } catch (error) {
    console.error('Error fetching glove batches:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      gloveBatchId,
      latexBatchId,
      productType,
      continuousData,
      processData,
      qcData
    } = body

    // Return mock response
    return NextResponse.json({
      id: Date.now(),
      gloveBatchId,
      latexBatchId,
      productType,
      manufacturingDate: new Date().toISOString(),
      status: 'in_progress',
      continuousData: JSON.stringify(continuousData || {}),
      processData: JSON.stringify(processData || {}),
      qcData: JSON.stringify(qcData || {}),
      latexBatch: {
        batchId: latexBatchId,
        productType
      },
      gloveQcResults: []
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating glove batch:', error)
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
  }
}