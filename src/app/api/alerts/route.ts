import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Alerts API: Fetching alerts from database...');
    
    const alerts = await prisma.alert.findMany({
      include: {
        batch: {
          select: { batchId: true, productType: true }
        },
        assignedUser: {
          select: { id: true, fullName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📊 Alerts API: Found ${alerts.length} alerts in database`);
    return NextResponse.json(alerts)
  } catch (error) {
    return handleApiError(error, 'Fetch alerts')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, severity, source, batchId } = body
    
    console.log('📝 Alerts API: Creating alert:', { title, severity, source });

    if (!title || !description || !severity || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, severity, source' }, 
        { status: 400 }
      )
    }

    const alert = await prisma.alert.create({
      data: {
        title,
        description,
        severity,
        source,
        batchId: batchId || null,
        status: 'active'
      },
      include: {
        batch: {
          select: { batchId: true, productType: true }
        }
      }
    })

    console.log('✅ Alerts API: Alert created successfully:', alert.id);
    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Create alert')
  }
}