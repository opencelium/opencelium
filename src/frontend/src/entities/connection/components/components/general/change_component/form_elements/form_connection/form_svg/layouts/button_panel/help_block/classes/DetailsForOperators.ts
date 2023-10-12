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
import { setFocusById } from "@application/utils/utils";
import AdditionalFunctions from "./AdditionalFunctions";
import { AnimationPopoverProps } from "../AnimationPopover/interfaces";
import { IAnimationData } from "../interfaces";
import RefFunctions from "./RefFunctions";
import IDetailsForOperators
  from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/interfaces/IDetailsForOperators";


export default class DetailsForOperators implements IDetailsForOperators{
  ref: any;
  condition: any;
  animationData: IAnimationData;
  setPopoverProps: (props: AnimationPopoverProps) => void;
  constructor(ref: any, setPopoverProps: any, condition: any, animationData: IAnimationData) {
    this.ref = ref;
    this.condition = condition;
    this.animationData = animationData;
    this.setPopoverProps = setPopoverProps;
  }

  @AdditionalFunctions.setPopover('condition_label')
  async openConditionDialog (animationSpeed: number) {
    try{
      const conditionRef = RefFunctions.getCondition(this.ref);
      if(conditionRef){
        await AdditionalFunctions.addOutlineById(["condition_name", "condition_label"]);
        await AdditionalFunctions.delay(animationSpeed);
        await AdditionalFunctions.removeOutlineById(["condition_name", "condition_label"]);
        conditionRef.toggleEdit();
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      throw error;
    }
  }

  @AdditionalFunctions.setPopover('.condition_method_select_left')
  async changeLeftMethod (animationSpeed: number) {
    try{
      if(this.ref.current.props){
        const leftStatementRef = RefFunctions.getLeftStatement(this.ref);
        const connectionMethods = this.ref.current.props.connection[this.condition.leftStatement.fromConnector].methods;

        if(leftStatementRef && connectionMethods){
          let leftMethod;
          connectionMethods.forEach((element: any) => {
            if(element.index === this.condition.leftStatement.leftMethodIndex){
              leftMethod = element;
              return;
            }
          });
          leftStatementRef.updateMethod(leftMethod);

          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){
      throw error;
    }
  }

  @AdditionalFunctions.setPopover('.condition_param_select_left')
  async setFocusOnLeftParam (animationSpeed: number) {
    try{
      const leftParamInput = RefFunctions.getLeftParamInput(this.ref);
      if(leftParamInput && leftParamInput.props){
        const leftParamInputId = leftParamInput.props.id;
        if(leftParamInputId){
          setFocusById(leftParamInputId);

          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){
      throw error;
    }
  }

  async changeLeftParam (animationSpeed: number) {
    try{
      const leftParamInput = RefFunctions.getLeftParamInput(this.ref);
      if(leftParamInput && leftParamInput.props){
        const leftStatementRef = RefFunctions.getLeftStatement(this.ref);
        const leftParamInputId = leftParamInput.props.id;
        if(leftStatementRef && leftParamInputId){
          leftStatementRef.updateParam(this.condition.leftStatement.leftParam);
          const leftParamInput = document.getElementById(leftParamInputId);
          if(leftParamInput){
            leftParamInput.blur();
          }
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){
      throw error;
    }
  }

  @AdditionalFunctions.setPopover('.condition_relational_operator')
  async changeRelationalOperator (animationSpeed: number) {
    try{
      const conditionRef = RefFunctions.getCondition(this.ref);
      if(conditionRef){
        conditionRef.updateRelationalOperator({ value: this.condition.relationalOperator});

        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      throw error;
    }
  }

  @AdditionalFunctions.setPopover('.condition_property_input')
  async setFocusOnRightProperty (animationSpeed: number) {
    try{
      const rightStatementRef = RefFunctions.getRightStatement(this.ref);
      if(rightStatementRef){
        if(rightStatementRef.props){
          const rightPropertyInputId = rightStatementRef.props.operator.index;

          if(rightPropertyInputId){
            setFocusById(`if_operator_property_${rightPropertyInputId}`);
            await AdditionalFunctions.delay(animationSpeed);
          }
        }
      }
    }
    catch(error){
      throw error;
    }
  }

  async changeRightProperty (animationSpeed: number) {
    try{
      const rightStatementRef = RefFunctions.getRightStatement(this.ref);
      if(rightStatementRef){
        rightStatementRef.updateProperty(this.condition.rightStatement.property);
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      throw error;
    }
  }

  async removeFocusFromRightProperty (animationSpeed: number) {
    try{
      const rightStatementRef = RefFunctions.getRightStatement(this.ref);
      if(rightStatementRef){
        if(rightStatementRef.props){
          const rightPropertyInputId = rightStatementRef.props.operator.index;
          if(rightPropertyInputId){
            const propertyInput = document.getElementById(`if_operator_property_${rightPropertyInputId}`);
            if(propertyInput){
              propertyInput.blur();
              await AdditionalFunctions.delay(animationSpeed);
            }
          }
        }
      }
    }
    catch(error){
      throw error;
    }
  }

  @AdditionalFunctions.setPopover('.condition_method_select_right')
  async changeRightMethod (animationSpeed: number) {
    try{
      if(this.ref.current.props){
        const rightStatementRef = RefFunctions.getRightStatement(this.ref);
        if(this.condition.rightStatement.fromConnector){
          const connectionMethods = this.ref.current.props.connection[this.condition.rightStatement.fromConnector].methods;
          if(rightStatementRef && connectionMethods){
            let rightMethod;
            if(this.condition.rightStatement) {
              connectionMethods.forEach((element: any) => {
                if (element.index === this.condition.rightStatement.rightMethodIndex) {
                  rightMethod = element;
                  return;
                }
              })
              rightStatementRef.updateMethod(rightMethod);
              await AdditionalFunctions.delay(animationSpeed);
            }
          }
        }
      }
    }
    catch(error){
      throw error;
    }
  }

  @AdditionalFunctions.setPopover('.condition_param_select_right')
  async setFocusOnRightParam (animationSpeed: number) {
    try{
      const rightParamInput = RefFunctions.getRightParamInput(this.ref);
      if(rightParamInput && rightParamInput.props){
        const rightParamInputId = rightParamInput.props.id;
        if(rightParamInputId){
          setFocusById(rightParamInputId);
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){
      throw error;
    }
  }

  async changeRightParam (animationSpeed: number) {
    try{
      const rightStatementRef = RefFunctions.getRightStatement(this.ref);
      if(rightStatementRef){
        rightStatementRef.updateParam(this.condition.rightStatement.rightParam);
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      throw error;
    }
  }

  async removeFocusFromRightParam (animationSpeed: number) {
    try{
      const rightParamInput = RefFunctions.getRightParamInput(this.ref);
      if(rightParamInput && rightParamInput.props){
        const rightParamInputId = rightParamInput.props.id;
        if(rightParamInputId){
          const rightParamInput = document.getElementById(rightParamInputId);
          if(rightParamInput){
            rightParamInput.blur();
            await AdditionalFunctions.delay(animationSpeed);
          }
        }
      }
    }
    catch(error){
      throw error;
    }
  }

  @AdditionalFunctions.setPopover('delete_icon')
  async deleteOperator (animationSpeed: number) {
    try{
      const operatorRef = RefFunctions.getOperator(this.ref);
      if(operatorRef){
        await AdditionalFunctions.addOutlineById(['delete_icon'], true, animationSpeed);

        await AdditionalFunctions.removeOutlineById(['delete_icon'])
        operatorRef.deleteOperator();

        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      throw error;
    }
  }
}
