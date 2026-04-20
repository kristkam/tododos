import { useEffect, useId, useState, type KeyboardEvent, type ReactElement } from 'react';

export type ConfirmTypeToDeleteModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  /** User must type this string exactly (e.g. template name) before delete is enabled. */
  confirmPhrase: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmTypeToDeleteModal({
  isOpen,
  title,
  message,
  confirmPhrase,
  confirmText = 'Delete permanently',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmTypeToDeleteModalProps): ReactElement | null {
  const [typed, setTyped] = useState('');
  const inputId = useId();

  useEffect(() => {
    if (isOpen) {
      setTyped('');
    }
  }, [isOpen, confirmPhrase]);

  if (!isOpen) {
    return null;
  }

  const matches = typed === confirmPhrase;

  const handleCancel = (): void => {
    setTyped('');
    onCancel();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && matches) {
      onConfirm();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="presentation"
    >
      <div className="modal-content modal-content-wide">
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
          <label htmlFor={inputId} className="confirm-phrase-label">
            Type <strong className="confirm-phrase-emphasis">{confirmPhrase}</strong> to confirm:
          </label>
          <input
            id={inputId}
            type="text"
            className="text-field"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={typed.length > 0 && !matches}
          />
        </div>
        <div className="modal-footer">
          <button type="button" onClick={handleCancel} className="btn btn--secondary" autoFocus>
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn--danger"
            disabled={!matches}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
