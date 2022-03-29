import React, {FC} from 'react';
import { ImageStyled } from './styles';
import {ImageProps} from "@atom/image/interfaces";
import Icon from "@atom/icon/Icon";

const Image: FC<ImageProps> =
    ({
        width,
        isLoading,
        loadingSize,
        ...props
    }) => {
    if(isLoading){
        return(
            <Icon name={''} isLoading={true} size={isLoading ? loadingSize : width}/>
        )
    }
    return (
        <ImageStyled width={width} {...props}/>
    )
}

Image.defaultProps = {
}


export {
    Image,
};
