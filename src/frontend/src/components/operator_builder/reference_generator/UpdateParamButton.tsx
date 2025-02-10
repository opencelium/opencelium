import React, {useState} from 'react';
import {UpdateParamButton} from "@app_component/operator_builder/reference_generator/styles";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import {FIELD_TYPE_ARRAY, FIELD_TYPE_OBJECT, FIELD_TYPE_STRING} from "@classes/content/connection/method/CMethodItem";
import Dialog from "@basic_components/Dialog";

const UpdateParam = () => {
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const [isLoading, toggleLoading] = useState<boolean>(false);
    const [type, setType] = useState<string>(FIELD_TYPE_STRING);
    const onUpdate = (e: any) => {
        e.preventDefault()
        e.stopPropagation();
    }
    return (
        <React.Fragment>
            <UpdateParamButton label={'Update'} handleClick={onUpdate}/>
            <Dialog
                id={'update_param_dialog'}
                actions={[{label: 'Update', isLoading, onClick: onUpdate}, {label: 'Cancel', onClick: () => toggleDialog(false)}]}
                active={showDialog}
                toggle={() => toggleDialog(!showDialog)}
                title={'Update Param'}
            >
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

export default UpdateParam;
