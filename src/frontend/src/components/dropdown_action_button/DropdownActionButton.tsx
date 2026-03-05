import React, {useCallback, useEffect, useMemo, useState} from 'react';
import { Dropdown, DropdownMenu, DropdownProps } from 'reactstrap';
import { DropdownMenuProps } from 'reactstrap/es/DropdownMenu';

import { DropdownItemStyled, DropdownToggleStyled } from './style';
import {ButtonLabelSize} from "@entity/application/utils/constants";

export type DropdownDirection = NonNullable<DropdownProps['direction']>;

export type DropdownActionItem = {
	id: string;
	label: string;
	onClick: () => void;
	disabled?: boolean;
	isLoading?: boolean;
	hidden?: boolean;
};

export type DropdownActionButtonProps = DropdownMenuProps & {
	direction?: DropdownDirection;
	label: string;
	disabled?: boolean;
	isLoading?: boolean;
	items: DropdownActionItem[];
	closeOnItemClick?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
};

export default function DropdownActionButton({
	direction,
	label,
	items,
	disabled = false,
	isLoading = false,
	closeOnItemClick = true,
	onOpenChange,
	id,
	...menuProps
}: DropdownActionButtonProps) {
	const [open, setOpen] = useState(false);

	const visibleItems = useMemo(() => (items || []).filter((x) => !x.hidden), [
		items,
	]);

	const toggle = useCallback(() => {
		if (disabled || isLoading) return;

		setOpen((prev) => {
			const next = !prev;
			onOpenChange?.(next);
			return next;
		});
	}, [disabled, isLoading, onOpenChange]);

	const handleItemClick = useCallback(
		(item: DropdownActionItem) => {
			if (disabled || isLoading || item.disabled || item.isLoading) return;

			if (closeOnItemClick) {
				setOpen(false);
				onOpenChange?.(false);
			}

			item.onClick();
		},
		[disabled, isLoading, closeOnItemClick, onOpenChange],
	);
	return (
		<Dropdown isOpen={open} toggle={toggle} direction={direction} id={id}>
			<DropdownToggleStyled caret disabled={disabled || isLoading}>
				{label}
			</DropdownToggleStyled>

			<DropdownMenu {...menuProps}>
				{visibleItems.map((item) => (
					<DropdownItemStyled
						key={item.id}
						disabled={disabled || isLoading || item.disabled || item.isLoading}
						onClick={() => handleItemClick(item)}
					>
						<span style={{fontSize: `${ButtonLabelSize}px`}}>{item.label}</span>
					</DropdownItemStyled>
				))}
			</DropdownMenu>
		</Dropdown>
	);
}
