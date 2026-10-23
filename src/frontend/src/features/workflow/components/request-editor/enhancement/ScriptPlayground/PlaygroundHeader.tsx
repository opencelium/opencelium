import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Button } from '@shared/ui/primitives/Button';
import { Icon } from '@shared/ui/primitives/Icon';

const NASHORN_DOCS_URL = 'https://docs.oracle.com/en/java/javase/14/nashorn/';

export function PlaygroundHeader({ hasDocsLink }: { hasDocsLink: boolean }) {
	const { t } = useI18n('workflow');
	return (
		<div className="scriptPlaygroundInputHeader">
			<strong className="scriptPlaygroundTitle">
				<Icon name="flask" size={17} color="inherit" />
				{t('sandbox.title')}
				<small>{t('sandbox.simulation')}</small>
			</strong>
			{hasDocsLink && (
				<Button
					type="link"
					iconRight="external-link"
					testId="script-playground-nashorn-docs"
					onClick={() => window.open(NASHORN_DOCS_URL, '_blank', 'noopener,noreferrer')}
				>
					{t('sandbox.nashornDocs')}
				</Button>
			)}
		</div>
	);
}
