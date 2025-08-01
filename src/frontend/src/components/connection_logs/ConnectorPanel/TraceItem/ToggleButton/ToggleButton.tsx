import React from 'react';
import styles from './ToggleButton.module.css';
import FontIcon from "@basic_components/FontIcon";
import {ColorTheme} from "@style/Theme";

interface ToggleButtonProps {
	loading: boolean;
	expanded: boolean;
	onClick: () => void;
	hasError?: boolean,
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
	loading,
	expanded,
	onClick,
	hasError,
}) => {
	const icon =
		<FontIcon
			iconStyles={{color: hasError ? ColorTheme.Red : '#000'}}
			size={16}
			isLoading={loading}
			value={expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
			onClick={() => {}}
		/>

	return (
		<button onClick={onClick} className={styles.toggleButton}>
			{icon}
		</button>
	);
};

export default ToggleButton;
