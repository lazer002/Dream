// env.js
//
// MUST be the first import in server.js. ES modules run their imports before
// the importing file's own code, so a `dotenv.config()` call inside server.js
// ran AFTER modules like utils/jwt.js had already read process.env (which made
// them fall back to default secrets). Importing this file first fixes that.

import dotenv from "dotenv";

dotenv.config();
