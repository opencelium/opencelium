import { setFocusById } from "@application/utils/utils";
import AdditionalFunctions from "./AdditionalFunctions";
import { AnimationPopoverProps } from "../AnimationPopover/interfaces";
import { IAnimationData } from "../interfaces";
import RefFunctions from "./RefFunctions";


export default class DetailsForOperators {
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
        conditionRef.toggleEdit();
  
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log('error');
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
      else{
        throw new Error('props is not defined')
      }
    }
    catch(error){
      console.log('error');
    }
  }

  @AdditionalFunctions.setPopover('.condition_param_select_left')
  async setFocusOnLeftParam (animationSpeed: number) {
    try{
      if(RefFunctions.getLeftParamInput(this.ref).props){
        const leftParamInputId = RefFunctions.getLeftParamInput(this.ref).props.id;
        if(leftParamInputId){
          setFocusById(leftParamInputId);
        
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
      else{
        throw new Error('props is not defined')
      }
    }
    catch(error){
      console.log('error')
    }
  }

  
  async changeLeftParam (animationSpeed: number) {
    try{
      if(RefFunctions.getLeftParamInput(this.ref).props){
        const leftStatementRef = RefFunctions.getLeftStatement(this.ref);
    
        const leftParamInputId = RefFunctions.getLeftParamInput(this.ref).props.id;
        
        if(leftStatementRef && leftParamInputId){
          leftStatementRef.updateParam(this.condition.leftStatement.leftParam);
    
          const leftParamInput = document.getElementById(leftParamInputId);
          if(leftParamInput){
            leftParamInput.blur();
          }
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
      else{
        throw new Error('props is not defined')
      }
    }
    catch(error){
      console.log('error');
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
      console.log("error");
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
        else{
          throw new Error('props is not defined')
        }
      }
    }
    catch(error){
      console.log('error');
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
      console.log('error');
    }
  }

  async removeFocusFromRightProperty (animationSpeed: number) {
    try{
      const rightStatementRef = RefFunctions.getRightStatement(this.ref);
      if(rightStatementRef){
        if(rightStatementRef.props){
          const rightProperyInputId = rightStatementRef.props.operator.index;
          if(rightProperyInputId){
            const propertyInput = document.getElementById(`if_operator_property_${rightProperyInputId}`);
            if(propertyInput){
              propertyInput.blur();
    
              await AdditionalFunctions.delay(animationSpeed);
            }
          }
        }
        else{
          throw new Error('props is not defined')
        }
      }
    }
    catch(error){
      console.log('error');
    }
  }

  @AdditionalFunctions.setPopover('.condition_method_select_right')
  async changeRightMethod (animationSpeed: number) {
    try{
      if(this.ref.current.props){
        const rightStatementRef = RefFunctions.getRightStatement(this.ref);
        const connectionMethods = this.ref.current.props.connection[this.condition.rightStatement.fromConnector].methods;
    
        if(rightStatementRef && connectionMethods){
          let rightMethod;
          connectionMethods.forEach((element: any) => {
            if(element.index === this.condition.rightStatement.rightMethodIndex){
              rightMethod = element;
              return;
            }
          })
    
          rightStatementRef.updateMethod(rightMethod);
    
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
      else{
        throw new Error('props is not defined')
      }
    }
    catch(error){
      console.log('error');
    }
  }

  @AdditionalFunctions.setPopover('.condition_param_select_right')
  async setFocusOnRightParam (animationSpeed: number) {
    try{
      if(RefFunctions.getRightParamInput(this.ref).props){
        const rightParamInputId = RefFunctions.getRightParamInput(this.ref).props.id;
        if(rightParamInputId){
          setFocusById(rightParamInputId);
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
      else{
        throw new Error('props is not defined')
      }
    }
    catch(error){
      console.log('error');
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
      console.log('error');
    }
  }

  async removeFocusFromRightParam (animationSpeed: number) {
    try{
      if(RefFunctions.getRightParamInput(this.ref).props){
        const rightParamInputId = RefFunctions.getRightParamInput(this.ref).props.id;
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
      console.log('error');
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
      console.log('error');
    }
  }
}