import React, {FC, useState} from 'react';
import {ArgumentProps,} from "./interfaces";
import InputText from "@app_component/base/input/text/InputText";
import Button from "@app_component/base/button/Button";
import {ArgumentContainer, ButtonContainer, FormContainer,} from './styles';
import {TextSize} from "@app_component/base/text/interfaces";
import {setFocusById} from "@application/utils/utils";
import {useAppDispatch} from "@application/utils/store";
import {deleteArgument as deleteArgumentById} from '../../redux_toolkit/action_creators/DataAggregatorCreators';


const Argument:FC<ArgumentProps> =
    ({
        clearArgsError,
        argument,
        id,
        isAdd,
        isUpdate,
        isView,
        add,
        update,
        deleteArg,
        args,
        argIndex,
     }) => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState<string>(argument.name || '');
    const [nameError, setNameError] = useState<string>('');
    const [description, setDescription] = useState<string>(argument.description || '');
    const changeName = (newName: string) => {
        setName(newName);
        setNameError('');
        if(clearArgsError){
            clearArgsError();
        }
    }
    const setArg = () => {
        if(name === ''){
            setNameError('The name is a required field.');
            setFocusById(`input_argument_name_${id}`);
            return;
        }
        let index = args.findIndex(a => a.name === name);
        if(index !== -1){
            if(isAdd || isUpdate && index !== argIndex){
                setNameError('Argument already exists.');
                setFocusById(`input_argument_name_${id}`);
                return;
            }
        }
        if(isAdd){
            setName('');
            setDescription('');
            add({name, description});
            setFocusById(`input_argument_name_${id}`);
        }
        if(isUpdate){
            update({name, description});
        }
        setNameError('');
    }
    const deleteArgument = () => {
        deleteArg();
        if(argument.id){
            dispatch(deleteArgumentById(argument.id));
        }
    }
    return (
        <React.Fragment>
            <ArgumentContainer>
                <FormContainer isView={isView}>
                    <InputText
                        id={`input_argument_name_${id}`}
                        readOnly={isView}
                        onChange={(e) => changeName(e.target.value)}
                        value={name}
                        minHeight={30}
                        label={'Name'}
                        error={nameError}
                        errorBottom={'-15px'}
                    />
                </FormContainer>
                <FormContainer isView={isView}>
                    <InputText
                        id={`input_argument_description_${id}`}
                        readOnly={isView}
                        minHeight={30}
                        onChange={(e) => setDescription(e.target.value)}
                        value={description}
                        label={"Description"}
                    />
                </FormContainer>
                {!isView &&
                    <ButtonContainer>
                        <Button
                            icon={isAdd ? 'add' : 'autorenew'}
                            iconSize={isAdd ? TextSize.Size_12 : TextSize.Size_10}
                            handleClick={setArg}
                        />
                        {isUpdate && <Button
                            icon={'delete'}
                            iconSize={TextSize.Size_10}
                            handleClick={deleteArgument}
                        />}
                    </ButtonContainer>
                }
            </ArgumentContainer>
        </React.Fragment>
    )
}

Argument.defaultProps = {
    isAdd: false,
    isUpdate: false,
    isView: false,
}

export default Argument;
