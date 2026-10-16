require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/database");

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set to a private value of at least 32 characters.");
  }

  await connectDatabase(process.env.MONGO_URI);
  app.listen(port, () => {
    console.log(`Student Result Management System running at http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer().catch(error => {
    console.error("Startup error:", error.message);
    process.exit(1);
  });
}
