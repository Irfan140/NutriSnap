import { Router } from "express";
import Groq from "groq-sdk";
import { env } from "../config/env.js";

const router = Router();

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

const FOOD_ANALYSIS_PROMPT = `You are a professional nutritionist AI.
Analyze the food in the given image and return the result in **two parts**.

IMPORTANT: If the image does NOT contain food or a meal, respond ONLY with:
NOT_FOOD

If the image contains food, return:

1: A valid JSON object of Nutrition Breakdowns with the following fields:
   - Calories (kcal)
   - Protein (g)
   - Carbohydrates (g)
   - Fat (g)
   - Fiber (g)
   - Key vitamins & minerals (array of strings)
   - Health Score (0-100)
   - Health Score Explanation (string)
  Make sure the JSON is valid and can be parsed. Use only double quotes. No trailing commas.

2: Markdown text provides a structured report with the following sections:

    1. **Health Advice**
      - Is this meal generally healthy or not?
      - Specific advice depending on the nutrients (e.g., too much sugar, low in protein, etc.)
      - Who should eat with caution (e.g., people with diabetes, high blood pressure)?

    2. **Alternative Suggestions**
      - Suggest healthier substitutes or modifications for this dish.
      - Keep the same flavor profile if possible.

    3. **Summary**
      - A short summary

Format the answer in clear markdown with headers, lists, and bold highlights.
`;

router.post("/aifood", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      res.status(400).json({ error: "No image provided" });
      return;
    }

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: FOOD_ANALYSIS_PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${image}` },
            },
          ],
        },
      ],
    });

    const message = response.choices[0]?.message?.content;

    if (!message) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    if (message.trim() === "NOT_FOOD") {
      res.status(422).json({ error: "The image does not appear to contain food. Please upload a meal image." });
      return;
    }

    const jsonMatch = message.match(/```json([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        JSON.parse(jsonMatch[1].trim());
      } catch {
        res.status(422).json({ error: "AI returned invalid nutrition data. Please try again with a clearer food image." });
        return;
      }
    }

    res.json({ message });
  } catch (error) {
    console.error("Error fetching AI guidance:", error);
    res.status(500).json({ error: "Error fetching AI guidance" });
  }
});

export default router;
