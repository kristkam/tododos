import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import type { GroupingScheme, ListTemplate } from '../types';

const NEW_LIST_NAME_INPUT_ID = 'template-picker-list-name';
const OPTIONAL_GROUPING_ID = 'template-picker-optional-grouping';

export type TemplatePickerModalProps = {
  isOpen: boolean;
  templates: ListTemplate[];
  templatesLoading: boolean;
  groupingSchemes: GroupingScheme[];
  groupingsLoading: boolean;
  onClose: () => void;
  /** Return whether the list was created (parent may close the modal on true). */
  onCreateFromTemplate: (
    template: ListTemplate,
    listName: string,
    options?: { groupingSchemeId?: string },
  ) => boolean | Promise<boolean>;
};

export function TemplatePickerModal({
  isOpen,
  templates,
  templatesLoading,
  groupingSchemes,
  groupingsLoading,
  onClose,
  onCreateFromTemplate,
}: TemplatePickerModalProps): ReactElement | null {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listName, setListName] = useState('');
  const [optionalGroupingId, setOptionalGroupingId] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setSelectedId(null);
    setListName('');
    setOptionalGroupingId('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  /** Keep selection if templates refresh; otherwise stay on placeholder (no implicit first pick). */
  useEffect(() => {
    if (!isOpen || templates.length === 0) {
      return;
    }
    setSelectedId((current) => {
      if (current && templates.some((t) => t.id === current)) {
        return current;
      }
      return null;
    });
  }, [isOpen, templates]);

  if (!isOpen) {
    return null;
  }

  const selected = selectedId ? templates.find((t) => t.id === selectedId) : undefined;
  const templateHasGrouping = Boolean(selected?.groupingSchemeId);
  const canCreateList =
    !templatesLoading && templates.length > 0 && Boolean(selectedId) && listName.trim().length > 0;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const trimmed = listName.trim();
    if (!selected || !trimmed) {
      return;
    }
    const opts =
      !templateHasGrouping && optionalGroupingId.trim()
        ? { groupingSchemeId: optionalGroupingId.trim() }
        : undefined;
    await Promise.resolve(onCreateFromTemplate(selected, trimmed, opts));
  };

  const inheritedSchemeName = selected?.groupingSchemeId
    ? groupingSchemes.find((s) => s.id === selected.groupingSchemeId)?.name
    : undefined;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        className="modal-content modal-content-wide template-picker-modal"
        onClick={(ev) => ev.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
      >
        <div className="modal-header">
          <h3 id="template-picker-title">Start from template</h3>
        </div>
        <div className="modal-body template-picker-body">
          {templatesLoading ? (
            <p className="template-picker-status">Loading templates…</p>
          ) : templates.length === 0 ? (
            <div className="template-picker-empty">
              <p>No templates yet. Create one to reuse item lists.</p>
            </div>
          ) : (
            <form id="template-picker-form" onSubmit={(e) => void submit(e)}>
              <label className="template-picker-label" htmlFor="template-picker-select">
                Template
              </label>
              <select
                id="template-picker-select"
                className={
                  selectedId
                    ? 'template-picker-select'
                    : 'template-picker-select template-picker-select-placeholder'
                }
                value={selectedId ?? ''}
                onChange={(e) => setSelectedId(e.target.value || null)}
              >
                <option value="">Choose a template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.items.length} {t.items.length === 1 ? 'item' : 'items'})
                  </option>
                ))}
              </select>

              {templateHasGrouping ? (
                <p className="template-picker-inherited-grouping" role="status">
                  Grouped by: {inheritedSchemeName ?? 'Unknown scheme'}
                </p>
              ) : (
                <>
                  <label className="template-picker-label" htmlFor={OPTIONAL_GROUPING_ID}>
                    Grouping (optional)
                  </label>
                  <select
                    id={OPTIONAL_GROUPING_ID}
                    className="template-picker-select"
                    value={optionalGroupingId}
                    onChange={(e) => setOptionalGroupingId(e.target.value)}
                    disabled={groupingsLoading || groupingSchemes.length === 0}
                  >
                    <option value="">None</option>
                    {groupingSchemes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label className="template-picker-label" htmlFor={NEW_LIST_NAME_INPUT_ID}>
                New list name
              </label>
              <input
                id={NEW_LIST_NAME_INPUT_ID}
                type="text"
                className="template-picker-name-input"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Name for your new list…"
                autoComplete="off"
              />
            </form>
          )}
        </div>
        <div className="modal-footer template-picker-footer">
          <div className="template-picker-footer-links">
            <Link to="/templates" className="template-picker-templates-link" onClick={onClose}>
              Manage templates
            </Link>
            <Link to="/groupings" className="template-picker-templates-link" onClick={onClose}>
              Manage groupings
            </Link>
          </div>
          <div className="template-picker-footer-buttons">
            <button type="button" onClick={onClose} className="modal-btn cancel-btn">
              Cancel
            </button>
            {!templatesLoading && templates.length > 0 ? (
              <button
                type="submit"
                form="template-picker-form"
                className="modal-btn primary-submit"
                disabled={!canCreateList}
              >
                Create list
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
