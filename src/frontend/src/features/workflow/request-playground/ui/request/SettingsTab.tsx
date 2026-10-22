import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Input } from '@shared/ui/primitives/Input';
import { Select } from '@shared/ui/primitives/Select';
import { Switch } from '@shared/ui/primitives/Switch';
import type { PlaygroundSettings, ProxyMode } from '../../model/playground.types';

type ToggleSetting = 'followRedirects' | 'verifySsl' | 'saveResponseAsSample' | 'logToHistory';

const TOGGLES: ToggleSetting[] = ['followRedirects', 'verifySsl', 'saveResponseAsSample', 'logToHistory'];
const PROXY_MODES: ProxyMode[] = ['system', 'none', 'custom'];

type Props = {
	settings: PlaygroundSettings;
	onChange: (patch: Partial<PlaygroundSettings>) => void;
};

const toCount = (text: string) => Math.max(0, Math.floor(Number(text) || 0));

export function SettingsTab({ settings, onChange }: Props) {
	const { t } = useI18n('workflow');
	return (
		<div className='rpTabBody rpForm'>
			<div className='rpFormInline'>
				<label className='rpFormField rpFormField--narrow'>
					<span className='rpFormLabel'>{t('requestPlayground.settings.timeout')}</span>
					<Input type='number' value={String(settings.timeoutSec)} testId='request-playground-timeout'
						onChange={(event) => onChange({ timeoutSec: toCount(event.target.value) })} />
				</label>
				<label className='rpFormField rpFormField--narrow'>
					<span className='rpFormLabel'>{t('requestPlayground.settings.retries')}</span>
					<Input type='number' value={String(settings.retries)} testId='request-playground-retries'
						onChange={(event) => onChange({ retries: toCount(event.target.value) })} />
				</label>
				<label className='rpFormField'>
					<span className='rpFormLabel'>{t('requestPlayground.settings.proxy')}</span>
					<Select<ProxyMode> value={settings.proxyMode} sortOptions={false} testId='request-playground-proxy'
						onChange={(proxyMode) => onChange({ proxyMode })}
						options={PROXY_MODES.map((mode) => ({ value: mode, label: t(`requestPlayground.settings.proxyMode.${mode}`) }))} />
				</label>
				{settings.proxyMode === 'custom' && (
					<label className='rpFormField rpFormField--grow'>
						<span className='rpFormLabel'>{t('requestPlayground.settings.proxyUrl')}</span>
						<Input value={settings.proxyUrl} placeholder='http://proxy.local:3128'
							testId='request-playground-proxy-url' onChange={(event) => onChange({ proxyUrl: event.target.value })} />
					</label>
				)}
			</div>
			<div className='rpSettingList'>
				{TOGGLES.map((key) => (
					<div key={key} className='rpSettingRow'>
						<Switch checked={settings[key]} onChange={(checked) => onChange({ [key]: checked })}
							testId={`request-playground-setting-${key}`} />
						<span className='rpSettingText'>
							<span className='rpSettingLabel'>{t(`requestPlayground.settings.${key}.label`)}</span>
							<span className='rpHint'>{t(`requestPlayground.settings.${key}.hint`)}</span>
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
