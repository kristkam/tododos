export type SortOption = 'normal' | 'completed-top' | 'completed-bottom';

export type ItemGroup = {
  id: string;
  name: string;
  /** Normalized alternate strings that also match this group. Does not include the normalized name. */
  aliases: string[];
};

export type GroupingScheme = {
  id: string;
  name: string;
  groups: ItemGroup[];
  createdAt: Date;
  updatedAt: Date;
};

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  order?: number;
  /** Set when the item is marked complete; used to sort the completed bucket. */
  completedAt?: Date;
};

export type TodoList = {
  id: string;
  name: string;
  items: TodoItem[];
  createdAt: Date;
  updatedAt: Date;
  sortBy: SortOption;
  /** Currently applied grouping scheme. Absent = flat (ungrouped) view. */
  activeGroupingId?: string;
  /** Ordered group ids overriding the scheme's canonical group order for this list. */
  groupOrder?: string[];
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
