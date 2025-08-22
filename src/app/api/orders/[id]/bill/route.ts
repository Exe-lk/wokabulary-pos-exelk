import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { customerName, customerEmail, customerPhone, billNumber } = await request.json();
    const { id } = await params;
    const orderId = parseInt(id);

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        customerName,
        customerEmail,
        customerPhone,
      },
      include: {
        staff: {
          select: {
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            foodItem: {
              select: {
                name: true,
                description: true,
              },
            },
            portion: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const baseUrl = process.env.BASE_URL!;
    const billUrl = `${baseUrl}bill/${orderId}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your Bill - Restaurant</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { max-width: 150px; height: auto; }
            .bill-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .bill-button { 
              display: inline-block; 
              background: #007bff; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank you for dining with us!</h1>
            </div>
            
            <p>Dear ${customerName || 'Valued Customer'},</p>
            
            <p>Thank you for choosing our restaurant. Your bill is ready for review.</p>
            
            <div class="bill-summary">
              <h3>Order Summary</h3>
              <p><strong>Order #:</strong> ${orderId}</p>
              ${billNumber ? `<p><strong>Bill #:</strong> ${billNumber}</p>` : ''}
              <p><strong>Table:</strong> ${updatedOrder.tableNumber}</p>
              <p><strong>Total Amount:</strong> Rs. ${updatedOrder.totalAmount.toFixed(2)}</p>
              <p><strong>Served by:</strong> ${updatedOrder.staff.name}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${billUrl}" class="bill-button">View & Download Bill</a>
            </div>
            
            <p>You can view and download your detailed bill by clicking the button above.</p>
            
            <div class="footer">
              <p>We appreciate your business and look forward to serving you again!</p>
              <p>If you have any questions about your bill, please don't hesitate to contact us.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Your Bill - Order #${orderId}${billNumber ? ` (Bill #${billNumber})` : ''}`,
      html: emailHtml,
    });

    // Send SMS if phone number is provided
    let smsResult = null;
    if (customerPhone) {
      try {
        const smsMessage = `Dear ${customerName || 'Valued Customer'},

Your bill for Order #${orderId}${billNumber ? ` (Bill #${billNumber})` : ''} is ready!

Total Amount: Rs. ${updatedOrder.totalAmount.toFixed(2)}
Table: ${updatedOrder.tableNumber}

View your bill: ${billUrl}

Thank you for dining with us!

Best Regards,
Wokabulary Team`;

        // Format phone number for Text.lk (should start with 94 for Sri Lanka)
        let formattedPhone = customerPhone;
        if (customerPhone.startsWith('+')) {
          formattedPhone = customerPhone.substring(1);
        } else if (customerPhone.startsWith('0')) {
          formattedPhone = '94' + customerPhone.substring(1);
        } else if (!customerPhone.startsWith('94')) {
          formattedPhone = '94' + customerPhone;
        }

        // Import sendSMS from textlk-node for server-side use
        const { sendSMS } = await import('textlk-node');
        
        smsResult = await sendSMS({
          phoneNumber: formattedPhone,
          message: smsMessage,
        });

        console.log('SMS Result:', smsResult);
      } catch (smsError: any) {
        console.error('SMS sending failed:', smsError);
        smsResult = { success: false, error: smsError.message };
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      message: 'Bill sent successfully via email' + (customerPhone ? ' and SMS' : ''),
      billUrl,
      smsResult,
    });
  } catch (error) {
    console.error('Error sending bill:', error);
    return NextResponse.json(
      { error: 'Failed to send bill' },
      { status: 500 }
    );
  }
} 