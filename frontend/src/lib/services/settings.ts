import { db } from "../firebase";
import { 
  doc, 
  getDoc, 
  setDoc
} from "firebase/firestore";

export interface CompanySettings {
  name: string;
  logo: string; // Base64 string or external URL
  gst: string;
  address1: string;
  address2: string;
  phone: string;
  email: string;
  website: string;
  bankDetails: string;
  terms: string;
}

const SETTINGS_DOC_ID = "company";
const COLLECTION_NAME = "settings";

export const getSettings = async (): Promise<CompanySettings | null> => {
  const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as CompanySettings;
  }
  return null;
};

export const updateSettings = async (settings: Partial<CompanySettings>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
  await setDoc(docRef, settings, { merge: true });
};
