import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query,
  orderBy
} from "firebase/firestore";

export interface QuotationItem {
  id: string; // Using string to handle client-side UUIDs temporarily
  productId: string;
  productName: string;
  productImage: string;
  modelNo: string;
  qty: number;
  rate: number;
  mrp: number;
  amount: number;
  sortOrder: number;
}

export interface Quotation {
  id?: string;
  qoNumber: string;
  date: string;
  dispatchDate: string;
  bookingDate: string;
  status: "Draft" | "Confirmed";
  clientId: string;
  clientName: string;
  subtotal: number;
  gst: number;
  total: number;
  amountInWords: string;
  items: QuotationItem[];
  createdAt: number;
}

const COLLECTION_NAME = "quotations";

export const getQuotations = async (): Promise<Quotation[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quotation));
};

export const getQuotation = async (id: string): Promise<Quotation | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Quotation;
  }
  return null;
};

export const addQuotation = async (quotation: Omit<Quotation, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...quotation,
    createdAt: Date.now()
  });
  return docRef.id;
};

export const updateQuotation = async (id: string, quotation: Partial<Quotation>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, quotation);
};

export const deleteQuotation = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
