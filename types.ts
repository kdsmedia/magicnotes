export interface Folder {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string; // Changed from CategoryType to string to support mixed types
  folderId?: string; // Link to custom folder
  codeLanguage?: string; // Extension identifier (e.g., 'js', 'html', 'php')
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  paperColor?: string;
  paperStyle?: PaperStyle;
}

export enum PaperStyle {
  PLAIN = 'plain',
  LINED = 'lined',
  GRID = 'grid',
  DOTTED = 'dotted'
}

export enum CategoryType {
  ALL = 'Semua',
  PERSONAL = 'Pribadi',
  WORK = 'Pekerjaan',
  IDEAS = 'Ide',
  JOURNAL = 'Jurnal',
  SECRET = 'Rahasia'
}

export interface AIResponse {
  text: string;
  error?: string;
}