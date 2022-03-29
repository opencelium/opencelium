import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import {TitleProps} from './interfaces';
import {LinkStyled, TitleStyled} from './styles';
import {isArray} from "../../utils";
import Text from "@atom/text/Text";
import {TextSize} from "@atom/text/interfaces";
import {IconStyled} from "./styles";

const Title: FC<TitleProps> =
    ({
        title,
        className,
        icon,
    }) => {
    if(isArray(title)){
        return(
            <TitleStyled className={className}>
                <span>
                    {
                        // @ts-ignore
                        title.map((t, index) => {
                            // @ts-ignore
                            let isLastTitle = index === title.length - 1;
                            if(t.link){
                                return (
                                    <span key={t.name}>
                                        <LinkStyled to={t.link} title={t.name}><Text value={`${t.name}`} size={TextSize.Size_24}/></LinkStyled>
                                        <Text value={`${!isLastTitle ? ` / ` : ''}`} size={TextSize.Size_24}/>
                                    </span>
                                );
                            } else{
                                return <span key={t.name}><Text value={`${t.name}${!isLastTitle ? ` / ` : ''}`} size={TextSize.Size_24}/></span>;
                            }
                        })
                    }
                    <IconStyled>{icon}</IconStyled>
                </span>
            </TitleStyled>
        )
    }
    return (
        <TitleStyled className={className}>
            <span>
                <Text value={title} size={TextSize.Size_24}/>
                <IconStyled>{icon}</IconStyled>
            </span>
        </TitleStyled>
    );
}

Title.defaultProps = {
    className: '',
    icon: null,
}


export {
    Title,
};

export default withTheme(Title);