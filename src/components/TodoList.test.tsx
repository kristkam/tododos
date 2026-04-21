import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TodoList } from './TodoList';
import type { GroupingScheme, TodoList as TodoListModel } from '../types';
import { GroupingsContext, type GroupingsContextValue } from '../contexts/GroupingsContext';

const baseList = (overrides: Partial<TodoListModel> = {}): TodoListModel => ({
  id: 'firestore-real-id-no-temp-prefix',
  name: 'Groceries',
  items: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  sortBy: 'normal',
  ...overrides,
});

const defaultGroupingsValue: GroupingsContextValue = {
  schemes: [],
  loading: false,
  error: null,
  createScheme: vi.fn(),
  updateScheme: vi.fn(),
  deleteScheme: vi.fn(),
  reorderSchemeGroups: vi.fn(),
};

function renderWithGroupings(
  ui: ReactElement,
  value: GroupingsContextValue = defaultGroupingsValue,
): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <GroupingsContext.Provider value={value}>{ui}</GroupingsContext.Provider>
    </MemoryRouter>,
  );
}

describe('TodoList', () => {
  it('calls onUpdateList with the real list id when adding an item immediately after navigation', async () => {
    const user = userEvent.setup();
    const onUpdateList = vi.fn();
    renderWithGroupings(<TodoList list={baseList()} onUpdateList={onUpdateList} />);

    await user.type(screen.getByPlaceholderText(/add new task/i), 'Milk');
    await user.keyboard('{Enter}');

    expect(onUpdateList).toHaveBeenCalledTimes(1);
    const updated = onUpdateList.mock.calls[0][0] as TodoListModel;
    expect(updated.id).toBe('firestore-real-id-no-temp-prefix');
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].text).toBe('Milk');
    expect(updated.activeGroupingId).toBeUndefined();
  });

  it('shows the grouping picker with no active grouping by default', () => {
    renderWithGroupings(<TodoList list={baseList()} onUpdateList={vi.fn()} />);
    const select = screen.getByRole('combobox', { name: /group by/i }) as HTMLSelectElement;
    expect(select.value).toBe('');
    expect(within(select).getByRole('option', { name: 'None' })).toBeInTheDocument();
  });

  it('renders section headers based on alias matching when a scheme is active', async () => {
    const user = userEvent.setup();
    const scheme: GroupingScheme = {
      id: 'sch-1',
      name: 'Food',
      groups: [
        { id: 'g1', name: 'Veggies', aliases: ['carrot'] },
        { id: 'g2', name: 'Meat', aliases: ['beef'] },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const value: GroupingsContextValue = {
      ...defaultGroupingsValue,
      schemes: [scheme],
    };
    const list = baseList({
      activeGroupingId: 'sch-1',
      items: [
        { id: 'a', text: 'Carrot', completed: false, createdAt: new Date(), order: 0 },
        { id: 'b', text: 'Beef', completed: false, createdAt: new Date(), order: 1 },
        { id: 'c', text: 'Mystery', completed: false, createdAt: new Date(), order: 2 },
      ],
    });

    renderWithGroupings(<TodoList list={list} onUpdateList={vi.fn()} />, value);

    expect(screen.getByRole('heading', { name: /Veggies/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Meat/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Other/ })).toBeInTheDocument();
    expect(screen.getByText('Carrot')).toBeInTheDocument();
    expect(screen.getByText('Beef')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();

    const carrotLabel = screen.getByText('Carrot');
    await user.click(screen.getByRole('button', { name: /Collapse Veggies tasks/i }));
    expect(carrotLabel).not.toBeVisible();
    await user.click(screen.getByRole('button', { name: /Expand Veggies tasks/i }));
    expect(carrotLabel).toBeVisible();
  });
});
