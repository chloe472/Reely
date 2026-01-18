# Reely

A web-based GeoGuessr-style game that analyzes images and videos to identify real-world locations. Upload screenshots or videos, and let AI identify where they were taken. Then test your geography skills by guessing the location on an interactive map with Street View.

## Overview

Reely combines AI-powered location detection with an interactive guessing game. Upload images or videos, get AI-analyzed locations, and compete on the leaderboard by accurately guessing where each location is on the map.

## Features

### Core Features
- Image & Video Upload - Upload photos or videos of locations
- AI Location Detection - Google Gemini API analyzes media to identify locations with coordinates
- Interactive Map Game - Guess locations on a world map with Google Maps integration
- Street View Integration - Explore locations in immersive Street View before guessing
- Points & Scoring - GeoGuessr-style scoring based on distance accuracy
- Leaderboard - Compete with other players and track top scores
- Collections - Organize your discovered locations into folders
- Video Scene Detection - Automatically extract multiple locations from videos

### Technical Features
- Google OAuth - Secure authentication via Supabase
- Real-time Database - MongoDB for game data and upload history
- Responsive Design - Professional blue-themed UI works on all devices
- Production Ready - Docker containers and Cloud Run deployment scripts

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Vite for build tooling
- Google Maps JavaScript API
- Supabase client for authentication

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Google Gemini Vision API
- FFmpeg for video processing
- Multer for file uploads
- Supabase for authentication

### Infrastructure
- Docker for containerization
- Google Cloud Run for deployment
- GCP Secret Manager for secrets
- Nginx for frontend serving
- MongoDB Atlas for database

## Project Structure

Reely/
├── Backend/
│   ├── middleware/          # Authentication middleware
│   ├── models/             # MongoDB schemas (Upload, User, Folder)
│   ├── routes/             # API endpoints
│   ├── services/           # Gemini AI, video processing
│   ├── uploads/            # Uploaded media storage
│   ├── Dockerfile          # Backend container
│   ├── deploy.sh           # GCP deployment script
│   └── setup-secrets.sh    # Secret configuration
├── Frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── context/        # React context (Auth)
│   │   ├── services/       # API client
│   │   └── lib/            # Supabase client
│   ├── Dockerfile          # Frontend container
│   ├── nginx.conf          # Production web server
│   └── deploy.sh           # GCP deployment script
├── docker-compose.yml      # Local development
├── deploy-all.sh           # Complete deployment script
└── env.example             # Environment variables template

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Cloud account (for deployment)
- MongoDB Atlas account
- Supabase account
- API Keys: Google Gemini API key, Google Maps API key

### Local Development Setup

1. Clone the repository
2. Setup Backend: cd Backend && npm install
3. Setup Frontend: cd Frontend && npm install
4. Configure environment variables (see env.example)
5. Start backend: npm start
6. Start frontend: npm run dev

### Docker Development Setup

1. Install Docker Desktop
2. Create environment file: cp env.example .env
3. Start services: docker-compose up --build
4. Access: Frontend http://localhost:3000, Backend http://localhost:8080

## Deployment to Google Cloud Platform

### Quick Deployment

export GCP_PROJECT_ID="your-project-id"
cd Backend && ./setup-secrets.sh
cd .. && ./deploy-all.sh

### Manual Deployment

1. Setup GCP Secrets: cd Backend && ./setup-secrets.sh
2. Deploy Backend: cd Backend && ./deploy.sh
3. Deploy Frontend: cd Frontend && BACKEND_URL="https://..." ./deploy.sh
4. Configure CORS, Supabase redirects, and API restrictions

## Environment Variables

Backend: PORT, NODE_ENV, GEMINI_API_KEY, MONGODB_URI, SUPABASE_URL, SUPABASE_ANON_KEY
Frontend: VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GOOGLE_MAPS_KEY

## API Endpoints

- POST /upload - Upload image or video
- GET /history - Get upload history
- GET /upload/:id - Get single upload
- PUT /upload/:id/guess - Submit location guess
- GET /leaderboard - Get top players
- POST /folders - Create folder
- GET /health - Health check

## How It Works

1. Upload - User uploads an image or video
2. Analysis - Google Gemini Vision API analyzes the media
3. Location Detection - AI extracts location name and coordinates
4. Game Mode - User sees Street View and tries to guess location on map
5. Scoring - Points awarded based on distance accuracy
6. Leaderboard - Top players ranked by total points

### Scoring System
- Perfect (< 1 km): 5000 points
- Excellent (< 10 km): 4500 points
- Great (< 50 km): 4000 points
- Good (< 100 km): 3500 points
- Not bad (< 500 km): 2500 points
- Could be better (< 1000 km): 2000 points
- Far off (> 1000 km): 500 points

## Database Schema

### MongoDB Collections
- uploads: user_id, filename, location, coordinates, points, confidence
- folders: user_id, name, uploads array

### Supabase Tables
- profiles: id, email, full_name, avatar_url

## Troubleshooting

Street View not loading: Verify API key, check billing enabled
Images not uploading: Check file size (max 100MB), verify Multer config
Gemini API errors: Verify API key, check quota limits
Deployment fails: Verify gcloud auth, check Secret Manager

View logs: gcloud run services logs read reely-backend --region=us-central1

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is private and not licensed for public use.

## Acknowledgments

Google Gemini for AI location detection
Google Maps for mapping and Street View
Supabase for authentication
MongoDB Atlas for database hosting
GeoGuessr for game inspiration

---

Built with Node.js, React, and Google Cloud Platform
