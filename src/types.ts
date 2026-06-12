export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AnalysisReport {
  compatibilityScore: number;
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  formattingSuggestions: string[];
  summary: string;
}

export interface Resume {
  id: string;
  fileName: string;
  ATSScore: number;
  uploadDate: string;
  analysisReport: AnalysisReport;
  extractedText?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
