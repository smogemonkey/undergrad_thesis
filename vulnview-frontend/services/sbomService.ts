import { toast } from "sonner"
import { API_ENDPOINTS } from "@/lib/constants"
import { apiFetch } from "@/lib/api"

interface SbomUploadResponse {
  id: string;
  status: string;
  message: string;
}

class SbomService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  async generateSbom(projectBlob: Blob): Promise<Blob> {
    try {
      const formData = new FormData();
      formData.append('project', projectBlob);

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.SBOM.GENERATE}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate SBOM');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating SBOM:', error);
      toast.error('Failed to generate SBOM');
      throw error;
    }
  }

  async uploadSbom(sbomBlob: Blob, projectName: string): Promise<SbomUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('sbom', sbomBlob);
      formData.append('projectName', projectName);

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.SBOM.UPLOAD}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload SBOM');
      }

      return await response.json() as SbomUploadResponse;
    } catch (error) {
      console.error('Error uploading SBOM:', error);
      toast.error('Failed to upload SBOM');
      throw error;
    }
  }

  async getSbomStatus(sbomId: string): Promise<{ status: string; progress: number }> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.SBOM.STATUS(sbomId)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get SBOM status');
      }

      return await response.json() as { status: string; progress: number };
    } catch (error) {
      console.error('Error getting SBOM status:', error);
      toast.error('Failed to get SBOM status');
      throw error;
    }
  }
}

export const sbomService = new SbomService();