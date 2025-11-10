import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-utils'

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
    console.log('📊 Process API: Fetching process stages from database...');
    
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')
    
    const whereClause = batchId ? { batchId } : {}
    
    const batchStages = await prisma.batchStage.findMany({
      where: whereClause,
      include: {
        batch: {
          select: { batchId: true, productType: true }
        }
      },
      orderBy: { stage: 'asc' }
    })
    
    const processStages = batchStages.map(stage => ({
      id: stage.id,
      batchId: stage.batchId,
      stageName: getStageNameByNumber(stage.stage),
      stageNumber: stage.stage,
      data: stage.data,
      status: 'completed',
      completedAt: stage.updatedAt.toISOString(),
      batch: stage.batch
    }))
    
    console.log(`📊 Process API: Found ${processStages.length} process stages in database`);
    return NextResponse.json(processStages)
  } catch (error) {
    return handleApiError(error, 'Fetch process stages')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { batchId, stageName, stageNumber, data } = body
    
    console.log('📝 Process API: Creating process stage:', { batchId, stageName, stageNumber });

    if (!batchId || !stageNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: batchId, stageNumber' }, 
        { status: 400 }
      )
    }

    // Verify batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId }
    })

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' }, 
        { status: 404 }
      )
    }

    const batchStage = await prisma.batchStage.upsert({
      where: {
        batchId_stage: {
          batchId,
          stage: stageNumber
        }
      },
      update: {
        data: JSON.stringify(data)
      },
      create: {
        batchId,
        stage: stageNumber,
        data: JSON.stringify(data)
      }
    })

    const processStage = {
      id: batchStage.id,
      batchId: batchStage.batchId,
      stageName: stageName || getStageNameByNumber(stageNumber),
      stageNumber: batchStage.stage,
      data: batchStage.data,
      status: 'completed',
      completedAt: batchStage.updatedAt.toISOString()
    }

    console.log('✅ Process API: Process stage created successfully:', batchStage.id);
    return NextResponse.json(processStage, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Create process stage')
  }
}