const { google } = require('googleapis');
const projectId = 'gen-lang-client-0925764429';
const dbId = 'ai-studio-ef378564-20e2-44ad-ad66-d81251638619';

async function run() {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const authClient = await auth.getClient();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/test/connection`;
    console.log("Fetching", url);
    const res = await authClient.request({ url });
    console.log("Success:", res.data);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
