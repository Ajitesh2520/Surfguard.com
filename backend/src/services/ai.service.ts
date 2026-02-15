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
  const prompt = `
You are a website classification engine.

Classify the following website domain into ONE of these categories ONLY:
${ALLOWED_CATEGORIES.join(", ")}

Domain: ${domain}

Return ONLY the category name.
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0
  });

  const category = response.choices[0].message.content?.trim();

  if (!ALLOWED_CATEGORIES.includes(category as any)) {
    return "Uncategorized";
  }

  return category!;
}
