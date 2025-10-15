import { useState, useEffect, useOptimistic } from 'react';
import type { TodoList as TodoListType } from '../types';
import { ListSelector } from './ListSelector';
import { TodoList } from './TodoList';
import { ConfirmModal } from './ConfirmModal';
import { useTodoLists } from '../hooks/useTodoLists';
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
  const [pendingListName, setPendingListName] = useState<string | null>(null);
  const { lists, loading, createList: createListFirebase, updateList: updateListFirebase, deleteList: deleteListFirebase } = useTodoLists();

  // Optimistic state for lists - allows immediate UI updates
  const [optimisticLists, addOptimisticList] = useOptimistic(
    lists,
    (state: TodoListType[], newList: TodoListType) => [...state, newList]
  );

  // Load current list ID from localStorage on app start
  useEffect(() => {
    const savedCurrentListId = loadCurrentListIdFromStorage();
    
    if (savedCurrentListId && optimisticLists.some(list => list.id === savedCurrentListId)) {
      setCurrentListId(savedCurrentListId);
      setView('list');
      setShowBackButton(true); // Show immediately for restored state
    }
  }, [optimisticLists]); // Depend on optimisticLists to ensure they're loaded before checking

  // Watch for when a real list becomes available to replace temp list
  useEffect(() => {
    if (pendingListName && currentListId?.startsWith('temp-')) {
      // Look for a real list with the pending name that's not our temp list
      const realList = optimisticLists.find(
        list => list.name === pendingListName && !list.id.startsWith('temp-')
      );
      
      if (realList) {
        setCurrentListId(realList.id);
        setPendingListName(null);
        
        // Start showing back button 125ms before toast finishes
        setTimeout(() => {
          setShowBackButton(true);
        }, 2675);
      }
    }
  }, [optimisticLists, pendingListName, currentListId]);

  // Save current list ID whenever it changes
  useEffect(() => {
    saveCurrentListIdToStorage(currentListId);
  }, [currentListId]);

  const createList = async (name: string) => {
    // Generate a temporary ID for optimistic update
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticList: TodoListType = {
      id: tempId,
      name,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Optimistically add the list and switch to it immediately
    addOptimisticList(optimisticList);
    setCurrentListId(tempId);
    setView('list');
    setPendingListName(name); // Track the name to find the real list when it arrives

    // Perform the actual Firebase operation
    const actualListId = await createListFirebase(name);
    if (!actualListId) {
      // If creation failed, go back to selector
      setCurrentListId(null);
      setView('selector');
      setPendingListName(null);
    }
    // Success case is handled by the useEffect watching for the real list
  };

  const selectList = (listId: string) => {
    setCurrentListId(listId);
    setView('list');
    setShowBackButton(true); // Show immediately when selecting existing list
  };

  const deleteList = (listId: string) => {
    const listToDeleteObj = optimisticLists.find(list => list.id === listId);
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

  const currentList = currentListId ? optimisticLists.find(list => list.id === currentListId) : null;

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
            lists={optimisticLists}
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