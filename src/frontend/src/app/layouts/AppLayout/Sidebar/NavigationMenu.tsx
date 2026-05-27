import { Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";
import {useAdminMenu, useMainMenu} from "@app/layouts/AppLayout/Sidebar/menues.tsx";
import {AnimatePresence, motion} from "framer-motion";
export const NavigationMenu = () => {
    const navigate = useNavigate();
    const { menuType, openSubmenuKeys, setOpenSubmenuKeys } = useLayoutStore();

    const mainMenu = useMainMenu();
    const adminMenu = useAdminMenu();
    const items = menuType === 'main' ? mainMenu : adminMenu;
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={menuType}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.25 }}
            >
                <Menu
                    mode="inline"
                    onClick={({ key, domEvent }) => {
                        // Modifier-held clicks fall through to the label's <a href>,
                        // letting the browser open the route in a new tab.
                        if (domEvent.metaKey || domEvent.ctrlKey || domEvent.shiftKey) return;
                        domEvent.preventDefault();
                        navigate(key);
                    }}
                    items={items}
                    openKeys={openSubmenuKeys}
                    onOpenChange={(keys) => setOpenSubmenuKeys(keys as string[])}
                />
            </motion.div>
        </AnimatePresence>
    );
};
