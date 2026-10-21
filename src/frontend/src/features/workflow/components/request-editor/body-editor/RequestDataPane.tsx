import type { ReactNode } from 'react';
import { Button } from '@shared/ui/primitives/Button';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = { isCollapsed: boolean; onExpand: () => void; children: ReactNode };
export function RequestDataPane({ isCollapsed, onExpand, children }: Props) {
	const { t } = useI18n('workflow');
	return (
		<div className={`bodyLegacyLeftPane ${isCollapsed ? 'bodyLegacyLeftPane--collapsed' : ''}`}>
			{isCollapsed && (
				<Tooltip content={t('sandbox.expandRequest')} placement="right">
					<Button
						className="bodyLegacyRequestStrip"
						iconLeft="chevron-right"
						testId="workflow-request-expand"
						onClick={onExpand}
					>
						<span>{t('requestData')}</span>
					</Button>
				</Tooltip>
			)}
			<div className="bodyLegacyLeft" style={isCollapsed ? { display: 'none' } : undefined}>
				{children}
			</div>
		</div>
	);
}
