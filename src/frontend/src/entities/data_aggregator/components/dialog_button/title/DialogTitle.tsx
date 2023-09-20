import React, {FC, useState} from 'react';
import {
    DialogTitleProps,
} from "./interfaces";
import Icon from "@app_component/base/icon/Icon";
import {
    DialogTitleLinkStyled,
    DialogTitleContainerStyled,
} from "./styles";
import {CDataAggregator} from "@entity/data_aggregator/classes/CDataAggregator";
import {useAppDispatch} from "@application/utils/store";
import { setIsForm } from '@entity/data_aggregator/redux_toolkit/slices/DataAggregatorSlice';


const DialogTitle:FC<DialogTitleProps> = ({hasList}) => {
    const dispatch = useAppDispatch();
    const {
        isForm,
    } = CDataAggregator.getReduxState();
    return (
        <DialogTitleContainerStyled>
            <DialogTitleLinkStyled isLink={isForm && hasList} onClick={hasList ? () => dispatch(setIsForm(false)) : null}>{"Data Aggregator"}</DialogTitleLinkStyled>
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
