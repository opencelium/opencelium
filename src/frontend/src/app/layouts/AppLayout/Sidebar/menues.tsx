import {BranchesOutlined, DashboardOutlined, ScheduleOutlined, UserAddOutlined} from "@ant-design/icons";
import {GoWorkflow} from "react-icons/go";
import {MdNotificationAdd, MdOutlineAssistantPhoto, MdOutlineSettingsAccessibility} from "react-icons/md";
import {GrAggregate, GrConfigure, GrDocumentConfig, GrGroup, GrLicense, GrSystem} from "react-icons/gr";
import {PiTreeStructureLight} from "react-icons/pi";
import {FaRegFileCode} from "react-icons/fa";
import {ImInsertTemplate} from "react-icons/im";
import {BiCategory} from "react-icons/bi";
import {LuFileQuestion, LuFileCog} from "react-icons/lu";
import {TbLicense} from "react-icons/tb";
import {BsLayoutTextWindowReverse} from "react-icons/bs";
import {useMemo, type ReactNode} from "react";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {buildTestId} from "@shared/testing/testId.ts";
import {useAuth} from "@features/auth/useAuth.ts";
import type {PermissionComponent} from "@/engine/policy";
import {filterMenuItems} from "./filterMenuItems";

// Maps a sidebar menu key to the backend permission component that gates it (READ only —
// missing CREATE/UPDATE only hides those specific affordances, not the menu entry).
// Populated per-entity as permission gating is rolled out; unmapped keys are always shown.
const MENU_ITEM_COMPONENT: Partial<Record<string, PermissionComponent>> = {
    '/': 'DASHBOARD',
    '/connector': 'CONNECTOR',
    '/schedule': 'SCHEDULE',
    '/workflow': 'CONNECTION',
    '/user': 'USER',
    '/role': 'USERGROUP',
    '/invoker': 'INVOKER',
    '/system-config': 'APP',
};

// Render a leaf menu label as a real anchor so the browser can open the route
// in a new tab on ctrl/cmd/middle-click. Color is inherited so it matches the
// menu text in both light and dark themes. Normal-click navigation is still
// handled by the Menu's onClick (see NavigationMenu).
const link = (to: string, label: ReactNode): ReactNode => (
    <a href={to} style={{color: 'inherit', textDecoration: 'none'}}>
        {label}
    </a>
);

// One navigable entry, with a selector derived from its route ('/schedule' ->
// 'sidebar-menu-schedule'). rc-menu spreads props it does not recognise onto the
// rendered <li>, so the id lands on the whole row — icon included — rather than on the
// anchor inside it, which is what a tour or a test needs to point at.
const leaf = (key: string, icon: ReactNode, label: string) => ({
    key,
    icon,
    label: link(key, label),
    'data-testid': buildTestId('sidebar-menu', key),
});

export const useMainMenu = (): any[] => {
    const {t} = useI18n('common');
    const {normalizedUser} = useAuth();
    const permissions = normalizedUser?.permissions ?? [];
    return useMemo(() => filterMenuItems([
        leaf('/', <DashboardOutlined/>, t('menu.dashboard')),
        leaf('/connector', <BranchesOutlined/>, t('menu.connectors')),
        leaf('/workflow', <GoWorkflow/>, t('menu.connections')),
        leaf('/schedule', <ScheduleOutlined/>, t('menu.schedules')),
    ], permissions, MENU_ITEM_COMPONENT), [t, permissions]);
};

export const useAdminMenu = (): any[] => {
    const {t} = useI18n('common');
    const {normalizedUser} = useAuth();
    const permissions = normalizedUser?.permissions ?? [];
    return useMemo(() => filterMenuItems([
        {
            key: 'user_access',
            label: t('menu.usersAccess'),
            icon: <MdOutlineSettingsAccessibility/>,
            children: [
                leaf('/user', <UserAddOutlined/>, t('menu.users')),
                leaf('/role', <GrGroup/>, t('menu.groups')),
                leaf('/ldap/check', <PiTreeStructureLight/>, t('menu.ldapCheck')),
            ],
        },
        {
            key: 'configurations',
            label: t('menu.configurations'),
            icon: <GrConfigure/>,
            children: [
                leaf('/invoker', <FaRegFileCode/>, t('menu.invokers')),
                leaf('/workflow-template', <ImInsertTemplate/>, t('menu.connectionTemplates')),
                leaf('/data-aggregator', <GrAggregate/>, t('menu.dataAggregator')),
                leaf('/notification-template', <MdNotificationAdd/>, t('menu.notificationTemplates')),
                leaf('/category', <BiCategory/>, t('menu.categories')),
                leaf('/support-file', <LuFileQuestion/>, t('menu.supportFiles')),
            ],
        },
        {
            key: 'license',
            label: t('menu.licenseSystem'),
            icon: <TbLicense/>,
            children: [
                leaf('/license', <GrLicense/>, t('menu.licenseManagement')),
                leaf('/update-assistant', <MdOutlineAssistantPhoto/>, t('menu.updateAssistant')),
                leaf('/system-check', <GrSystem/>, t('menu.systemCheck')),
                leaf('/system-config', <GrDocumentConfig />, t('menu.config')),
            ],
        },
        leaf('/ui/config', <BsLayoutTextWindowReverse/>, t('menu.ui')),
    ], permissions, MENU_ITEM_COMPONENT), [t, permissions]);
};
