import { google } from 'googleapis';
import { verifyAuthToken } from './auth';

/**
 * Refreshes an expired OAuth token using the refresh token
 */
export async function refreshOAuthToken(refreshToken: string) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    // This will automatically refresh the access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      success: true,
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || refreshToken, // Keep existing refresh token if new one not provided
      expiryDate: credentials.expiry_date
    };
  } catch (error: any) {
    console.error('Token refresh failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Checks if a token is expired and refreshes it if needed
 */
export async function ensureValidToken(accessToken: string, refreshToken: string | undefined) {
  if (!refreshToken) {
    return {
      success: false,
      error: 'No refresh token available',
      needsReauth: true
    };
  }

  try {
    // Create OAuth2 client to test the token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    // Test the token by making a simple API call
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    await oauth2.userinfo.get();

    // Token is still valid
    return {
      success: true,
      accessToken,
      refreshToken,
      needsRefresh: false
    };

  } catch (error: any) {
    console.log('Token appears to be expired, attempting refresh...');
    
    // Token is expired, try to refresh
    const refreshResult = await refreshOAuthToken(refreshToken);
    
    if (refreshResult.success) {
      return {
        success: true,
        accessToken: refreshResult.accessToken,
        refreshToken: refreshResult.refreshToken,
        needsRefresh: true
      };
    } else {
      return {
        success: false,
        error: refreshResult.error,
        needsReauth: true
      };
    }
  }
}

/**
 * Middleware to ensure valid OAuth tokens for API routes
 */
export async function withValidOAuth(req: Request) {
  try {
    const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
        status: 401
      };
    }

    const payload = verifyAuthToken(token);
    if (!payload || !payload.accessToken) {
      return {
        success: false,
        error: 'Invalid or expired authentication token',
        status: 401
      };
    }

    // Ensure token is valid
    const tokenResult = await ensureValidToken(payload.accessToken, payload.refreshToken);
    
    if (!tokenResult.success) {
      return {
        success: false,
        error: tokenResult.error,
        needsReauth: tokenResult.needsReauth,
        status: 401
      };
    }

    return {
      success: true,
      payload: {
        ...payload,
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken
      },
      needsRefresh: tokenResult.needsRefresh
    };

  } catch (error: any) {
    console.error('OAuth validation error:', error);
    return {
      success: false,
      error: 'OAuth validation failed',
      status: 500
    };
  }
}
