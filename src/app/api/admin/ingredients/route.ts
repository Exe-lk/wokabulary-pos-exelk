import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(ingredients);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ingredients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, unitOfMeasurement } = await request.json();

    if (!name || !unitOfMeasurement) {
      return NextResponse.json(
        { error: 'Name and unit of measurement are required' },
        { status: 400 }
      );
    }

    // Check if ingredient with same name already exists
    const existingIngredient = await prisma.ingredient.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingIngredient) {
      return NextResponse.json(
        { error: 'An ingredient with this name already exists' },
        { status: 400 }
      );
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        description,
        unitOfMeasurement,
        currentStockQuantity: 0,
      },
    });

    return NextResponse.json(ingredient, { status: 201 });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json(
      { error: 'Failed to create ingredient' },
      { status: 500 }
    );
  }
}
