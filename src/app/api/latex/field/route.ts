import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {

    // Use existing batch system with JSON data
    const batches = await prisma.batch.findMany({
      where: {
        productType: 'Field Latex'
      },
      include: {
        batchStages: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const fieldLatexData = batches.map(batch => {
      const stages = batch.batchStages || []
      const fieldData = stages.find(s => s.stage === 1)
      const data = fieldData ? JSON.parse(fieldData.data || '{}') : {}
      
      return {
        id: batch.id,
        supplierLotId: data.supplierLotId || batch.batchId,
        supplier: data.supplier || 'Unknown',
        receptionDate: batch.startDate,
        volume: data.volume || 0,
        preservativeAdded: data.preservativeAdded || 0,
        initialPh: data.initialPh || 0,
        visualInspection: data.visualInspection || '',
        ambientTemp: data.ambientTemp || 0,
        timeSinceTapping: data.timeSinceTapping || 0,
        status: batch.status
      }
    })

    return NextResponse.json(fieldLatexData)
  } catch (error) {
    console.error('Error fetching field latex:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      supplierLotId,
      supplier,
      volume,
      preservativeAdded,
      initialPh,
      visualInspection,
      ambientTemp,
      timeSinceTapping
    } = body

    // Return mock response
    const mockResponse = {
      id: Date.now().toString(),
      supplierLotId,
      supplier,
      receptionDate: new Date().toISOString(),
      volume: Number(volume) || 0,
      preservativeAdded: Number(preservativeAdded) || 0,
      initialPh: Number(initialPh) || 0,
      visualInspection: visualInspection || '',
      ambientTemp: Number(ambientTemp) || 0,
      timeSinceTapping: Number(timeSinceTapping) || 0,
      status: 'received'
    }

    return NextResponse.json(mockResponse, { status: 201 })
  } catch (error) {
    console.error('Error creating field latex record:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
  }
}