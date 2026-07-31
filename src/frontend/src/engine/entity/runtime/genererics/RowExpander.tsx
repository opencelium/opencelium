import {IconButton} from '@shared/ui/primitives/IconButton';
import {Tooltip} from '@shared/ui/primitives/Tooltip';
import {useI18n} from '@shared/i18n/hooks/useI18n';
import './RowExpander.css';

type RowExpanderProps = {
    expanded: boolean;
    count: number;
    onToggle: (event: unknown) => void;
    testId: string;
};

// Toggle for a row's sub-rows. While collapsed, a pulsing count badge signals how
// many hidden sub-rows (e.g. running executions) are waiting to be revealed.
export function RowExpander({expanded, count, onToggle, testId}: RowExpanderProps) {
    const {t} = useI18n('common');
    return (
        <span className="row-expander" data-row-click-ignore>
            <Tooltip content={t(expanded ? 'list.collapseRow' : 'list.expandRow')}>
                <span className="row-expander__anchor">
                    <IconButton
                        iconProps={{name: expanded ? 'chevron-down' : 'chevron-right'}}
                        size="xs"
                        type="text"
                        onClick={onToggle}
                        testId={testId}
                    />
                    {!expanded && count > 0 && (
                        <span className="row-expander__badge">{count}</span>
                    )}
                </span>
            </Tooltip>
        </span>
    );
}
