import { useEffect, type CSSProperties } from 'react';
import {
	duplicateRuleById,
	removeChildById,
	updateGroupConjunction,
	updateRuleProperties,
} from '../conditionBuilder.utils';
import { RuleRow } from '../RuleRow/RuleRow';
import type { GroupEditorProps } from './GroupEditor.types';
import { useGroupTreeLine } from './useGroupTreeLine';
import { GroupEditorHeader } from './GroupEditorHeader';

export function GroupEditor({ group, operatorType, methods, allMethods, iterators,
	onDelete, onChange }: GroupEditorProps) {
	const items = group.items || [];
	const conjunction = group.properties?.conjunction;
	const { bodyRef, bottom } = useGroupTreeLine(items.length, operatorType);
	useEffect(() => {
		if (operatorType !== 'if' || items.length > 1 || conjunction === undefined) return;
		onChange(updateGroupConjunction(group, group.id, undefined));
	}, [conjunction, group, items.length, onChange, operatorType]);
	const updateNestedGroup = (nextGroup: typeof group) => onChange({
		...group,
		items: items.map((item) => item.id === nextGroup.id ? nextGroup : item),
	});
	const groupClass = operatorType === 'loop'
		? 'conditionLoopGroup'
		: `conditionGroup${group.error ? ' conditionGroupInvalid' : ''}`;
	return <div className={groupClass}>
		{operatorType === 'if' && <GroupEditorHeader group={group} operatorType={operatorType}
			onDelete={onDelete} onChange={onChange} />}
		<div ref={bodyRef} className="conditionGroupBody"
			style={{ '--condition-tree-bottom': `${bottom}px` } as CSSProperties}>
			{items.map((child) => child.type === 'rule'
				? <RuleRow key={child.id} rule={child} operatorType={operatorType}
					methods={methods} allMethods={allMethods} iterators={iterators}
					canDelete={operatorType === 'if'}
					onDelete={() => onChange(removeChildById(group, child.id))}
					onDuplicate={() => onChange(duplicateRuleById(group, child.id))}
					onChange={(patch) => onChange(updateRuleProperties(group, child.id, patch))} />
				: <GroupEditor key={child.id} group={child} operatorType={operatorType}
					methods={methods} allMethods={allMethods} iterators={iterators}
					onDelete={() => onChange(removeChildById(group, child.id))}
					onChange={updateNestedGroup} />)}
		</div>
	</div>;
}
