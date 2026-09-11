import app from "./app.js";
import { env } from "./config/env.config.js";
import { logger } from "./utils/logger.utils.js";

app.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT}`);
});
