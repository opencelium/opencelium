import React, {FC, useEffect, useRef, useState} from 'react';
import {withTheme} from 'styled-components';
import { InlineEditInputProps } from './interfaces';
import { InlineEditInputStyled } from './styles';
import Button from "@app_component/base/button/Button";
import {TextSize} from "@app_component/base/text/interfaces";
import {toggleNotificationPanel} from "@application/redux_toolkit/slices/ApplicationSlice";
import {useEventListener} from "@application/utils/utils";
import {NotificationPanelStyled} from "@app_component/layout/notification_panel/styles";

const InlineEditInput: FC<InlineEditInputProps> =
    ({
         isInProcess,
         updateValue,
         initialValue,
    }) => {
    const inlineValueRef = useRef(null);
    const inlineInputRef = useRef(null);
    const [showEditor, toggleEditor] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>(initialValue);
    const update = () => {
        updateValue(inputValue);
    }
    const checkIfClickedOutside = (e: any) => {
        if(inlineInputRef.current !== null){
            if (showEditor && inlineInputRef.current && !inlineInputRef.current.contains(e.target)) {
                const inputElement = document.querySelector('[role=dialog]');
                const isPartOfDialog = inputElement ? document.querySelector('[role=dialog]').contains(e.target) : false;
                if(!isPartOfDialog){
                    toggleEditor(false);
                }
            }
        }
    }
    useEffect(() => {
        if(!isInProcess){
            toggleEditor(false);
        }
    }, [isInProcess])
    useEffect(() => {
        if(showEditor){
            const inputElement = inlineInputRef.current.querySelector('textarea');
            if(inputElement){
                inputElement.focus();
            }
        }
    }, [showEditor])
    useEventListener('mousedown', checkIfClickedOutside, window, showEditor);
    const rows = inlineValueRef.current ? Math.round(inlineValueRef.current.offsetHeight / 20) : 3;
    return (
        <div style={{position: 'relative'}}>
            <span ref={inlineValueRef} style={{color: showEditor ? 'white' : 'black'}} onDoubleClick={() => {
                toggleEditor(true);
            }}>{initialValue === '' ? '-' : initialValue}</span>
            {showEditor &&
                <InlineEditInputStyled ref={inlineInputRef}>
                    <textarea rows={rows} onChange={(e) => setInputValue(e.target.value)} value={inputValue}/>
                    <Button isLoading={isInProcess} isDisabled={isInProcess} iconSize={TextSize.Size_12} right={-45} top={0} position={'absolute'} icon={'check'} handleClick={update}/>
                    <Button isDisabled={isInProcess} iconSize={TextSize.Size_12} right={rows > 1 ? -45 : -86} top={rows > 1 ? '28px' : 0} position={'absolute'} icon={'cancel'} handleClick={() => toggleEditor(false)}/>
                </InlineEditInputStyled>
            }
        </div>
    )
}

InlineEditInput.defaultProps = {
    isInProcess: false,
}


export {
    InlineEditInput,
};

export default withTheme(InlineEditInput);