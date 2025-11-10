import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateBatchId } from '@/lib/utils'
import { getValidOperatorId, handleApiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 API: Fetching batches from database...');
    const batches = await prisma.batch.findMany({
      include: {
        operator: {
          select: { id: true, fullName: true, email: true }
        },
        batchStages: true,
        _count: {
          select: { alerts: true, qcResults: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📊 API: Found ${batches.length} batches in database`);
    return NextResponse.json(batches)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productType, latexBatchId, shift } = body
    console.log('📝 API: Creating batch:', { productType, latexBatchId, shift })

    if (!productType || !shift) {
      return NextResponse.json(
        { error: 'Missing required fields: productType and shift' }, 
        { status: 400 }
      )
    }

    const operatorId = await getValidOperatorId()
    const batchId = generateBatchId(productType)

    const batch = await prisma.batch.create({
      data: {
        batchId,
        productType,
        latexBatchId,
        startDate: new Date(),
        shift,
        operatorId,
        status: 'draft'
      },
      include: {
        operator: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    console.log('✅ API: Batch created successfully:', batch.batchId);
    return NextResponse.json(batch, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Create batch')
  }
}