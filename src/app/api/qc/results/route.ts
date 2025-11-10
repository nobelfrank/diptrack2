import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 QC API: Fetching QC results from database...');
    
    const qcResults = await prisma.qCResult.findMany({
      include: {
        batch: {
          select: { batchId: true, productType: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📊 QC API: Found ${qcResults.length} QC results in database`);
    return NextResponse.json(qcResults)
  } catch (error) {
    console.error('QC API Error:', error)
    return handleApiError(error, 'Fetch QC results')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { batchId, testType, result, passed, notes } = body
    
    console.log('📝 QC API: Creating QC result:', { batchId, testType, result, passed });

    if (!batchId || !testType || !result || passed === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: batchId, testType, result, passed' }, 
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

    const qcResult = await prisma.qCResult.create({
      data: {
        batchId,
        testType,
        result,
        passed: Boolean(passed),
        notes: notes || null,
        testedAt: new Date()
      },
      include: {
        batch: {
          select: { batchId: true, productType: true }
        }
      }
    })

    console.log('✅ QC API: QC result created successfully:', qcResult.id);
    return NextResponse.json(qcResult, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Create QC result')
  }
}