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
}

interface FirestoreTodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Timestamp;
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
      createdAt: item.createdAt.toDate()
    })),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate()
  };
};

// Convert TodoList to Firestore document
const convertTodoListToFirestore = (list: Omit<TodoList, 'id'>): FirestoreTodoList => ({
  name: list.name,
  items: list.items.map((item: TodoItem) => ({
    id: item.id,
    text: item.text,
    completed: item.completed,
    createdAt: Timestamp.fromDate(item.createdAt)
  })),
  createdAt: Timestamp.fromDate(list.createdAt),
  updatedAt: Timestamp.fromDate(list.updatedAt)
});

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
        updatedAt: new Date() // Always update the timestamp
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