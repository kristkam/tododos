import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TemplatesRoute } from './TemplatesRoute';
import { TemplatesContext, type TemplatesContextValue } from '../contexts/TemplatesContext';

describe('TemplatesRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not delete until the template name is typed exactly', async () => {
    const user = userEvent.setup();
    const deleteTemplate = vi.fn().mockResolvedValue(true);
    const templatesMock: TemplatesContextValue = {
      templates: [
        {
          id: 'tpl-a',
          name: 'My Template',
          items: [{ id: 'i1', text: 'One' }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      loading: false,
      error: null,
      createTemplate: vi.fn(),
      updateTemplate: vi.fn(),
      deleteTemplate,
    };

    render(
      <MemoryRouter initialEntries={['/templates']}>
        <TemplatesContext.Provider value={templatesMock}>
          <Routes>
            <Route path="/templates" element={<TemplatesRoute />} />
          </Routes>
        </TemplatesContext.Provider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /delete template my template/i }));
    const confirmBtn = screen.getByRole('button', { name: /^Delete template$/ });
    expect(confirmBtn).toBeDisabled();

    await user.type(screen.getByRole('textbox'), 'My Templat');
    expect(confirmBtn).toBeDisabled();
    expect(deleteTemplate).not.toHaveBeenCalled();

    await user.type(screen.getByRole('textbox'), 'e');
    expect(confirmBtn).not.toBeDisabled();
    await user.click(confirmBtn);

    expect(deleteTemplate).toHaveBeenCalledTimes(1);
    expect(deleteTemplate).toHaveBeenCalledWith('tpl-a', 'My Template');
  });
});
