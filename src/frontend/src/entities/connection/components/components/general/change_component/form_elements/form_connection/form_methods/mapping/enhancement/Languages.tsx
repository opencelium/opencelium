import React, {useEffect, useMemo} from 'react';
import InputSelect from "@app_component/base/input/select/InputSelect";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {checkPolyglot} from "@entity/external_application/redux_toolkit/action_creators/ExternalApplicationCreators";
import {ExternalApplicationStatus} from "@entity/external_application/requests/interfaces/IExternalApplication";

const languageOptions = [
    {label: 'JavaScript', value: 'js'},
    //{label: 'Python2', value: 'python2'},
    {label: 'Python3', value: 'python3'},
    {label: 'Ruby', value: 'ruby'},
];

const Languages = ({onChange, currentLanguage}: any) => {
    const dispatch = useAppDispatch();
    const {polyglotStatus} = useAppSelector((state: RootState) => state.externalApplicationReducer);
    const options = useMemo(() => {
        if (polyglotStatus?.status === ExternalApplicationStatus.DOWN) {
            return languageOptions.map(l => ({value: l.value, label: l.value === 'js' ? l.label : `${l.label} (not configured)`}));
        } else {
            return languageOptions;
        }
    }, [polyglotStatus])
    useEffect(() => {
        dispatch(checkPolyglot());
    }, [])
    return (
        <InputSelect
            id={`input_language`}
            icon={'code'}
            marginBottom={'20px'}
            label={'Language'}
            options={options}
            onChange={onChange}
            value={languageOptions.find(o => o.value === currentLanguage)}
        />
    )
}

export default Languages;
