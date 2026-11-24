import type { ReactNode } from 'react';
import { getNotificationTool } from '../../tools/notificationTools';
import { ToolStep } from '../steps/tool/ToolStep';
import { ToolStepAside } from '../steps/tool/ToolStepAside';
import { WebhookStep } from '../steps/webhook/WebhookStep';
import { WebhookGuide } from '../steps/webhook/WebhookGuide';
import { MessageStep } from '../steps/message/MessageStep';
import { MessagePreview } from '../steps/message/MessagePreview';
import { RequestResponseStep } from '../steps/request/RequestResponseStep';
import type { NotificationDialogState } from './useNotificationDialog';

type Props = { state: NotificationDialogState; nodeColor?: string };

export function NotificationStepContent({ state, nodeColor }: Props) {
	const tool = state.config.tool ? getNotificationTool(state.config.tool) : null;
	let main: ReactNode;
	let aside: ReactNode = null;
	if (state.step === 1 || !tool) {
		main = <ToolStep selected={state.config.tool} onSelect={state.selectTool} />;
		aside = <ToolStepAside />;
	} else if (state.step === 2) {
		main = <WebhookStep state={state} tool={tool} />;
		aside = <WebhookGuide tool={tool} />;
	} else if (state.step === 3) {
		main = <MessageStep state={state} tool={tool} />;
		aside = <MessagePreview tool={tool} bodyText={state.bodyText} />;
	} else {
		main = <RequestResponseStep state={state} tool={tool} nodeColor={nodeColor} />;
	}
	return (
		<div className={`notificationDialogBody ${aside ? '' : 'notificationDialogBody--full'}`}>
			<div className='notificationDialogMain'>{main}</div>
			{aside && <aside className='notificationDialogAside'>{aside}</aside>}
		</div>
	);
}
