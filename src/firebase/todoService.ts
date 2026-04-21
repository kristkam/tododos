import {
  collection,
  deleteField,
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
  type FieldValue,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type { TodoList, TodoItem } from '../types';

const LISTS_COLLECTION = 'todoLists';

type FirestoreTodoList = {
  name: string;
  items: FirestoreTodoItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sortBy?: 'normal' | 'completed-top' | 'completed-bottom';
  activeGroupingId?: string;
  groupOrder?: string[];
};

type FirestoreTodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Timestamp;
  order?: number;
  completedAt?: Timestamp;
};

const convertFirestoreToTodoList = (docSnap: QueryDocumentSnapshot<DocumentData>): TodoList => {
  const data = docSnap.data() as FirestoreTodoList;
  const rawItems = data.items ?? [];
  const list: TodoList = {
    id: docSnap.id,
    name: data.name,
    items: rawItems.map((item): TodoItem => {
      const row: TodoItem = {
        id: item.id,
        text: item.text,
        completed: item.completed,
        createdAt: item.createdAt.toDate(),
        order: item.order,
      };
      if (item.completedAt !== undefined) {
        row.completedAt = item.completedAt.toDate();
      }
      return row;
    }),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    sortBy: data.sortBy ?? 'normal',
  };
  if (typeof data.activeGroupingId === 'string' && data.activeGroupingId.length > 0) {
    list.activeGroupingId = data.activeGroupingId;
  }
  if (Array.isArray(data.groupOrder) && data.groupOrder.length > 0) {
    list.groupOrder = [...data.groupOrder];
  }
  return list;
};

const convertTodoListToFirestore = (list: Omit<TodoList, 'id'>): FirestoreTodoList => {
  const out: FirestoreTodoList = {
    name: list.name,
    items: list.items.map((item: TodoItem) => {
      const row: FirestoreTodoItem = {
        id: item.id,
        text: item.text,
        completed: item.completed,
        createdAt: Timestamp.fromDate(item.createdAt),
      };
      if (item.order !== undefined) {
        row.order = item.order;
      }
      if (item.completedAt !== undefined) {
        row.completedAt = Timestamp.fromDate(item.completedAt);
      }
      return row;
    }),
    createdAt: Timestamp.fromDate(list.createdAt),
    updatedAt: Timestamp.fromDate(list.updatedAt),
    sortBy: list.sortBy,
  };
  if (list.activeGroupingId !== undefined) {
    out.activeGroupingId = list.activeGroupingId;
  }
  if (list.groupOrder !== undefined) {
    out.groupOrder = [...list.groupOrder];
  }
  return out;
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
        activeGroupingId: list.activeGroupingId,
        groupOrder: list.groupOrder,
      });
      const payload: Record<string, unknown> = { ...firestoreData };
      const activeGrouping: string | FieldValue =
        list.activeGroupingId ?? deleteField();
      const groupOrder: string[] | FieldValue =
        list.groupOrder ?? deleteField();
      payload.activeGroupingId = activeGrouping;
      payload.groupOrder = groupOrder;
      await updateDoc(listRef, payload);
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
