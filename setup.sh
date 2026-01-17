#!/bin/bash

echo "🚀 Reely Quick Start Script"
echo "============================"
echo ""

# Check if we're in the Reely directory
if [ ! -d "Backend" ] || [ ! -d "Frontend" ]; then
    echo "❌ Error: Please run this script from the Reely root directory"
    exit 1
fi

# Backend setup
echo "📦 Setting up Backend..."
cd Backend

if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✏️  Please edit Backend/.env with your actual API keys"
    echo ""
fi

if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    npm install
fi

echo "✅ Backend setup complete"
echo ""

# Frontend setup
echo "📦 Setting up Frontend..."
cd ../Frontend

if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✏️  Please edit Frontend/.env with your actual API keys"
    echo ""
fi

if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

echo "✅ Frontend setup complete"
echo ""

# Summary
echo "✨ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit Backend/.env with your MongoDB URI and Gemini API key"
echo "2. Edit Frontend/.env with your Google Maps API key"
echo "3. Start the backend: cd Backend && npm run dev"
echo "4. Start the frontend: cd Frontend && npm run dev"
echo ""
echo "📖 See INTEGRATION_GUIDE.md for detailed instructions"
