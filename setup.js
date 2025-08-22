#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Wokabulary POS System...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/wokabulary_pos"
DIRECT_URL="postgresql://username:password@localhost:5432/wokabulary_pos"

# Next.js Configuration
NEXTAUTH_SECRET="your-nextauth-secret-here"
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
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local file created successfully!');
  console.log('⚠️  Please update the DATABASE_URL with your actual database credentials.\n');
} else {
  console.log('✅ .env.local file already exists.\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('yarn install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully!\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Generate Prisma client
console.log('🔧 Generating Prisma client...');
try {
  execSync('yarn prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully!\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  console.log('⚠️  Make sure your DATABASE_URL is correctly set in .env.local\n');
}

console.log('🎉 Setup completed!');
console.log('\nNext steps:');
console.log('1. Update your DATABASE_URL in .env.local with your actual database credentials');
console.log('2. Run "yarn prisma migrate dev" to set up your database');
console.log('3. Run "yarn seed" to populate initial data (optional)');
console.log('4. Run "yarn dev" to start the development server');
console.log('\nFor more information, check the README.md file.');
