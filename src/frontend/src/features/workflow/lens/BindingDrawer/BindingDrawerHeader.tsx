import { CloseOutlined } from '@ant-design/icons';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { MethodColorDot } from '../../components/MethodColorDot/MethodColorDot';
import type { LensBinding, LensEndpoint } from '../bindingLens.types';
import { REASON_KEYS } from '../BindingTable/bindingTableColumns';

type BindingDrawerHeaderProps = {
	consumer: LensEndpoint;
	/** Every reference filling the consumer field through the open source. */
	sources: LensBinding[];
	onClose: () => void;
};

/** The colour as a swatch, not as the name's own colour — see
 *  BindingTableEndpoint for why that hides a method name. */
function EndpointLabel({ endpoint }: { endpoint: LensEndpoint }) {
	const { t } = useI18n('workflow');
	return (
		<span className='bindingDrawerMethod'>
			<MethodColorDot color={endpoint.color} size={8} />
			{endpoint.label ?? t('bindingLens.unknownMethod')}
		</span>
	);
}

export function BindingDrawerHeader({ consumer, sources, onClose }: BindingDrawerHeaderProps) {
	const { t } = useI18n('workflow');
	return (
		<div className='drawerHeader'>
			<div className='drawerHeaderContent'>
				<div>
					<div className='drawerTitle'>{t('bindingLens.drawerTitle')}</div>
					<div className='drawerSubTitle'>
						<EndpointLabel endpoint={consumer} />
						{` ${consumer.path}`}
					</div>
					<ul className='bindingDrawerSources' aria-label={t('bindingLens.tableColumnSource')}>
						{sources.map((binding) => (
							<li key={binding.key}
								className={binding.invalidReason ? 'bindingDrawerSourceBroken' : undefined}>
								<span className='bindingDrawerSourceArrow'>&larr;</span>
								<EndpointLabel endpoint={binding.provider} />
								<span className='bindingDrawerSourcePath'>{binding.provider.path}</span>
								{binding.invalidReason && (
									<span className='bindingTableReason'>
										{t(REASON_KEYS[binding.invalidReason])}
									</span>
								)}
							</li>
						))}
					</ul>
				</div>
			</div>
			<button className='iconButton' type='button' onClick={onClose}
				data-testid='workflow-binding-drawer-close'>
				<CloseOutlined />
			</button>
		</div>
	);
}
