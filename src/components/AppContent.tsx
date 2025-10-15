import { useState, useEffect } from 'react';
import type { TodoList as TodoListType } from '../types';
import { ListSelector } from './ListSelector';
import { TodoList } from './TodoList';
import { ConfirmModal } from './ConfirmModal';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { 
  saveCurrentListIdToStorage, 
  loadCurrentListIdFromStorage 
} from '../storage';

export function AppContent() {
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [view, setView] = useState<'selector' | 'list'>('selector');
  const [showBackButton, setShowBackButton] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listToDelete, setListToDelete] = useState<TodoListType | null>(null);
  const { lists, loading, createList: createListFirebase, updateList: updateListFirebase, deleteList: deleteListFirebase } = useFirebaseSync();

  // Load current list ID from localStorage on app start
  useEffect(() => {
    const savedCurrentListId = loadCurrentListIdFromStorage();
    
    if (savedCurrentListId && lists.some(list => list.id === savedCurrentListId)) {
      setCurrentListId(savedCurrentListId);
      setView('list');
      setShowBackButton(true); // Show immediately for restored state
    }
  }, [lists]); // Depend on lists to ensure they're loaded before checking

  // Save current list ID whenever it changes
  useEffect(() => {
    saveCurrentListIdToStorage(currentListId);
  }, [currentListId]);

  const createList = async (name: string) => {
    const listId = await createListFirebase(name);
    if (listId) {
      setCurrentListId(listId);
      setView('list'); // Immediate view switch to prevent flickering
      
      // Start showing back button 125ms before toast finishes
      // Toast duration: 2500ms + exit animation: 300ms = 2800ms total
      // Start button 125ms before toast is gone for optimal overlap
      setTimeout(() => {
        setShowBackButton(true);
      }, 2675); // Show button 125ms before toast is completely gone
    }
  };

  const selectList = (listId: string) => {
    setCurrentListId(listId);
    setView('list');
    setShowBackButton(true); // Show immediately when selecting existing list
  };

  const deleteList = (listId: string) => {
    const listToDeleteObj = lists.find(list => list.id === listId);
    if (listToDeleteObj) {
      setListToDelete(listToDeleteObj);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteList = async () => {
    if (listToDelete) {
      const success = await deleteListFirebase(listToDelete.id, listToDelete.name);
      
      if (success && currentListId === listToDelete.id) {
        setCurrentListId(null);
        setView('selector');
      }
    }
    setShowDeleteModal(false);
    setListToDelete(null);
  };

  const cancelDeleteList = () => {
    setShowDeleteModal(false);
    setListToDelete(null);
  };

  const updateList = async (updatedList: TodoListType) => {
    await updateListFirebase(updatedList);
  };

  const goBackToSelector = () => {
    setShowBackButton(false);
    setCurrentListId(null);
    setView('selector');
  };

  const currentList = currentListId ? lists.find(list => list.id === currentListId) : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tododos</h1>
        {view === 'list' && showBackButton && (
          <button onClick={goBackToSelector} className="back-btn">
            ← Back to Lists
          </button>
        )}
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading your lists...</p>
          </div>
        ) : view === 'selector' ? (
          <ListSelector
            lists={lists}
            currentListId={currentListId}
            onSelectList={selectList}
            onCreateList={createList}
            onDeleteList={deleteList}
          />
        ) : currentList ? (
          <TodoList
            list={currentList}
            onUpdateList={updateList}
          />
        ) : (
          <div className="error">List not found</div>
        )}
      </main>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete List"
        message={listToDelete ? `Are you sure you want to delete "${listToDelete.name}"? This action cannot be undone.` : ''}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteList}
        onCancel={cancelDeleteList}
      />
    </div>
  );
}