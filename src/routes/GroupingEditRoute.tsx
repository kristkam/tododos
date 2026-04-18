import { useCallback, type ReactElement } from 'react';
import { useMatch, useNavigate, useParams } from 'react-router-dom';
import { GroupingEditor } from '../components/GroupingEditor';
import { useGroupings } from '../contexts/GroupingsContext';
import { useTodoLists } from '../contexts/TodoListsContext';
import { useTemplates } from '../contexts/TemplatesContext';
import type { GroupingScheme, ItemGroup } from '../types';
import { newClientId } from '../lib/templateItems';
import { countGroupReferences } from '../lib/countGroupReferences';

function initialSingleGroup(): { groups: ItemGroup[]; defaultGroupId: string } {
  const id = newClientId();
  return { groups: [{ id, name: '' }], defaultGroupId: id };
}

export function GroupingEditRoute(): ReactElement {
  const matchNew = useMatch({ path: '/groupings/new', end: true });
  const { schemeId } = useParams<{ schemeId: string }>();
  const isNew = matchNew !== null;
  const navigate = useNavigate();
  const { schemes, loading, createScheme, updateScheme } = useGroupings();
  const { lists } = useTodoLists();
  const { templates } = useTemplates();

  const scheme =
    !isNew && schemeId ? schemes.find((s) => s.id === schemeId) : undefined;

  const buildRemoveGroupMessage = useCallback(
    (groupId: string): string | null => {
      if (!scheme) {
        return null;
      }
      const { listItemCount, templateItemCount } = countGroupReferences(scheme.id, groupId, lists, templates);
      const total = listItemCount + templateItemCount;
      if (total === 0) {
        return null;
      }
      return `This group is used by ${listItemCount} list item(s) and ${templateItemCount} template item(s). After you save, those items will use the default group until edited. Remove this group?`;
    },
    [lists, scheme, templates],
  );

  const handleSubmit = useCallback(
    async (payload: { name: string; groups: ItemGroup[]; defaultGroupId: string }): Promise<void> => {
      if (isNew) {
        const id = await createScheme({
          name: payload.name,
          groups: payload.groups,
          defaultGroupId: payload.defaultGroupId,
        });
        if (id) {
          navigate('/groupings');
        }
        return;
      }
      if (!scheme) {
        return;
      }
      const updated: GroupingScheme = {
        ...scheme,
        name: payload.name,
        groups: payload.groups,
        defaultGroupId: payload.defaultGroupId,
      };
      const ok = await updateScheme(updated);
      if (ok) {
        navigate('/groupings');
      }
    },
    [createScheme, isNew, navigate, scheme, updateScheme],
  );

  const handleCancel = useCallback((): void => {
    navigate('/groupings');
  }, [navigate]);

  if (!isNew) {
    if (loading) {
      return (
        <div className="loading">
          <div className="loading-spinner" />
          <p>Loading grouping…</p>
        </div>
      );
    }
    if (!schemeId || !scheme) {
      return (
        <div className="error-panel">
          <p>Grouping not found.</p>
          <button type="button" className="error-panel-action" onClick={() => navigate('/groupings')}>
            Back to groupings
          </button>
        </div>
      );
    }
  }

  const seed = isNew ? initialSingleGroup() : null;

  return (
    <div className="lists-view template-edit-view">
      <h2 className="section-label">{isNew ? 'New grouping' : 'Edit grouping'}</h2>
      <GroupingEditor
        key={isNew ? 'new' : schemeId}
        initialName={isNew ? '' : scheme?.name ?? ''}
        initialGroups={isNew ? seed!.groups : scheme?.groups ?? []}
        initialDefaultGroupId={isNew ? seed!.defaultGroupId : scheme?.defaultGroupId ?? ''}
        submitLabel={isNew ? 'Create grouping' : 'Save grouping'}
        buildRemoveGroupMessage={isNew ? undefined : buildRemoveGroupMessage}
        onSubmit={(p) => void handleSubmit(p)}
        onCancel={handleCancel}
      />
    </div>
  );
}
