import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListSelector } from '../components/ListSelector';
import { ConfirmModal } from '../components/ConfirmModal';
import { TemplatePickerModal } from '../components/TemplatePickerModal';
import { useTodoLists } from '../contexts/TodoListsContext';
import { useTemplates } from '../contexts/TemplatesContext';
import { useGroupings } from '../contexts/GroupingsContext';
import { materializeTemplateItems } from '../lib/templateItems';
import { loadCurrentListIdFromStorage } from '../storage';
import type { ListTemplate, TodoList } from '../types';

export function ListsRoute(): ReactElement {
  const { lists, loading, createList, deleteList } = useTodoLists();
  const { templates, loading: templatesLoading } = useTemplates();
  const { schemes, loading: groupingsLoading } = useGroupings();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listToDelete, setListToDelete] = useState<TodoList | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }
    const saved = loadCurrentListIdFromStorage();
    if (saved && lists.some((l) => l.id === saved)) {
      navigate(`/lists/${saved}`, { replace: true });
    }
  }, [loading, lists, navigate]);

  const handleCreateList = async (name: string, options?: { groupingSchemeId?: string }): Promise<void> => {
    const id = await createList(name, options);
    if (id) {
      navigate(`/lists/${id}`);
    }
  };

  const handleCreateFromTemplate = async (
    template: ListTemplate,
    listName: string,
    options?: { groupingSchemeId?: string },
  ): Promise<boolean> => {
    const listSchemeId = template.groupingSchemeId ?? options?.groupingSchemeId;
    const scheme = listSchemeId ? schemes.find((s) => s.id === listSchemeId) : undefined;
    const seedItems = materializeTemplateItems(template, scheme);
    const id = await createList(listName, { seedItems, groupingSchemeId: listSchemeId });
    if (id) {
      setTemplatePickerOpen(false);
      navigate(`/lists/${id}`);
      return true;
    }
    return false;
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
        groupingSchemes={schemes}
        groupingsLoading={groupingsLoading}
        onSelectList={(id) => navigate(`/lists/${id}`)}
        onCreateList={(name, opts) => void handleCreateList(name, opts)}
        onDeleteList={handleDeleteRequest}
        onStartFromTemplate={() => setTemplatePickerOpen(true)}
      />
      <TemplatePickerModal
        isOpen={templatePickerOpen}
        templates={templates}
        templatesLoading={templatesLoading}
        groupingSchemes={schemes}
        groupingsLoading={groupingsLoading}
        onClose={() => setTemplatePickerOpen(false)}
        onCreateFromTemplate={(template, listName, opts) => handleCreateFromTemplate(template, listName, opts)}
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
