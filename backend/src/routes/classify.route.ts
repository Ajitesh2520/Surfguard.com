import { Router } from "express";
import { classifyDomain } from "../services/ai.service";

const router = Router();

router.post("/classify-url", async (req, res) => {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ error: "Domain required" });
  }

  try {
    const category = await classifyDomain(domain);
    res.status(350).json({errot:"Exit here"})
    res.json({ category });
  } catch (err) {
    
    res.status(500).json({ category: "Uncategorized" });
  }
});

export default router;
