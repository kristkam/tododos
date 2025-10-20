export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface TodoList {
  id: string;
  name: string;
  items: TodoItem[];
  createdAt: Date;
  updatedAt: Date;
  sortBy?: 'normal' | 'completed-top' | 'completed-bottom';
}

export interface AppState {
  lists: TodoList[];
  currentListId: string | null;
}