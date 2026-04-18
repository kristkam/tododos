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

/** Reusable list shape without per-item completion or timestamps (not a persisted todo list). */
export type TemplateItem = {
  id: string;
  text: string;
  order?: number;
};

export type ListTemplate = {
  id: string;
  name: string;
  items: TemplateItem[];
  createdAt: Date;
  updatedAt: Date;
};
