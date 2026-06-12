import { Router, Response } from "express";
import multer from "multer";
import { dbService } from "../db.js";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.js";
import { extractTextFromPDF, analyzeResumeWithGemini } from "../utils/resumeAnalyzer.js";

const router = Router();

// Configure safe memory-only multer context to parse PDF structures instantly
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Megabyte limit safeguard
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file attachment. Only PDF documents (.pdf) are supported."));
    }
  },
});

/**
 * @route POST /api/resume/upload
 * @desc Handle PDF attachment, extract, trigger Gemini analysis, save in db
 */
router.post(
  "/upload",
  authenticateToken as any,
  upload.single("resume"),
  async (req: any, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized endpoint request." });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "Please attach a PDF resume file." });
        return;
      }

      const jobDescription = req.body.jobDescription || "";
      const originalName = req.file.originalname;

      console.log(`Processing file execution: ${originalName} (size: ${req.file.size} bytes)...`);

      // 1. Core text extraction inside PDF
      let text = "";
      try {
        text = await extractTextFromPDF(req.file.buffer);
      } catch (pdfErr: any) {
        res.status(422).json({ error: `PDF Processing error: ${pdfErr.message || pdfErr}` });
        return;
      }

      if (!text || text.trim().length === 0) {
        res.status(422).json({
          error: "Unable to extract text from PDF. Ensure files are not encrypted, empty, or styled entirely with vector outlines.",
        });
        return;
      }

      console.log(`Extracted resume text segment of length: ${text.length}. Initiating Gemini ATS evaluation...`);

      // 2. ATS Analysis with Gemini
      const analysisReport = await analyzeResumeWithGemini(text, jobDescription);

      // 3. Save resume into local/Mongo storage adapter
      const newResume = await dbService.createResume({
        userId: req.user.id,
        fileName: originalName,
        ATSScore: analysisReport.compatibilityScore || 70,
        extractedText: text,
        analysisReport: JSON.stringify(analysisReport),
        uploadDate: new Date(),
      });

      res.status(201).json({
        message: "Resume processed and analyzed successfully",
        resume: {
          id: newResume.id || newResume._id,
          fileName: newResume.fileName,
          ATSScore: newResume.ATSScore,
          uploadDate: newResume.uploadDate,
          analysisReport,
        },
      });
    } catch (err: any) {
      console.error("General upload parsing exception:", err);
      res.status(500).json({
        error: `Unexpected system error during resume intake processes: ${err.message || err}`,
      });
    }
  }
);

/**
 * @route GET /api/resume/list
 * @desc Get resumes list for the connected user
 */
router.get("/list", authenticateToken as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Access unauthorized." });
      return;
    }

    const list = await dbService.findResumesByUserId(req.user.id);
    const simplified = list.map((resItem: any) => {
      let reportParsed = {};
      try {
        reportParsed = JSON.parse(resItem.analysisReport);
      } catch (e) {
        reportParsed = {};
      }

      return {
        id: resItem.id || resItem._id,
        fileName: resItem.fileName,
        ATSScore: resItem.ATSScore,
        uploadDate: resItem.uploadDate,
        analysisReport: reportParsed,
      };
    });

    res.status(200).json(simplified);
  } catch (error: any) {
    console.error("Failed to list active resumes:", error);
    res.status(500).json({ error: "Failed to reload uploaded resumes. Please try again." });
  }
});

/**
 * @route GET /api/resume/:id
 * @desc Get full analysis report for a specific resume
 */
router.get("/:id", authenticateToken as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Access unauthorized." });
      return;
    }

    const id = req.params.id;
    const resume = await dbService.findResumeById(id);

    if (!resume || resume.userId !== req.user.id) {
      res.status(404).json({ error: "Resume record not found." });
      return;
    }

    let reportParsed = {};
    try {
      reportParsed = JSON.parse(resume.analysisReport);
    } catch {
      reportParsed = {};
    }

    res.status(200).json({
      id: resume.id || resume._id,
      fileName: resume.fileName,
      ATSScore: resume.ATSScore,
      extractedText: resume.extractedText,
      uploadDate: resume.uploadDate,
      analysisReport: reportParsed,
    });
  } catch (error: any) {
    console.error("Failed to fetch detailed resume analysis:", error);
    res.status(500).json({ error: "Failed to locate report details." });
  }
});

/**
 * @route DELETE /api/resume/:id
 * @desc Delete uploaded resume entry
 */
router.delete("/:id", authenticateToken as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Access unauthorized." });
      return;
    }

    const id = req.params.id;
    const deleted = await dbService.deleteResume(id, req.user.id);

    if (!deleted) {
      res.status(404).json({ error: "Resume index not found or unauthorized to delete this copy." });
      return;
    }

    res.status(200).json({ message: "Resume removed successfully from record logs." });
  } catch (error: any) {
    console.error("Failure removing index record:", error);
    res.status(500).json({ error: "Server failed to process document deletion." });
  }
});

export default router;
