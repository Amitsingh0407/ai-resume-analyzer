import { GoogleGenAI, Type } from "@google/genai";
import * as pdfImport from "pdf-parse";

const pdf = (pdfImport as any).default || pdfImport;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
     
    },
  },
});

/**
 * Extracts raw text from an uploaded PDF file buffer.
 * Includes fallback logic to extract alphanumeric strings if parse fails.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    if (data && data.text) {
      return data.text.trim();
    }
    throw new Error("No text content found in PDF");
  } catch (error: any) {
    console.warn("pdf-parse failed, attempting fallback regex buffer text extraction:", error);
    // Fallback: simple extraction of readable characters from the binary stream if standard parser fails
    const cleanString = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    const lines = cleanString
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 3 && !l.includes("%PDF") && !l.match(/obj|endobj|stream/));
    
    if (lines.length > 5) {
      return lines.join("\n");
    }
    throw new Error("Failed to parse resume text. Please upload a structured text-based PDF.");
  }
}

/**
 * Sends extracted resume text together with an optional job description to Gemini.
 * Returns a typed JSON containing ATS compatibility, match score, missing keywords, strengths, and suggestions.
 */
export async function analyzeResumeWithGemini(
  resumeText: string,
  jobDescription?: string
): Promise<any> {
  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error("Empty resume transcript supplied for analysis.");
  }

  const jdText = jobDescription?.trim() || "General application for entry/mid-level software engineering or professional roles.";

  const prompt = `
Analyze the following resume transcript for ATS (Applicant Tracking System) compatibility.
Identify details based on professional standards and provide a compatibility score out of 100.

--- RESUME TEXT ---
${resumeText.substring(0, 12000)}

--- TARGET JOB SPECIFICATION / TARGET STANDARD ---
${jdText.substring(0, 3000)}

Analyze the content carefully and output a JSON response containing the target schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `
You are an expert technical recruiter and Senior ATS optimization consultant.
Evaluate resumes objectively. Ensure ATS compatibility calculation evaluates:
- Formatting: spacing, complex columns, tables, headers, and footer compatibility.
- Content: critical industry keywords, tool alignment, clear titles, metric-driven achievements, and clear sections.
- Missing skills: gaps compared to the target standards or modern industry definitions.

Return the response strictly inside the declared schema format. Do NOT wrap or output extra commentary.
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "compatibilityScore",
            "missingKeywords",
            "strengths",
            "weaknesses",
            "missingSkills",
            "formattingSuggestions",
            "summary"
          ],
          properties: {
            compatibilityScore: {
              type: Type.INTEGER,
              description: "ATS Compatibility Score between 0 and 100",
            },
            missingKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Important keywords/action verbs that are missing from the resume",
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Core strengths identified in the candidate's achievements",
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Gaps or issues in formatting or content holding back the resume",
            },
            missingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Technical or soft skills missing that would optimize ATS passing",
            },
            formattingSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Aesthetic or structure suggestions (e.g., dates, layouts, headers)",
            },
            summary: {
              type: Type.STRING,
              description: "A professional 2-3 sentence overview analysis report for the user",
            },
          },
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response output from Gemini analysis model");
    }

    return JSON.parse(textOutput.trim());
  } catch (error: any) {
    console.error("Gemini optimization model error:", error);
    // Robust fallback schema in case Gemini fails or responds with a different shape
    return {
      compatibilityScore: 65,
      missingKeywords: ["CI/CD", "Docker", "Agile Methodologies"],
      strengths: ["Clear structure", "Chronological experience presentation"],
      weaknesses: ["No quantified achievements (e.g., dollars, percentages)", "Vague summaries"],
      missingSkills: ["Cloud Platforms", "Automated Testing"],
      formattingSuggestions: ["List contact details in header text", "Use standardized bullets"],
      summary: `Unable to conduct dynamic AI analysis due to API constraints. Here is a simulated general evaluation: Standard structure, but could benefit from focusing on achievements over task lists. Error details: ${error.message || error}`,
    };
  }
}
