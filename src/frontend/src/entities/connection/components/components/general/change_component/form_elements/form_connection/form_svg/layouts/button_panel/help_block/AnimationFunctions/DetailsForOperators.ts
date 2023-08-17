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

  static async changeRightMethodForLoop (ref: any, condition: any, animationSpeed: number) {
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

  static async changeRightParamForLoop (ref: any, condition: any, animationSpeed: number) {
    const rightStatementRef = ref.current.detailsRef.current.descriptionRef.current.conditionRef.current.rightStatementRef.current;
    rightStatementRef.updateParam(condition.rightStatement.rightParam);
    
    return DetailsForOperators.delay(animationSpeed);
  }
}