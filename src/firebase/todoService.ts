import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './config';
import type { TodoList, TodoItem } from '../types';

// Collection name for todo lists
const LISTS_COLLECTION = 'todoLists';

// Type for Firestore document
interface FirestoreTodoList {
  name: string;
  items: FirestoreTodoItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sortBy?: 'normal' | 'completed-top' | 'completed-bottom';
}

interface FirestoreTodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Timestamp;
  order?: number;
}

// Convert Firestore document to TodoList
const convertFirestoreToTodoList = (
  doc: QueryDocumentSnapshot<DocumentData>
): TodoList => {
  const data = doc.data() as FirestoreTodoList;
  return {
    id: doc.id,
    name: data.name,
    items: data.items.map((item: FirestoreTodoItem) => ({
      id: item.id,
      text: item.text,
      completed: item.completed,
      createdAt: item.createdAt.toDate(),
      order: item.order
    })),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    sortBy: data.sortBy
  };
};

// Convert TodoList to Firestore document
const convertTodoListToFirestore = (list: Omit<TodoList, 'id'>): FirestoreTodoList => {
  const firestoreList: FirestoreTodoList = {
    name: list.name,
    items: list.items.map((item: TodoItem) => {
      const firestoreItem: FirestoreTodoItem = {
        id: item.id,
        text: item.text,
        completed: item.completed,
        createdAt: Timestamp.fromDate(item.createdAt)
      };
      // Only add order if it exists (Firestore doesn't like undefined)
      if (item.order !== undefined) {
        firestoreItem.order = item.order;
      }
      return firestoreItem;
    }),
    createdAt: Timestamp.fromDate(list.createdAt),
    updatedAt: Timestamp.fromDate(list.updatedAt)
  };
  
  // Only add sortBy if it exists (Firestore doesn't like undefined)
  if (list.sortBy !== undefined) {
    firestoreList.sortBy = list.sortBy;
  }
  
  return firestoreList;
};

// Firebase service functions
export const firebaseService = {
  // Get all todo lists
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

  // Subscribe to real-time updates of all lists
  subscribeToLists(callback: (lists: TodoList[]) => void): () => void {
    const q = query(collection(db, LISTS_COLLECTION), orderBy('updatedAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const lists = querySnapshot.docs.map(convertFirestoreToTodoList);
      callback(lists);
    }, (error) => {
      console.error('Error in Firebase subscription:', error);
    });
  },

  // Create a new todo list
  async createList(list: Omit<TodoList, 'id'>): Promise<string> {
    try {
      const firestoreData = convertTodoListToFirestore(list);
      const docRef = await addDoc(collection(db, LISTS_COLLECTION), firestoreData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating list in Firebase:', error);
      throw error;
    }
  },

  // Update an existing todo list
  async updateList(list: TodoList): Promise<void> {
    try {
      const listRef = doc(db, LISTS_COLLECTION, list.id);
      const firestoreData = convertTodoListToFirestore({
        name: list.name,
        items: list.items,
        createdAt: list.createdAt,
        updatedAt: new Date(), // Always update the timestamp
        sortBy: list.sortBy
      });
      await updateDoc(listRef, firestoreData as Partial<FirestoreTodoList>);
    } catch (error) {
      console.error('Error updating list in Firebase:', error);
      throw error;
    }
  },

  // Delete a todo list
  async deleteList(listId: string): Promise<void> {
    try {
      const listRef = doc(db, LISTS_COLLECTION, listId);
      await deleteDoc(listRef);
    } catch (error) {
      console.error('Error deleting list from Firebase:', error);
      throw error;
    }
  }
};