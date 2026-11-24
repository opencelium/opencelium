import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayoutStore } from '@app/layouts/AppLayout/layout.store';
import { switchMenu } from '@app/layouts/AppLayout/Sidebar/useMenuSwitch';

export const useGlobalHotkeys = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            const key = event.key.toLowerCase();
            if (key !== 'm' && key !== 'w') return;

            event.preventDefault();

            if (key === 'm') {
                const { menuType } = useLayoutStore.getState();
                switchMenu(navigate, menuType === 'main' ? 'admin' : 'main');
                return;
            }

            navigate('/workflow/create');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);
};
