import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/cashier/orders - Create a new order with COMPLETED status (for cashier)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableNumber, staffId, items, notes, customerData, paymentData, billNumber } = body;

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

    // Handle customer creation - for cashier, we need a customer for payment records
    let customerId = null;
    if (customerData) {
      if (customerData.isNewCustomer && customerData.phone) {
        // Check if customer with this phone already exists
        const existingCustomer = await prisma.customer.findUnique({
          where: { phone: customerData.phone },
        });

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const newCustomer = await prisma.customer.create({
            data: {
              name: customerData.name || 'Walk-in Customer',
              email: customerData.email || null,
              phone: customerData.phone,
            },
          });
          customerId = newCustomer.id;
        }
      } else if (customerData.customerId) {
        customerId = customerData.customerId;
      }
    }
    
    // If payment data is provided but no customer, create a walk-in customer
    if (paymentData && !customerId) {
      // Generate a unique phone number for walk-in customers
      const walkInPhone = `WALKIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const walkInCustomer = await prisma.customer.create({
        data: {
          name: customerData?.name || 'Walk-in Customer',
          email: customerData?.email || null,
          phone: walkInPhone,
        },
      });
      customerId = walkInCustomer.id;
    }

    // Calculate total amount and create order with items
    let totalAmount = 0;
    const orderItemsData = [];
    const ingredientReductions = new Map();

    // Step 1: Validate each item, calculate total, and check inventory
    for (const item of items) {
      const foodItemPortion = await prisma.foodItemPortion.findFirst({
        where: {
          foodItemId: item.foodItemId,
          portionId: item.portionId,
        },
        include: {
          foodItem: true,
          portion: true,
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      if (!foodItemPortion) {
        return NextResponse.json(
          { error: `Invalid food item and portion combination: ${item.foodItemId}, ${item.portionId}` },
          { status: 400 }
        );
      }

      // Check if food item is active
      if (!foodItemPortion.foodItem.isActive) {
        return NextResponse.json(
          { error: `Food item "${foodItemPortion.foodItem.name}" is currently disabled and cannot be ordered` },
          { status: 400 }
        );
      }

      // Check if portion is active
      if (!foodItemPortion.portion.isActive) {
        return NextResponse.json(
          { error: `Portion "${foodItemPortion.portion.name}" for "${foodItemPortion.foodItem.name}" is currently disabled` },
          { status: 400 }
        );
      }

      // Calculate ingredient requirements for this order item
      for (const portionIngredient of foodItemPortion.ingredients) {
        const requiredQuantity = portionIngredient.quantity * item.quantity;
        const ingredientId = portionIngredient.ingredientId;
        
        if (ingredientReductions.has(ingredientId)) {
          ingredientReductions.set(ingredientId, ingredientReductions.get(ingredientId) + requiredQuantity);
        } else {
          ingredientReductions.set(ingredientId, requiredQuantity);
        }
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

    // Step 2: Check if there's sufficient inventory for all ingredients
    for (const [ingredientId, requiredQuantity] of ingredientReductions) {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: ingredientId },
      });

      if (!ingredient) {
        return NextResponse.json(
          { error: `Ingredient not found: ${ingredientId}` },
          { status: 400 }
        );
      }

      if (ingredient.currentStockQuantity < requiredQuantity) {
        return NextResponse.json(
          { error: `Insufficient inventory for ingredient "${ingredient.name}". Required: ${requiredQuantity} ${ingredient.unitOfMeasurement}, Available: ${ingredient.currentStockQuantity} ${ingredient.unitOfMeasurement}` },
          { status: 400 }
        );
      }
    }

    // Step 3: Reduce ingredient stock
    for (const [ingredientId, requiredQuantity] of ingredientReductions) {
      await prisma.ingredient.update({
        where: { id: ingredientId },
        data: {
          currentStockQuantity: {
            decrement: requiredQuantity,
          },
        },
      });
    }

    // Step 4: Create the order with COMPLETED status
    const order = await prisma.order.create({
      data: {
        tableNumber,
        staffId,
        customerId,
        totalAmount,
        notes: notes || null,
        status: 'COMPLETED', // Cashier orders are immediately completed
        customerName: customerData?.name || null,
        customerEmail: customerData?.email || null,
        customerPhone: customerData?.phone || null,
        billNumber: billNumber || null,
      },
    });

    // Step 5: Create order items
    await prisma.orderItem.createMany({
      data: orderItemsData.map(item => ({
        ...item,
        orderId: order.id,
      })),
    });

    // Create payment record if payment data is provided
    if (paymentData && customerId) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          customerId: customerId,
          amount: order.totalAmount,
          receivedAmount: paymentData.receivedAmount,
          balance: paymentData.balance,
          paymentMode: paymentData.paymentMode,
          referenceNumber: paymentData.referenceNumber || null,
        },
      });
    }

    // Return the complete order with relations
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
        payments: {
          select: {
            id: true,
            amount: true,
            receivedAmount: true,
            balance: true,
            paymentDate: true,
            paymentMode: true,
          },
        },
      },
    });

    return NextResponse.json(completeOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating cashier order:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      console.error('Prisma error code:', prismaError.code);
      console.error('Prisma error meta:', prismaError.meta);
      
      switch (prismaError.code) {
        case 'P2002':
          return NextResponse.json(
            { error: 'A record with this data already exists' },
            { status: 409 }
          );
        case 'P2003':
          return NextResponse.json(
            { error: 'Foreign key constraint failed - check if staff, customer, or items exist' },
            { status: 400 }
          );
        case 'P2025':
          return NextResponse.json(
            { error: 'Required record not found' },
            { status: 404 }
          );
        default:
          return NextResponse.json(
            { error: `Database error: ${prismaError.message || 'Unknown error'}` },
            { status: 500 }
          );
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? `Server error: ${error.message}` : 'Failed to create order' },
      { status: 500 }
    );
  }
}
