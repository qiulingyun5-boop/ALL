import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Test connection helper
export async function testFirestoreConnection() {
  try {
    // Attempt to read a public doc to verify connection
    await getDocFromServer(doc(db, '_connection_test', 'connectivity'));
    console.log("神识连接成功：云端同步阵法已激活。");
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      // If permissions are denied, the server is reachable but the rules blocked it.
      // This still technically confirms connectivity to the project.
      console.log("星域连通：权限受限（正常现象，需通过登录解除）。");
      return;
    }
    console.error("神识干扰 (Firebase Error):", error.code, error.message);
    if (error.message?.includes('offline') || error.code === 'unavailable') {
      console.error("云端断开：请检查太虚网络连接或防火墙设置。已强制开启长轮询模式。");
    } else {
      console.error("神识干扰：", error);
    }
  }
}
