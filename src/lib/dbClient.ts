import Dexie, { Table } from 'dexie';
import type { Archive, UserProfile, Folder } from './db';

class My3DArchiveDB extends Dexie {
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