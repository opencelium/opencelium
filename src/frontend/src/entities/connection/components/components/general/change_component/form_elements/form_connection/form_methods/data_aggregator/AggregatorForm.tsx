import React, {FC, useRef, useState, useEffect, useMemo} from 'react';
import AceEditor from "react-ace";
import {
    AggregatorFormProps,
} from "./interfaces";
import InputSelect from "@app_component/base/input/select/InputSelect";
import Arguments from "./arguments/Arguments";
import AddArgument from "./arguments/AddArgument";
import Input from "@app_component/base/input/Input";
import {
    AggregatorFormContainer, FormContainer,
    ArgumentFormContainer, ActionButtonContainer,
} from "./styles";
import {getReactXmlStyles} from "@app_component/base/input/xml_view/styles";
import { withTheme } from 'styled-components';
import InputText from "@app_component/base/input/text/InputText";
import {ModelArgument} from "@root/requests/models/DataAggregator";
import {TextSize} from "@app_component/base/text/interfaces";
import Button from "@app_component/base/button/Button";
import CAggregator from "@classes/content/connection/data_aggregator/CAggregator";
import { OptionProps } from '@app_component/base/input/select/interfaces';
import {setFocusById} from "@application/utils/utils";

const getStaticWordCompleter = (variables: string[]) => {
    return {
        getCompletions: function (editor: any, session: any, pos: any, prefix: any, callback: any) {
            callback(null, variables.map(function (word) {
                return {
                    caption: word,
                    value: word,
                    meta: "static"
                };
            }));
        }
    }
}

const AggregatorForm:FC<AggregatorFormProps> =
    ({
        readOnly,
        allMethods,
        allOperators,
        aggregator,
        formType,
        theme,
        add,
        update,
        closeForm,
        dataAggregator,
    }) => {
    if(formType === 'view'){
        readOnly = true;
    }
    const variablesRef = useRef(null);
    const scriptSegmentRef = useRef(null);
    const [name, setName] = useState<string>(aggregator?.name || '');
    const [nameError, setNameError] = useState<string>('');
    const initialItems = useMemo(() => {
        if(!aggregator){
            return [];
        }
        return allMethods.filter(m => {return aggregator.assignedItems.findIndex(i => i.name === m.value) !== -1;});
    }, [aggregator]);
    const [items, setItems] = useState<OptionProps[]>(initialItems || []);
    const [args, setArgs] = useState(aggregator?.args || []);
    const [argsError, setArgsError] = useState<string>('');
    const initialScript = CAggregator.splitVariablesFromScript(aggregator?.script || '');
    const [variables, setVariables] = useState<string>(initialScript.variables || '');
    const [scriptSegment, setScriptSegment] = useState<string>(initialScript.scriptSegment || '');
    const [scriptSegmentError, setScriptSegmentError] = useState<string>('');
    const [hideComments, toggleComments] = useState<boolean>(false);
    const changeScriptSegment = (segment: string) => {
        setScriptSegment(CAggregator.cleanCodeFromComments(segment));
        setScriptSegmentError('');
    }
    const changeName = (newName: string) => {
        setName(newName);
        setNameError('');
    }
    useEffect(() => {
        if(variablesRef.current){
            variablesRef.current.editor.renderer.$cursorLayer.element.style.opacity = 0;
            variablesRef.current.editor.textInput.getElement().disabled=true
            variablesRef.current.editor.commands.commmandKeyBinding = {};
            variablesRef.current.editor.session.on('change', () => {
                variablesRef.current.editor.renderer.scrollToLine(Number.POSITIVE_INFINITY)
            })
        }
    }, [])
    useEffect(() => {
        if(hideComments){
            if(variablesRef.current){
                variablesRef.current.editor.session.foldAllComments();
            }
            if(scriptSegmentRef.current){
                scriptSegmentRef.current.editor.session.foldAllComments()
            }
            toggleComments(false);
        }
    }, [hideComments])
    useEffect(() => {
        scriptSegmentRef.current.editor.completers.push(getStaticWordCompleter(args.map(a => a.name)))
    }, [args])
    const change = () => {
        if(name === ''){
            setNameError('Name is a required field');
            setFocusById('input_aggregator_name');
            return;
        }
        let dataAggregatorItem = dataAggregator.find(a => a.name === name);
        if(dataAggregatorItem){
            if((formType === 'update' && dataAggregatorItem.id !== aggregator.id)
            || formType === 'add'){
                setNameError('Such name already exists');
                setFocusById('input_aggregator_name');
                return;
            }
        }
        if(args.length === 0){
            setArgsError('Arguments are required fields');
            setFocusById(`input_argument_name_add`);
            return;
        }
        if(scriptSegment === ''){
            setScriptSegmentError('Script is a required field');
            scriptSegmentRef.current.focus();
            return;
        }
        if(formType === 'add'){
            add({name, args, assignedItems: items.map(i => {return {name: i.value.toString()}}), script: CAggregator.joinVariablesWithScriptSegment(variables, scriptSegment)});
        }
        if(formType === 'update'){
            update({id: aggregator.id, name, args, assignedItems: items.map(i => {return {name: i.value.toString()}}), script: CAggregator.joinVariablesWithScriptSegment(variables, scriptSegment)});
        }
    }
    const addArgument = (arg: ModelArgument) => {
        let newVars = `${variables}\nvar ${arg.name};`;
        setVariables(newVars);
        setArgs([arg, ...args]);
        toggleComments(true);
        setArgsError('');
    }
    const updateArgument = (index: number, arg: ModelArgument) => {
        let newVariables = variables;
        newVariables = newVariables.split(`var ${args[index].name}`).join(`var ${arg.name}`);
        setVariables(newVariables);
        let newScriptSegment = scriptSegment;
        if(scriptSegment === args[index].name){
            newScriptSegment = arg.name;
        }
        newScriptSegment = newScriptSegment.split(` ${args[index].name}`).join(` ${arg.name}`);
        newScriptSegment = newScriptSegment.split(`${args[index].name} `).join(`${arg.name} `);
        newScriptSegment = newScriptSegment.split(`\n${args[index].name}`).join(`\n${arg.name}`);
        setScriptSegment(newScriptSegment);
        const newArgs = [...args];
        newArgs[index] = arg;
        setArgs(newArgs);
        toggleComments(true);
    }
    const deleteArgument = (index: number) => {
        let newVariables = variables;
        newVariables = newVariables.split(`\nvar ${args[index].name};`).join(``);
        setVariables(newVariables);
        let newScriptSegment = scriptSegment;
        newScriptSegment = newScriptSegment.split(` ${args[index].name}`).join(` ${CAggregator.generateNotExistVar()}`);
        newScriptSegment = newScriptSegment.split(`\n${args[index].name}`).join(`\n${CAggregator.generateNotExistVar()}`);
        setScriptSegment(newScriptSegment);
        const newArgs = [...args];
        newArgs.splice(index, 1);
        setArgs(newArgs);
        toggleComments(true);
    }
    const styleProps = {
        hasIcon: true,
        marginTop: '25px',
        marginBottom: '50px',
        theme,
    }
    return (
        <React.Fragment>
            <AggregatorFormContainer>
                <FormContainer>
                    <InputText
                        id={`input_aggregator_name`}
                        autoFocus={true}
                        required={true}
                        readOnly={readOnly}
                        onChange={(e) => changeName(e.target.value)}
                        value={name}
                        icon={'person'}
                        label={'Name'}
                        error={nameError}
                    />
                    <InputSelect
                        id={`input_aggregator_items`}
                        readOnly={readOnly}
                        onChange={(option: any) => setItems(option)}
                        value={items}
                        icon={'commit'}
                        label={'Item'}
                        options={allMethods}
                        isMultiple={true}
                    />
                    <Input errorBottom={'-20px'} error={argsError} readOnly={readOnly} required={true} value={'arguments'} label={'Arguments'} icon={'abc'} marginBottom={'20px'}>
                        <ArgumentFormContainer>
                            {!readOnly && <AddArgument clearArgsError={() => setArgsError('')} args={args} add={addArgument}/>}
                            <Arguments add={addArgument} update={updateArgument} deleteArg={deleteArgument} args={args} readOnly={readOnly}/>
                        </ArgumentFormContainer>
                    </Input>
                </FormContainer>
                <FormContainer style={{marginBottom: '20px'}}>
                    <Input required={true} error={scriptSegmentError} readOnly={readOnly} value={variables} label={'Script'} icon={'javascript'} marginBottom={'20px'} display={'grid'}>
                        <AceEditor
                            ref={variablesRef}
                            style={{...getReactXmlStyles(styleProps), marginLeft: '50px', marginBottom: 0}}
                            mode="javascript"
                            theme="tomorrow"
                            name="input_aggregator_script"
                            editorProps={{$blockScrolling: true}}
                            showPrintMargin={true}
                            showGutter={true}
                            highlightActiveLine={true}
                            value={variables}
                            height={'100px'}
                            width={'100%'}
                            readOnly={true}
                            cursorStart={0}
                            focus={false}
                            setOptions={{
                                readOnly: true,
                                cursorStyle: 'slim',
                                enableBasicAutocompletion: false,
                                enableLiveAutocompletion: false,
                                enableSnippets: false,
                                showLineNumbers: false,
                                useWorker: false,
                                showPrintMargin: false,
                                highlightActiveLine: false,
                                highlightGutterLine: false,
                                enableKeyboardAccessibility: false,
                                tabSize: 2,
                            }}
                        />
                        <AceEditor
                            ref={scriptSegmentRef}
                            style={{...getReactXmlStyles(styleProps), marginLeft: '50px', marginBottom: 20, marginTop: 0}}
                            mode="javascript"
                            theme="tomorrow"
                            onChange={changeScriptSegment}
                            name="input_aggregator_script"
                            editorProps={{$blockScrolling: true}}
                            showPrintMargin={true}
                            showGutter={true}
                            highlightActiveLine={true}
                            value={`${CAggregator.getScriptSegmentComment()}${scriptSegment}`}
                            height={'230px'}
                            width={'100%'}
                            readOnly={readOnly}
                            setOptions={{
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                enableSnippets: true,
                                showLineNumbers: false,
                                tabSize: 2,
                                useWorker: false,
                            }}
                        />
                    </Input>
                </FormContainer>
            </AggregatorFormContainer>
            <ActionButtonContainer>
                {formType !== 'view' &&
                    <Button
                        label={formType === 'add' ? 'Add' : 'Update'}
                        size={TextSize.Size_14}
                        handleClick={change}
                    />
                }
                {(closeForm || formType === 'view') &&
                    <Button
                        label={'Cancel'}
                        size={TextSize.Size_14}
                        handleClick={closeForm}
                    />
                }
            </ActionButtonContainer>
        </React.Fragment>
    )
}

export default withTheme(AggregatorForm);
