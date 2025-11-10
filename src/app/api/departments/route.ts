import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-utils'

export async function GET() {
  try {
    console.log('📊 Departments API: Fetching departments from database...');
    
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    })
    
    console.log(`📊 Departments API: Found ${departments.length} departments in database`);
    return NextResponse.json(departments)
  } catch (error) {
    return handleApiError(error, 'Fetch departments')
  }
}