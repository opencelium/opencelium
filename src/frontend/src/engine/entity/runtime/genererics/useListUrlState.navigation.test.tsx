import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { expect, it } from 'vitest';
import { useListUrlState } from './useListUrlState';

const defaults = { filters: {}, sortFields: [], sorting: [], pageSize: 10 };

function List() {
    const [state, update] = useListUrlState(defaults, true);
    const navigate = useNavigate();
    return (
        <>
            <output>{state.globalFilter}:{state.pagination.pageIndex + 1}</output>
            <button onClick={() => update(previous => ({
                ...previous,
                globalFilter: 'changed',
                pagination: { ...previous.pagination, pageIndex: 0 },
            }))}>Search</button>
            <button onClick={() => navigate('/list/update/1')}>Edit</button>
            <button onClick={() => navigate(-1)}>Leave list</button>
        </>
    );
}

function Detail() {
    const navigate = useNavigate();
    return <button onClick={() => navigate(-1)}>Back</button>;
}

function Location() {
    const { search } = useLocation();
    return <output data-testid="search">{search}</output>;
}

it('restores a shared URL and replaces the list history entry when state changes', () => {
    render(
        <MemoryRouter initialEntries={['/home', '/list?q=nightly&page=3']}>
            <Location />
            <Routes>
                <Route path="/home" element={<p>Home</p>} />
                <Route path="/list" element={<List />} />
                <Route path="/list/update/1" element={<Detail />} />
            </Routes>
        </MemoryRouter>,
    );

    expect(screen.getByText('nightly:3')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('nightly:3')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Search'));
    expect(screen.getByTestId('search')).toHaveTextContent('?q=changed');
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('changed:1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Leave list'));
    expect(screen.getByText('Home')).toBeInTheDocument();
});
