import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request, res: Response) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a professional nutritionist AI. 
Analyze the food in the given image and return the result in **two parts**:


1: JSON object of Nutrition Breakdowns with the following fields:  
   - Calories (kcal)  
   - Protein (g)  
   - Carbohydrates (g)  
   - Fat (g)  
   - Fiber (g)  
   - Key vitamins & minerals (if identifiable)  
   - Health Score (0-100) with short explanation.
  Make sure the JSON is valid and can be parsed.



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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${image}` },
            },
          ],
        },
      ],
    });

    console.log("response:", response);
    console.log("message:", response.choices[0].message.content);

    return Response.json({ message: response.choices[0].message.content });
  } catch (error) {
    console.error("Error fetching AI guidance:", error);
    return Response.json(
      { error: "Error fetching AI guidance" },
      { status: 500 },
    );
  }
}
