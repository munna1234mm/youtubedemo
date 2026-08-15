import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Ensure persistent data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/* ── Persistent Database Schema ── */
interface StoredVideo {
  id: string;
  title: string;
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorUsername: string;
  storageProvider: 'gcs' | 'local_cdn';
  bucket?: string;
}

interface RegisteredUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  starsCount: number;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  isOnline?: boolean;
  lastSeen?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  mediaUrl?: string;
  starsSent?: number;
}

interface DbData {
  videos: StoredVideo[];
  users: RegisteredUser[];
  messages: ChatMessage[];
  posts: any[];
}

function loadDb(): DbData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading db.json, using defaults:', err);
  }

  return {
    videos: [],
    users: [
      {
        id: 'user_munna',
        name: 'Developer Munna',
        username: 'BD_Shopee',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Building on TON & Telegram WebApps 🚀 Tech & Digital Creator',
        isVerified: true,
        isPremium: true,
        starsCount: 1420,
        followersCount: 3840,
        followingCount: 512,
        friendsCount: 684,
        isOnline: true,
      },
    ],
    messages: [],
    posts: [],
  };
}

let db: DbData = loadDb();

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

// Google Cloud Storage credentials
const DEFAULT_GCS_CREDENTIALS = {
  type: "service_account",
  project_id: "unique-caldron-471907-e0",
  private_key_id: "8c693db0723d30643b7328c74bad45eab26916af",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCn0foyLvKUdaju\nA5b1YF0PUahfd3elCxWJhnAyO8hASuxhTkfpdWdqJqt5RWTE1RXyNQ5NWMbteA1o\nt6+Ll2CmUzt/eYS5e+xkdE7Y+UEkYeXjE9WmsC4jGqocBAEldC/EXkH7AJSc5C71\nUqNK0DsJpjzQLErzl0hnvZnHsHd8K3shfz7+IeIkiW1zawDQ9y+cJV7rlp8GpcPk\nmeZDaqctWH+0igIcOLjho5qW2dZ777tAnnYl0MaQLV6MWx07r8u6t/298OzhzFfN\n3CKEMhpY/uMMoHsulmK+gIqNcVFXIAeNweyglpGqepV/hmijBNXH/K/xkjNF/Nck\nxFM4aMazAgMBAAECggEACOVnWAhHreZsBvkwvbj9TExKjfKYaJE+wIepMR7pkO+7\nBraug2n78Lm0QFCVGwWl5q0fIRGFZhEFoPLC/wLbMD+PeV5Y0oS6G/vtMn183jyR\nG6lkm4DEyVgznIDH1yzvQhkYpU4hrD/aXDQ+JlkFScMpGR30xGOIho6B9UuqlQeB\nEAFIIHyqsjHqprYa71ARLKfb/tBm79NX5CCrbmFhhh9IqCuAw2B05LHXiNblLjt0\nX7gz6sWceafqIANisvNQEo+qsA8yyUIH2bUPcgURpeR8pqww2Ym0RPKOblD+ebqJ\nJwOHopjijeCsd6ddumd5VjzuH/JrRP4NTY1c5RYTaQKBgQDQcwegwmaFd5dQBW/2\nzSEmAbSqfhG7xS0B+zjkXwGM4y0pvqoJLkkmGALE8RefZbLrXExn1hVHiJ/JgI3X\n2dW1qIG2lof/yyokw0bCCVq7dU8tZdzf8Uyr2Lb24+gd9lG3LputKWWltcesi3q4\nUtpA4yDuohd8c1QYq4whd8gCiQKBgQDOGkyanhdeyxGMAuhXTh73tcpyIe4S5KIr\nQiOitJ92TctOkqvm4nu1VhFiOUe260ZW6Z7UMgqW77VUvIUdXAtd/iENWd17kVK3\n/nutjT9efov7ezYYEoe1LyoHYHM/5WZITJazJYko0zSeshtmfpq9RE8hoyYl/s+/\nXWW661jgWwKBgDCkNwp3cq8Aaim9KxRfZ7XTvhHu2zqC127X7b20wcrblEVifZEo\n4N7nyXWlgMqsU6UCY73zQgHwSsEdo3vUFD+Qs7wkwlWZVhtACjnrLuYBiNliJLmJ\nOEf9iSxxoE+llAn38VHmEBcsJQ0JeziZ9N4hYiTtZCehTeV32npQ1jZpAoGBAIEL\ngm9FEQjvSLtLjsIrTcR3dJxlljUKJmfDb6COS1G9f9BgkXVs1VxC2XuQtdBYG6CL\ngkEGXA8JY5X8u7QYT524YmWDoOOfqBVAJ5wQ1l6KCYeaK9KCt6nAMCaSQ1b8gUA/\nhBQDKo//PfEnP3S7TJO403sSNe6QTu9YwTt55BoFAoGAUG1QgQh+yovZJJL1v/VF\n2AkB2vvWEdz1e6gbslFecp0ObgUma59I3X1XGXGEDRADnOFcSqCgPryZvSIHtNS3\nCG0zKZxPwTNY/3lyuWvedN6FT9AVAsUNVHse019bqZEtrFKpQ4k3csQ2qLZH215z\nSHSW5g35aWFwfqVOOXTjFzw=\n-----END PRIVATE KEY-----\n",
  client_email: "developermunna@unique-caldron-471907-e0.iam.gserviceaccount.com",
  client_id: "106453966043540983741",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/developermunna%40unique-caldron-471907-e0.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

let storageClient: Storage | null = null;
function getStorageClient(): Storage | null {
  if (storageClient) return storageClient;
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      storageClient = new Storage({
        projectId: credentials.project_id || process.env.GCS_PROJECT_ID || DEFAULT_GCS_CREDENTIALS.project_id,
        credentials,
      });
      return storageClient;
    }
    storageClient = new Storage({
      projectId: DEFAULT_GCS_CREDENTIALS.project_id,
      credentials: {
        client_email: DEFAULT_GCS_CREDENTIALS.client_email,
        private_key: DEFAULT_GCS_CREDENTIALS.private_key,
      },
    });
    return storageClient;
  } catch (err) {
    console.warn('GCS client init notice:', err);
    return null;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

/* ── API Endpoints ── */

// 1. Videos API
app.get('/api/videos', (req, res) => {
  const totalBytes = db.videos.reduce((acc, v) => acc + (v.size || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  res.json({
    success: true,
    videos: db.videos,
    stats: {
      count: db.videos.length,
      totalMB: `${totalMB} MB`,
      bucket: process.env.GCS_BUCKET_NAME || 'telebook-user-videos',
      storageProvider: 'Cloud Storage',
    },
  });
});

app.post('/api/upload/video', upload.single('video'), async (req, res) => {
  try {
    let videoBuffer: Buffer | null = null;
    let fileName = `vid_${Date.now()}_${Math.floor(Math.random() * 10000)}.mp4`;
    let mimeType = 'video/mp4';
    let size = 0;
    const title = req.body?.title || 'User Video Reel';
    const authorId = req.body?.authorId || 'user_me';
    const authorName = req.body?.authorName || 'TeleBook User';
    const authorAvatar = req.body?.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    const authorUsername = req.body?.authorUsername || 'user';

    if (req.file) {
      videoBuffer = req.file.buffer;
      fileName = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      mimeType = req.file.mimetype;
      size = req.file.size;
    }

    if (req.body?.videoUrl && !videoBuffer) {
      const newVideo: StoredVideo = {
        id: `vid_${Date.now()}`,
        title,
        url: req.body.videoUrl,
        fileName: req.body.fileName || 'web_video.mp4',
        size: 5000000,
        mimeType: 'video/mp4',
        uploadedAt: new Date().toISOString(),
        authorId,
        authorName,
        authorAvatar,
        authorUsername,
        storageProvider: 'gcs',
        bucket: process.env.GCS_BUCKET_NAME || 'telebook-user-videos',
      };
      db.videos.unshift(newVideo);
      saveDb();
      return res.json({ success: true, video: newVideo });
    }

    if (!videoBuffer) {
      return res.status(400).json({ error: 'No video file or payload provided' });
    }

    let publicUrl = '';
    const storage = getStorageClient();
    const bucketName = process.env.GCS_BUCKET_NAME || 'telebook-user-videos';

    if (storage && bucketName) {
      try {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(`videos/${fileName}`);
        await file.save(videoBuffer, {
          metadata: { contentType: mimeType, cacheControl: 'public, max-age=31536000' },
        });
        publicUrl = `https://storage.googleapis.com/${bucketName}/videos/${fileName}`;
      } catch {
        publicUrl = `data:${mimeType};base64,${videoBuffer.toString('base64')}`;
      }
    } else {
      publicUrl = `data:${mimeType};base64,${videoBuffer.toString('base64')}`;
    }

    const storedItem: StoredVideo = {
      id: `vid_${Date.now()}`,
      title,
      url: publicUrl,
      fileName,
      size,
      mimeType,
      uploadedAt: new Date().toISOString(),
      authorId,
      authorName,
      authorAvatar,
      authorUsername,
      storageProvider: storage ? 'gcs' : 'local_cdn',
      bucket: bucketName,
    };

    db.videos.unshift(storedItem);
    saveDb();

    res.json({
      success: true,
      message: 'Video published successfully',
      video: storedItem,
    });
  } catch (error: any) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Failed to upload video', details: error.message });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  const { id } = req.params;
  const index = db.videos.findIndex((v) => v.id === id);
  if (index >= 0) {
    db.videos.splice(index, 1);
    saveDb();
  }
  res.json({ success: true, message: 'Video deleted', id });
});

// 2. Users & Auth API (Dual Telegram & Email/Password Sign Up)
app.get('/api/users', (req, res) => {
  const now = Date.now();
  const usersWithOnlineStatus = (db.users || []).map((u: any) => ({
    ...u,
    isOnline: Boolean(u.lastActive && now - u.lastActive < 60000) || u.isOnline || false,
    lastSeen: u.lastActive ? new Date(u.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
  }));
  res.json({ success: true, users: usersWithOnlineStatus });
});

// Heartbeat to keep user live/online
app.post('/api/users/heartbeat', (req, res) => {
  const { userId } = req.body;
  if (userId) {
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      (user as any).lastActive = Date.now();
      (user as any).isOnline = true;
      saveDb();
    }
  }
  res.json({ success: true });
});

// Register with Email/Password or Custom Profile
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, username, avatar, bio } = req.body;
  if (!name || (!email && !username)) {
    return res.status(400).json({ error: 'Name and email or username are required' });
  }

  const cleanUsername = (username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '');
  const existing = db.users.find((u: any) => (email && u.email === email) || u.username === cleanUsername);

  if (existing) {
    (existing as any).lastActive = Date.now();
    (existing as any).isOnline = true;
    saveDb();
    return res.json({ success: true, user: existing, message: 'Existing account found' });
  }

  const newUser: any = {
    id: `u_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    email: email || '',
    password: password || '',
    username: cleanUsername,
    avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: bio || 'TeleBook Member 🚀',
    isVerified: false,
    isPremium: false,
    starsCount: 100,
    followersCount: 0,
    followingCount: 0,
    friendsCount: 0,
    isOnline: true,
    lastActive: Date.now(),
    authProvider: email ? 'email' : 'telegram',
  };

  db.users.unshift(newUser);
  saveDb();
  res.json({ success: true, user: newUser });
});

// Login (Email or Telegram manual login)
app.post('/api/auth/login', (req, res) => {
  const { email, password, telegramUser } = req.body;

  if (telegramUser) {
    const tgId = `tg_${telegramUser.id}`;
    let user = db.users.find((u) => u.id === tgId || u.username === telegramUser.username);
    if (!user) {
      user = {
        id: tgId,
        name: `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim() || 'Telegram User',
        username: telegramUser.username || `tg_user_${telegramUser.id}`,
        avatar: telegramUser.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Connected with Telegram ✈️',
        isVerified: true,
        isPremium: Boolean(telegramUser.is_premium),
        starsCount: 250,
        followersCount: 15,
        followingCount: 5,
        friendsCount: 10,
      };
      db.users.unshift(user);
    }
    (user as any).lastActive = Date.now();
    (user as any).isOnline = true;
    saveDb();
    return res.json({ success: true, user });
  }

  if (email && password) {
    const user = db.users.find((u: any) => u.email === email && (!u.password || u.password === password));
    if (user) {
      (user as any).lastActive = Date.now();
      (user as any).isOnline = true;
      saveDb();
      return res.json({ success: true, user });
    }
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.status(400).json({ error: 'Invalid login credentials' });
});

app.post('/api/users', (req, res) => {
  const user = req.body;
  if (!user || !user.id) return res.status(400).json({ error: 'Invalid user' });

  const existingIdx = db.users.findIndex((u) => u.id === user.id);
  if (existingIdx >= 0) {
    db.users[existingIdx] = { 
      ...db.users[existingIdx], 
      ...user, 
      isOnline: true,
      lastActive: Date.now() 
    };
  } else {
    db.users.unshift({
      id: user.id,
      name: user.name || 'TeleBook Member',
      username: user.username || 'user',
      avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: user.bio || '',
      isVerified: user.isVerified || false,
      isPremium: user.isPremium || false,
      starsCount: user.starsCount || 0,
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      friendsCount: user.friendsCount || 0,
      isOnline: true,
      lastActive: Date.now(),
    });
  }
  saveDb();
  res.json({ success: true, users: db.users });
});

// 3. Messages API
app.get('/api/messages', (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) return res.json({ success: true, messages: db.messages });

  const thread = db.messages.filter(
    (m) =>
      (m.senderId === user1 && m.receiverId === user2) ||
      (m.senderId === user2 && m.receiverId === user1)
  );
  res.json({ success: true, messages: thread });
});

app.post('/api/messages', (req, res) => {
  const { senderId, receiverId, text, mediaUrl, starsSent } = req.body;
  if (!senderId || !receiverId || (!text && !mediaUrl && !starsSent)) {
    return res.status(400).json({ error: 'Invalid message payload' });
  }

  const newMsg: ChatMessage = {
    id: `msg_${Date.now()}`,
    senderId,
    receiverId,
    text: text || '',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isRead: true,
    mediaUrl,
    starsSent,
  };

  db.messages.push(newMsg);
  saveDb();
  res.json({ success: true, message: newMsg });
});

// 4. Posts API (Global Social Feed, Comments & Reactions)
app.get('/api/posts', (req, res) => {
  res.json({ success: true, posts: db.posts });
});

app.post('/api/posts', (req, res) => {
  const post = req.body;
  if (!post) return res.status(400).json({ error: 'Invalid post' });

  const newPost = {
    id: post.id || `post_${Date.now()}`,
    ...post,
    timestamp: 'Just now',
    comments: post.comments || [],
    commentsCount: post.commentsCount || 0,
    likesCount: post.likesCount || 0,
    reactionsSummary: post.reactionsSummary || {},
  };

  db.posts.unshift(newPost);
  saveDb();
  res.json({ success: true, post: newPost });
});

// React on any post
app.post('/api/posts/:id/react', (req, res) => {
  const { id } = req.params;
  const { reactionType, diff, summary } = req.body;

  const post = db.posts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  post.likesCount = Math.max(0, (post.likesCount || 0) + (diff || 0));
  if (summary) {
    post.reactionsSummary = summary;
  }

  saveDb();
  res.json({ success: true, post });
});

// Add comment to any post
app.post('/api/posts/:id/comment', (req, res) => {
  const { id } = req.params;
  const { user, text, image, parentCommentId } = req.body;

  const post = db.posts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (!post.comments) post.comments = [];

  const newComment = {
    id: `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    isPremium: user.isPremium || false,
    text: text || '',
    image: image || undefined,
    timestamp: 'Just now',
    likesCount: 0,
    isLiked: false,
    replies: [],
  };

  if (parentCommentId) {
    const parent = post.comments.find((c: any) => c.id === parentCommentId);
    if (parent) {
      if (!parent.replies) parent.replies = [];
      parent.replies.push(newComment);
    } else {
      post.comments.push(newComment);
    }
  } else {
    post.comments.push(newComment);
  }

  post.commentsCount = (post.commentsCount || 0) + 1;
  saveDb();
  res.json({ success: true, post, comment: newComment });
});

// Start server with Vite middleware in dev & static dist in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TeleBook Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
