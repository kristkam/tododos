export type SortOption = 'normal' | 'completed-top' | 'completed-bottom';

export type ItemGroup = {
  id: string;
  name: string;
};

export type GroupingScheme = {
  id: string;
  name: string;
  groups: ItemGroup[];
  defaultGroupId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  order?: number;
  /** When the list has a grouping scheme, every item must reference a group id from that scheme. */
  groupId?: string;
};

export type TodoList = {
  id: string;
  name: string;
  items: TodoItem[];
  createdAt: Date;
  updatedAt: Date;
  sortBy: SortOption;
  /** Set at list creation only; never changed afterward. */
  groupingSchemeId?: string;
  groupBy: boolean;
};

/** Reusable list shape without per-item completion or timestamps (not a persisted todo list). */
export type TemplateItem = {
  id: string;
  text: string;
  order?: number;
  /** When the template has a grouping scheme, every item should reference a group id from that scheme. */
  groupId?: string;
};

export type ListTemplate = {
  id: string;
  name: string;
  items: TemplateItem[];
  createdAt: Date;
  updatedAt: Date;
  /** Assign-once-then-lock: may be set later if initially undefined. */
  groupingSchemeId?: string;
};
