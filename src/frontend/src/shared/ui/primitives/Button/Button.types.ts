import React from 'react';
import type { CSSProperties } from 'react';
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types.ts';
import type {ButtonColorType} from "antd/es/button/buttonHelpers";

export type ButtonVariant = 'outlined' | 'dashed' | 'solid' | 'filled' | 'text' | 'link'

export interface ButtonProps {
	children?: React.ReactNode;
	variant?: ButtonVariant;
	disabled?: boolean;
	onClick?: () => void;
	type?: "default" | "primary" | "dashed" | "link" | "text";
	htmlType?: 'submit' | 'reset' | 'button';
	loading?: boolean;
	iconLeft?: IconName;
	iconRight?: IconName;
	style?: CSSProperties | undefined;
	color?: ButtonColorType,
}
export type ButtonComponent = React.ForwardRefExoticComponent<
	ButtonProps & React.RefAttributes<HTMLButtonElement>
>;
