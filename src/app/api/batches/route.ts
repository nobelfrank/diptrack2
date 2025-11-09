import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateBatchId } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json(batches)
  } catch (error) {
    console.error('Error fetching batches:', error)
    // Return mock data on error
    const mockData = [
      {
        id: 1,
        batchId: 'B001',
        productType: 'Latex Gloves',
        status: 'active',
        startDate: new Date().toISOString(),
        shift: 'Day',
        operator: { id: 1, fullName: 'John Doe', email: 'john@example.com' },
        batchStages: [],
        _count: { alerts: 0, qcResults: 0 }
      }
    ]
    return NextResponse.json(mockData)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productType, latexBatchId, shift } = body

    const batchId = generateBatchId(productType)

    const batch = await prisma.batch.create({
      data: {
        batchId,
        productType,
        latexBatchId,
        startDate: new Date(),
        shift,
        operatorId: '1',
        status: 'draft'
      },
      include: {
        operator: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    return NextResponse.json(batch, { status: 201 })
  } catch (error) {
    console.error('Error creating batch:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}