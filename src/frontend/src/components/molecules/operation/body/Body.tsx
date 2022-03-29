import React, {FC} from 'react';
import {BodyProps} from "@molecule/operation/interfaces";
import InputJsonView from "@atom/input/json_view/InputJsonView";
import {ResponseFormat} from "@interface/invoker/IBody";
import {useTranslation} from "react-i18next";
import InputXmlView from "@atom/input/xml_view/InputXmlView";
import CXmlEditor from "@classes/components/general/basic_components/xml_editor/CXmlEditor";


const Body: FC<BodyProps> =
    ({
        updateBody,
        readOnly,
        value,
        format,
        ...props
    }) => {
        const {t} = useTranslation('basic_components');
        switch (format){
            case ResponseFormat.Json:
                return (
                    <InputJsonView
                        readOnly={readOnly}
                        icon={'data_object'}
                        label={'Body'}
                        updateJson={updateBody}
                        jsonViewProps={{
                            name: 'body',
                            collapsed: false,
                            src: value,
                        }}
                    />
                );
            case ResponseFormat.Xml:
                return(
                    <InputXmlView
                        readOnly={readOnly}
                        icon={'data_object'}
                        label={'Body'}
                        xmlViewProps={{
                            translate: t,
                            xml: value,
                            afterUpdateCallback: (xmlEditor: CXmlEditor) => {return updateBody(xmlEditor.convertToBackendXml())},
                            readOnly: readOnly,
                        }}
                    />
                );
        }
        return null;
    }

Body.defaultProps = {
}


export {
    Body,
};
