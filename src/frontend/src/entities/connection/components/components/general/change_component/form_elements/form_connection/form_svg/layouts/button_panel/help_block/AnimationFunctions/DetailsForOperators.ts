import { setFocusById } from "@application/utils/utils";

export default class DetailsForOperators {

  static async delay(ms: any) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  static async openConditionDialog (ref: any, animationSpeed: number) {
    const conditionRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current;
    conditionRef.toggleEdit();

    return DetailsForOperators.delay(animationSpeed);
  }

  static async changeLeftMethod (ref: any, condition: any, animationSpeed: number) {
    const leftStatementRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.leftStatementRef.current;
    const connectionMethods = ref.current.props.connection[condition.leftStatement.fromConnector].methods;

    let leftMethod;
    connectionMethods.forEach((element: any) => {
      if(element.index === condition.leftStatement.leftMethodIndex){
        leftMethod = element;
        return;
      }
    });

    leftStatementRef.updateMethod(leftMethod);

    return DetailsForOperators.delay(animationSpeed);
  }

  static async setFocusOnLeftParam (ref: any, animationSpeed: number) {
    const leftParamInputId = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.leftStatementRef.current.paramInputRef.current.props.id;
    setFocusById(leftParamInputId);
    
    return DetailsForOperators.delay(animationSpeed);
  }

  static async changeLeftParam (ref: any, condition: any, animationSpeed: number) {
    const leftStatementRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.leftStatementRef.current;

    const leftParamInputId = leftStatementRef.paramInputRef.current.props.id
    
    leftStatementRef.updateParam(condition.leftStatement.leftParam);

    const leftParamInput = document.getElementById(leftParamInputId);
    leftParamInput.blur();
    return DetailsForOperators.delay(animationSpeed);
  }

  static async changeRelationalOperator (ref: any, condition: any, animationSpeed: number) {
    const conditionRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current;
    conditionRef.updateRelationalOperator({ value: condition.relationalOperator});

    return DetailsForOperators.delay(animationSpeed);
  }

  static async setFocusOnRightProperty (ref: any, animationSpeed: number) {
    const rightProperyInputId = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current.props.operator.index;
    setFocusById(`if_operator_property_${rightProperyInputId}`);
    return DetailsForOperators.delay(animationSpeed);
  }

  static async changeRightProperty (ref: any, condition: any, animationSpeed: number) {
    const rightStatementRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current;
    rightStatementRef.updateProperty(condition.rightStatement.property);
    return DetailsForOperators.delay(animationSpeed);
  }

  static async removeFocusFromRightProperty (ref: any, animationSpeed: number) {
    const rightProperyInputId = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current.props.operator.index;
    const propertyInput = document.getElementById(`if_operator_property_${rightProperyInputId}`);
    propertyInput.blur();

    return DetailsForOperators.delay(animationSpeed);
  }

  static async changeRightMethod (ref: any, condition: any, animationSpeed: number) {
    const rightStatementRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current;
    const connectionMethods = ref.current.props.connection[condition.rightStatement.fromConnector].methods;

    let rightMethod;
    connectionMethods.forEach((element: any) => {
      if(element.index === condition.rightStatement.rightMethodIndex){
        rightMethod = element;
        return;
      }
    })

    rightStatementRef.updateMethod(rightMethod);

    return DetailsForOperators.delay(animationSpeed);
  }

  static async setFocusOnRightParam (ref: any, animationSpeed: number) {
    const rightParamInputId = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current.paramInputRef.current.props.id;
    setFocusById(rightParamInputId);
    return DetailsForOperators.delay(animationSpeed);
  }

  static async changeRightParam (ref: any, condition: any, animationSpeed: number) {
    const rightStatementRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current;
    rightStatementRef.updateParam(condition.rightStatement.rightParam);
    
    return DetailsForOperators.delay(animationSpeed);
  }

  static async removeFocusFromRightParam (ref: any, animationSpeed: number) {
    const rightParamInputId = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current.paramInputRef.current.props.id;
    const rightParamInput = document.getElementById(rightParamInputId);
    rightParamInput.blur();
    return DetailsForOperators.delay(animationSpeed);
  }
}