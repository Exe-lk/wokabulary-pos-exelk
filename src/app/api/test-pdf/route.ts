import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(request: NextRequest) {
  let browser;
  try {
    console.log('Testing Puppeteer...');
    
    // Test basic Puppeteer functionality
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
    });

    console.log('Puppeteer browser launched successfully');

    const page = await browser.newPage();
    await page.setContent('<html><body><h1>Test PDF</h1><p>This is a test.</p></body></html>');
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    console.log(`Test PDF generated successfully, size: ${pdf.length} bytes`);

    return NextResponse.json({
      success: true,
      message: 'Puppeteer is working correctly',
      pdfSize: pdf.length,
      environment: process.env.NODE_ENV,
      isNetlify: !!process.env.NETLIFY,
      isVercel: !!process.env.VERCEL
    });

  } catch (error) {
    console.error('Puppeteer test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      isNetlify: !!process.env.NETLIFY,
      isVercel: !!process.env.VERCEL
    }, { status: 500 });
    
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Test browser closed');
      } catch (closeError) {
        console.error('Error closing test browser:', closeError);
      }
    }
  }
}
