import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmTypeToDeleteModal } from './ConfirmTypeToDeleteModal';

describe('ConfirmTypeToDeleteModal', () => {
  it('keeps confirm disabled until the phrase matches exactly', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmTypeToDeleteModal
        isOpen
        title="Delete template"
        message="This cannot be undone."
        confirmPhrase="My Template"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    const confirmBtn = screen.getByRole('button', { name: /delete permanently/i });
    expect(confirmBtn).toBeDisabled();

    await user.type(screen.getByRole('textbox'), 'My Templat');
    expect(confirmBtn).toBeDisabled();

    await user.type(screen.getByRole('textbox'), 'e');
    expect(confirmBtn).not.toBeDisabled();

    await user.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('clears the input when cancelled', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { rerender } = render(
      <ConfirmTypeToDeleteModal
        isOpen
        title="Delete"
        message="Sure?"
        confirmPhrase="X"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.type(screen.getByRole('textbox'), 'partial');
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();

    rerender(
      <ConfirmTypeToDeleteModal
        isOpen={false}
        title="Delete"
        message="Sure?"
        confirmPhrase="X"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    rerender(
      <ConfirmTypeToDeleteModal
        isOpen
        title="Delete"
        message="Sure?"
        confirmPhrase="X"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});
