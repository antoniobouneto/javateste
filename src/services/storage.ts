import { DiaryEntry } from '../types/diary';

const DB_NAME = 'geodiario_db';
const STORE_NAME = 'records';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB não suportado'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('created_at', 'createdAt', { unique: false });
      }
    };
  });
}

// Sample seed data to help user immediately see the app functioning
const SAMPLE_ENTRIES: DiaryEntry[] = [
  {
    id: 'seed-1',
    title: 'Pôr do sol no Parque Ibirapuera',
    imageData: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    latitude: -23.587416,
    longitude: -46.657634,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    address: 'Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP',
  },
  {
    id: 'seed-2',
    title: 'Visita ao Jardim Botânico',
    imageData: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    latitude: -22.969123,
    longitude: -43.224376,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    address: 'R. Jardim Botânico, 1008 - Jardim Botânico, Rio de Janeiro - RJ',
  },
];

export async function getAllEntries(): Promise<DiaryEntry[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        let results = request.result as DiaryEntry[];
        if (!results || results.length === 0) {
          // Check if user has explicitly cleared data before
          const hasSeeded = localStorage.getItem('geodiario_initialized');
          if (!hasSeeded) {
            localStorage.setItem('geodiario_initialized', 'true');
            // Seed initial entries
            Promise.all(SAMPLE_ENTRIES.map(e => insertEntry(e))).then(() => {
              resolve(SAMPLE_ENTRIES);
            }).catch(() => resolve([]));
            return;
          }
          resolve([]);
        } else {
          // Sort descending by date (created_at DESC)
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback to localStorage if IndexedDB fails
    const raw = localStorage.getItem('geodiario_records');
    if (!raw) {
      localStorage.setItem('geodiario_records', JSON.stringify(SAMPLE_ENTRIES));
      return SAMPLE_ENTRIES;
    }
    try {
      const list = JSON.parse(raw) as DiaryEntry[];
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }
}

export async function insertEntry(entry: DiaryEntry): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    const raw = localStorage.getItem('geodiario_records');
    const list: DiaryEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    localStorage.setItem('geodiario_records', JSON.stringify(list));
  }
}

export async function deleteEntryFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    const raw = localStorage.getItem('geodiario_records');
    if (raw) {
      const list: DiaryEntry[] = JSON.parse(raw);
      const filtered = list.filter(item => item.id !== id);
      localStorage.setItem('geodiario_records', JSON.stringify(filtered));
    }
  }
}
