import { Maximize2, Minimize2 } from 'lucide-react';
import { Collapse } from '@shared/ui/primitives/Collapse';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { EnhancementArgs } from '../EnhancementArgs/EnhancementArgs';
import EnhancementDescription from '../EnhancementDescription/EnhancementDescription';
import ScriptLanguage from '../ScriptLanguage/ScriptLanguage';
import EnhancementScript from '../EnhancementScript/EnhancementScript';
import type { Enhancement } from '../../../../types/connection';
import type { useEnhancementState } from './useEnhancementState';

type Props = {
	enhancement: Enhancement;
	readOnly?: boolean;
	state: ReturnType<typeof useEnhancementState>;
};

export function EnhancementDetails({ enhancement, readOnly, state }: Props) {
	const { t } = useI18n('workflow');
	const maximizeLabel = t(state.isScriptMaximized ? 'actions.minimizeScript' : 'actions.maximizeScript');
	return <div className='bodyLegacyEnhancementBody'>
		<div className='bodyLegacyEnhancementArgs'>
			<Collapse defaultActiveKeys={[]} items={[{
				key: 'variableInfo', label: t('args.sectionTitle'),
				content: <EnhancementArgs enhancement={enhancement} />,
			}]} />
		</div>
		<div className='bodyLegacyEnhancementLabel'>{t('enhancement.language')}</div>
		<div className='bodyLegacyEnhancementLanguage'>
			<ScriptLanguage readOnly={readOnly} language={enhancement.language}
				onChangeLanguage={state.onChangeLanguage} />
		</div>
		<div ref={state.scriptBoxRef} style={state.isScriptMaximized ? state.maximizedStyle : undefined}
			className={state.isScriptMaximized
				? 'bodyLegacyEnhancementScript bodyLegacyEnhancementScriptMaximized'
				: 'bodyLegacyEnhancementScript'}>
			<div className='bodyLegacyEnhancementLabel'>{t('enhancement.script')}</div>
			<div className='bodyLegacyEnhancementScriptEditor'>
				<span className='bodyLegacyScriptToggle'><Tooltip content={maximizeLabel}>
					<button type='button' className='logsHeaderIconButton logsHeaderIconButton--active'
						onClick={state.toggleScriptMaximized} aria-label={maximizeLabel}>
						{state.isScriptMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
					</button>
				</Tooltip></span>
				<EnhancementScript readOnly={readOnly} enhancement={enhancement}
					onChangeScript={state.onChangeScript} />
			</div>
		</div>
		<div className='bodyLegacyEnhancementDescription'>
			<EnhancementDescription readOnly={readOnly} description={enhancement.description || ''}
				onChangeDescription={state.onChangeDescription} />
		</div>
	</div>;
}
