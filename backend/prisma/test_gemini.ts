import dotenv from 'dotenv';
dotenv.config();
import { genAI } from '../src/lib/gemini.js';

async function testGeminiDirect() {
  console.log('=== TESTING GEMINI DIRECT CALL ===');
  console.log('API Key length:', (process.env.GEMINI_API_KEY || '').length);
  
  const modelName = 'gemini-2.5-flash-lite';
  console.log(`Using model: ${modelName}`);

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = 'Halo! Saya adalah ibu hamil trimester 2, berikan tips singkat agar stamina saya tetap bugar hari ini. Gunakan sapaan Bunda dan jawab dalam 2 kalimat.';
    
    console.log(`Sending prompt: "${prompt}"`);
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    console.log('\n--- Gemini Response ---');
    console.log(text);
    console.log('-----------------------');
    console.log('✔ Direct Gemini call SUCCESS!');
  } catch (error: any) {
    console.error('❌ Direct Gemini call FAILED:', error.message || error);
  }
}

testGeminiDirect();
