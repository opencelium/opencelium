import type { NotificationTool } from '../tools/notificationTool.types';
import { readableTextColor } from '../../utils/methodColor';

type Props = { tool: NotificationTool; className: string };

/** The tool's logo when it ships one, otherwise its abbreviation on the brand colour. */
export function NotificationToolMark({ tool, className }: Props) {
	if (tool.logo) {
		return (
			<span className={`${className} notificationToolLogo`}>
				<img src={tool.logo} alt='' aria-hidden='true' draggable={false} />
			</span>
		);
	}
	return (
		<span className={className} style={{ background: tool.brandColor, color: readableTextColor(tool.brandColor) }}>
			{tool.abbreviation}
		</span>
	);
}
