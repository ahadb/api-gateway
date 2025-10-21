// Quick mock data service for testing
const express = require('express');
const app = express();

app.use(express.json());

app.get('/me', (req, res) => {
  res.json({
    id: 123,
    name: 'Test User',
    email: 'test@example.com',
    message: 'Mock data service working!'
  });
});

app.get('/*', (req, res) => {
  res.json({ 
    path: req.path,
    message: 'Mock data service received request' 
  });
});

const PORT = 8001;
app.listen(PORT, () => {
  console.log(`🔧 Mock data service running on port ${PORT}`);
});

