# NutriSnap

NutriSnap is an AI-powered meal analyzer. Snap a photo of your food and instantly get a full nutrition breakdown — calories, protein, carbs, fats, fiber, and key vitamins & minerals — along with a 0–100 health score, practical dietary advice, and healthier alternatives. It ships as a React Native app backed by an Express API that analyzes images with a Groq vision model through LangChain.

## Demo

<p align="center">
  <img src="docs/demo.gif" alt="NutriSnap demo" width="320"/>
</p>

## Features

- 📸 **Image Analysis** — upload meal photos for AI-powered nutritional analysis
- 🥗 **Nutrition Breakdown** — calories, protein, carbs, fats, fiber, and key vitamins & minerals
- 💯 **Health Score** — 0–100 rating with a personalized explanation
- 💡 **Health Advice** — AI-generated recommendations based on meal composition
- 🔄 **Alternative Suggestions** — healthier substitutes that keep a similar flavor profile
- 🔐 **Authentication** — Clerk sign-in/sign-up with email/password and Google OAuth
- 🎨 **Modern UI** — custom StyleSheet-based design system
- 📱 **Cross-Platform** — works on iOS and Android

## Tech Stack

### Mobile

- [Expo](https://expo.dev) with Expo Router
- TypeScript
- Clerk authentication
- Zod validation
- Custom StyleSheet-based design system

### Server

- [Bun](https://bun.sh/) runtime
- Express
- LangChain with Groq chat model
- Zod
- dotenv

## Flow

```text
sign in (Clerk) -> pick meal photo -> POST /api/aifood -> controller (Zod validation) -> AI service -> prompt -> ChatGroq structured output -> Zod parser -> markdown response -> app renders results
```

1. The user signs in through Clerk (email/password or Google) and picks a meal photo from the gallery.
2. The app sends the photo as base64 to `POST /api/aifood`. The controller validates the request with Zod and returns errors directly with raw status codes (`400` invalid request, `422` not food / invalid AI data, `500` server failure).
3. The AI service pipes the image through a LangChain prompt into the Groq vision model with structured output, then validates the result against a Zod nutrition schema.
4. The backend formats the validated analysis into a markdown message and returns it.
5. The app parses the response and renders the health score ring, macro rows, vitamin chips, and the AI advice.
