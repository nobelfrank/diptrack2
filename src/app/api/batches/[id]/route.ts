import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`📊 Batch API: Fetching batch details for ID: ${params.id}`);
    
    const batch = await prisma.batch.findUnique({
      where: { id: params.id },
      include: {
        operator: {
          select: { id: true, fullName: true, email: true }
        },
        batchStages: {
          orderBy: { stage: 'asc' }
        },
        qcResults: {
          orderBy: { createdAt: 'desc' }
        },
        alerts: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    console.log(`✅ Batch API: Found batch ${batch.batchId}`);
    return NextResponse.json(batch)
  } catch (error) {
    return handleApiError(error, 'Fetch batch details')
  }
}