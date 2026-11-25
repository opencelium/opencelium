import type { ReactNode } from 'react';
import type { NotificationPreviewCard } from '../../../tools/notificationTool.types';

type Props = { card: NotificationPreviewCard; render: (value: string) => ReactNode[] };

export function PreviewCard({ card, render }: Props) {
	return (
		<div className={`notificationPreviewCard ${card.isPlain ? 'notificationPreviewCard--plain' : ''}`}
			style={card.accent ? { borderLeftColor: card.accent } : undefined}>
			{card.title && (
				<div className={`notificationPreviewTitle ${card.titleTone ? `notificationPreviewTitle--${card.titleTone}` : ''}`}>
					{render(card.title)}
				</div>
			)}
			{card.subtitle && <div className='notificationMuted'>{render(card.subtitle)}</div>}
			{card.text && <div className='notificationPreText'>{render(card.text)}</div>}
			{card.facts.length > 0 && (
				<div className={`notificationPreviewFacts notificationPreviewFacts--${card.factsLayout}`}>
					{card.facts.map(([label, value], index) => card.factsLayout === 'list' ? (
						<div key={index} className='notificationPreviewFactLine'>
							<span className='notificationMuted'>{render(label)}</span><span>{render(value)}</span>
						</div>
					) : (
						<div key={index}><b>{render(label)}</b><div>{render(value)}</div></div>
					))}
				</div>
			)}
			{card.button && <span className='notificationPreviewButton'>{render(card.button)}</span>}
		</div>
	);
}
