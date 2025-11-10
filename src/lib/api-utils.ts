import { NextResponse } from 'next/server'
import { prisma } from './prisma'

export async function getValidOperatorId(): Promise<string> {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'admin@diptrack.com' },
          { id: 'admin-1' }
        ]
      }
    })
    return adminUser?.id || 'admin-1'
  } catch (error) {
    console.log('Using fallback operator ID')
    return 'admin-1'
  }
}

export function handleApiError(error: any, operation: string) {
  console.error(`${operation} error:`, error)
  
  if (error.code === 'P2002') {
    return NextResponse.json(
      { error: 'A record with this data already exists' }, 
      { status: 409 }
    )
  }
  
  if (error.code === 'P2025') {
    return NextResponse.json(
      { error: 'Record not found' }, 
      { status: 404 }
    )
  }
  
  if (error.code?.startsWith('P')) {
    return NextResponse.json(
      { error: 'Database operation failed', details: error.message }, 
      { status: 500 }
    )
  }
  
  return NextResponse.json(
    { error: `${operation} failed`, details: error.message }, 
    { status: 500 }
  )
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T | NextResponse> {
  try {
    return await operation()
  } catch (error) {
    return handleApiError(error, operationName)
  }
}