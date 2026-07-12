#!/bin/bash

echo "🚀 Installing LoyaltyPass..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check for .env file
echo ""
if [ ! -f .env ]; then
    echo "⚠️  No .env file found"
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit frontend/.env with your Supabase credentials!"
    echo ""
    echo "Get credentials from:"
    echo "1. Create project at https://supabase.com"
    echo "2. Go to Settings → API"
    echo "3. Copy URL and anon key"
    echo ""
else
    echo "✅ .env file found"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "1. Setup Supabase (run supabase/schema.sql and policies.sql)"
echo "2. Configure frontend/.env with your credentials"
echo "3. Run: cd frontend && npm run dev"
echo ""
echo "For detailed instructions, see QUICKSTART.md"
