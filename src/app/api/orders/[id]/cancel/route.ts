import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/orders/[id]/cancel - Cancel an order (only if status is PREPARING)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reason } = await request.json();

    // Get current order
    const currentOrder = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      select: { 
        status: true,
        tableNumber: true,
        totalAmount: true,
        orderItems: {
          include: {
            foodItem: { select: { name: true } },
            portion: { select: { name: true } }
          }
        }
      }
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only allow cancellation if order is in PREPARING status
    if (currentOrder.status !== 'PREPARING') {
      return NextResponse.json(
        { error: `Cannot cancel order with status ${currentOrder.status}. Only orders in PREPARING status can be cancelled.` },
        { status: 400 }
      );
    }

    // Update the order status to CANCELLED
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { 
        status: 'CANCELLED',
        notes: reason ? `CANCELLED: ${reason}` : 'CANCELLED',
        updatedAt: new Date()
      },
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
    });

    return NextResponse.json({
      message: 'Order has been cancelled successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
