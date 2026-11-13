import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';

function Editor() {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	useUnsavedChangesGuard(true, 'Discard unsaved changes?');
	return <>
		<p>{pathname}</p>
		<button onClick={() => navigate('/workflow/update/8?playground=1&execution=9')}>
			Open in Playground
		</button>
	</>;
}

it('keeps the current editor on cancel and opens the recorded workflow on confirm', () => {
	const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
	try {
		render(<MemoryRouter initialEntries={['/workflow/update/7']}><Editor /></MemoryRouter>);
		const action = screen.getByRole('button', { name: 'Open in Playground' });
		fireEvent.click(action);
		expect(screen.getByText('/workflow/update/7')).toBeTruthy();
		fireEvent.click(action);
		expect(screen.getByText('/workflow/update/8')).toBeTruthy();
		expect(confirm).toHaveBeenCalledTimes(2);
	} finally {
		confirm.mockRestore();
	}
});
