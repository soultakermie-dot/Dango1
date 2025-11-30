# Classroom Application

A monorepo application for connecting students with teachers. Built with Express.js backend and React Native (Expo) frontend.

## Project Structure

```
classroom/
├── api/              # Express.js backend
├── application/      # React Native Expo app
├── avatars/          # User avatar storage
└── requirements.md   # Project requirements
```

## Prerequisites

- Node.js (v18.0.0 or higher required)
- npm (v9.0.0 or higher required)
- PostgreSQL database
- For mobile development: Expo Go app (iOS/Android) or simulators

**Note:** If you're using `nvm` (Node Version Manager), the project includes `.nvmrc` files. Simply run `nvm use` in each directory to automatically switch to the correct Node version.

## Setup Instructions

### 1. Database Setup

Create a PostgreSQL database:

**Quick command (from api directory):**
```bash
cd api
npm run db:create
```

**Or manually:**
```bash
createdb -U postgres classroom
```

**Or using psql:**
```sql
psql -U postgres -c "CREATE DATABASE classroom;"
```

### 2. Backend Setup

1. Navigate to the API directory:
```bash
cd api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=classroom
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

5. Run migrations:
```bash
npm run migrate
```

6. Start the server:
```bash
npm run dev
```

The API will be running on `http://localhost:3000`

### 3. Frontend Setup

1. Navigate to the application directory:
```bash
cd application
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Update API configuration:
   - Edit `application/config/api.js`
   - Update `API_BASE_URL` if your backend is running on a different host/port

4. Start the Expo development server:
```bash
npm start
```

5. Run on your device:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Features

### Authentication
- User registration (Student/Teacher)
- Login/Logout
- JWT-based authentication

### Student Features
- Browse teachers on Home page
- Search and filter teachers by subject
- View teacher details
- Add/remove teachers to/from favorites
- View favorite teachers list
- Edit profile

### Teacher Features
- Register with subjects (Math, History, English, Biology)
- Edit profile including subjects
- Upload avatar

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Teachers
- `GET /api/teachers` - Get all teachers (with search and filter)
- `GET /api/teachers/:id` - Get teacher details
- `GET /api/teachers/subjects/all` - Get all subjects

### Favorites (Students only)
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites/:teacherId` - Add to favorites
- `DELETE /api/favorites/:teacherId` - Remove from favorites
- `GET /api/favorites/check/:teacherId` - Check if favorited

### Profile
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update profile

## Database Schema

- **users** - User accounts (students and teachers)
- **subjects** - Available subjects (Math, History, English, Biology)
- **teacher_subjects** - Many-to-many relationship between teachers and subjects
- **favorites** - Student favorite teachers

## Tech Stack

### Backend
- Express.js
- PostgreSQL
- Knex.js (migrations)
- JWT authentication
- Multer (file uploads)
- bcryptjs (password hashing)

### Frontend
- React Native
- Expo
- React Navigation
- AsyncStorage
- Axios
- Expo Image Picker

## Notes

- All API queries use raw SQL for visibility
- Avatars are stored in the `avatars/` folder
- JWT tokens expire after 7 days
- The app uses basic authentication middleware

