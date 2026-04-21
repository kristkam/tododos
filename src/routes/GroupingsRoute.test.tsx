import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GroupingsRoute } from './GroupingsRoute';
import { GroupingsContext, type GroupingsContextValue } from '../contexts/GroupingsContext';
import { TodoListsContext, type TodoListsContextValue } from '../contexts/TodoListsContext';

describe('GroupingsRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not delete until the grouping name is typed exactly', async () => {
    const user = userEvent.setup();
    const deleteScheme = vi.fn().mockResolvedValue(true);
    const groupingsMock: GroupingsContextValue = {
      schemes: [
        {
          id: 'sch-a',
          name: 'My Grouping',
          groups: [{ id: 'g1', name: 'Groceries', aliases: [] }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      loading: false,
      error: null,
      createScheme: vi.fn(),
      updateScheme: vi.fn(),
      deleteScheme,
      reorderSchemeGroups: vi.fn(),
    };
    const todoMock: TodoListsContextValue = {
      lists: [],
      loading: false,
      error: null,
      createList: vi.fn(),
      updateList: vi.fn(),
      deleteList: vi.fn(),
      clearActiveGroupingForScheme: vi.fn(),
    };

    render(
      <MemoryRouter initialEntries={['/groupings']}>
        <TodoListsContext.Provider value={todoMock}>
          <GroupingsContext.Provider value={groupingsMock}>
            <Routes>
              <Route path="/groupings" element={<GroupingsRoute />} />
            </Routes>
          </GroupingsContext.Provider>
        </TodoListsContext.Provider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /delete grouping my grouping/i }));
    const confirmBtn = screen.getByRole('button', { name: /^Delete grouping$/ });
    expect(confirmBtn).toBeDisabled();

    await user.type(screen.getByRole('textbox'), 'My Groupin');
    expect(confirmBtn).toBeDisabled();
    expect(deleteScheme).not.toHaveBeenCalled();

    await user.type(screen.getByRole('textbox'), 'g');
    expect(confirmBtn).not.toBeDisabled();
    await user.click(confirmBtn);

    expect(deleteScheme).toHaveBeenCalledTimes(1);
    expect(deleteScheme).toHaveBeenCalledWith('sch-a', 'My Grouping');
  });
});
