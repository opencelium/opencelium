/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React from "react";
import PropTypes from "prop-types";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";
import { connect } from "react-redux";
import { setPanelConfigurations } from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import { setModalPanelConfigurations } from "@entity/connection/redux_toolkit/slices/ModalConnectionSlice";
import ColorMode from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/ColorMode";
import { TooltipButton } from "@app_component/base/tooltip_button/TooltipButton";
import { TextSize } from "@app_component/base/text/interfaces";
import LabelSize from "@change_component/form_elements/form_connection/form_svg/details/configurations_icon/LabelSize";
import { ColorTheme } from "@style/Theme";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import InputText from "@app_component/base/input/text/InputText";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";
import {setFocusById} from "@application/utils/utils";
import {
  getAndUpdateConnectionDescription,
  getAndUpdateConnectionTitle
} from "@root/redux_toolkit/action_creators/ConnectionCreators";
import { ResponseMessages } from "@application/requests/interfaces/IResponse";
import InputSelect from "@app_component/base/input/select/InputSelect";
import {Category} from "@entity/category/classes/Category";
import {getAllCategories} from "@entity/category/redux_toolkit/action_creators/CategoryCreators";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";

function mapStateToProps(state, props) {
  const { connectionOverview, connection } = mapItemsToClasses(state, props.isModal);
  const {gettingCategories, categories} = state.categoryReducer;
  return {
    colorMode: connectionOverview.colorMode,
    processTextSize: connectionOverview.processTextSize,
    connection,
    gettingAllCategories: gettingCategories,
    categories,
  };
}

@GetModalProp()
@connect(mapStateToProps, {
  setPanelConfigurations, setModalPanelConfigurations, getAndUpdateConnectionDescription,
  getAndUpdateConnectionTitle, getAllCategories,
})
class ConfigurationsIcon extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisibleSettingsWindow: false,
      colorMode: props.colorMode,
      processTextSize: props.processTextSize,
      title: props?.connection ? props.connection.title : '',
      description: props?.connection ? props.connection.description: '',
      validationMessageTitle: '',
      validationMessageDescription: '',
      errorMessage: '',
      category: Category.getOptionsForCategorySelect(props.categories).find(c => c.value === props.connection.categoryId) || null,
      categoryOptions: [],
    };
    this.flag = true;
  }

  componentDidMount() {
    this.props.getAllCategories();
  }

  componentDidUpdate(prevProps, prevState, snapshot){
    const {connection, categories, gettingAllCategories} = this.props;
    if(gettingAllCategories === API_REQUEST_STATE.FINISH && prevProps.gettingAllCategories === API_REQUEST_STATE.START) {
      const newCategory = connection.categoryId ? categories.find(c => c.id === connection.categoryId) : null;
      this.setState({
        categoryOptions: Category.getOptionsForCategorySelect(categories),
        category: newCategory ? {label: newCategory.name, value: newCategory.id} : null,
      });
    }
    if(this.props.errorAction.error && this.flag){
      this.flag = false;
      this.setState({errorMessage: this.props.errorAction.message})
      this.toggleIsVisibleSettingsWindow();
    }
  }

  handleChangeCategory(newCategory) {
    this.setState({
      category: newCategory,
    })
  }

  setTitle(title){
    const {getTitle} = this.props;
    getTitle(title)
    this.setState({title, validationMessageTitle: ''});
  }

  setDescription(description){
    const {getDescription} = this.props;
    getDescription(description);
    this.setState({description, validationMessageDescription: ''});
  }

  toggleIsVisibleSettingsWindow() {
    if(!this.state.isVisibleSettingsWindow){
      setFocusById('settings_input_title', 500);
      if(!this.state.title || this.props.errorAction.message){
        this.setState({title: this.state.title ? this.state.title : this.props.connection.title, validationMessageTitle: this.props.errorAction.message ? this.props.errorAction.message : ''})
      }
      if(!this.state.description){
        this.setState({description: this.props.connection.description})
      }
      if(!this.state.category) {
        this.setState({category: Category.getOptionsForCategorySelect(this.props.categories, false).find(c => c.value === this.props.connection.categoryId) || null})
      }
    }
    this.setState(
      {
        isVisibleSettingsWindow: !this.state.isVisibleSettingsWindow,
      },
      () => {
        if (!this.state.isVisibleSettingsWindow) {
          setTimeout(() => document.activeElement.blur(), 500);
        }
      }
    );
    if(this.flag === false && this.props.errorAction.error && this.state.isVisibleSettingsWindow){
      this.flag = true;
      this.props.errorAction.error = '';
    }
  }

  onChangeColorMode(colorMode) {
    this.setState({
      colorMode,
    });
  }

  onChangeProcessTextSize(processTextSize) {
    this.setState({
      processTextSize,
    });
  }

  save() {
    const { colorMode, processTextSize, title, description, category } = this.state;
    const {
      connection, setPanelConfigurations, setModalPanelConfigurations,
      isModal, getAndUpdateConnectionDescription, getAndUpdateConnectionTitle,
      updateConnection,
    } = this.props;
    if(isModal){
      setModalPanelConfigurations({
        colorMode,
        processTextSize,
      });
    } else{
      setPanelConfigurations({
        colorMode,
        processTextSize,
      });
    }
    const specialCharacters = /[\/\\]/;
    if(connection.id) {
      const connectionObj = connection.getObject();
      if (title === '') {
        this.setState({validationMessageTitle: 'Title is a required field'});
        setFocusById('settings_input_title');
        return;
      }
      else if(specialCharacters.test(title)){
        this.setState({validationMessageTitle: 'Title cannot contain \"/\" and \"\\\" characters'})
        setFocusById('settings_input_title');
        return;
      }
      else if (title !== connection.title) {
        connection.title = title;
        connection.description = description;
        if (category) {
          connection.categoryId = category.value;
        }
        getAndUpdateConnectionTitle({...connectionObj, title, description, categoryId: category ? category.value : null}).then((data) => {
          if(data.payload.message === ResponseMessages.CONNECTOR_EXISTS){
            this.setState({validationMessageTitle: 'Connection with such title already exist'});
            return
          }
          else{
            this.setState({
              title: '',
              description: '',
              category: null,
            })
            this.toggleIsVisibleSettingsWindow();
          }
          updateConnection(connection);
        });

      } else if (description !== connection.description || category.value !== connection.categoryId) {
        connection.description = description;
        if (category) {
          connection.categoryId = category.value;
        }
        getAndUpdateConnectionDescription({...connectionObj, description, categoryId: category ? category.value : null});
        updateConnection(connection);
        this.setState({
          title: '',
          description: '',
          category: null,
        })
        this.toggleIsVisibleSettingsWindow();
      }
      else if(title === connection.title){
        this.toggleIsVisibleSettingsWindow();
        updateConnection(connection);
      }
    }
  }

  render() {
    const {
      isVisibleSettingsWindow, colorMode, title, validationMessageTitle, validationMessageDescription,
      description, processTextSize, category, categoryOptions,
    } = this.state;
    const { disabled, readOnly, connection } = this.props;
    return (
      <React.Fragment>
        <TooltipButton
          size={TextSize.Size_20}
          position={"bottom"}
          className={styles.configurations_icon}
          icon={"settings"}
          tooltip={disabled ? "" : "Settings"}
          target={`settings_connection_button`}
          hasBackground={true}
          background={
            isVisibleSettingsWindow ? ColorTheme.Blue : ColorTheme.White
          }
          color={isVisibleSettingsWindow ? ColorTheme.White : ColorTheme.Gray}
          padding="2px"
          isDisabled={disabled}
          handleClick={() => this.toggleIsVisibleSettingsWindow()}
        />
        <Dialog
          actions={[
            { label: "Save", onClick: (a) => this.save(a) },
            {
              label: "Cancel",
              onClick: (a) => this.toggleIsVisibleSettingsWindow(a),
            },
          ]}
          active={isVisibleSettingsWindow}
          toggle={(a) => this.toggleIsVisibleSettingsWindow(a)}
          title={"Settings"}
          hasAutoFocus={false}
        >
          <React.Fragment>
            {connection.id &&
                <React.Fragment>
                  <InputText
                      id={`settings_input_title`}
                      icon={'title'}
                      label={'Title'}
                      maxLength={256}
                      onChange={(e) => this.setTitle(e.target.value)}
                      value={title}
                      error={validationMessageTitle}
                      readOnly={readOnly}
                      required
                  />
                  <InputTextarea
                      id={`settings_input_description`}
                      icon={'notes'}
                      label={'Description'}
                      error={validationMessageDescription}
                      onChange={(e) => this.setDescription(e.target.value)}
                      value={description}
                      readOnly={readOnly}
                  />

                  <InputSelect
                      id={'settings_input_category'}
                      value={category}
                      onChange={(a) => this.handleChangeCategory(a)}
                      options={categoryOptions}
                      placeholder={'Choose category'}
                      isDisabled={readOnly}
                      icon={'category'}
                      label={'Category'}
                      categoryList={true}
                  />
                </React.Fragment>
            }
            <ColorMode
              colorMode={colorMode}
              onChangeColorMode={(a) => this.onChangeColorMode(a)}
            />
            <div style={{ marginTop: "20px" }}>
              <LabelSize
                value={processTextSize}
                onChange={(a) => this.onChangeProcessTextSize(a)}
              />
            </div>
          </React.Fragment>
        </Dialog>
      </React.Fragment>
    );
  }
}

ConfigurationsIcon.propTypes = {
  disabled: PropTypes.bool,
};

ConfigurationsIcon.defaultProps = {
  disabled: false,
};

export default ConfigurationsIcon;
