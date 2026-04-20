import { useEffect, type ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TodoList } from '../components/TodoList';
import { useTodoLists } from '../contexts/TodoListsContext';
import { useTemplates } from '../contexts/TemplatesContext';
import { todoItemsToTemplateItems } from '../lib/templateItems';
import { saveCurrentListIdToStorage } from '../storage';

export function ListRoute(): ReactElement {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { lists, loading, updateList } = useTodoLists();
  const { createTemplate } = useTemplates();

  const list = listId ? lists.find((l) => l.id === listId) : undefined;

  useEffect(() => {
    if (list) {
      saveCurrentListIdToStorage(list.id);
    }
  }, [list]);

  useEffect(() => {
    if (!loading && listId && !list) {
      saveCurrentListIdToStorage(null);
    }
  }, [loading, listId, list]);

  const handleSaveAsTemplate = async (): Promise<void> => {
    if (!list) {
      return;
    }
    await createTemplate({
      name: list.name,
      items: todoItemsToTemplateItems(list.items),
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Loading list...</p>
      </div>
    );
  }

  if (!listId || !list) {
    return (
      <div className="error-panel">
        <p>List not found.</p>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
          Back to lists
        </button>
      </div>
    );
  }

  return (
    <TodoList
      list={list}
      onUpdateList={(updated) => void updateList(updated)}
      headerActions={
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => void handleSaveAsTemplate()}
        >
          Save as template
        </button>
      }
    />
  );
}
