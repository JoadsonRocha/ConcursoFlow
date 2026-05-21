import { generateMindMap } from './server/services/gemini.js';
(async () => {
  try {
    const res = await generateMindMap("Matemática");
    console.log(res);
  } catch (err) {
    console.error("DEBUG ERR:", err);
  }
})();
