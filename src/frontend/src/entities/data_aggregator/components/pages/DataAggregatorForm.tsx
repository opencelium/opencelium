import React, {FC, useRef, useState, useEffect, useMemo} from 'react';
import AceEditor, { IMarker } from "react-ace";
import Arguments from "../arguments/Arguments";
import AddArgument from "../arguments/AddArgument";
import Input from "@app_component/base/input/Input";
import {
    ArgumentFormContainer,
} from "./styles";
import {getReactXmlStyles} from "@app_component/base/input/xml_view/styles";
import { withTheme } from 'styled-components';
import InputText from "@app_component/base/input/text/InputText";
import {ModelArgument} from "@entity/data_aggregator/requests/models/DataAggregator";
import Button from "@app_component/base/button/Button";
import CAggregator from "@classes/content/connection/data_aggregator/CAggregator";
import {getMarker, setFocusById} from "@application/utils/utils";
import {CDataAggregator} from "@entity/data_aggregator/classes/CDataAggregator";
import {API_REQUEST_STATE, TRIPLET_STATE} from '@application/interfaces/IApplication';
import FormComponent from "@app_component/form/form/Form";
import {Form} from "@application/classes/Form";
import {IForm} from "@application/interfaces/IForm";
import FormSection from '@app_component/form/form_section/FormSection';
import {
    addAggregator,
    getAggregatorById, getAllAggregators,
    updateAggregator
} from "../../redux_toolkit/action_creators/DataAggregatorCreators";
import {useAppDispatch} from "@application/utils/store";
import {useNavigate, useParams} from "react-router";
import { clearError as clearDataAggregatorError } from '@entity/data_aggregator/redux_toolkit/slices/DataAggregatorSlice';

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

const DataAggregatorDialogForm:FC<IForm> =
    ({
         isAdd, isUpdate, isView, theme
    }) => {
        let readOnly = false;
        if(isView){
            readOnly = true;
        }
        const {
            addingAggregator, updatingAggregator, error,
            currentAggregator, aggregators, gettingAggregator,
            gettingAllAggregators, isCurrentAggregatorHasUniqueName,
        } = CDataAggregator.getReduxState();
        const [markers, setMarkers] = useState<any[]>([]);
        const dispatch = useAppDispatch();
        const variablesRef = useRef(null);
        const scriptSegmentRef = useRef(null);
        const [name, setName] = useState<string>(currentAggregator?.name || '');
        const [nameError, setNameError] = useState<string>('');
        const [args, setArgs] = useState(currentAggregator?.args || []);
        const [argsError, setArgsError] = useState<string>('');
        const initialScript = CAggregator.splitVariablesFromScript(currentAggregator?.script || '');
        const [variables, setVariables] = useState<string>(initialScript.variables || '');
        const [scriptSegment, updateScriptSegment] = useState<string>(initialScript.scriptSegment || '');
        const [scriptSegmentError, setScriptSegmentError] = useState<string>('');
        const [hideComments, toggleComments] = useState<boolean>(false);
        const shouldFetchDataAggregator = isUpdate || isView;
        const didMount = useRef(false);
        let navigate = useNavigate();
        let urlParams = useParams();
        let aggregatorId = 0;
        if(shouldFetchDataAggregator){
            aggregatorId = parseInt(urlParams.id);
        }
        const setScriptSegment = (segment: string) => {
            updateScriptSegment(segment);
        }
        const changeScriptSegment = (segment: string) => {
            setScriptSegment(CAggregator.cleanCodeFromComments(segment));
            setScriptSegmentError('');
        }
        const changeName = (newName: string) => {
            setName(newName);
            setNameError('');
        }
        useEffect(() => {
            return () => {
                dispatch(clearDataAggregatorError());
            }
        }, [])
        useEffect(() => {
            const newMarkers = getMarker(scriptSegmentRef.current.editor, CAggregator.getScriptSegmentComment()+scriptSegment, CAggregator.generateNotExistVar());
            setMarkers(newMarkers)
        }, [scriptSegment])
        useEffect(() => {
            if(currentAggregator) {
                if (name !== currentAggregator.name) {
                    setName(currentAggregator.name);
                }
                if (args !== currentAggregator.args) {
                    setArgs(currentAggregator.args);
                }
                const initialScript = CAggregator.splitVariablesFromScript(currentAggregator.script || '');
                if (variables !== initialScript.variables) {
                    setVariables(initialScript.variables);
                }
                if (scriptSegment !== initialScript.scriptSegment) {
                    setScriptSegment(initialScript.scriptSegment);
                }
            }
        }, [currentAggregator])
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
            if(isCurrentAggregatorHasUniqueName === TRIPLET_STATE.FALSE){
                setNameError('Such name already exists');
                setFocusById('input_aggregator_name');
                return;
            }
        }, [isCurrentAggregatorHasUniqueName])
        useEffect(() => {
            if(shouldFetchDataAggregator){
                dispatch(getAggregatorById(`${aggregatorId}`));
            }
        }, [])
        useEffect(() => {
            if (didMount.current) {
                if(error === null && (addingAggregator === API_REQUEST_STATE.FINISH || updatingAggregator === API_REQUEST_STATE.FINISH)){
                    navigate('/data_aggregator', { replace: false });
                }
            } else {
                didMount.current = true;
            }
        },[addingAggregator, updatingAggregator]);
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
            if(args.length === 0){
                setArgsError('Arguments are required fields');
                setFocusById(`input_argument_name_add`);
                return;
            }
            if(scriptSegment === ''){
                setScriptSegmentError('Script is a required field');
                scriptSegmentRef.current.editor.focus();
                return;
            }
            if(isAdd){
                dispatch(addAggregator({name, args, script: CAggregator.joinVariablesWithScriptSegment(variables, scriptSegment)}));
            }
            if(isUpdate){
                dispatch(updateAggregator({id: currentAggregator.id, name, args, script: CAggregator.joinVariablesWithScriptSegment(variables, scriptSegment)}));
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
            if(newScriptSegment.indexOf(args[index].name) === 0){
                newScriptSegment = CAggregator.generateNotExistVar() + newScriptSegment.substring(args[index].name.length);
            }
            setScriptSegment(newScriptSegment);
            const newArgs = [...args];
            newArgs.splice(index, 1);
            setArgs(newArgs);
            toggleComments(true);
        }
        const form = new Form({isView, isAdd, isUpdate});
        const formData = form.getFormData('Data Aggregator');
        let actions = [<Button
            key={'list_button'}
            label={formData.listButton.label}
            icon={formData.listButton.icon}
            href={'/data_aggregator'}
            autoFocus={isView}
        />];
        if(isAdd || isUpdate){
            actions.unshift(<Button
                key={'action_button'}
                label={formData.actionButton.label}
                icon={formData.actionButton.icon}
                handleClick={change}
                isLoading={addingAggregator === API_REQUEST_STATE.START || updatingAggregator === API_REQUEST_STATE.START}
            />);
        }
        const styleProps = {
            hasIcon: true,
            marginTop: '25px',
            marginBottom: '50px',
            theme,
        }
        const data = {
            title: [{name: 'Admin Panel', link: '/admin_cards'}, {name: formData.formTitle}],
            actions,
            formSections: [
                <FormSection label={{value: 'General Data'}}>
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
                    <Input errorBottom={'-20px'} error={argsError} readOnly={readOnly} required={true} value={'arguments'} label={'Arguments'} icon={'abc'} marginBottom={'20px'}>
                        <ArgumentFormContainer>
                            {!readOnly && <AddArgument clearArgsError={() => setArgsError('')} args={args} add={addArgument}/>}
                            <Arguments add={addArgument} update={updateArgument} deleteArg={deleteArgument} args={args} readOnly={readOnly}/>
                        </ArgumentFormContainer>
                    </Input>
                </FormSection>,
                <FormSection label={{value: 'Code'}}>
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
                            markers={markers}
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
                </FormSection>
            ]
        }
        return (
            <FormComponent {...data} isLoading={shouldFetchDataAggregator && (gettingAggregator === API_REQUEST_STATE.START || gettingAllAggregators === API_REQUEST_STATE.START)}/>
        );
    }

export default withTheme(DataAggregatorDialogForm);
