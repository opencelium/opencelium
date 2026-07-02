import React from 'react';
import type { CSSProperties } from 'react';
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types.ts';
import type {ButtonColorType} from "antd/es/button/buttonHelpers";

// Antd-flavoured variants (forwarded to the antd Button) plus the semantic
// variants used by the material/custom implementations and the confirm dialog.
export type AntButtonVariant = 'outlined' | 'dashed' | 'solid' | 'filled' | 'text' | 'link';
export type ButtonVariant = AntButtonVariant | 'primary' | 'secondary' | 'danger';

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
	/** Stable selector for e2e tests; emitted as `data-testid`. */
	testId?: string;
}
export type ButtonComponent = React.ForwardRefExoticComponent<
	ButtonProps & React.RefAttributes<HTMLButtonElement>
>;
