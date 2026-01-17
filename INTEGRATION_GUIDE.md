# Reely Backend + Frontend Integration Guide

## 🚀 Complete Setup Instructions

This guide will help you integrate the Reely frontend with the backend API, including authentication, image upload, and Gemini AI analysis.

---

## Backend Setup

### 1. Install Dependencies

```bash
cd Backend
npm install
```

Dependencies installed:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `multer` - File upload handling
- `cors` - Cross-origin resource sharing
- `@google/generative-ai` - Gemini AI SDK
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `dotenv` - Environment variables

### 2. Configure Environment Variables

Create a `.env` file in the `Backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# MongoDB Connection String (Get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/reely?retryWrites=true&w=majority

# Server Port
PORT=3001

# Gemini API Key (Get from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Secret (Generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this

# Node Environment
NODE_ENV=development
```

#### Getting Your API Keys:

**MongoDB Atlas:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string and replace `<password>` with your database password

**Gemini API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Create an API key
3. Copy and paste into `.env`

### 3. Start the Backend Server

```bash
npm run dev
```

You should see:
```
╔══════════════════════════════════════════════╗
║   Reely Backend is running!                  ║
║   Local:  http://localhost:3001             ║
║   Database: MongoDB Atlas                    ║
╚══════════════════════════════════════════════╝
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd Frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `Frontend` directory:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001

# Google Maps API Key (for map guessing feature)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

#### Getting Google Maps API Key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Maps JavaScript API"
4. Create credentials (API Key)
5. Add restrictions:
   - **HTTP referrers:** `http://localhost:5173/*`
   - **API restrictions:** Maps JavaScript API

### 3. Start the Frontend Dev Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173/`

---

## 📋 API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Upload Endpoints (Authentication Required)

#### Upload Screenshot
```http
POST /upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- screenshot: <image_file>
```

Response:
```json
{
  "id": "upload_id",
  "filename": "1234567890-screenshot.jpg",
  "imageUrl": "/uploads/1234567890-screenshot.jpg",
  "analysis": {
    "location_name": "Marina Bay Sands",
    "address": "10 Bayfront Avenue, Singapore",
    "city": "Singapore",
    "country": "Singapore",
    "description": "...",
    "category": "Hotel & Casino",
    "confidence": "high"
  },
  "google_maps_url": "https://www.google.com/maps/search/..."
}
```

#### Get Upload History
```http
GET /history?limit=50&offset=0
Authorization: Bearer <token>
```

---

## 🔐 Authentication Flow

### 1. **User Registration/Login**
- User navigates to `/login`
- Enters email, password, (and name for registration)
- Frontend calls `/auth/register` or `/auth/login`
- Backend returns JWT token
- Frontend stores token in `localStorage`

### 2. **Protected Routes**
- Dashboard checks for token on mount
- If no token found → redirect to `/login`
- All API requests include `Authorization: Bearer <token>` header

### 3. **Logout**
- User clicks logout button
- Frontend removes token from `localStorage`
- Redirects to `/login`

---

## 📸 Image Upload & Analysis Flow

### 1. **User Uploads Images**
- User drags & drops or selects images on Dashboard
- Images are stored in component state

### 2. **Processing**
- User clicks "Search" button
- Frontend shows loading screen
- For each image:
  - Upload to backend `/upload` endpoint
  - Backend saves file to `/uploads` directory
  - Backend analyzes image with Gemini AI
  - Backend saves analysis to MongoDB
  - Backend returns location data

### 3. **Results Display**
- Frontend receives location data
- Navigates to `/results` page
- Displays locations in Card or List view
- Game Mode: Users can play guessing game
- Non-Game Mode: View location details

---

## 🎮 Map Guessing Feature

To enable the map guessing game:

1. **Add Google Maps API Key** to `Frontend/.env`:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. **Update MapGuess.tsx** (line 49):
   ```typescript
   const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
   script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
   ```

3. **Gameplay**:
   - User clicks "Guess" on a location
   - Navigates to `/map-guess`
   - User places pin on world map
   - System calculates distance and awards points
   - User proceeds to next round or returns to results

---

## 🗄️ MongoDB Schema

### User Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  created_at: Date,
  last_login: Date
}
```

### Upload Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User, required),
  filename: String,
  original_name: String,
  location_name: String,
  address: String,
  description: String,
  category: String,
  latitude: Number,
  longitude: Number,
  google_maps_url: String,
  raw_response: Mixed,
  created_at: Date
}
```

---

## 🧪 Testing the Integration

### 1. Test Authentication
```bash
# Register a new user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 2. Test Image Upload
```bash
# Save the token from login response
TOKEN="your_jwt_token_here"

# Upload an image
curl -X POST http://localhost:3001/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "screenshot=@/path/to/image.jpg"
```

### 3. Test Frontend
1. Open `http://localhost:5173/login`
2. Register a new account
3. Upload a screenshot
4. Click "Search"
5. View results
6. Test game mode

---

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
- Check your `MONGODB_URI` in `.env`
- Ensure IP address is whitelisted in MongoDB Atlas
- Verify username/password are correct

**Gemini API Error:**
- Verify `GEMINI_API_KEY` in `.env`
- Check API quota/billing in Google AI Studio
- Ensure image is in supported format (JPEG, PNG)

**CORS Error:**
- Backend `cors()` middleware is enabled
- Check frontend is running on `http://localhost:5173`

### Frontend Issues

**401 Unauthorized:**
- Token expired → logout and login again
- Token missing → check `localStorage`

**Failed to fetch:**
- Backend not running
- Check `VITE_API_URL` in `.env`
- Verify backend port (3001)

**Map not loading:**
- Check `VITE_GOOGLE_MAPS_API_KEY`
- Verify API is enabled in Google Cloud
- Check browser console for errors

---

## 📝 Next Steps

### Recommended Enhancements:
1. ✅ Add password reset functionality
2. ✅ Implement email verification
3. ✅ Add profile picture upload
4. ✅ Create History page to view past uploads
5. ✅ Add batch delete for uploads
6. ✅ Implement search/filter for history
7. ✅ Add export to CSV/JSON functionality
8. ✅ Social sharing features
9. ✅ Leaderboard for game mode
10. ✅ Multi-language support

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong JWT secrets** - Generate with `openssl rand -base64 32`
3. **Enable HTTPS in production**
4. **Implement rate limiting**
5. **Validate all user inputs**
6. **Sanitize file uploads**
7. **Use environment-specific configs**

---

## 📦 Deployment

### Backend (Railway/Heroku/DigitalOcean)
```bash
# Set environment variables
MONGODB_URI=<production_mongodb_uri>
GEMINI_API_KEY=<your_key>
JWT_SECRET=<strong_secret>
NODE_ENV=production
PORT=3001

# Build command
npm install

# Start command
npm start
```

### Frontend (Vercel/Netlify)
```bash
# Environment variables
VITE_API_URL=https://your-backend.com
VITE_GOOGLE_MAPS_API_KEY=<your_key>

# Build command
npm run build

# Output directory
dist
```

---

## 📞 Support

If you encounter issues:
1. Check this README
2. Review error messages in console
3. Verify all environment variables are set
4. Ensure all dependencies are installed
5. Check MongoDB/Gemini API status

---

## ✨ Features Implemented

✅ User Authentication (Register/Login/Logout)
✅ JWT Token Management
✅ Protected Routes
✅ Image Upload with Gemini AI Analysis
✅ MongoDB Data Storage
✅ Upload History
✅ Game Mode with Map Guessing
✅ Non-Game Mode with Location Details
✅ Card & List View Toggle
✅ Google Maps Integration
✅ Responsive Design
✅ Error Handling
✅ Loading States

Happy coding! 🎉
