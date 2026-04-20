import { useCallback, type ReactElement } from 'react';
import { useMatch, useNavigate, useParams } from 'react-router-dom';
import { GroupingEditor, type GroupingEditorPayload } from '../components/GroupingEditor';
import { useGroupings } from '../contexts/GroupingsContext';
import type { GroupingScheme, ItemGroup } from '../types';
import { newClientId } from '../lib/templateItems';

function makeInitialGroups(): ItemGroup[] {
  return [{ id: newClientId(), name: '', aliases: [] }];
}

export function GroupingEditRoute(): ReactElement {
  const matchNew = useMatch({ path: '/groupings/new', end: true });
  const { schemeId } = useParams<{ schemeId: string }>();
  const isNew = matchNew !== null;
  const navigate = useNavigate();
  const { schemes, loading, createScheme, updateScheme } = useGroupings();

  const scheme = !isNew && schemeId ? schemes.find((s) => s.id === schemeId) : undefined;

  const handleCreate = useCallback(
    async (payload: GroupingEditorPayload): Promise<void> => {
      const id = await createScheme({ name: payload.name, groups: payload.groups });
      if (id) {
        navigate('/groupings');
      }
    },
    [createScheme, navigate],
  );

  const handlePatch = useCallback(
    async (payload: GroupingEditorPayload): Promise<boolean> => {
      if (!scheme) {
        return false;
      }
      return updateScheme(
        { ...scheme, name: payload.name, groups: payload.groups },
        { silent: true },
      );
    },
    [scheme, updateScheme],
  );

  const handleDone = useCallback((): void => {
    navigate('/groupings');
  }, [navigate]);

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
          <button
            type="button"
            className="error-panel-action"
            onClick={() => navigate('/groupings')}
          >
            Back to groupings
          </button>
        </div>
      );
    }
  }

  const editorScheme: GroupingScheme | undefined = scheme;

  return (
    <div className="lists-view template-edit-view">
      <h2 className="section-label">{isNew ? 'New grouping' : 'Edit grouping'}</h2>
      <GroupingEditor
        key={isNew ? 'new' : schemeId}
        mode={isNew ? 'create' : 'edit'}
        initialName={isNew ? '' : editorScheme?.name ?? ''}
        initialGroups={isNew ? makeInitialGroups() : editorScheme?.groups ?? []}
        onCreate={isNew ? (p) => void handleCreate(p) : undefined}
        onPatch={isNew ? undefined : handlePatch}
        onCancel={handleCancel}
        onDone={isNew ? undefined : handleDone}
      />
    </div>
  );
}
