import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc 
} from "firebase/firestore";

export interface Client {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  gst: string;
}

const COLLECTION_NAME = "clients";

export const getClients = async (): Promise<Client[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
};

export const getClient = async (id: string): Promise<Client | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Client;
  }
  return null;
};

export const addClient = async (client: Omit<Client, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), client);
  return docRef.id;
};

export const updateClient = async (id: string, client: Partial<Client>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, client);
};

export const deleteClient = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
