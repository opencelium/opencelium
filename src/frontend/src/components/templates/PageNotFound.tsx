import React, {FC} from 'react';
import {ImageStyled, TitleStyled} from "@template/styles";
import {Image} from "@atom/image/Image";
import PageNotFoundImagePath from "@images/page_not_found.png";

const PageNotFound: FC =
    ({

    }) => {
    return (
        <div>
            <TitleStyled>
                This Page not Found
            </TitleStyled>
            <ImageStyled>
                <Image src={PageNotFoundImagePath} width={72} height={72} alt={'Page not found'} />
            </ImageStyled>
        </div>
    )
}

PageNotFound.defaultProps = {
}


export {
    PageNotFound,
};
