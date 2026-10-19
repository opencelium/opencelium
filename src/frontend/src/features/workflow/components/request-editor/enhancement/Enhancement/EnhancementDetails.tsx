import { useRef, useState } from 'react';
import type { Ace } from 'ace-builds';
import { Splitter } from '@shared/ui/primitives/Splitter';
import { ScriptPlayground } from '../ScriptPlayground/ScriptPlayground';
import { usePlaygroundLayout } from '../ScriptPlayground/usePlaygroundLayout';
import type { CompatibilityIssue } from '@features/workflow/script-sandbox/checkNashornCompatibility';
import { Collapse } from '@shared/ui/primitives/Collapse';
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
	playgroundOpen?: boolean;
	onClosePlayground?: () => void;
	onChangeScript?: (script: string) => void;
	state: ReturnType<typeof useEnhancementState>;
};

export function EnhancementDetails({
	enhancement,
	readOnly,
	state,
	playgroundOpen,
	onClosePlayground,
	onChangeScript,
}: Props) {
	const { t } = useI18n('workflow');
	const [draft, setDraft] = useState(enhancement.script);
	const [sourceScript, setSourceScript] = useState(enhancement.script);
	const {
		scriptBoxRef,
		isScriptMaximized,
		maximizedStyle,
		toggleScriptMaximized,
		onChangeLanguage,
		onChangeScript: changeScript,
		onChangeDescription,
	} = state;
	const [issues, setIssues] = useState<CompatibilityIssue[]>([]);
	const [runtimeLocation, setRuntimeLocation] = useState<{ line: number; column: number }>();
	const editor = useRef<Ace.Editor | null>(null);
	const wrapper = useRef<HTMLDivElement>(null);
	const stacked = usePlaygroundLayout(wrapper);
	if (sourceScript !== enhancement.script) {
		setSourceScript(enhancement.script);
		if (draft !== enhancement.script) {
			setDraft(enhancement.script);
			setRuntimeLocation(undefined);
		}
	}
	const onEditorReady = (instance: Ace.Editor) => {
		editor.current = instance;
		instance.commands.addCommand({
			name: 'runPlayground',
			bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
			exec: () =>
				wrapper.current
					?.querySelector<HTMLButtonElement>('[data-testid="script-playground-run"]')
					?.click(),
		});
	};
	const details = (
		<div className="bodyLegacyEnhancementBody">
			<div className="bodyLegacyEnhancementArgs">
				<Collapse
					defaultActiveKeys={[]}
					items={[
						{
							key: 'variableInfo',
							label: (
								<span className="scriptVariablesSummary">
									<span>{t('sandbox.variables')}</span>
									<small>
										{Object.keys(enhancement.args)
											.filter((name) => /^VAR_\d+$/.test(name))
											.join(', ')}
									</small>
								</span>
							),
							testId: 'workflow-enhancement-variables-toggle',
							content: <EnhancementArgs enhancement={enhancement} />,
						},
					]}
				/>
			</div>
			<div className="bodyLegacyEnhancementLabel">{t('enhancement.language')}</div>
			<div className="bodyLegacyEnhancementLanguage">
				<ScriptLanguage
					readOnly={readOnly}
					language={enhancement.language}
					onChangeLanguage={onChangeLanguage}
				/>
			</div>
			<div
				ref={scriptBoxRef}
				style={isScriptMaximized ? maximizedStyle : undefined}
				className={
					isScriptMaximized
						? 'bodyLegacyEnhancementScript bodyLegacyEnhancementScriptMaximized'
						: 'bodyLegacyEnhancementScript'
				}
			>
				<div className="bodyLegacyEnhancementLabel">{t('enhancement.script')}</div>
				<div className="bodyLegacyEnhancementScriptEditor">
					{isScriptMaximized && (
						<button
							className="bodyLegacyScriptToggle scriptMaximizeExit"
							type="button"
							data-testid="workflow-script-minimize"
							onClick={toggleScriptMaximized}
						>
							{t('actions.minimizeScript')}
						</button>
					)}

					<EnhancementScript
						readOnly={readOnly}
						enhancement={enhancement}
						onChangeScript={onChangeScript ?? changeScript}
						runtimeLocation={runtimeLocation}
						onDraftChange={(value) => {
							setDraft(value);
							setRuntimeLocation(undefined);
						}}
						onIssuesChange={setIssues}
						onEditorReady={onEditorReady}
					/>
				</div>
			</div>
			<div className="bodyLegacyEnhancementDescription">
				<EnhancementDescription
					readOnly={readOnly}
					description={enhancement.description || ''}
					onChangeDescription={onChangeDescription}
				/>
			</div>
		</div>
	);
	return (
		<div
			ref={wrapper}
			style={{
				flex: 1,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
			}}
		>
			<Splitter
				className={
					playgroundOpen && stacked
						? 'scriptPlaygroundLayout scriptPlaygroundLayout--stacked'
						: 'scriptPlaygroundLayout'
				}
				layout={playgroundOpen && stacked ? 'vertical' : 'horizontal'}
				style={{ flex: 1, minHeight: 0 }}
				panels={[
					{ key: 'editor', content: details, defaultSize: '55%', min: '30%' },
					...(playgroundOpen
						? [
								{
									key: 'playground',
									min: '30%',
									content: (
										<ScriptPlayground
											key={enhancement.enhanceId}
											enhancement={enhancement}
											script={draft}
											issues={issues}
											onRuntimeLocation={setRuntimeLocation}
											onClose={() => onClosePlayground?.()}
											onLocate={(line, column) => {
												editor.current?.gotoLine(line, column, true);
												editor.current?.focus();
											}}
										/>
									),
								},
							]
						: []),
				]}
			/>
		</div>
	);
}
