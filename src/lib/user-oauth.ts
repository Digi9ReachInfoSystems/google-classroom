import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export function createUserOAuthClient(tokens: any): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

export function getClassroomWithUserAuth(oauth2Client: OAuth2Client) {
  return google.classroom({ version: 'v1', auth: oauth2Client });
}
