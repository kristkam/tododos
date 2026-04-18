import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TodoList } from './TodoList';
import type { TodoList as TodoListModel } from '../types';
import { GroupingsContext, type GroupingsContextValue } from '../contexts/GroupingsContext';

const baseList = (): TodoListModel => ({
  id: 'firestore-real-id-no-temp-prefix',
  name: 'Groceries',
  items: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  sortBy: 'normal',
  groupBy: false,
});

const groupingsValue: GroupingsContextValue = {
  schemes: [],
  loading: false,
  error: null,
  createScheme: vi.fn(),
  updateScheme: vi.fn(),
  deleteScheme: vi.fn(),
};

function renderWithGroupings(ui: ReactElement): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <GroupingsContext.Provider value={groupingsValue}>{ui}</GroupingsContext.Provider>
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
    expect(updated.id.startsWith('temp-')).toBe(false);
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].text).toBe('Milk');
  });

  it('shows Add grouping in the header when the list has no grouping scheme', () => {
    renderWithGroupings(<TodoList list={baseList()} onUpdateList={vi.fn()} />);
    expect(screen.getByText('Add grouping')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /add grouping/i })).toBeInTheDocument();
  });

  it('renders section headers when groupBy is on and a scheme is present', () => {
    const scheme = {
      id: 'sch-1',
      name: 'Food',
      groups: [
        { id: 'g1', name: 'Veggies' },
        { id: 'g2', name: 'Meat' },
      ],
      defaultGroupId: 'g1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const value: GroupingsContextValue = {
      ...groupingsValue,
      schemes: [scheme],
    };
    const list: TodoListModel = {
      ...baseList(),
      groupingSchemeId: 'sch-1',
      groupBy: true,
      items: [
        {
          id: 'a',
          text: 'Carrot',
          completed: false,
          createdAt: new Date(),
          order: 0,
          groupId: 'g1',
        },
        {
          id: 'b',
          text: 'Beef',
          completed: false,
          createdAt: new Date(),
          order: 1,
          groupId: 'g2',
        },
      ],
    };
    render(
      <GroupingsContext.Provider value={value}>
        <TodoList list={list} onUpdateList={vi.fn()} />
      </GroupingsContext.Provider>,
    );

    expect(screen.getByRole('heading', { name: 'Veggies' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Meat' })).toBeInTheDocument();
    expect(screen.getByText('Carrot')).toBeInTheDocument();
    expect(screen.getByText('Beef')).toBeInTheDocument();
  });
});
