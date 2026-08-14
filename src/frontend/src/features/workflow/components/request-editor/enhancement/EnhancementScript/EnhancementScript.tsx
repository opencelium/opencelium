import CustomAceEditor from '../../../custom_ace_editor/CustomAceEditor';
import { useTheme } from '@shared/theme/hooks/useTheme';
import type { EnhancementScriptProps } from './EnhancementScript.types';
import { useEnhancementScriptValue } from './useEnhancementScriptValue';

const modeMap = {
    'js': 'javascript',
    'python2': 'python',
    'python3': 'python',
    'ruby': 'ruby',
}
const EnhancementScript = ({ enhancement, onChangeScript, readOnly }: EnhancementScriptProps) => {
    const { themeMode } = useTheme();
    const [localScript, setLocalScript] = useEnhancementScriptValue(
        enhancement.script, onChangeScript,
    );
    return (
        <CustomAceEditor
            hasDiffLang
            // maxLength={Validation.TextLength.Long}
            maxLength={65535}
            counterStyles={{ bottom: '-2px' }}
            style={{
                marginBottom: 0,
                width: '100%',
                height: '100%'
            }}
            mode={modeMap[enhancement.language]}
            editorTheme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'}
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

export default EnhancementScript;
