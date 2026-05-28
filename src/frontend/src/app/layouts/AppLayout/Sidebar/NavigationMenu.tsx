import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef } from 'react';
import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";
import {useAdminMenu, useMainMenu} from "@app/layouts/AppLayout/Sidebar/menues.tsx";
import {AnimatePresence, motion} from "framer-motion";

type MenuItem = { key: string; children?: MenuItem[] };

// Group entries like 'user_access' carry children and are never routes;
// only leaves map to a navigable path.
const collectLeafKeys = (items: MenuItem[]): string[] =>
    items.flatMap((item) => (item.children ? collectLeafKeys(item.children) : [item.key]));

// The active item is the leaf whose route is the longest prefix of the current
// pathname, matched on segment boundaries so '/connection' doesn't swallow
// '/connection-template' while '/invoker/5/edit' still selects '/invoker'.
const findSelectedKey = (items: MenuItem[], pathname: string): string | undefined =>
    collectLeafKeys(items)
        .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
        .sort((a, b) => b.length - a.length)[0];

// Chain of group keys from the menu root down to (but excluding) the target
// leaf, or null when the leaf isn't in this tree.
const findAncestorKeys = (items: MenuItem[], targetKey: string): string[] | null => {
    for (const item of items) {
        if (item.key === targetKey) return [];
        if (item.children) {
            const sub = findAncestorKeys(item.children, targetKey);
            if (sub) return [item.key, ...sub];
        }
    }
    return null;
};

export const NavigationMenu = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { menuType, openSubmenuKeys, setOpenSubmenuKeys, setMenu } = useLayoutStore();

    const mainMenu = useMainMenu();
    const adminMenu = useAdminMenu();
    const items = menuType === 'main' ? mainMenu : adminMenu;

    // A route lives in at most one menu; resolve the match in each so we can
    // both highlight the active item and detect when it belongs to the menu
    // that isn't currently shown.
    const mainKey = useMemo(() => findSelectedKey(mainMenu, pathname), [mainMenu, pathname]);
    const adminKey = useMemo(() => findSelectedKey(adminMenu, pathname), [adminMenu, pathname]);
    const selectedKey = menuType === 'main' ? mainKey : adminKey;

    // Landing on a route owned by the other menu (e.g. /invoker while the main
    // menu is shown, or a refresh that restored the wrong menuType) switches to
    // its menu. Guarded by pathname so a manual menu toggle on the same page
    // isn't overridden.
    const switchedForPath = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (switchedForPath.current === pathname) return;
        switchedForPath.current = pathname;
        const owner = mainKey ? 'main' : adminKey ? 'admin' : undefined;
        if (owner && owner !== menuType) setMenu(owner);
    }, [pathname, mainKey, adminKey, menuType, setMenu]);

    // Open the group(s) holding the active route only when the route actually
    // changes — guarded by the selected-key *value*, not the effect deps,
    // because `items` is a fresh reference every render (useI18n's `t` isn't
    // memoized). Without this guard the effect would re-fire on the re-render
    // that a manual collapse triggers and immediately re-open the group.
    const openedForKey = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (selectedKey === openedForKey.current) return;
        openedForKey.current = selectedKey;
        if (!selectedKey) return;
        const ancestors = findAncestorKeys(items, selectedKey);
        if (!ancestors || ancestors.length === 0) return;
        const current = useLayoutStore.getState().openSubmenuKeys;
        const missing = ancestors.filter((key) => !current.includes(key));
        if (missing.length > 0) setOpenSubmenuKeys([...current, ...missing]);
    }, [selectedKey, items, setOpenSubmenuKeys]);
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
                    selectedKeys={selectedKey ? [selectedKey] : []}
                    openKeys={openSubmenuKeys}
                    onOpenChange={(keys) => setOpenSubmenuKeys(keys as string[])}
                />
            </motion.div>
        </AnimatePresence>
    );
};
