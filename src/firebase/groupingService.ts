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
import type { GroupingScheme, ItemGroup } from '../types';

const GROUPING_SCHEMES_COLLECTION = 'groupingSchemes';

type FirestoreItemGroup = {
  id: string;
  name: string;
};

type FirestoreGroupingScheme = {
  name: string;
  groups: FirestoreItemGroup[];
  defaultGroupId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const convertFirestoreToGroupingScheme = (
  snapshot: QueryDocumentSnapshot<DocumentData>,
): GroupingScheme => {
  const data = snapshot.data() as FirestoreGroupingScheme;
  const rawGroups = data.groups ?? [];
  return {
    id: snapshot.id,
    name: data.name,
    groups: rawGroups.map((g: FirestoreItemGroup): ItemGroup => ({
      id: g.id,
      name: g.name,
    })),
    defaultGroupId: data.defaultGroupId,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
};

const convertGroupingSchemeToFirestore = (scheme: Omit<GroupingScheme, 'id'>): FirestoreGroupingScheme => ({
  name: scheme.name,
  groups: scheme.groups.map((g: ItemGroup) => ({
    id: g.id,
    name: g.name,
  })),
  defaultGroupId: scheme.defaultGroupId,
  createdAt: Timestamp.fromDate(scheme.createdAt),
  updatedAt: Timestamp.fromDate(scheme.updatedAt),
});

export const groupingFirebaseService = {
  async getSchemes(): Promise<GroupingScheme[]> {
    try {
      const q = query(collection(db, GROUPING_SCHEMES_COLLECTION), orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertFirestoreToGroupingScheme);
    } catch (error) {
      console.error('Error fetching grouping schemes from Firebase:', error);
      throw error;
    }
  },

  subscribeToSchemes(callback: (schemes: GroupingScheme[]) => void): () => void {
    const q = query(collection(db, GROUPING_SCHEMES_COLLECTION), orderBy('updatedAt', 'desc'));
    return onSnapshot(
      q,
      (querySnapshot) => {
        const schemes = querySnapshot.docs.map(convertFirestoreToGroupingScheme);
        callback(schemes);
      },
      (error) => {
        console.error('Error in Firebase grouping schemes subscription:', error);
      },
    );
  },

  async createScheme(scheme: Omit<GroupingScheme, 'id'>): Promise<string> {
    try {
      const schemeRef = doc(collection(db, GROUPING_SCHEMES_COLLECTION));
      const firestoreData = convertGroupingSchemeToFirestore(scheme);
      await setDoc(schemeRef, firestoreData);
      return schemeRef.id;
    } catch (error) {
      console.error('Error creating grouping scheme in Firebase:', error);
      throw error;
    }
  },

  async updateScheme(scheme: GroupingScheme): Promise<void> {
    try {
      const schemeRef = doc(db, GROUPING_SCHEMES_COLLECTION, scheme.id);
      const firestoreData = convertGroupingSchemeToFirestore({
        name: scheme.name,
        groups: scheme.groups,
        defaultGroupId: scheme.defaultGroupId,
        createdAt: scheme.createdAt,
        updatedAt: new Date(),
      });
      await updateDoc(schemeRef, firestoreData as Partial<FirestoreGroupingScheme>);
    } catch (error) {
      console.error('Error updating grouping scheme in Firebase:', error);
      throw error;
    }
  },

  async deleteScheme(schemeId: string): Promise<void> {
    try {
      const schemeRef = doc(db, GROUPING_SCHEMES_COLLECTION, schemeId);
      await deleteDoc(schemeRef);
    } catch (error) {
      console.error('Error deleting grouping scheme from Firebase:', error);
      throw error;
    }
  },
};
