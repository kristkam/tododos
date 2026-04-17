export type SortOption = 'normal' | 'completed-top' | 'completed-bottom';

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  order?: number;
};

export type TodoList = {
  id: string;
  name: string;
  items: TodoItem[];
  createdAt: Date;
  updatedAt: Date;
  sortBy: SortOption;
};
