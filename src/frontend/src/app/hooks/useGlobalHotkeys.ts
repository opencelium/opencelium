import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayoutStore } from '@app/layouts/AppLayout/layout.store';

export const useGlobalHotkeys = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            const key = event.key.toLowerCase();
            if (key !== 'm' && key !== 'w') return;

            event.preventDefault();

            if (key === 'm') {
                const { menuType, setMenu, lastPathByMenu } = useLayoutStore.getState();
                const target = menuType === 'main' ? 'admin' : 'main';
                setMenu(target);
                navigate(lastPathByMenu[target]);
                return;
            }

            navigate('/workflow/create');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);
};
