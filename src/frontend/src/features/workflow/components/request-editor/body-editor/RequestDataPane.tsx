import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = { collapsed: boolean; onChange: (collapsed: boolean) => void; children: ReactNode };
export function RequestDataPane({ collapsed, onChange, children }: Props) {
	const { t } = useI18n('workflow');
	return (
		<div className={`bodyLegacyLeftPane ${collapsed ? 'bodyLegacyLeftPane--collapsed' : ''}`}>
			{collapsed && (
				<button
					className="bodyLegacyRequestStrip"
					type="button"
					data-testid="workflow-request-expand"
					aria-label={t('sandbox.expandRequest')}
					onClick={() => onChange(false)}
				>
					<ChevronRight size={16} />
					<span>{t('requestData')}</span>
				</button>
			)}
			<div className="bodyLegacyLeft" style={collapsed ? { display: 'none' } : undefined}>
				<button
					className="bodyLegacyRequestCollapse"
					type="button"
					data-testid="workflow-request-collapse"
					aria-label={t('sandbox.collapseRequest')}
					onClick={() => onChange(true)}
				>
					<ChevronLeft size={16} />
				</button>
				{children}
			</div>
		</div>
	);
}
