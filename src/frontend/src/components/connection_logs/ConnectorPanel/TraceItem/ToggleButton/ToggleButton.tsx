import React from 'react';
import styles from './ToggleButton.module.css';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

interface ToggleButtonProps {
	loading: boolean;
	expanded: boolean;
	onClick: () => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
	loading,
	expanded,
	onClick,
}) => {
	const icon = <TooltipFontIcon
			size={16}
			tooltip={'Next'}
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
