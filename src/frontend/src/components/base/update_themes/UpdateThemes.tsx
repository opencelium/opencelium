/*
 *  Copyright (C) <2022>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {ChromePicker} from 'react-color';
import {Application} from "@application/classes/Application";
import {setThemes} from '@application/redux_toolkit/slices/ApplicationSlice';
import {useAppDispatch} from "@application/utils/store";
import {setFocusById} from "@application/utils/utils";
import {LocalStorageTheme} from "@application/interfaces/IApplication";
import {Auth} from '@application/classes/Auth';
import {updateThemes} from "@application/redux_toolkit/action_creators/ApplicationCreators";
import Text from "@app_component/base/text/Text";
import Button from "@app_component/base/button/Button";
import {Dialog} from "@app_component/base/dialog/Dialog";
import InputSelect from "@app_component/base/input/select/InputSelect";
import {TextSize} from "@app_component/base/text/interfaces";
import InputText from "@app_component/base/input/text/InputText";
import Theme, {DefaultTheme, DefaultThemes} from "@style/Theme";
import {UpdateThemesProps} from "./interfaces";
import {ActionsStyled, ColorRowStyled, NameStyled, HeaderStyled, PreviewStyled} from "./styles";
import {FormSection} from "@app_component/form/form_section/FormSection";
import {Form} from "@app_component/form/form/Form";
import {InputTextType} from "@app_component/base/input/text/interfaces";
import {Menu} from "@app_component/layout/menu/Menu";

const UpdateThemes: FC<UpdateThemesProps> =
    ({

     }) => {
        const dispatch = useAppDispatch();
        const {themes} = Application.getReduxState();
        const {authUser} = Auth.getReduxState();
        const currentTheme = themes.find(theme => theme.isCurrent) || DefaultTheme;
        const themesOptions = themes.map(theme => {
            return {
                label: theme.name,
                value: theme.name,
            };
        });
        const [selectedTheme, setSelectedTheme] = useState({label: currentTheme.name, value: currentTheme.name});
        const [showDialog, toggleDialog] = useState<boolean>(false);
        const [actionColor, setActionColor] = useState<string>(currentTheme.colors.action);
        const [menuColor, setMenuColor] = useState<string>(currentTheme.colors.menu);
        const [labelColor, setLabelColor] = useState<string>(currentTheme.colors.header);
        const [name, setName] = useState<string>(currentTheme.name);
        const [nameValidationMessage, setNameValidationMessage] = useState<string>('');
        const [mode, setMode] = useState<'add' | 'edit'>('edit');
        const [isCurrent, setIsCurrent] = useState<boolean>(currentTheme.isCurrent);
        useEffect(() => {
            if(showDialog){
                setFocusById('edit_theme_close');
                selectTheme({label: currentTheme.name, value: currentTheme.name});
            }
        }, [showDialog])
        const update = (localStorageThemes: LocalStorageTheme[]) => {
            let newThemes: string = JSON.stringify(localStorageThemes);
            //TODO join setThemes and updateThemes
            dispatch(setThemes(newThemes));
            dispatch(updateThemes({email: authUser.email, themes: newThemes}))
        }
        const selectTheme = (newTheme: any) => {
            const selectedTheme = themes.find(theme => theme.name === newTheme.value);
            setActionColor(selectedTheme.colors.action);
            setMenuColor(selectedTheme.colors.menu);
            setLabelColor(selectedTheme.colors.header);
            setSelectedTheme(newTheme);
            setName(newTheme.value);
            setMode('edit');
            setIsCurrent(!!selectedTheme.isCurrent);
        }
        const addTheme = () => {
            const newThemes: LocalStorageTheme[] = [...themes];
            if(themes.findIndex(theme => theme.name === name) !== -1){
                setNameValidationMessage('Such name already exists');
                return;
            }
            newThemes.push({
                name,
                isCurrent: false,
                colors: {
                    action: actionColor,
                    menu: menuColor,
                    header: labelColor,
                }
            })
            setSelectedTheme({label: name, value: name});
            setMode('edit');
            setIsCurrent(false);
            update(newThemes);
        }
        const updateTheme = () => {
            const newThemes: LocalStorageTheme[] = [...themes];
            const index = themes.findIndex(theme => theme.name === name);
            if(index !== -1) {
                newThemes[index] = ({
                    name,
                    isCurrent: newThemes[index].isCurrent,
                    colors: {
                        action: actionColor,
                        menu: menuColor,
                        header: labelColor,
                    }
                })
                update(newThemes);
            }
        }
        const deleteTheme = () => {
            let newThemes: LocalStorageTheme[] = [...themes];
            newThemes = newThemes.filter(theme => theme.name !== name);
            setName(DefaultTheme.name);
            setMode('edit')
            setSelectedTheme({label: DefaultTheme.name, value: DefaultTheme.name});
            update(newThemes);
        }
        const setCurrentTheme = (isCurrent: boolean) => {
            let hasUpdate = false;
            let newThemes: LocalStorageTheme[] = themes.map(theme => {
                let newTheme = {...theme};
                if(selectedTheme.value === theme.name){
                    if(!theme.isCurrent){
                        newTheme.isCurrent = isCurrent;
                        hasUpdate = true;
                    }
                } else{
                    newTheme.isCurrent = false;
                }
                return newTheme;
            });
            if(hasUpdate){
                setIsCurrent(isCurrent);
                update(newThemes);
            }
        }
        const changeName = (newName: string) => {
            setName(newName);
            if(mode !== 'add'){
                setMode('add');
            }
            if(nameValidationMessage !== ''){
                setNameValidationMessage('');
            }
        }
        const actionButtonDisabled = name === '' || DefaultThemes.findIndex(theme => theme.name === name) !== -1;
        const deleteButtonDisabled = mode === 'add' || DefaultThemes.findIndex(theme => theme.name === name) !== -1;
        return (
            <React.Fragment>
                <Button
                    margin={"-50px 0 0 0"}
                    float={'right'}
                    key={'edit_theme'}
                    label={'Edit'}
                    icon={'edit'}
                    handleClick={() => toggleDialog(!showDialog)}
                />
                <Dialog
                    actions={[
                        {label: 'Close', onClick: () => toggleDialog(false), id: 'edit_theme_close'}
                    ]}
                    active={showDialog}
                    toggle={() => toggleDialog(!showDialog)}
                    title={'Edit Themes'}
                    styles={{modal: {minWidth: '800px'}}}
                >
                    {/*@ts-ignore*/}
                    <div style={{display: 'flex'}}>
                        <div style={{width: '100%'}}>
                            <InputSelect id={'edit_theme_theme'} label={'Theme'} icon={'palette'} options={themesOptions} value={selectedTheme} onChange={selectTheme}/>
                        </div>
                        <div style={{width: '65px', textAlign: 'center', paddingTop: '25px'}}>
                            <input type={'checkbox'} checked={isCurrent} onChange={(e) => setCurrentTheme(e.target.checked)}/>
                            <div style={{marginTop: '-8px'}}>{"current"}</div>
                        </div>
                    </div>
                    <HeaderStyled>
                        <Text value={'Preview'} size={TextSize.Size_20}/>
                    </HeaderStyled>
                    <PreviewStyled>
                        <Menu isPreview={true} isReadonly={true} background={menuColor} hoverMenuItemBackground={labelColor}/>
                        <Form formSections={[
                            <FormSection label={{value: 'user details', background: labelColor}}>
                                <InputText
                                    icon={'perm_identity'}
                                    value={'Name'}
                                    readOnly={true}
                                    label={'Name'}
                                />
                                <InputText
                                    readOnly={true}
                                    icon={'email'}
                                    value={'Email'}
                                    label={'Email'}
                                />
                            </FormSection>,
                            <FormSection label={{value: 'credentials', background: labelColor}}>
                                <InputText
                                    icon={'vpn_key'}
                                    type={InputTextType.Password}
                                    value={'password'}
                                    readOnly={true}
                                    label={'Current Password'}
                                    checkBackground={actionColor}
                                />
                                <InputText
                                    type={InputTextType.Password}
                                    readOnly={true}
                                    icon={'vpn_key'}
                                    value={'password'}
                                    label={'New Password'}
                                    checkBackground={actionColor}
                                />
                                <Button
                                    margin={"10px 0 0"}
                                    float={'right'}
                                    key={'action'}
                                    label={'Action'}
                                    icon={'refresh'}
                                    handleClick={() => {}}
                                    background={actionColor}
                                />
                            </FormSection>]}
                        />
                    </PreviewStyled>
                    <HeaderStyled>
                        <Text value={'Colors'} size={TextSize.Size_20}/>
                    </HeaderStyled>
                    <ColorRowStyled>
                        <div>
                            <NameStyled><Text value={'Action Color'} size={TextSize.Size_16}/></NameStyled>
                            <ChromePicker color={actionColor} onChange={(color) => setActionColor(color.hex)}/>
                        </div>
                        <div>
                            <NameStyled><Text value={'Menu Color'} size={TextSize.Size_16}/></NameStyled>
                            <ChromePicker color={menuColor} onChange={(color) => setMenuColor(color.hex)}/>
                        </div>
                        <div>
                            <NameStyled><Text value={'Label Color'} size={TextSize.Size_16}/></NameStyled>
                            <ChromePicker color={labelColor} onChange={(color) => setLabelColor(color.hex)}/>
                        </div>
                    </ColorRowStyled>
                    <InputText
                        icon={'perm_identity'}
                        value={name}
                        onChange={(e) => changeName(e.target.value)}
                        error={nameValidationMessage}
                        label={'Name'}
                    />
                    <ActionsStyled>
                        <Button
                            margin={"10px 0 0"}
                            key={'action_theme'}
                            label={mode === "add" ? 'Add' : 'Update'}
                            icon={mode === 'add' ? 'add' : 'edit'}
                            handleClick={mode === 'add' ? addTheme : updateTheme}
                            isDisabled={actionButtonDisabled}
                        />
                        <Button
                            margin={"10px 0 0 10px"}
                            key={'delete_theme'}
                            label={'Delete'}
                            icon={'delete'}
                            handleClick={deleteTheme}
                            isDisabled={deleteButtonDisabled}
                        />
                    </ActionsStyled>
                </Dialog>
            </React.Fragment>
        )
    }

UpdateThemes.defaultProps = {
}

export {
    UpdateThemes,
};

export default withTheme(UpdateThemes);