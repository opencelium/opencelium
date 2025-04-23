import React from 'react';
import { BiSolidDownArrow, BiSolidRightArrow } from 'react-icons/bi';
import { FaSpinner } from 'react-icons/fa';
import styles from './ToggleButton.module.css';

interface ToggleButtonProps {
	loading: boolean;
	expanded: boolean;
	onClick: () => void;
}

const Spinner = FaSpinner as React.FC<React.SVGProps<SVGSVGElement>>;
const ArrowDown = BiSolidDownArrow as React.FC<React.SVGProps<SVGSVGElement>>;
const ArrowRight = BiSolidRightArrow as React.FC<React.SVGProps<SVGSVGElement>>;

const ToggleButton: React.FC<ToggleButtonProps> = ({
	loading,
	expanded,
	onClick,
}) => {
	const icon = loading ? (
		<Spinner style={{ animation: 'spin 1s linear infinite' }} />
	) : expanded ? (
		<ArrowDown />
	) : (
		<ArrowRight />
	);

	return (
		<button onClick={onClick} className={styles.toggleButton}>
			{icon}
		</button>
	);
};

export default ToggleButton;
