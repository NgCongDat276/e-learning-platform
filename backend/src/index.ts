import "dotenv/config";
import app from "./app";
import { envConfig } from "./config/env.config";

const PORT = envConfig.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
