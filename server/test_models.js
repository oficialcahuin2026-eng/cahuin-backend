require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const run = async () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-1.5-pro-latest'];
  
  for (const m of models) {
    try {
      console.log("Trying model:", m);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Hola, dime solo la palabra 'SI'");
      console.log("Success with", m, ":", result.response.text());
      break;
    } catch (e) {
      console.log("Failed", m, e.message);
    }
  }
};

run();
