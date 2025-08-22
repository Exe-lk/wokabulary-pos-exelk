# Wokabulary POS System

A modern point-of-sale system built with Next.js, Prisma, and PostgreSQL.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Yarn or npm

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
DIRECT_URL="postgresql://username:password@localhost:5432/your_database_name"

# Next.js Configuration
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Supabase Configuration (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Email Configuration (if using nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Set up the database:
```bash
# Generate Prisma client
yarn prisma generate

# Run database migrations
yarn prisma migrate dev

# Seed the database (optional)
yarn seed
```

3. Run the development server:
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

4. Test your database connection:
```bash
# Visit the health check endpoint
curl http://localhost:3000/api/health
# or open in browser: http://localhost:3000/api/health
```

## Database Schema

The application uses the following main models:
- **Admin**: System administrators
- **Staff**: Restaurant staff (waiters, cashiers, etc.)
- **Customer**: Customer information
- **Category**: Food categories
- **FoodItem**: Menu items
- **Portion**: Food portions (small, medium, large)
- **Order**: Customer orders
- **OrderItem**: Individual items in orders
- **Payment**: Payment records

## Features

- **Admin Panel**: Manage staff, menu items, categories, and view reports
- **Waiter Interface**: Take orders, manage tables, and process payments
- **Kitchen Interface**: View and update order status
- **Manager Dashboard**: Overview of restaurant operations
- **Customer Management**: Track customer information and order history
- **Payment Processing**: Multiple payment modes with receipt generation

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to set up your environment variables in your deployment platform.

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. **Check your DATABASE_URL**: Ensure your `.env.local` file has the correct database URL
2. **Verify database is running**: Make sure your PostgreSQL server is running
3. **Test connection**: Visit `/api/health` to check database connectivity
4. **Check credentials**: Verify your database username and password are correct

### Common Error Messages

- **"Cannot read properties of undefined (reading 'findUnique')"**: Database connection not configured
- **"ECONNREFUSED"**: Database server not running or wrong port
- **"authentication failed"**: Incorrect database credentials

### Quick Setup

Run the setup script for automatic configuration:
```bash
yarn setup
```

This will:
- Create a `.env.local` file with template values
- Install dependencies
- Generate Prisma client
- Provide next steps for database setup
