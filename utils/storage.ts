import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, child } from 'firebase/database';
import { Todo, DayMetadata } from '../types';

// Helper to safely get environment variables in Vite
const getEnv = (key: string): string => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
     // @ts-ignore
     return import.meta.env[key];
  }
  return '';
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

let db: any = null;

// Initialize Firebase only if config exists
if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("Chronos System: Cloud Link Established");
  } catch (e) {
    console.error("Chronos System: Cloud Connection Failed", e);
  }
} else {
  console.log("Chronos System: Running in Local Mode (No Firebase Config Found)");
}

export interface UserData {
  todos: Todo[];
  metadata: Record<string, DayMetadata>;
}

export const storage = {
  isCloudActive: () => !!db,

  // Load data for a specific user
  loadUserData: async (username: string): Promise<UserData> => {
    const cleanName = username.toLowerCase().trim();
    
    // 1. Try Firebase
    if (db) {
      try {
        const todoSnap = await get(child(ref(db), `users/${cleanName}/todos`));
        const metaSnap = await get(child(ref(db), `users/${cleanName}/metadata`));
        
        return {
          todos: todoSnap.exists() ? todoSnap.val() : [],
          metadata: metaSnap.exists() ? metaSnap.val() : {}
        };
      } catch (e) { 
        console.warn("Firebase load failed, falling back to local for viewing", e);
      }
    } 
    
    // 2. Fallback to LocalStorage (or if Firebase not configured)
    const t = localStorage.getItem(`chronos_${cleanName}_todos`);
    const m = localStorage.getItem(`chronos_${cleanName}_daily_metadata`);
    return { todos: t ? JSON.parse(t) : [], metadata: m ? JSON.parse(m) : {} };
  },

  // Save data for a specific user
  saveUserData: async (username: string, data: UserData): Promise<void> => {
    const cleanName = username.toLowerCase().trim();
    
    // Always save to LocalStorage as backup/cache
    localStorage.setItem(`chronos_${cleanName}_todos`, JSON.stringify(data.todos));
    localStorage.setItem(`chronos_${cleanName}_daily_metadata`, JSON.stringify(data.metadata));

    // If Firebase is active, save there too and wait for completion
    if (db) {
      try {
        await Promise.all([
          set(ref(db, `users/${cleanName}/todos`), data.todos),
          set(ref(db, `users/${cleanName}/metadata`), data.metadata)
        ]);
        console.log("Chronos System: Data synced to cloud successfully");
      } catch (e) {
        console.warn("Chronos System: Cloud sync failed, data saved locally", e);
      }
    }
  }
};