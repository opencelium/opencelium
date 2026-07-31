import type {IconProps} from '../Icon/Icon.types';
import type {ButtonProps} from '../Button/Button.types';

export interface IconButtonProps extends ButtonProps {
    iconProps: IconProps;
    size?: 'xs' | 'sm' | 'md' | 'lg';
}
