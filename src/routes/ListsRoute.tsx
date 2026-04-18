import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListSelector } from '../components/ListSelector';
import { ConfirmModal } from '../components/ConfirmModal';
import { useTodoLists } from '../contexts/TodoListsContext';
import { loadCurrentListIdFromStorage } from '../storage';
import type { TodoList } from '../types';

export function ListsRoute(): ReactElement {
  const { lists, loading, createList, deleteList } = useTodoLists();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listToDelete, setListToDelete] = useState<TodoList | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }
    const saved = loadCurrentListIdFromStorage();
    if (saved && lists.some((l) => l.id === saved)) {
      navigate(`/lists/${saved}`, { replace: true });
    }
  }, [loading, lists, navigate]);

  const handleCreateList = async (name: string): Promise<void> => {
    const id = await createList(name);
    if (id) {
      navigate(`/lists/${id}`);
    }
  };

  const handleDeleteRequest = (listId: string): void => {
    const found = lists.find((l) => l.id === listId);
    if (found) {
      setListToDelete(found);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteList = async (): Promise<void> => {
    if (!listToDelete) {
      return;
    }
    const { id, name } = listToDelete;
    // Close immediately so a slow or flaky network does not leave the modal stuck open.
    setShowDeleteModal(false);
    setListToDelete(null);
    await deleteList(id, name);
  };

  const cancelDeleteList = (): void => {
    setShowDeleteModal(false);
    setListToDelete(null);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Loading your lists...</p>
      </div>
    );
  }

  return (
    <>
      <ListSelector
        lists={lists}
        currentListId={null}
        onSelectList={(id) => navigate(`/lists/${id}`)}
        onCreateList={handleCreateList}
        onDeleteList={handleDeleteRequest}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete List"
        message={
          listToDelete
            ? `Are you sure you want to delete "${listToDelete.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={() => {
          void confirmDeleteList();
        }}
        onCancel={cancelDeleteList}
      />
    </>
  );
}
