import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone }
    });

    if (existingCustomer) {
      return NextResponse.json({ error: 'Customer with this phone number already exists' }, { status: 409 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone
      }
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
