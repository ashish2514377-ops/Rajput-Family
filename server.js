// server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(__dirname, 'db.json');

// Ensure Uploads Directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(__dirname));

// Configure Multer storage for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

// Security Key
const JWT_SECRET = process.env.JWT_SECRET || 'rajput_royal_secret_token_123';

// ----------------------------------------------------
// DB CONNECTION: MongoDB or JSON File Fallback
// ----------------------------------------------------
let isMongoConnected = false;

// Mongoose Schemas (used if MongoDB is configured)
const SettingsSchema = new mongoose.Schema({
  aboutTitle: String,
  aboutIntro: String,
  aboutHistory: String,
  bannerTitle: String,
  bannerSubtitle: String,
  groupPhoto: String,
  contactPhone1: String,
  contactPhone2: String,
  contactEmail1: String,
  contactEmail2: String,
  residenceAddress: String,
  googleMapEmbed: String,
  facebookLink: String,
  twitterLink: String,
  instagramLink: String,
  galleryPassword: String,
  enableGalleryProtection: Boolean,
  visitorCount: Number
});

const MemberSchema = new mongoose.Schema({
  name: String,
  role: String,
  relationship: String,
  bio: String,
  photo: String
});

const AlbumSchema = new mongoose.Schema({
  name: String,
  description: String,
  isProtected: Boolean
});

const PhotoSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  imageUrl: String,
  date: String
});

const EventSchema = new mongoose.Schema({
  title: String,
  date: String,
  category: String,
  description: String
});

const TreeSchema = new mongoose.Schema({
  spouses: mongoose.Schema.Types.Mixed,
  children: mongoose.Schema.Types.Mixed
});

let SettingsModel, MemberModel, AlbumModel, PhotoModel, EventModel, TreeModel;

const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  try {
    mongoose.connect(MONGODB_URI);
    isMongoConnected = true;
    console.log("Mongoose connected to MongoDB.");
    
    // Register Models
    SettingsModel = mongoose.model('Settings', SettingsSchema);
    MemberModel = mongoose.model('Member', MemberSchema);
    AlbumModel = mongoose.model('Album', AlbumSchema);
    PhotoModel = mongoose.model('Photo', PhotoSchema);
    EventModel = mongoose.model('Event', EventSchema);
    TreeModel = mongoose.model('Tree', TreeSchema);
  } catch (err) {
    console.error("MongoDB failed to connect. Falling back to JSON Database.", err);
    isMongoConnected = false;
  }
} else {
  console.log("No MONGODB_URI specified in environment. Falling back to JSON Database (db.json).");
}

// ----------------------------------------------------
// JSON FILE-BASED DATABASE CONTROLLER (Fallback)
// ----------------------------------------------------
const defaultSettings = {
  aboutTitle: "A Legacy of Honor & Valor",
  aboutIntro: "For generations, the Rajput family has stood as a beacon of rich heritage, noble values, and cultural excellence in Rajasthan. From historical roots of chivalry to modern achievements in social advocate groups, technologies, and art, we carry our ancestors' virtues with pride.",
  aboutHistory: "Our lineage traces back to the royal clans of Mewar, known for their unwavering courage, artistic patronage, and deep love for the motherland. Today, we preserve this history by maintaining family historical havelis, supporting local artisans, and building paths for the generations to come.",
  bannerTitle: "The Rajput Family",
  bannerSubtitle: '"Honoring our timeless legacy, embracing a brilliant future."',
  groupPhoto: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200&auto=format&fit=crop",
  contactPhone1: "+91 98765 43210",
  contactPhone2: "+91 (294) 242 6789",
  contactEmail1: "info@rajputfamily.com",
  contactEmail2: "admin@rajputfamily.com",
  residenceAddress: "Rajput Heritage Haveli, City Palace Road, Udaipur, Rajasthan - 313001, India",
  googleMapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3628.79093836791!2d73.68112007604584!3d24.575727978116568!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3967e564d6dbdb3d%3A0xe54d90f23b7ff496!2sThe%20City%20Palace!5e0!3m2!1sen!2sin!4v1718610000000!5m2!1sen!2sin",
  facebookLink: "https://facebook.com",
  twitterLink: "https://twitter.com",
  instagramLink: "https://instagram.com",
  galleryPassword: "rajputgallery123",
  enableGalleryProtection: false,
  visitorCount: 1547
};

const defaultMembers = [
  {
    id: "m1",
    name: "Maharaja Ranveer Singh",
    role: "Patriarch & Military Veteran",
    relationship: "Grandparent",
    bio: "A visionary leader and retired military veteran. He is the custodian of the Rajput family heritage, values, and traditions.",
    photo: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: "m2",
    name: "Maharani Devika Devi",
    role: "Matriarch & Charity Leader",
    relationship: "Grandparent",
    bio: "The warm-hearted pillar of the family. She coordinates family events, keeps ancient culinary secrets, and leads local charity trusts.",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: "m3",
    name: "Kunwar Vikram Singh",
    role: "Managing Director of Hospitality",
    relationship: "Parent",
    bio: "Eldest son of Ranveer and Devika. He oversees the family's heritage hospitality projects, agro-ventures, and historical preservation efforts.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: "m4",
    name: "Kunwarani Gayatri Devi",
    role: "Social Advocate & Educator",
    relationship: "Parent",
    bio: "Wife of Vikram Singh. She runs educational institutions for underprivileged children and promotes traditional Rajasthani textiles.",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: "m5",
    name: "Rajkumari Aaradhya Rajput",
    role: "Digital Artist & Designer",
    relationship: "Child",
    bio: "Daughter of Vikram and Gayatri. Currently pursuing her Masters in Fine Arts. She blends traditional art styles with modern digital illustration.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: "m6",
    name: "Rajveer Singh Rajput",
    role: "Software Architect",
    relationship: "Child",
    bio: "Son of Vikram and Gayatri. Tech enthusiast, open-source contributor, and web developer. He built this digital home for the Rajput family.",
    photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop"
  }
];

const defaultAlbums = [
  { id: "all", name: "All Photos", description: "Browse all memories", isProtected: false },
  { id: "heritage", name: "Heritage", description: "Ancestral haveli and landmarks", isProtected: false },
  { id: "celebrations", name: "Celebrations", description: "Diwali, birthdays, and festivals", isProtected: false },
  { id: "family_life", name: "Family Life", description: "Candid tea times and daily dinners", isProtected: false },
  { id: "travel", name: "Travel", description: "Family excursions and desert camps", isProtected: false },
  { id: "private", name: "Royal Archive", description: "Confidential historical documents", isProtected: true }
];

const defaultPhotos = [
  {
    id: "p1",
    title: "Rajput Palace Heritage",
    description: "Our ancestral estate glowing in the warm gold light of sunset.",
    category: "heritage",
    imageUrl: "https://images.unsplash.com/photo-1598977123418-45f04b614133?q=80&w=800&auto=format&fit=crop",
    date: "2025-10-12"
  },
  {
    id: "p2",
    title: "Diwali Celebrations 2025",
    description: "The courtyard illuminated with thousands of traditional oil lamps.",
    category: "celebrations",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop",
    date: "2025-11-01"
  },
  {
    id: "p3",
    title: "The Grand Archway",
    description: "A close-up view of the hand-carved stone archways greeting guests.",
    category: "heritage",
    imageUrl: "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?q=80&w=800&auto=format&fit=crop",
    date: "2026-01-15"
  },
  {
    id: "p4",
    title: "Annual Family Reunion",
    description: "Gathered at the central gardens for our yearly summer lunch.",
    category: "family_life",
    imageUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800&auto=format&fit=crop",
    date: "2025-06-20"
  },
  {
    id: "p5",
    title: "Traditional Morning Tea",
    description: "Sharing laughter over cups of spiced masala chai in the veranda.",
    category: "family_life",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800&auto=format&fit=crop",
    date: "2026-03-05"
  },
  {
    id: "p6",
    title: "Desert Sunset Exploration",
    description: "Capturing the golden sand dunes shifting under the setting sun.",
    category: "travel",
    imageUrl: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=800&auto=format&fit=crop",
    date: "2026-02-18"
  },
  {
    id: "p7",
    title: "Ancestral Scroll Collection",
    description: "Mewar lineage transcripts preserved from the 18th century.",
    category: "private",
    imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop",
    date: "2025-04-10"
  }
];

const defaultEvents = [
  {
    id: "e1",
    title: "Maharaja Ranveer Singh's Birthday",
    date: `${new Date().getFullYear()}-07-12`,
    category: "birthday",
    description: "Pranam! Celebrating the golden jubilee of our patriarch with a traditional family gathering and lunch."
  },
  {
    id: "e2",
    title: "Vikram & Gayatri's Marriage Anniversary",
    date: `${new Date().getFullYear()}-08-25`,
    category: "anniversary",
    description: "Commemorating 30 years of companionship, wisdom, and leadership at our heritage lawn."
  },
  {
    id: "e3",
    title: "Annual Heritage Foundation Day",
    date: `${new Date().getFullYear()}-10-18`,
    category: "function",
    description: "Traditional haveli illumination ceremony followed by cultural Rajasthani folk dances and music."
  }
];

const defaultTree = {
  spouses: {
    "m1": "m2",
    "m2": "m1",
    "m3": "m4",
    "m4": "m3"
  },
  children: {
    "m1": ["m3"],
    "m2": ["m3"],
    "m3": ["m5", "m6"],
    "m4": ["m5", "m6"]
  }
};

function readLocalDb() {
  if (!fs.existsSync(DB_FILE)) {
    const freshDb = {
      settings: defaultSettings,
      members: defaultMembers,
      albums: defaultAlbums,
      photos: defaultPhotos,
      events: defaultEvents,
      tree: defaultTree
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(freshDb, null, 2));
    return freshDb;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (err) {
    console.error("Malformed db.json. Rebuilding standard configuration.");
    const freshDb = {
      settings: defaultSettings,
      members: defaultMembers,
      albums: defaultAlbums,
      photos: defaultPhotos,
      events: defaultEvents,
      tree: defaultTree
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(freshDb, null, 2));
    return freshDb;
  }
}

function writeLocalDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ----------------------------------------------------
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });
  
  const token = authHeader.split(' ')[1];
  if (token === JWT_SECRET) {
    next();
  } else {
    res.status(403).json({ message: "Invalid authorization token." });
  }
};

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongoDB: isMongoConnected });
});

// Admin Authentication API
app.post('/api/auth/login', (req, res) => {
  const { username, passcode } = req.body;
  if (username === 'admin' && passcode === 'rajput123') {
    res.json({ token: JWT_SECRET, email: 'admin@rajputfamily.com' });
  } else {
    res.status(401).json({ message: "Invalid username or security passcode." });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
  const token = authHeader.split(' ')[1];
  if (token === JWT_SECRET) {
    res.json({ email: 'admin@rajputfamily.com' });
  } else {
    res.status(401).json({ message: "Invalid session token." });
  }
});

// ----------------------------------------------------
// SETTINGS ENDPOINTS
// ----------------------------------------------------
app.get('/api/settings', async (req, res) => {
  if (isMongoConnected) {
    let doc = await SettingsModel.findOne();
    if (!doc) doc = await SettingsModel.create(defaultSettings);
    res.json(doc);
  } else {
    const db = readLocalDb();
    res.json(db.settings || defaultSettings);
  }
});

app.post('/api/settings', authMiddleware, async (req, res) => {
  const settingsData = req.body;
  if (isMongoConnected) {
    let doc = await SettingsModel.findOne();
    if (doc) {
      await SettingsModel.updateOne({}, settingsData);
    } else {
      await SettingsModel.create(settingsData);
    }
    res.json(settingsData);
  } else {
    const db = readLocalDb();
    db.settings = { ...db.settings, ...settingsData };
    writeLocalDb(db);
    res.json(db.settings);
  }
});

// ----------------------------------------------------
// FAMILY MEMBERS ENDPOINTS
// ----------------------------------------------------
app.get('/api/members', async (req, res) => {
  if (isMongoConnected) {
    const list = await MemberModel.find();
    res.json(list);
  } else {
    const db = readLocalDb();
    res.json(db.members || []);
  }
});

app.post('/api/members', authMiddleware, async (req, res) => {
  const memberData = req.body;
  if (isMongoConnected) {
    const newDoc = await MemberModel.create(memberData);
    res.json(newDoc);
  } else {
    const db = readLocalDb();
    const newMember = { id: "m_" + Date.now(), ...memberData };
    db.members.push(newMember);
    
    // Seed blank tree links
    if (!db.tree.children[newMember.id]) {
      db.tree.children[newMember.id] = [];
    }
    writeLocalDb(db);
    res.json(newMember);
  }
});

app.put('/api/members/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const memberData = req.body;
  if (isMongoConnected) {
    await MemberModel.findByIdAndUpdate(id, memberData);
    res.json({ id, ...memberData });
  } else {
    const db = readLocalDb();
    const idx = db.members.findIndex(m => m.id === id);
    if (idx !== -1) {
      db.members[idx] = { ...db.members[idx], ...memberData };
      writeLocalDb(db);
      res.json(db.members[idx]);
    } else {
      res.status(404).json({ message: "Member profile not found." });
    }
  }
});

app.delete('/api/members/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  if (isMongoConnected) {
    await MemberModel.findByIdAndDelete(id);
    res.json({ success: true });
  } else {
    const db = readLocalDb();
    db.members = db.members.filter(m => m.id !== id);
    
    // Clear lineage references
    delete db.tree.spouses[id];
    delete db.tree.children[id];
    for (const parent in db.tree.children) {
      db.tree.children[parent] = db.tree.children[parent].filter(cid => cid !== id);
    }
    for (const mid in db.tree.spouses) {
      if (db.tree.spouses[mid] === id) {
        delete db.tree.spouses[mid];
      }
    }
    writeLocalDb(db);
    res.json({ success: true });
  }
});

// ----------------------------------------------------
// PHOTO ALBUMS ENDPOINTS
// ----------------------------------------------------
app.get('/api/albums', async (req, res) => {
  if (isMongoConnected) {
    const list = await AlbumModel.find();
    res.json(list.length ? list : defaultAlbums);
  } else {
    const db = readLocalDb();
    res.json(db.albums || defaultAlbums);
  }
});

app.post('/api/albums', authMiddleware, async (req, res) => {
  const albumData = req.body;
  if (isMongoConnected) {
    const newDoc = await AlbumModel.create(albumData);
    res.json(newDoc);
  } else {
    const db = readLocalDb();
    const newAlbum = { id: albumData.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(), ...albumData };
    db.albums.push(newAlbum);
    writeLocalDb(db);
    res.json(newAlbum);
  }
});

app.delete('/api/albums/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  if (isMongoConnected) {
    await AlbumModel.findByIdAndDelete(id);
    res.json({ success: true });
  } else {
    const db = readLocalDb();
    db.albums = db.albums.filter(a => a.id !== id);
    writeLocalDb(db);
    res.json({ success: true });
  }
});

// ----------------------------------------------------
// PHOTOS ARCHIVE ENDPOINTS
// ----------------------------------------------------
app.get('/api/photos', async (req, res) => {
  if (isMongoConnected) {
    const list = await PhotoModel.find().sort({ date: -1 });
    res.json(list);
  } else {
    const db = readLocalDb();
    const photos = db.photos || [];
    res.json(photos.sort((a, b) => new Date(b.date) - new Date(a.date)));
  }
});

app.post('/api/photos', authMiddleware, async (req, res) => {
  const photoData = req.body;
  if (isMongoConnected) {
    const newDoc = await PhotoModel.create(photoData);
    res.json(newDoc);
  } else {
    const db = readLocalDb();
    const newPhoto = { id: "p_" + Date.now(), ...photoData };
    db.photos.push(newPhoto);
    writeLocalDb(db);
    res.json(newPhoto);
  }
});

app.delete('/api/photos/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  if (isMongoConnected) {
    await PhotoModel.findByIdAndDelete(id);
    res.json({ success: true });
  } else {
    const db = readLocalDb();
    db.photos = db.photos.filter(p => p.id !== id);
    writeLocalDb(db);
    res.json({ success: true });
  }
});

// ----------------------------------------------------
// EVENTS SCHEDULER ENDPOINTS
// ----------------------------------------------------
app.get('/api/events', async (req, res) => {
  if (isMongoConnected) {
    const list = await EventModel.find().sort({ date: 1 });
    res.json(list);
  } else {
    const db = readLocalDb();
    const events = db.events || [];
    res.json(events.sort((a, b) => new Date(a.date) - new Date(b.date)));
  }
});

app.post('/api/events', authMiddleware, async (req, res) => {
  const eventData = req.body;
  if (isMongoConnected) {
    const newDoc = await EventModel.create(eventData);
    res.json(newDoc);
  } else {
    const db = readLocalDb();
    const newEvent = { id: "e_" + Date.now(), ...eventData };
    db.events.push(newEvent);
    writeLocalDb(db);
    res.json(newEvent);
  }
});

app.put('/api/events/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const eventData = req.body;
  if (isMongoConnected) {
    await EventModel.findByIdAndUpdate(id, eventData);
    res.json({ id, ...eventData });
  } else {
    const db = readLocalDb();
    const idx = db.events.findIndex(e => e.id === id);
    if (idx !== -1) {
      db.events[idx] = { ...db.events[idx], ...eventData };
      writeLocalDb(db);
      res.json(db.events[idx]);
    } else {
      res.status(404).json({ message: "Event not scheduled." });
    }
  }
});

app.delete('/api/events/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  if (isMongoConnected) {
    await EventModel.findByIdAndDelete(id);
    res.json({ success: true });
  } else {
    const db = readLocalDb();
    db.events = db.events.filter(e => e.id !== id);
    writeLocalDb(db);
    res.json({ success: true });
  }
});

// ----------------------------------------------------
// FAMILY TREE LINEAGE ENDPOINTS
// ----------------------------------------------------
app.get('/api/tree', async (req, res) => {
  if (isMongoConnected) {
    let doc = await TreeModel.findOne();
    if (!doc) doc = await TreeModel.create(defaultTree);
    res.json(doc);
  } else {
    const db = readLocalDb();
    res.json(db.tree || defaultTree);
  }
});

app.post('/api/tree', authMiddleware, async (req, res) => {
  const treeData = req.body;
  if (isMongoConnected) {
    await TreeModel.updateOne({}, treeData);
    res.json(treeData);
  } else {
    const db = readLocalDb();
    db.tree = treeData;
    writeLocalDb(db);
    res.json(db.tree);
  }
});

// ----------------------------------------------------
// MEDIA UPLOAD FILE ROUTE
// ----------------------------------------------------
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file provided." });
  
  // Return the relative local path url parameter
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Serve frontend SPA routing fallbacks (catch-all)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Rajput Family Web Server is active on port: http://localhost:${PORT}`);
});
