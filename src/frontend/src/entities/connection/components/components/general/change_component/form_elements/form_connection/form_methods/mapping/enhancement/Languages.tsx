import React, {useEffect} from 'react';
import InputSelect from "@app_component/base/input/select/InputSelect";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {checkPolyglot} from "@entity/external_application/redux_toolkit/action_creators/ExternalApplicationCreators";

const languageOptions = [
    {label: 'JavaScript', value: 'js'},
    //{label: 'Python2', value: 'python2'},
    {label: 'Python3', value: 'python3'},
    {label: 'Ruby', value: 'ruby'},
];

const Languages = ({onChange, currentLanguage}: any) => {
    const dispatch = useAppDispatch();
    const {polyglotStatus} = useAppSelector((state: RootState) => state.externalApplicationReducer);
    useEffect(() => {
        dispatch(checkPolyglot());
    }, [])
    console.log(polyglotStatus)
    return (
        <InputSelect
            id={`input_language`}
            icon={'code'}
            marginBottom={'20px'}
            label={'Language'}
            options={languageOptions}
            onChange={onChange}
            value={languageOptions.find(o => o.value === currentLanguage)}
        />
    )
}

export default Languages;
