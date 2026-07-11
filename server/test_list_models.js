require('dotenv').config();
const axios = require('axios');

const run = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    res.data.models.forEach(m => console.log(m.name));
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
};

run();
