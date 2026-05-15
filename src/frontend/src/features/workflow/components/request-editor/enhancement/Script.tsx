import React, {useEffect, useState} from 'react';
import type { Enhancement } from "../../../types/connection";
import {DebounceDelay} from "../../../constants/constants";
import type { Validation } from "../../../types/constants";
import CustomAceEditor from "../../custom_ace_editor/CustomAceEditor";

const modeMap = {
    'js': 'javascript',
    'python2': 'python',
    'python3': 'python',
    'ruby': 'ruby',
}
interface ScriptProps {
    enhancement: Enhancement,
    onChangeScript: (newScript: string) => void,
    readOnly?: boolean,
}
const Script = ({enhancement, onChangeScript, readOnly}: ScriptProps) => {
    const [markers, setMarkers] = useState<any[]>([]);
    const scriptRef: any = React.useRef(null);
    const [localScript, setLocalScript] = useState(enhancement.script);

    useEffect(() => {
        setLocalScript(enhancement.script);
    }, [enhancement.script]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (localScript !== enhancement.script) {
                onChangeScript(localScript);
            }
        }, DebounceDelay);

        return () => clearTimeout(timeout);
    }, [localScript]);
    useEffect(() => {
        /*const newMarkers = getMarker(
            scriptRef.current?.editor,
            enhancement.script,
            scriptRef.generateNotExistVar()
        );
        setMarkers(newMarkers);*/
    }, [enhancement.script]);
    return (
        <CustomAceEditor
            hasDiffLang
            // maxLength={Validation.TextLength.Long}
            maxLength={255}
            ref={scriptRef}
            style={{
                marginBottom: 0,
                width: '100%',
                height: '100%'
            }}
            markers={markers}
            mode={modeMap[enhancement.language]}
            editorTheme='tomorrow'
            name='enhancement_code'
            editorProps={{ $blockScrolling: true }}
            showPrintMargin={true}
            showGutter={true}
            highlightActiveLine={true}
            onChange={setLocalScript}
            value={localScript}
            width={'100%'}
            height='300px'
            readOnly={readOnly}
            setOptions={{
                enableBasicAutocompletion: false,
                enableLiveAutocompletion: false,
                enableSnippets: false,
                showLineNumbers: false,
                tabSize: 2,
                useWorker: false,
            }}
        />
    )
}

export default Script;
