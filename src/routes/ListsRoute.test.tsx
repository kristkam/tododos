import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ListsRoute } from './ListsRoute';
import { TodoListsContext, type TodoListsContextValue } from '../contexts/TodoListsContext';
import { TemplatesContext, type TemplatesContextValue } from '../contexts/TemplatesContext';

describe('ListsRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('creates a list from a template with pre-added items', async () => {
    const user = userEvent.setup();
    const createList = vi.fn().mockResolvedValue('new-list-id');
    const todoMock: TodoListsContextValue = {
      lists: [],
      loading: false,
      error: null,
      createList,
      updateList: vi.fn(),
      deleteList: vi.fn(),
    };
    const templatesMock: TemplatesContextValue = {
      templates: [
        {
          id: 'tpl-1',
          name: 'Weekly',
          items: [{ id: 'x', text: 'Buy milk' }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      loading: false,
      error: null,
      createTemplate: vi.fn(),
      updateTemplate: vi.fn(),
      deleteTemplate: vi.fn(),
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <TodoListsContext.Provider value={todoMock}>
          <TemplatesContext.Provider value={templatesMock}>
            <Routes>
              <Route path="/" element={<ListsRoute />} />
              <Route path="/lists/:listId" element={<div data-testid="list-detail">List</div>} />
            </Routes>
          </TemplatesContext.Provider>
        </TodoListsContext.Provider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /start from template/i }));
    await user.selectOptions(screen.getByLabelText(/^template$/i), 'tpl-1');
    await user.type(screen.getByLabelText(/new list name/i), 'Groceries');
    await user.click(screen.getByRole('button', { name: /^create list$/i }));

    expect(createList).toHaveBeenCalledTimes(1);
    expect(createList).toHaveBeenCalledWith(
      'Groceries',
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Buy milk',
          completed: false,
        }),
      ]),
    );
  });
});
