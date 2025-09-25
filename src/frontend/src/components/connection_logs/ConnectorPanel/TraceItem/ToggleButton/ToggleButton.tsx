import React from 'react';
import styles from './ToggleButton.module.css';
import FontIcon from "@basic_components/FontIcon";
import {ColorTheme} from "@style/Theme";

interface ToggleButtonProps {
	loading: boolean;
	expanded: boolean;
	onClick: () => void;
	hasError?: boolean,
	disabled?: boolean,
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
	loading,
	expanded,
	onClick,
	hasError,
	disabled,
}) => {
	const icon =
		<FontIcon
			iconStyles={{color: disabled ? '#eee' : hasError ? ColorTheme.Red : '#000', cursor: disabled ? 'default' : 'pointer'}}
			size={16}
			isLoading={loading}
			value={expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
			onClick={() => {}}
		/>

	return (
		<button onClick={onClick} className={styles.toggleButton} disabled={disabled} style={{cursor: disabled ? 'default' : 'pointer'}}>
			{icon}
		</button>
	);
};

export default ToggleButton;
