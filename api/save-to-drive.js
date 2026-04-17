import { google } from 'googleapis';

  export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          type: "service_account",
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
        },
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      const drive = google.drive({ version: 'v3', auth });
      const plannerData = req.body;

      const file = await drive.files.create({
        requestBody: {
          name: `planner-${new Date().toISOString().split('T')[0]}.json`
        },
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(plannerData, null, 2)
        }
      });

      res.status(200).json({
        success: true,
        fileId: file.data.id,
        message: 'Google Drive에 저장되었습니다!'
      });

    } catch (error) {
      console.error('Google Drive 저장 실패:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
