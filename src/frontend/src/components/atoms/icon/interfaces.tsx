interface MaterialIconStyledProps {
    size?: string | number,
    color?: string,
    position?: string,
    left?: string,
    right?: string,
    top?: string,
    styles?: string,
}

interface IconProps extends MaterialIconStyledProps{
    id?: string,
    name: string,
    onClick?: (e?: any) => void,
    isLoading?: boolean,
    className?: string,
}

export {
    MaterialIconStyledProps,
    IconProps,
}