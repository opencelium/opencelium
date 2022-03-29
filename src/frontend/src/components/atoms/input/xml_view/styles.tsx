import {ElementProps} from "@atom/input/interfaces";

const getReactXmlStyles = ({paddingLeft, paddingRight, width, isIconInside, hasIcon, marginTop, marginBottom, theme}: ElementProps) => {
    return {
        display: `inline-block`,
        outline: `none`,
        border: `none`,
        transition: `border-bottom-color 0.5s`,
        paddingLeft: `${paddingLeft || 0}`,
        paddingRight: `${paddingRight || 0}`,
        width: `${width || isIconInside || !hasIcon ? '100%' : `calc(100% - 30px)`}`,
        marginLeft: `${!hasIcon || isIconInside ? 0 : '30px'}`,
        marginTop: `${marginTop || 0}`,
        marginBottom: `${marginBottom || 0}`,
    };
}
export {
    getReactXmlStyles,
}