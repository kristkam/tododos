import type { ReactElement } from 'react';
import { CheckIcon } from './icons';

export type CheckboxProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Used for aria-label (task title, etc.). */
  label: string;
};

/**
 * Accessible circular checkbox (native inputs cannot match the iOS-style design).
 */
export function Checkbox({ checked, onChange, label }: CheckboxProps): ReactElement {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`Mark "${label}" ${checked ? 'incomplete' : 'complete'}`}
      className={`task-checkbox ${checked ? 'is-checked' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
    >
      {checked ? (
        <span className="task-checkbox-check task-checkbox-check--enter" aria-hidden>
          <CheckIcon size={14} color="currentColor" />
        </span>
      ) : null}
    </button>
  );
}
