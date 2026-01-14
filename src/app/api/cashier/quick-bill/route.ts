import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/cashier/quick-bill - Create a quick bill without table number or kitchen status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffId, items, notes, customerData, paymentData, orderType } = body;

    if (!staffId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Staff ID and at least one item are required' },
        { status: 400 }
      );
    }

    if (!customerData || !customerData.name || !customerData.phone) {
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 }
      );
    }

    if (!paymentData) {
      return NextResponse.json(
        { error: 'Payment data is required' },
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

    // Handle customer creation
    let customerId = null;
    if (customerData.isNewCustomer) {
      const newCustomer = await prisma.customer.create({
        data: {
          name: customerData.name,
          email: customerData.email || null,
          phone: customerData.phone,
        },
      });
      customerId = newCustomer.id;
    } else if (customerData.customerId) {
      customerId = customerData.customerId;
    } else {
      // Try to find existing customer by phone
      const existingCustomer = await prisma.customer.findUnique({
        where: { phone: customerData.phone },
      });
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            name: customerData.name,
            email: customerData.email || null,
            phone: customerData.phone,
          },
        });
        customerId = newCustomer.id;
      }
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

      if (!foodItemPortion.foodItem.isActive) {
        return NextResponse.json(
          { error: `Food item "${foodItemPortion.foodItem.name}" is currently disabled` },
          { status: 400 }
        );
      }

      if (!foodItemPortion.portion.isActive) {
        return NextResponse.json(
          { error: `Portion "${foodItemPortion.portion.name}" for "${foodItemPortion.foodItem.name}" is currently disabled` },
          { status: 400 }
        );
      }

      // Calculate ingredient requirements
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

    // Generate bill number
    const now = new Date();
    const dateStr = now.getFullYear().toString() + 
                   (now.getMonth() + 1).toString().padStart(2, '0') + 
                   now.getDate().toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const billNumber = `BILL-${dateStr}-${randomNum}`;

    // Verify staff exists or find/create for admin
    let staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    let finalStaffId = staffId;

    // If staff not found, check if it's an admin user
    if (!staff) {
      const admin = await prisma.admin.findUnique({
        where: { id: staffId },
      });

      if (admin) {
        // Find or create a staff record for this admin
        // First try to find by email
        staff = await prisma.staff.findUnique({
          where: { email: admin.email },
        });

        // If no staff found, create one for the admin
        if (!staff) {
          // We need a supabaseId for staff, but admin doesn't have one
          // Create a dummy supabaseId or use a different approach
          // For now, let's use the admin ID as a prefix
          const dummySupabaseId = `admin_${admin.id}`;
          
          // Check if staff with this supabaseId exists
          staff = await prisma.staff.findUnique({
            where: { supabaseId: dummySupabaseId },
          });

          if (!staff) {
            // Create staff record for admin
            staff = await prisma.staff.create({
              data: {
                email: admin.email,
                name: admin.name,
                role: 'CASHIER', // Default role for admin-created bills
                supabaseId: dummySupabaseId,
                isActive: true,
              },
            });
          }
        }
        // Update finalStaffId to use the staff record
        finalStaffId = staff.id;
      } else {
        return NextResponse.json(
          { error: 'Staff member or admin not found' },
          { status: 400 }
        );
      }
    }

    // Step 4: Create the order (status COMPLETED for quick bills, no table number)
    const order = await prisma.order.create({
      data: {
        tableNumber: null as any, // Quick bills don't have table numbers
        staffId: finalStaffId,
        customerId: customerId || null,
        totalAmount,
        notes: notes || null,
        status: 'COMPLETED', // Quick bills are immediately completed
        customerName: customerData.name,
        customerEmail: customerData.email || null,
        customerPhone: customerData.phone,
        billNumber,
        orderType: orderType || 'TAKEAWAY',
      },
    });

    // Step 5: Create order items
    await prisma.orderItem.createMany({
      data: orderItemsData.map(item => ({
        ...item,
        orderId: order.id,
      })),
    });

    // Step 6: Create payment record
    if (customerId && paymentData) {
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
            referenceNumber: true,
          },
        },
      },
    });

    return NextResponse.json(completeOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating quick bill:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      console.error('Prisma error code:', prismaError.code);
      
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
      { error: error instanceof Error ? `Server error: ${error.message}` : 'Failed to create quick bill' },
      { status: 500 }
    );
  }
}
