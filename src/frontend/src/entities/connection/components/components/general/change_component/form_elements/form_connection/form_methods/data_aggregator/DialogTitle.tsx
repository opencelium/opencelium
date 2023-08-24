import React, {FC, useState} from 'react';
import {
    DialogTitleProps,
} from "./interfaces";
import Icon from "@app_component/base/icon/Icon";
import {
    DialogTitleLinkStyled,
    DialogTitleContainerStyled,
} from "@change_component/form_elements/form_connection/form_methods/data_aggregator/styles";


const DialogTitle:FC<DialogTitleProps> = ({isForm, setIsForm, hasList}) => {
    return (
        <DialogTitleContainerStyled>
            <DialogTitleLinkStyled isLink={isForm && hasList} onClick={hasList ? () => setIsForm(false) : null}>{"Data Aggregator"}</DialogTitleLinkStyled>
            {isForm &&
                <React.Fragment>
                    <Icon name={'chevron_right'}/>
                    <span>{"Form"}</span>
                </React.Fragment>
            }
        </DialogTitleContainerStyled>
    )
}

export default DialogTitle;
