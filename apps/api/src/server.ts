import "dotenv/config";
import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./infra/database";

const port = Number(process.env.PORT) || 4000;

async function start() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  await connectDatabase();

  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`SurfGuard API listening on port ${port}`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDatabase();
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}

void start();
