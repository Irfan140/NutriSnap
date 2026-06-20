# NutriSnap

An AI-powered meal analyzer with a React Native mobile app and Express backend. Upload a food photo and get instant nutritional breakdown, health score, and dietary advice powered by **Groq's Llama 4 Scout Vision** model.

## Features

- **Image Analysis**: Upload or capture photos of meals for instant AI-powered nutritional analysis
- **Nutrition Breakdown**: Calories, protein, carbs, fats, fiber, and key vitamins & minerals
- **Health Score**: 0-100 rating with personalized explanations
- **Health Advice**: AI-generated recommendations based on meal composition
- **Alternative Suggestions**: Healthier substitutes while maintaining similar flavors
- **Authentication**: Secure sign-in/sign-up with Clerk (email/password and Google OAuth)
- **Modern UI**: NativeWind (TailwindCSS for React Native)
- **Cross-Platform**: Works on iOS and Android

## Tech Stack

### Mobile App
- [Expo](https://expo.dev) (~55.0) with Expo Router
- TypeScript
- NativeWind (TailwindCSS for React native apps)
- Clerk (authentication)
- React Native Reanimated

### Backend Server
- [Bun](https://bun.sh/) runtime
- Express
- Groq SDK (Llama 4 Scout Vision)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) app on your mobile device

## Getting Started

### 1. Clone and install

```bash
git clone <your-repository-url>
cd Meal_Analyzer
bun install
```

### 2. Set up environment variables

Create `.env.local` in the project root:

```env
GROQ_API_KEY=your_groq_api_key
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

Get your keys:
- **Groq**: [console.groq.com](https://console.groq.com/)
- **Clerk**: [clerk.com](https://clerk.com/)

### 3. Set up the backend server

```bash
cd server
bun install
cp .env.example .env
```

Edit `server/.env` and add your `GROQ_API_KEY`.

### 4. Run the servers

In one terminal — start the backend:

```bash
cd server
bun run dev
```

In another terminal — start the Expo app:

```bash
bun expo start
```

Scan the QR code with Expo Go on your device.

> **Note**: On a physical Android device, the app connects to the server at `192.168.1.69:3000`. Update the IP in `src/app/(app)/(tabs)/index.tsx` if your local IP differs.



## API

### `POST /api/aifood`

Analyzes a food image and returns nutritional data.

**Request:**
```json
{
  "image": "<base64-encoded-image>"
}
```

**Response (200):**
```json
{
  "message": "```json\n{ ... nutrition data ... }\n```\n\n## Health Advice\n..."
}
```

**Error Responses:**
- `400` — No image provided
- `422` — Image does not contain food, or AI returned invalid data
- `500` — Server error

### `GET /health`

Health check endpoint.

**Response:**
```json
{ "status": "ok" }
```

## Scripts

### App (root)
```bash
bun expo start        # Start Expo dev server
bun android           # Run on Android
bun ios               # Run on iOS
bun lint              # Run ESLint
```

### Server
```bash
bun run dev           # Start with hot reload
bun run start         # Start production
```

## Building for Production

```bash
npm install -g eas-cli
eas build:configure
eas build --platform android
eas build --platform ios
```
