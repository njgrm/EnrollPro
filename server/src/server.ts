import 'dotenv/config';

// Set process timezone to Manila
process.env.TZ = 'Asia/Manila';

import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
