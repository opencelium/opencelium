import React, {useState} from 'react';
import {AddParamButton, UpdateParamButton} from "@app_component/operator_builder/reference_generator/styles";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import {FIELD_TYPE_ARRAY, FIELD_TYPE_OBJECT, FIELD_TYPE_STRING} from "@classes/content/connection/method/CMethodItem";
import Dialog from "@basic_components/Dialog";
import Input from "@basic_components/inputs/Input";

const AddParam = () => {
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const [isLoading, toggleLoading] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [type, setType] = useState<string>(FIELD_TYPE_STRING);
    const onUpdate = (e: any) => {
        e.preventDefault()
        e.stopPropagation();
    }
    return (
        <React.Fragment>
            <AddParamButton label={'Add'} handleClick={onUpdate}/>
            <Dialog
                id={'add_param_dialog'}
                actions={[{label: 'Add', isLoading, onClick: onUpdate}, {label: 'Cancel', onClick: () => toggleDialog(false)}]}
                active={showDialog}
                toggle={() => toggleDialog(!showDialog)}
                title={'Add Param'}
            >
                <Input
                    id={'add_param_input_name'}
                    required={true}
                    onChange={(e: any) => setName(e.target.value)}
                    value={name}
                    icon={'title'}
                    label={'Name'}
                />

                <RadioButtons
                    required={true}
                    label={'Type'}
                    icon={'text_format'}
                    value={type}
                    handleChange={(a: string) => setType(a)}
                    radios={[
                        {
                            id: 'update_param_input_type',
                            label: 'String',
                            value: FIELD_TYPE_STRING,
                        },{
                            label: 'Array',
                            value: FIELD_TYPE_ARRAY,
                        },{
                            label: 'Object',
                            value: FIELD_TYPE_OBJECT,
                        }
                    ]}/>
            </Dialog>
        </React.Fragment>
    );
}

export default AddParam;
