const app = require('./src/app');
const connectDB = require('./src/DB/db');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
  });
});