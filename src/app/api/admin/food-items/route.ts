import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/food-items - Get all food items with portion and category details
export async function GET() {
  try {
    const foodItems = await prisma.foodItem.findMany({
      include: {
        category: true,
        foodItemPortions: {
          include: {
            portion: true
          },
          orderBy: {
            price: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(foodItems);
  } catch (error) {
    console.error('Error fetching food items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food items' },
      { status: 500 }
    );
  }
}

// POST /api/admin/food-items - Create a new food item with multiple portions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, imageUrl, categoryId, portions } = body;

    if (!name || !categoryId || !portions || !Array.isArray(portions) || portions.length === 0) {
      return NextResponse.json(
        { error: 'Name, category, and at least one portion with price are required' },
        { status: 400 }
      );
    }

    // Validate portions array
    for (const portion of portions) {
      if (!portion.portionId || !portion.price || portion.price <= 0) {
        return NextResponse.json(
          { error: 'Each portion must have a valid portionId and positive price' },
          { status: 400 }
        );
      }
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Selected category does not exist' },
        { status: 400 }
      );
    }

    // Check if all portions exist
    const portionIds = portions.map(p => p.portionId);
    const existingPortions = await prisma.portion.findMany({
      where: { id: { in: portionIds } }
    });

    if (existingPortions.length !== portionIds.length) {
      return NextResponse.json(
        { error: 'One or more selected portions do not exist' },
        { status: 400 }
      );
    }

    // Create food item with portions in a transaction
    const foodItem = await prisma.$transaction(async (tx) => {
      // Create the food item first
      const newFoodItem = await tx.foodItem.create({
        data: {
          name,
          description: description || null,
          imageUrl: imageUrl || null,
          categoryId,
        }
      });

      // Create food item portions
      await tx.foodItemPortion.createMany({
        data: portions.map(portion => ({
          foodItemId: newFoodItem.id,
          portionId: portion.portionId,
          price: parseFloat(portion.price)
        }))
      });

      // Return the complete food item with relations
      return await tx.foodItem.findUnique({
        where: { id: newFoodItem.id },
        include: {
          category: true,
          foodItemPortions: {
            include: {
              portion: true
            },
            orderBy: {
              price: 'asc'
            }
          }
        }
      });
    });

    return NextResponse.json(foodItem, { status: 201 });
  } catch (error) {
    console.error('Error creating food item:', error);
    return NextResponse.json(
      { error: 'Failed to create food item' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/food-items - Update a food item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, imageUrl, categoryId, portions, isActive } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Food item ID is required' },
        { status: 400 }
      );
    }

    // Check if food item exists
    const existingItem = await prisma.foodItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Food item not found' },
        { status: 404 }
      );
    }

    // Update food item in a transaction
    const foodItem = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description || null;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Update the food item
      const updatedFoodItem = await tx.foodItem.update({
        where: { id },
        data: updateData
      });

      // If portions are provided, update them
      if (portions && Array.isArray(portions) && portions.length > 0) {
        // Validate portions
        for (const portion of portions) {
          if (!portion.portionId || !portion.price || portion.price <= 0) {
            throw new Error('Each portion must have a valid portionId and positive price');
          }
        }

        // Delete existing portions
        await tx.foodItemPortion.deleteMany({
          where: { foodItemId: id }
        });

        // Create new portions
        await tx.foodItemPortion.createMany({
          data: portions.map(portion => ({
            foodItemId: id,
            portionId: portion.portionId,
            price: parseFloat(portion.price)
          }))
        });
      }

      // Return the complete food item with relations
      return await tx.foodItem.findUnique({
        where: { id },
        include: {
          category: true,
          foodItemPortions: {
            include: {
              portion: true
            },
            orderBy: {
              price: 'asc'
            }
          }
        }
      });
    });

    return NextResponse.json(foodItem);
  } catch (error) {
    console.error('Error updating food item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update food item' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/food-items/[id] - Delete a food item
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Food item ID is required' },
        { status: 400 }
      );
    }

    // Check if food item exists
    const existingItem = await prisma.foodItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Food item not found' },
        { status: 404 }
      );
    }

    // Delete food item (cascade will handle food item portions)
    await prisma.foodItem.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Food item deleted successfully' });
  } catch (error) {
    console.error('Error deleting food item:', error);
    return NextResponse.json(
      { error: 'Failed to delete food item' },
      { status: 500 }
    );
  }
} 