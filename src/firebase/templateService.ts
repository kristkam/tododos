import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type { ListTemplate, TemplateItem } from '../types';

const TEMPLATES_COLLECTION = 'listTemplates';

type FirestoreListTemplate = {
  name: string;
  items: FirestoreTemplateItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type FirestoreTemplateItem = {
  id: string;
  text: string;
  order?: number;
};

const convertFirestoreToListTemplate = (
  snapshot: QueryDocumentSnapshot<DocumentData>,
): ListTemplate => {
  const data = snapshot.data() as FirestoreListTemplate;
  const rawItems = data.items ?? [];
  return {
    id: snapshot.id,
    name: data.name,
    items: rawItems.map((item: FirestoreTemplateItem) => ({
      id: item.id,
      text: item.text,
      order: item.order,
    })),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
};

const convertListTemplateToFirestore = (template: Omit<ListTemplate, 'id'>): FirestoreListTemplate => ({
  name: template.name,
  items: template.items.map((item: TemplateItem) => {
    const row: FirestoreTemplateItem = {
      id: item.id,
      text: item.text,
    };
    if (item.order !== undefined) {
      row.order = item.order;
    }
    return row;
  }),
  createdAt: Timestamp.fromDate(template.createdAt),
  updatedAt: Timestamp.fromDate(template.updatedAt),
});

export const templateFirebaseService = {
  async getTemplates(): Promise<ListTemplate[]> {
    try {
      const q = query(collection(db, TEMPLATES_COLLECTION), orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertFirestoreToListTemplate);
    } catch (error) {
      console.error('Error fetching templates from Firebase:', error);
      throw error;
    }
  },

  subscribeToTemplates(callback: (templates: ListTemplate[]) => void): () => void {
    const q = query(collection(db, TEMPLATES_COLLECTION), orderBy('updatedAt', 'desc'));
    return onSnapshot(
      q,
      (querySnapshot) => {
        const templates = querySnapshot.docs.map(convertFirestoreToListTemplate);
        callback(templates);
      },
      (error) => {
        console.error('Error in Firebase template subscription:', error);
      },
    );
  },

  async createTemplate(template: Omit<ListTemplate, 'id'>): Promise<string> {
    try {
      const templateRef = doc(collection(db, TEMPLATES_COLLECTION));
      const firestoreData = convertListTemplateToFirestore(template);
      await setDoc(templateRef, firestoreData);
      return templateRef.id;
    } catch (error) {
      console.error('Error creating template in Firebase:', error);
      throw error;
    }
  },

  async updateTemplate(template: ListTemplate): Promise<void> {
    try {
      const templateRef = doc(db, TEMPLATES_COLLECTION, template.id);
      const firestoreData = convertListTemplateToFirestore({
        name: template.name,
        items: template.items,
        createdAt: template.createdAt,
        updatedAt: new Date(),
      });
      await updateDoc(templateRef, firestoreData as Partial<FirestoreListTemplate>);
    } catch (error) {
      console.error('Error updating template in Firebase:', error);
      throw error;
    }
  },

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
      await deleteDoc(templateRef);
    } catch (error) {
      console.error('Error deleting template from Firebase:', error);
      throw error;
    }
  },
};
