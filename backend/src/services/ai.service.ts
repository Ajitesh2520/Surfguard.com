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
  const randomIndex = Math.floor(Math.random() * ALLOWED_CATEGORIES.length);
  return ALLOWED_CATEGORIES[randomIndex];
}
