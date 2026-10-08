import CustomAceEditor from '../../../custom_ace_editor/CustomAceEditor';
import { useTheme } from '@shared/theme/hooks/useTheme';
import type { EnhancementScriptProps } from './EnhancementScript.types';
import { useEnhancementScriptValue } from './useEnhancementScriptValue';
import { logFieldBinding } from '../../../../utils/fieldBindingDebug';

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
    logFieldBinding('5. what the script editor renders', {
        fromEnhancement: typeof enhancement.script === 'string'
            ? `string(len=${enhancement.script.length})` : String(enhancement.script),
        handedToAce: typeof localScript === 'string'
            ? `string(len=${localScript.length})` : String(localScript),
        language: enhancement.language,
        mode: modeMap[enhancement.language],
    });
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
