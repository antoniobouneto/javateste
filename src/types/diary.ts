export interface DiaryEntry {
  id: string;
  title: string;
  imageData: string; // Base64 data URL
  latitude: number;
  longitude: number;
  createdAt: string; // ISO 8601
  address?: string;
}

export interface LocationDataResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}
