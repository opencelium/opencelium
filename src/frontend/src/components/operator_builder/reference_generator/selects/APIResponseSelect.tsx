import React from 'react';
import {APIResponseType, DeepSelectProps} from "@app_component/operator_builder/reference_generator/props";
import DeepSelect from "@app_component/operator_builder/reference_generator/selects/DeepSelect";
import HeaderSelect from "@app_component/operator_builder/reference_generator/selects/HeaderSelect";
import StatusPlaceholder from "@app_component/operator_builder/reference_generator/selects/StatusPlaceholder";

type ApiResponseSelectProps = {
    selectProps: DeepSelectProps,
    apiResponseType: APIResponseType,
}

const ApiResponseSelect = ({apiResponseType, selectProps}: ApiResponseSelectProps) => {
    switch (apiResponseType) {
        case 'body':
            return <DeepSelect {...selectProps}/>;
        case 'header':
            return <HeaderSelect
                {...selectProps}
            />;
        case 'status':
            return <StatusPlaceholder/>;
    }
}

export default ApiResponseSelect;
