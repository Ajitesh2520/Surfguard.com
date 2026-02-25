import OpenAI from "openai";


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ALLOWED_CATEGORIES = [
  "Education",
  "Entertainment",
  "Social Media",
  "Sports",
  "News",
  "Shopping",
  "Work",
  "Uncategorized"
];

export async function classifyDomain(domain: string): Promise<string> {
  console.log("control reaches here")
//   const prompt = `
// You are a website classification engine.

// Classify the following website domain into ONE of these categories ONLY:
// ${ALLOWED_CATEGORIES.join(", ")}

// Domain: ${domain}

// Return ONLY the category name.
// `;
 const prompt = `
Classify the following website domain into ONE of these categories ONLY:
${ALLOWED_CATEGORIES.join(", ")}
Domain: ${domain}
Return ONLY the category name.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0
    });

    const category = response.choices[0].message.content?.trim();
    console.log("AI response:", category);

    if (!ALLOWED_CATEGORIES.includes(category as any)) {
      return "Uncategorized";
    }

    return category!;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "Uncategorized";
  }
}
