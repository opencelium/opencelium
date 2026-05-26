import {ApiOutlined, BranchesOutlined, ScheduleOutlined, UserAddOutlined} from "@ant-design/icons";
import {MdNotificationAdd, MdOutlineAssistantPhoto, MdOutlineSettingsAccessibility} from "react-icons/md";
import {GrAggregate, GrConfigure, GrDocumentConfig, GrGroup, GrLicense, GrSystem} from "react-icons/gr";
import {PiTreeStructureLight} from "react-icons/pi";
import {FaRegFileCode} from "react-icons/fa";
import {ImInsertTemplate} from "react-icons/im";
import {BiCategory} from "react-icons/bi";
import {LuFileQuestion, LuFileCog} from "react-icons/lu";
import {TbLicense} from "react-icons/tb";
import {BsLayoutTextWindowReverse} from "react-icons/bs";
import {useMemo} from "react";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";


export const useMainMenu = (): any[] => {
    const {t} = useI18n('common');
    return useMemo(() => [
        {key: '/connector', icon: <BranchesOutlined/>, label: t('menu.connectors')},
        {key: '/connection', icon: <ApiOutlined/>, label: t('menu.connections')},
        {key: '/schedule', icon: <ScheduleOutlined/>, label: t('menu.schedules')},
    ], [t]);
};

export const useAdminMenu = (): any[] => {
    const {t} = useI18n('common');
    return useMemo(() => [
        {
            key: 'user_access',
            label: t('menu.usersAccess'),
            icon: <MdOutlineSettingsAccessibility/>,
            children: [
                {key: '/user', icon: <UserAddOutlined/>, label: t('menu.users')},
                {key: '/role', icon: <GrGroup/>, label: t('menu.groups')},
                {key: '/ldap/check', icon: <PiTreeStructureLight/>, label: t('menu.ldapCheck')},
            ],
        },
        {
            key: 'configurations',
            label: t('menu.configurations'),
            icon: <GrConfigure/>,
            children: [
                {key: '/invoker', icon: <FaRegFileCode/>, label: t('menu.invokers')},
                {key: '/connection-template', icon: <ImInsertTemplate/>, label: t('menu.connectionTemplates')},
                {key: '/data-aggregator', icon: <GrAggregate/>, label: t('menu.dataAggregator')},
                {key: '/notification-template', icon: <MdNotificationAdd/>, label: t('menu.notificationTemplates')},
                {key: '/category', icon: <BiCategory/>, label: t('menu.categories')},
                {key: '/support-file', icon: <LuFileQuestion/>, label: t('menu.supportFiles')},
            ],
        },
        {
            key: 'license',
            label: t('menu.licenseSystem'),
            icon: <TbLicense/>,
            children: [
                {key: '/license', icon: <GrLicense/>, label: t('menu.licenseManagement')},
                {key: '/update-assistant', icon: <MdOutlineAssistantPhoto/>, label: t('menu.updateAssistant')},
                {key: '/system-check', icon: <GrSystem/>, label: t('menu.systemCheck')},
                {key: '/system-config', icon: <GrDocumentConfig />, label: t('menu.config')},
            ],
        },
        {key: '/ui/config', icon: <BsLayoutTextWindowReverse/>, label: t('menu.ui')},
    ], [t]);
};
