import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// -------------------------------------------------------------
// Mongoose Models
// -------------------------------------------------------------

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const ResumeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  fileName: { type: String, required: true },
  ATSScore: { type: Number, required: true },
  extractedText: { type: String, required: true },
  analysisReport: { type: String, required: true }, // JSON Stringified detailed analysis
  uploadDate: { type: Date, default: Date.now },
});

// Avoid OverwriteModelError in Express dev environment
const UserMongooseModel = mongoose.models.User || mongoose.model("User", UserSchema);
const ResumeMongooseModel = mongoose.models.Resume || mongoose.model("Resume", ResumeSchema);

const UserModel: any = UserMongooseModel;
const ResumeModel: any = ResumeMongooseModel;

// -------------------------------------------------------------
// MongoDB Connection Handling & Dual Mode Detection
// -------------------------------------------------------------

let useMongo = false;
const MONGO_URI = process.env.MONGODB_URI || "";

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("MongoDB connected successfully.");
      useMongo = true;
    })
    .catch((err) => {
      console.error("MongoDB connection error, falling back to local file JSON database:", err);
      useMongo = false;
    });
} else {
  console.log("No MONGODB_URI found. AI Resume Analyzer running with dynamic local JSON-file storage fallback.");
}

// -------------------------------------------------------------
// Local JSON File Database Mock Handler (Graceful Fallback)
// -------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, "users.json");
const RESUMES_FILE = path.join(DATA_DIR, "resumes.json");

const loadLocalData = (filePath: string): any[] => {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content || "[]");
  } catch (error) {
    console.error(`Error reading database file: ${filePath}`, error);
    return [];
  }
};

const saveLocalData = (filePath: string, data: any[]): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing database file: ${filePath}`, error);
  }
};

// -------------------------------------------------------------
// Unified Database Interface Service Layer (Seamless CRUD)
// -------------------------------------------------------------

export const dbService = {
  // Check backend status
  getDbMode: () => {
    return useMongo ? "MongoDB Atlas" : "Local JSON Databases";
  },

  // USER CRUD
  findUserByEmail: async (email: string) => {
    if (useMongo) {
      return await UserModel.findOne({ email }).lean();
    } else {
      const users = loadLocalData(USERS_FILE);
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      return user ? { ...user, _id: user.id } : null;
    }
  },

  findUserById: async (id: string) => {
    if (useMongo) {
      const user = await UserModel.findById(id).lean();
      return user ? { ...user, id: user._id.toString() } : null;
    } else {
      const users = loadLocalData(USERS_FILE);
      const user = users.find((u) => u.id === id);
      return user ? { ...user, _id: user.id } : null;
    }
  },

  createUser: async (userData: any) => {
    if (useMongo) {
      const newUser = new UserModel(userData);
      const saved = await newUser.save();
      const obj = saved.toObject();
      return { ...obj, id: obj._id.toString() };
    } else {
      const users = loadLocalData(USERS_FILE);
      const id = "user_" + Math.random().toString(36).substring(2, 11);
      const newUser = { id, ...userData };
      users.push(newUser);
      saveLocalData(USERS_FILE, users);
      return { ...newUser, _id: id };
    }
  },

  // RESUME CRUD
  createResume: async (resumeData: any) => {
    if (useMongo) {
      const newResume = new ResumeModel(resumeData);
      const saved = await newResume.save();
      const obj = saved.toObject();
      return { ...obj, id: obj._id.toString() };
    } else {
      const resumes = loadLocalData(RESUMES_FILE);
      const id = "resume_" + Math.random().toString(36).substring(2, 11);
      const newResume = {
        id,
        uploadDate: new Date(),
        ...resumeData,
      };
      resumes.push(newResume);
      saveLocalData(RESUMES_FILE, resumes);
      return { ...newResume, _id: id };
    }
  },

  findResumesByUserId: async (userId: string) => {
    if (useMongo) {
      const list = await ResumeModel.find({ userId }).sort({ uploadDate: -1 }).lean();
      return list.map((item: any) => ({ ...item, id: item._id.toString() }));
    } else {
      const resumes = loadLocalData(RESUMES_FILE);
      return resumes
        .filter((r) => r.userId === userId)
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    }
  },

  findResumeById: async (id: string) => {
    if (useMongo) {
      const item = await ResumeModel.findById(id).lean();
      return item ? { ...item, id: item._id.toString() } : null;
    } else {
      const resumes = loadLocalData(RESUMES_FILE);
      const item = resumes.find((r) => r.id === id);
      return item || null;
    }
  },

  deleteResume: async (id: string, userId: string) => {
    if (useMongo) {
      const result = await ResumeModel.deleteOne({ _id: id, userId });
      return result.deletedCount > 0;
    } else {
      const resumes = loadLocalData(RESUMES_FILE);
      const initialLength = resumes.length;
      const filtered = resumes.filter((r) => !(r.id === id && r.userId === userId));
      saveLocalData(RESUMES_FILE, filtered);
      return filtered.length < initialLength;
    }
  },
};
