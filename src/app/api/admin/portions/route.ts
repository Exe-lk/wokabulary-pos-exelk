import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/portions - Get all portions
export async function GET() {
  try {
    const portions = await prisma.portion.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(portions);
  } catch (error) {
    console.error('Error fetching portions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portions' },
      { status: 500 }
    );
  }
}

// POST /api/admin/portions - Create a new portion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Portion name is required' },
        { status: 400 }
      );
    }

    // Check if portion with same name already exists
    const existingPortion = await prisma.portion.findUnique({
      where: { name }
    });

    if (existingPortion) {
      return NextResponse.json(
        { error: 'Portion with this name already exists' },
        { status: 400 }
      );
    }

    const portion = await prisma.portion.create({
      data: {
        name,
        description: description || null,
      }
    });

    return NextResponse.json(portion, { status: 201 });
  } catch (error) {
    console.error('Error creating portion:', error);
    return NextResponse.json(
      { error: 'Failed to create portion' },
      { status: 500 }
    );
  }
} 