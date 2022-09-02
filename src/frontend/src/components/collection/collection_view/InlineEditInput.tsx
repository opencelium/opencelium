import React, {FC, useEffect, useRef, useState} from 'react';
import {withTheme} from 'styled-components';
import { InlineEditInputProps } from './interfaces';
import {BackgroundStyled, InlineEditInputStyled } from './styles';
import Button from "@app_component/base/button/Button";
import {TextSize} from "@app_component/base/text/interfaces";
import {toggleNotificationPanel} from "@application/redux_toolkit/slices/ApplicationSlice";
import {useEventListener} from "@application/utils/utils";
import {NotificationPanelStyled} from "@app_component/layout/notification_panel/styles";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";

const InlineEditInput: FC<InlineEditInputProps> =
    ({
         isInProcess,
         updateValue,
         initialValue,
         maxLength,
    }) => {
    const inlineValueRef = useRef(null);
    const inlineInputRef = useRef(null);
    const [showEditor, toggleEditor] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>(initialValue);
    const [validationMessage, setValidationMessage] = useState<string>('');
    const cancel = () => {
        setInputValue(initialValue);
        toggleEditor(false);
    }
    const update = () => {
        if(inputValue.trim() === ''){
            setValidationMessage('Title is a required field');
            return;
        }
        const specialCharacters = /[\/\\]/;
        if(specialCharacters.test(inputValue)){
            setValidationMessage('Title cannot contain "/" and "\\" characters');
            return;
        }
        updateValue(inputValue);
    }
    const onKeyDown = (e: any) => {
        if(e.key === 'Escape') {
            cancel();
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            update();
        }
    }
    const checkIfClickedOutside = (e: any) => {
        if(inlineInputRef.current !== null){
            if (showEditor && inlineInputRef.current && !inlineInputRef.current.contains(e.target)) {
                const inputElement = document.querySelector('[role=dialog]');
                const isPartOfDialog = inputElement ? document.querySelector('[role=dialog]').contains(e.target) : false;
                if(!isPartOfDialog){
                    cancel();
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
    const textareaElement = document.getElementById('inline_edit_input');
    //TODO: auto height of the textarea - check in firefox
    //const rows = textareaElement ? Math.round(textareaElement.scrollHeight / 25) : inlineValueRef.current ? Math.round(inlineValueRef.current.offsetHeight / 25) : 3;
    const rows = 3;
    return (
        <div style={{position: showEditor ? 'relative' : 'unset'}}>
            <span ref={inlineValueRef} style={{color: showEditor ? 'white' : 'black'}} onDoubleClick={() => {
                toggleEditor(true);
            }}>{initialValue === '' ? '-' : initialValue}</span>
            {showEditor &&
                <React.Fragment>
                    <BackgroundStyled/>
                    <InlineEditInputStyled ref={inlineInputRef}>
                        <InputTextarea placeholder={'Title'} error={validationMessage} id={'inline_edit_input'} maxLength={maxLength} onKeyDown={(e) => onKeyDown(e)} onChange={(e) => setInputValue(e.target.value)} value={inputValue}/>
                        <Button isLoading={isInProcess} isDisabled={isInProcess} iconSize={TextSize.Size_12} right={-45} top={0} position={'absolute'} icon={'check'} handleClick={update}/>
                        <Button isDisabled={isInProcess} iconSize={TextSize.Size_12} right={rows > 1 ? -45 : -86} top={rows > 1 ? '28px' : 0} position={'absolute'} icon={'cancel'} handleClick={() => cancel()}/>
                    </InlineEditInputStyled>
                </React.Fragment>
            }
        </div>
    )
}

InlineEditInput.defaultProps = {
    isInProcess: false,
    maxLength: Infinity,
}


export {
    InlineEditInput,
};

export default withTheme(InlineEditInput);