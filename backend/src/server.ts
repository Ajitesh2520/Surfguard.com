import express from "express";
import cors from "cors";
import classifyRoute from "./routes/classify.route";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", classifyRoute);

app.listen(4000, () => {
  console.log("AI backend running on port 4000");
});
