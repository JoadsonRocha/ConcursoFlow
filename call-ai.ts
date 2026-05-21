import * as gemini from './server/services/gemini.js';

async function run() {
  try {
    const res = await gemini.generateFlashcards("Direito Constitucional", 2);
    console.log(res);
  } catch (e) {
    console.error("ERROR CAUGHT", e);
  }
}

run();
