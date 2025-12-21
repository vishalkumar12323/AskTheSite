import { app } from "./app";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  console.log(`API running on port ${env.PORT}`);
});
