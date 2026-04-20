import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Meal, WorkoutLog, WeightRecord, BodyStats, UserSettings, SupplementCheck } from '../types';

/**
 * Cloud Sync Service
 */

export const syncUserSettings = async (userId: string, settings: UserSettings) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    uid: userId,
    settings,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const fetchUserSettings = async (userId: string): Promise<UserSettings | null> => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data().settings as UserSettings;
  }
  return null;
};

// Generic helper for collection syncing
export const syncCollection = async <T extends { id: string }>(
  userId: string, 
  collectionName: string, 
  items: T[]
) => {
  const batch = writeBatch(db);
  items.forEach(item => {
    const docRef = doc(db, 'users', userId, collectionName, item.id);
    batch.set(docRef, { ...item, userId });
  });
  await batch.commit();
};

export const saveItem = async (userId: string, collectionName: string, item: any) => {
  const docRef = doc(db, 'users', userId, collectionName, item.id || item.date);
  await setDoc(docRef, { ...item, userId });
};

export const deleteItem = async (userId: string, collectionName: string, id: string) => {
  await deleteDoc(doc(db, 'users', userId, collectionName, id));
};

export const fetchCollection = async <T>(userId: string, collectionName: string): Promise<T[]> => {
  const colRef = collection(db, 'users', userId, collectionName);
  const snap = await getDocs(colRef);
  return snap.docs.map(doc => doc.data() as T);
};

// Specialized water/supplement sync since they use dates as keys
export const saveDailyStatus = async (userId: string, type: 'water' | 'supplements', date: string, data: any) => {
  const docRef = doc(db, 'users', userId, type, date);
  await setDoc(docRef, { ...data, userId, date });
};

export const fetchDailyStatus = async (userId: string, type: 'water' | 'supplements'): Promise<{[date: string]: any}> => {
  const colRef = collection(db, 'users', userId, type);
  const snap = await getDocs(colRef);
  const result: any = {};
  snap.docs.forEach(doc => {
    result[doc.id] = doc.data();
  });
  return result;
};
