import { useI18n } from '@shared/i18n/hooks/useI18n';
import { HttpMethodBadge } from '@shared/ui/http-method/HttpMethodBadge';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import type { RequestBodyFormat, SidebarMethodInfo } from './sidebarMethodInfo';

type Props = { title: string; info: SidebarMethodInfo };

export function SidebarMethodSummary({ title, info }: Props) {
	const { t } = useI18n('workflow');
	const formatLabels: Record<RequestBodyFormat, string> = {
		json: 'JSON',
		xml: 'XML',
		form: t('sidebar.methodInfo.formFormat'),
		graphql: 'GraphQL',
	};
	return (
		<>
			<div className='sidebarItemTitleRow'>
				<HttpMethodBadge method={info.httpMethod} />
				<strong>{title}</strong>
			</div>
			{info.endpointPath || info.bodyFormat ? (
				<div className='sidebarMethodRequestRow'>
					<span className='sidebarMethodEndpoint' title={info.endpoint}>{info.endpointPath}</span>
					{info.bodyFormat ? (
						<Tooltip content={t('sidebar.methodInfo.bodyFormatHint')} placement='top'>
							<span className='sidebarMethodTag'>{formatLabels[info.bodyFormat]}</span>
						</Tooltip>
					) : null}
				</div>
			) : null}
		</>
	);
}
