// 타입 정의만 유지
export interface Archive {
  id?: number;
  title: string;
  content: string;
  fileType: 'image' | 'model';
  fileBlob: Blob;
  thumbnailBlob?: Blob;
  createdAt: Date;
  updatedAt?: Date;
  folderId?: number | null; // 폴더 ID (없으면 null)
}

export interface UserProfile {
  id?: number;
  name: string;
  bio: string;
  profileImageBlob?: Blob;
  backgroundImageBlob?: Blob;
  updatedAt: Date;
}

export interface Folder {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}
import Dexie, { Table } from 'dexie';

export interface Archive {
  id?: number;
  title: string;
  content: string;
  fileType: 'image' | 'model';
  fileBlob: Blob;
  thumbnailBlob?: Blob;
  createdAt: Date;
  updatedAt?: Date;
  folderId?: number | null; // 폴더 ID (없으면 null)
export interface Folder {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}
}

export interface UserProfile {
  id?: number;
  name: string;
  bio: string;
  profileImageBlob?: Blob;
  backgroundImageBlob?: Blob;
  updatedAt: Date;
}

export class My3DArchiveDB extends Dexie {
  archives!: Table<Archive>;
  userProfile!: Table<UserProfile>;
  folders!: Table<Folder>;

  constructor() {
    super('My3DArchiveDB');
    this.version(1).stores({
      archives: '++id, title, fileType, createdAt',
    });
    this.version(2).stores({
      archives: '++id, title, fileType, createdAt, updatedAt',
    });
    this.version(3).stores({
      archives: '++id, title, fileType, createdAt, updatedAt',
      userProfile: '++id, updatedAt',
    });
    this.version(4).stores({
      archives: '++id, title, fileType, createdAt, updatedAt, folderId',
      userProfile: '++id, updatedAt',
      folders: '++id, name, createdAt, updatedAt',
    });
  }
}

export const db = new My3DArchiveDB();