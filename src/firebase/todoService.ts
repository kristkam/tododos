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
import type { TodoList, TodoItem } from '../types';

const LISTS_COLLECTION = 'todoLists';

interface FirestoreTodoList {
  name: string;
  items: FirestoreTodoItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sortBy?: 'normal' | 'completed-top' | 'completed-bottom';
  groupingSchemeId?: string;
  groupBy?: boolean;
}

interface FirestoreTodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Timestamp;
  order?: number;
  groupId?: string;
}

const convertFirestoreToTodoList = (docSnap: QueryDocumentSnapshot<DocumentData>): TodoList => {
  const data = docSnap.data() as FirestoreTodoList;
  const rawItems = data.items ?? [];
  return {
    id: docSnap.id,
    name: data.name,
    items: rawItems.map((item: FirestoreTodoItem) => {
      const row: TodoItem = {
        id: item.id,
        text: item.text,
        completed: item.completed,
        createdAt: item.createdAt.toDate(),
        order: item.order,
      };
      if (item.groupId !== undefined) {
        row.groupId = item.groupId;
      }
      return row;
    }),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    sortBy: data.sortBy ?? 'normal',
    groupingSchemeId: data.groupingSchemeId,
    groupBy: data.groupBy ?? false,
  };
};

const convertTodoListToFirestore = (list: Omit<TodoList, 'id'>): FirestoreTodoList => {
  const firestoreList: FirestoreTodoList = {
    name: list.name,
    items: list.items.map((item: TodoItem) => {
      const firestoreItem: FirestoreTodoItem = {
        id: item.id,
        text: item.text,
        completed: item.completed,
        createdAt: Timestamp.fromDate(item.createdAt),
      };
      if (item.order !== undefined) {
        firestoreItem.order = item.order;
      }
      if (item.groupId !== undefined) {
        firestoreItem.groupId = item.groupId;
      }
      return firestoreItem;
    }),
    createdAt: Timestamp.fromDate(list.createdAt),
    updatedAt: Timestamp.fromDate(list.updatedAt),
    sortBy: list.sortBy,
    groupBy: list.groupBy,
  };
  if (list.groupingSchemeId !== undefined) {
    firestoreList.groupingSchemeId = list.groupingSchemeId;
  }
  return firestoreList;
};

export const firebaseService = {
  async getLists(): Promise<TodoList[]> {
    try {
      const q = query(collection(db, LISTS_COLLECTION), orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertFirestoreToTodoList);
    } catch (error) {
      console.error('Error fetching lists from Firebase:', error);
      throw error;
    }
  },

  subscribeToLists(callback: (lists: TodoList[]) => void): () => void {
    const q = query(collection(db, LISTS_COLLECTION), orderBy('updatedAt', 'desc'));

    return onSnapshot(
      q,
      (querySnapshot) => {
        const lists = querySnapshot.docs.map(convertFirestoreToTodoList);
        callback(lists);
      },
      (error) => {
        console.error('Error in Firebase subscription:', error);
      },
    );
  },

  async createList(list: Omit<TodoList, 'id'>): Promise<string> {
    try {
      const listRef = doc(collection(db, LISTS_COLLECTION));
      const firestoreData = convertTodoListToFirestore(list);
      await setDoc(listRef, firestoreData);
      return listRef.id;
    } catch (error) {
      console.error('Error creating list in Firebase:', error);
      throw error;
    }
  },

  async updateList(list: TodoList): Promise<void> {
    try {
      const listRef = doc(db, LISTS_COLLECTION, list.id);
      const firestoreData = convertTodoListToFirestore({
        name: list.name,
        items: list.items,
        createdAt: list.createdAt,
        updatedAt: new Date(),
        sortBy: list.sortBy,
        groupingSchemeId: list.groupingSchemeId,
        groupBy: list.groupBy,
      });
      await updateDoc(listRef, firestoreData as Partial<FirestoreTodoList>);
    } catch (error) {
      console.error('Error updating list in Firebase:', error);
      throw error;
    }
  },

  async deleteList(listId: string): Promise<void> {
    try {
      const listRef = doc(db, LISTS_COLLECTION, listId);
      await deleteDoc(listRef);
    } catch (error) {
      console.error('Error deleting list from Firebase:', error);
      throw error;
    }
  },
};
