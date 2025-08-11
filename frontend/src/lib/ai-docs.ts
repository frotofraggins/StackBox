/**
 * AI Documents Frontend Library
 * Handles document upload, management, and AI analysis integration
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Document {
  key: string;
  filename: string;
  size: number;
  lastModified: string;
  source: 'email' | 'upload';
}

export interface DocumentList {
  tenantId: string;
  documents: Document[];
  count: number;
}

export interface UploadResult {
  message: string;
  tenantId: string;
  uploadedFiles: {
    filename: string;
    s3Key: string;
    size: number;
    contentType: string;
    uploadedAt: string;
  }[];
  count: number;
}

export interface AnalysisResult {
  tenantId: string;
  analysisDate: string;
  documentsAnalyzed: number;
  keyInsights: string[];
  industryMatch: string;
  confidence: number;
  recommendedCapabilities: {
    name: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }[];
  nextSteps: string[];
}

export class AIDocsService {
  private tenantId: string;
  private authToken?: string;

  constructor(tenantId: string, authToken?: string) {
    this.tenantId = tenantId;
    this.authToken = authToken;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }

  private getMultipartHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }

  /**
   * Get all documents for the tenant
   */
  async getDocuments(source?: 'upload' | 'email-ingest'): Promise<DocumentList> {
    const url = new URL(`${API_BASE}/ai-docs/tenant/${this.tenantId}/documents`);
    if (source) {
      url.searchParams.set('source', source);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Upload documents for AI analysis
   */
  async uploadDocuments(files: File[]): Promise<UploadResult> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('documents', file);
    });

    const response = await fetch(`${API_BASE}/ai-docs/tenant/${this.tenantId}/upload`, {
      method: 'POST',
      headers: this.getMultipartHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get signed download URL for a document
   */
  async getDownloadUrl(documentKey: string): Promise<{ downloadUrl: string; expiresIn: number }> {
    const encodedKey = encodeURIComponent(documentKey);
    
    const response = await fetch(`${API_BASE}/ai-docs/tenant/${this.tenantId}/document/${encodedKey}/download`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentKey: string): Promise<void> {
    const encodedKey = encodeURIComponent(documentKey);
    
    const response = await fetch(`${API_BASE}/ai-docs/tenant/${this.tenantId}/document/${encodedKey}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`);
    }
  }

  /**
   * Trigger AI analysis of tenant documents
   */
  async analyzeDocuments(forceReprocess = false): Promise<{ 
    message: string; 
    tenantId: string; 
    status: string; 
    estimatedCompletionTime: string; 
    analysisId: string; 
  }> {
    const response = await fetch(`${API_BASE}/ai-docs/tenant/${this.tenantId}/analyze`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ forceReprocess }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Analysis failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get AI analysis results
   */
  async getAnalysisResults(): Promise<AnalysisResult> {
    const response = await fetch(`${API_BASE}/ai-docs/tenant/${this.tenantId}/analysis`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get analysis results: ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * React hook for AI docs functionality
 */
export function useAIDocs(tenantId: string, authToken?: string) {
  const service = new AIDocsService(tenantId, authToken);
  
  return {
    getDocuments: service.getDocuments.bind(service),
    uploadDocuments: service.uploadDocuments.bind(service),
    getDownloadUrl: service.getDownloadUrl.bind(service),
    deleteDocument: service.deleteDocument.bind(service),
    analyzeDocuments: service.analyzeDocuments.bind(service),
    getAnalysisResults: service.getAnalysisResults.bind(service),
  };
}

/**
 * File validation utilities
 */
export const FileValidation = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ] as const,
  
  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size must be less than ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }
    
    if (!this.ALLOWED_TYPES.includes(file.type as any)) {
      return {
        valid: false,
        error: 'Only PDF, DOCX, and TXT files are allowed'
      };
    }
    
    return { valid: true };
  },
  
  validateFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (files.length === 0) {
      errors.push('At least one file must be selected');
    }
    
    if (files.length > 10) {
      errors.push('Maximum 10 files can be uploaded at once');
    }
    
    files.forEach((file, index) => {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file type icon name for UI
 */
export function getFileTypeIcon(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'file-pdf';
    case 'docx':
    case 'doc':
      return 'file-word';
    case 'txt':
      return 'file-text';
    default:
      return 'file';
  }
}

/**
 * Generate tenant-specific email address for document ingestion
 */
export function getTenantEmailAddress(tenantId: string): string {
  return `docs-${tenantId}@stackpro.io`;
}
