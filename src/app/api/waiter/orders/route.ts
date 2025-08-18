import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/waiter/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableNumber, staffId, items, notes } = body;

    if (!tableNumber || !staffId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Table number, staff ID, and at least one item are required' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.foodItemId || !item.portionId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Each item must have valid foodItemId, portionId, and positive quantity' },
          { status: 400 }
        );
      }
    }

    // Calculate total amount and create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      // Validate each item and calculate total
      for (const item of items) {
        const foodItemPortion = await tx.foodItemPortion.findFirst({
          where: {
            foodItemId: item.foodItemId,
            portionId: item.portionId,
          },
          include: {
            foodItem: true,
            portion: true,
          },
        });

        if (!foodItemPortion) {
          throw new Error(`Invalid food item and portion combination: ${item.foodItemId}, ${item.portionId}`);
        }

        const itemTotal = foodItemPortion.price * item.quantity;
        totalAmount += itemTotal;

        orderItemsData.push({
          foodItemId: item.foodItemId,
          portionId: item.portionId,
          quantity: item.quantity,
          unitPrice: foodItemPortion.price,
          totalPrice: itemTotal,
          specialRequests: item.specialRequests || null,
        });
      }

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          tableNumber,
          staffId,
          totalAmount,
          notes: notes || null,
          status: 'PENDING',
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: orderItemsData.map(item => ({
          ...item,
          orderId: newOrder.id,
        })),
      });

      // Return the complete order with relations
      return await tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              foodItem: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
              portion: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET /api/waiter/orders - Get orders for a specific staff member
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const status = searchParams.get('status');

    let whereClause: any = {};
    
    if (staffId) {
      whereClause.staffId = staffId;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
            portion: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 