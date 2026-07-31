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

export const useMainMenu = (): any[] => {
    const {t} = useI18n('common');
    const {normalizedUser} = useAuth();
    const permissions = normalizedUser?.permissions ?? [];
    return useMemo(() => filterMenuItems([
        {key: '/', icon: <DashboardOutlined/>, label: link('/', t('menu.dashboard'))},
        {key: '/connector', icon: <BranchesOutlined/>, label: link('/connector', t('menu.connectors'))},
        {key: '/workflow', icon: <GoWorkflow/>, label: link('/workflow', t('menu.connections'))},
        {key: '/schedule', icon: <ScheduleOutlined/>, label: link('/schedule', t('menu.schedules'))},
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
                {key: '/user', icon: <UserAddOutlined/>, label: link('/user', t('menu.users'))},
                {key: '/role', icon: <GrGroup/>, label: link('/role', t('menu.groups'))},
                {key: '/ldap/check', icon: <PiTreeStructureLight/>, label: link('/ldap/check', t('menu.ldapCheck'))},
            ],
        },
        {
            key: 'configurations',
            label: t('menu.configurations'),
            icon: <GrConfigure/>,
            children: [
                {key: '/invoker', icon: <FaRegFileCode/>, label: link('/invoker', t('menu.invokers'))},
                {key: '/workflow-template', icon: <ImInsertTemplate/>, label: link('/workflow-template', t('menu.connectionTemplates'))},
                {key: '/data-aggregator', icon: <GrAggregate/>, label: link('/data-aggregator', t('menu.dataAggregator'))},
                {key: '/notification-template', icon: <MdNotificationAdd/>, label: link('/notification-template', t('menu.notificationTemplates'))},
                {key: '/category', icon: <BiCategory/>, label: link('/category', t('menu.categories'))},
                {key: '/support-file', icon: <LuFileQuestion/>, label: link('/support-file', t('menu.supportFiles'))},
            ],
        },
        {
            key: 'license',
            label: t('menu.licenseSystem'),
            icon: <TbLicense/>,
            children: [
                {key: '/license', icon: <GrLicense/>, label: link('/license', t('menu.licenseManagement'))},
                {key: '/update-assistant', icon: <MdOutlineAssistantPhoto/>, label: link('/update-assistant', t('menu.updateAssistant'))},
                {key: '/system-check', icon: <GrSystem/>, label: link('/system-check', t('menu.systemCheck'))},
                {key: '/system-config', icon: <GrDocumentConfig />, label: link('/system-config', t('menu.config'))},
            ],
        },
        {key: '/ui/config', icon: <BsLayoutTextWindowReverse/>, label: link('/ui/config', t('menu.ui'))},
    ], permissions, MENU_ITEM_COMPONENT), [t, permissions]);
};
