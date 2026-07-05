export interface PaintingStyle {
  id: string;
  label: string;
  prompt: string;
}

export interface VisualizationRequest {
  imageBase64?: string;
  imageUrl?: string;
}

export interface StyleResult {
  id: string;
  label: string;
  imageUrl?: string;
  error?: string;
}

export interface VisualizationResponse {
  styles: StyleResult[];
  processingTime?: number;
}
