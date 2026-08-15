/**
 * Google Drive API v3 Client for User Video Storage
 * Scope: https://www.googleapis.com/auth/drive.file
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: any }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export interface GoogleDriveVideo {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  streamUrl: string;
}

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '106453966043540983741';

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let driveAccessToken: string | null = localStorage.getItem('tb_gdrive_token');

export function getStoredDriveToken(): string | null {
  return driveAccessToken || localStorage.getItem('tb_gdrive_token');
}

export function isDriveConnected(): boolean {
  return Boolean(getStoredDriveToken());
}

export function disconnectDrive(): void {
  driveAccessToken = null;
  localStorage.removeItem('tb_gdrive_token');
}

/**
 * Initiates Google OAuth2 popup to connect Google Drive
 */
export function connectGoogleDrive(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services SDK is still loading. Please try again in a moment.'));
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.access_token) {
            driveAccessToken = response.access_token;
            localStorage.setItem('tb_gdrive_token', response.access_token);
            resolve(response.access_token);
          } else {
            reject(new Error(response.error || 'Failed to obtain Google Drive access token'));
          }
        },
        error_callback: (err) => {
          reject(err);
        },
      });

      client.requestAccessToken();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Creates or gets the dedicated "TeleBook Videos" folder in Google Drive
 */
export async function getOrCreateTeleBookFolder(token: string): Promise<string | null> {
  try {
    // Search for existing folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and name='TeleBook Videos' and trashed=false&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Create new folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'TeleBook Videos',
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Video uploads and reels from TeleBook Telegram Mini App',
      }),
    });

    if (createRes.ok) {
      const folder = await createRes.json();
      return folder.id;
    }
  } catch (err) {
    console.warn('Folder creation warning:', err);
  }
  return null;
}

/**
 * Uploads a video file directly to user's Google Drive via multipart upload
 */
export async function uploadVideoToGoogleDrive(
  file: File | Blob,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<GoogleDriveVideo> {
  let token = getStoredDriveToken();
  if (!token) {
    token = await connectGoogleDrive();
  }

  const folderId = await getOrCreateTeleBookFolder(token);

  const metadata = {
    name: fileName || `telebook_video_${Date.now()}.mp4`,
    mimeType: file.type || 'video/mp4',
    description: 'Uploaded via TeleBook Telegram Mini App',
    ...(folderId ? { parents: [folderId] } : {}),
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const fileArrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(fileArrayBuffer);

  const metadataBlob = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    delimiter,
    `Content-Type: ${file.type || 'video/mp4'}\r\n`,
    'Content-Transfer-Encoding: base64\r\n\r\n',
  ]);

  // Convert array buffer to base64 for reliable binary transfer in browser
  let binary = '';
  const len = fileBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(fileBytes[i]);
  }
  const base64Data = btoa(binary);

  const fullPayload = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    delimiter,
    `Content-Type: ${file.type || 'video/mp4'}\r\n\r\n`,
    file,
    closeDelimiter,
  ]);

  if (onProgress) onProgress(40);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: fullPayload,
    }
  );

  if (onProgress) onProgress(75);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive upload failed (${res.status}): ${errText}`);
  }

  const uploadedFile = await res.json();

  // Make the file publicly viewable by anyone with link so it streams in Reels/Stories
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFile.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Share permission warning:', permErr);
  }

  if (onProgress) onProgress(100);

  // Fast direct streamable link formats
  const streamUrl =
    uploadedFile.webContentLink ||
    `https://drive.google.com/uc?export=download&id=${uploadedFile.id}`;

  return {
    id: uploadedFile.id,
    name: uploadedFile.name,
    mimeType: uploadedFile.mimeType,
    size: uploadedFile.size ? parseInt(uploadedFile.size, 10) : undefined,
    webViewLink: uploadedFile.webViewLink,
    webContentLink: uploadedFile.webContentLink,
    thumbnailLink: uploadedFile.thumbnailLink,
    createdTime: uploadedFile.createdTime,
    streamUrl,
  };
}

/**
 * Lists user's video files from Google Drive
 */
export async function listGoogleDriveVideos(): Promise<GoogleDriveVideo[]> {
  const token = getStoredDriveToken();
  if (!token) return [];

  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=mimeType contains 'video/' and trashed=false&orderBy=createdTime desc&fields=files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime)&pageSize=30`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        disconnectDrive();
      }
      return [];
    }

    const data = await res.json();
    const files = data.files || [];

    return files.map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size ? parseInt(f.size, 10) : undefined,
      webViewLink: f.webViewLink,
      webContentLink: f.webContentLink,
      thumbnailLink: f.thumbnailLink,
      createdTime: f.createdTime,
      streamUrl:
        f.webContentLink ||
        `https://drive.google.com/uc?export=download&id=${f.id}`,
    }));
  } catch (err) {
    console.warn('List Drive videos error:', err);
    return [];
  }
}

/**
 * Deletes a video file from Google Drive
 */
export async function deleteGoogleDriveVideo(fileId: string): Promise<boolean> {
  const token = getStoredDriveToken();
  if (!token) return false;

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok || res.status === 204;
  } catch (err) {
    console.warn('Delete Drive video error:', err);
    return false;
  }
}
