import {CommandPalette} from "@widgets/CommandPalette/CommandPalette.tsx";
import {useNavigate} from "react-router-dom";
import {useBreakpoints} from "@app/hooks/useBreakpoints.tsx";
import {Button} from "@shared/ui/primitives/Button";
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import {Tooltip} from "@shared/ui/primitives/Tooltip";
import {IconButton} from "@shared/ui/primitives/IconButton";
import {useAuth} from "@features/auth/useAuth.ts";
import {hasComponentPermission} from "@/engine/policy";
import {UserActions} from "@widgets/UserActions/UserActions";

const COMPACT_USER_ACTIONS_BELOW_WIDTH = 1200;
const ICON_ONLY_CREATE_BELOW_WIDTH = 1000;

export const TopBar = () => {
    const {width} = useBreakpoints();
    const {t: tCommon} = useI18n('common');
    const navigate = useNavigate();
    const {normalizedUser} = useAuth();
    const permissions = normalizedUser?.permissions ?? [];
    const canCreateWorkflow = hasComponentPermission(permissions, 'CONNECTION', 'CREATE');
    const openWorkflowCreate = () => navigate('/workflow/create');
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                height: '100%',
                margin: '0 24px 0 4px',
            }}
        >
            {/* The two sides share the leftover space equally, which keeps the palette
                centred; when there is none left, only the palette gives way, so it can
                never slide over the buttons beside it. */}
            <div style={{flex: '1 1 0', display: 'flex', alignItems: 'center'}}>
                {canCreateWorkflow && (
                    <Tooltip content={tCommon('topbar.createWorkflowHint')}>
                        {width < ICON_ONLY_CREATE_BELOW_WIDTH ? (
                            <IconButton
                                type="primary"
                                iconProps={{name: 'workflow', color: 'inherit', size: 16}}
                                onClick={openWorkflowCreate}
                                testId="topbar-create-workflow"
                            />
                        ) : (
                            <Button
                                type="primary"
                                iconLeft="workflow"
                                onClick={openWorkflowCreate}
                                testId="topbar-create-workflow"
                            >
                                {tCommon('topbar.createWorkflow')}
                            </Button>
                        )}
                    </Tooltip>
                )}
            </div>

            <div style={{flex: '0 1 600px', minWidth: 0}}>
                <CommandPalette/>
            </div>

            <div style={{flex: '1 1 0', display: 'flex', justifyContent: 'flex-end'}}>
                <UserActions layout={width < COMPACT_USER_ACTIONS_BELOW_WIDTH ? 'compact' : 'inline'} newFeatureId='changelog'/>
            </div>
        </div>
    );
};
