import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from './TodoList';
import type { TodoList as TodoListModel } from '../types';

const baseList = (): TodoListModel => ({
  id: 'firestore-real-id-no-temp-prefix',
  name: 'Groceries',
  items: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  sortBy: 'normal',
});

describe('TodoList', () => {
  it('calls onUpdateList with the real list id when adding an item immediately after navigation', async () => {
    const user = userEvent.setup();
    const onUpdateList = vi.fn();
    render(<TodoList list={baseList()} onUpdateList={onUpdateList} />);

    await user.type(screen.getByPlaceholderText(/add a new item/i), 'Milk');
    await user.click(screen.getByRole('button', { name: /^Add$/ }));

    expect(onUpdateList).toHaveBeenCalledTimes(1);
    const updated = onUpdateList.mock.calls[0][0] as TodoListModel;
    expect(updated.id).toBe('firestore-real-id-no-temp-prefix');
    expect(updated.id.startsWith('temp-')).toBe(false);
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].text).toBe('Milk');
  });
});
