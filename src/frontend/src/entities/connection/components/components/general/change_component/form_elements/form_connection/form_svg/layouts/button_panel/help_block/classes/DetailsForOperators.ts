import { setFocusById } from "@application/utils/utils";
import AdditionalFunctions from "./AdditionalFunctions";
import { AnimationPopoverProps } from "../AnimationPopover/interfaces";
import { IAnimationData } from "../interfaces";


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
    const conditionRef = this.ref.current.detailsRef.current.descriptionRef.current.conditionRef.current;
    conditionRef.toggleEdit();

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('.condition_method_select_left')
  async changeLeftMethod (animationSpeed: number) {
    const leftStatementRef = this.ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.leftStatementRef.current;
    const connectionMethods = this.ref.current.props.connection[this.condition.leftStatement.fromConnector].methods;

    let leftMethod;
    connectionMethods.forEach((element: any) => {
      if(element.index === this.condition.leftStatement.leftMethodIndex){
        leftMethod = element;
        return;
      }
    });

    leftStatementRef.updateMethod(leftMethod);

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('.condition_param_select_left')
  async setFocusOnLeftParam (animationSpeed: number) {
    const leftParamInputId = this.ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.leftStatementRef.current.paramInputRef.current.props.id;
    setFocusById(leftParamInputId);
    
    return AdditionalFunctions.delay(animationSpeed);
  }

  
  async changeLeftParam (animationSpeed: number) {
    const leftStatementRef = this.ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.leftStatementRef.current;

    const leftParamInputId = leftStatementRef.paramInputRef.current.props.id
    
    leftStatementRef.updateParam(this.condition.leftStatement.leftParam);

    const leftParamInput = document.getElementById(leftParamInputId);
    leftParamInput.blur();
    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('.condition_relational_operator')
  async changeRelationalOperator (animationSpeed: number) {
    const conditionRef = this.ref.current.detailsRef.current.descriptionRef.current.conditionRef.current;
    conditionRef.updateRelationalOperator({ value: this.condition.relationalOperator});

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('.condition_property_input')
  async setFocusOnRightProperty (animationSpeed: number) {
    const rightProperyInputId = this.ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current.props.operator.index;
    setFocusById(`if_operator_property_${rightProperyInputId}`);
    return AdditionalFunctions.delay(animationSpeed);
  }

  async changeRightProperty (animationSpeed: number) {
    const rightStatementRef = this.ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current;
    rightStatementRef.updateProperty(this.condition.rightStatement.property);
    return AdditionalFunctions.delay(animationSpeed);
  }

  async removeFocusFromRightProperty (animationSpeed: number) {
    const rightProperyInputId = this.ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current.props.operator.index;
    const propertyInput = document.getElementById(`if_operator_property_${rightProperyInputId}`);
    propertyInput.blur();

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('.condition_method_select_right')
  async changeRightMethod (animationSpeed: number) {
    const rightStatementRef = this.ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current;
    const connectionMethods = this.ref.current.props.connection[this.condition.rightStatement.fromConnector].methods;

    let rightMethod;
    connectionMethods.forEach((element: any) => {
      if(element.index === this.condition.rightStatement.rightMethodIndex){
        rightMethod = element;
        return;
      }
    })

    rightStatementRef.updateMethod(rightMethod);

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('.condition_param_select_right')
  async setFocusOnRightParam (animationSpeed: number) {
    const rightParamInputId = this.ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current.paramInputRef.current.props.id;
    setFocusById(rightParamInputId);
    return AdditionalFunctions.delay(animationSpeed);
  }

  async changeRightParam (animationSpeed: number) {
    const rightStatementRef = this.ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current;
    rightStatementRef.updateParam(this.condition.rightStatement.rightParam);
    
    return AdditionalFunctions.delay(animationSpeed);
  }

  async removeFocusFromRightParam (animationSpeed: number) {
    const rightParamInputId = this.ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current.paramInputRef.current.props.id;
    const rightParamInput = document.getElementById(rightParamInputId);
    rightParamInput.blur();
    return AdditionalFunctions.delay(animationSpeed);
  }
}