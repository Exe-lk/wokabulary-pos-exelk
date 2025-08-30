import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/kitchen/orders - Get orders for kitchen staff (PENDING, PREPARING, READY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let whereClause: any = {
      status: {
        in: ['PENDING', 'PREPARING', 'READY']
      }
    };
    
    if (status && ['PENDING', 'PREPARING', 'READY'].includes(status)) {
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
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
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
      orderBy: [
        { status: 'asc' }, // PENDING first, then PREPARING, then READY
        { createdAt: 'asc' }, // Oldest first within each status
      ],
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 