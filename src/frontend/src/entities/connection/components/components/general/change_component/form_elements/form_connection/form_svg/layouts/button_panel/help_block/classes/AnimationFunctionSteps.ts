import { AnimationPopoverProps } from "../AnimationPopover/interfaces";
import { IAnimationData } from "../interfaces";
import AdditionalFunctions from "./AdditionalFunctions";
import { setFocusById } from "@application/utils/utils";
import RefFunctions
  from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/classes/RefFunctions";

export default class AnimationFunctionSteps {
  ref: any;
  animationData: IAnimationData;
  setPopoverProps: (props: AnimationPopoverProps) => void;
  constructor(ref: any, animationData: IAnimationData, setPopoverProps: any){
    this.ref = ref;
    this.animationData = animationData;
    this.setPopoverProps = setPopoverProps;
  }

  static DefaultSpeed: number = 2000;

  @AdditionalFunctions.setPopover((args: any[]) => {
    const [, connectorPanelType] = args;
    return `${connectorPanelType}_panel_modal`;
  }, 'bottom-start')
  async clickOnPanel(connectorPanel: string, connectorPanelType: string, animationSpeed: number) {
    if(connectorPanel){
      try{
        // @ts-ignore
        connectorPanel.onClick();

        await AdditionalFunctions.delay(animationSpeed);
      }
      catch(error){}
    }
  }


  async onMouseOver(prevElementType: string, animationSpeed: number) {
    const operatorRef = RefFunctions.getOperator(this.ref);
    const processRef = RefFunctions.getProcess(this.ref);

    if (prevElementType && (operatorRef || processRef)) {
      try {
        if (prevElementType === 'operator') {
          operatorRef.onMouseOverSvg();
        } else {
          processRef.onMouseOverSvg();
        }

        await AdditionalFunctions.delay(animationSpeed);
      } catch (error) {}
    }
  }

  @AdditionalFunctions.setPopover((args: any[]) => {
    const [type] = args;
    return type === 'process' ? 'create_process_right' : 'create_operator_right';
  })
  async showPopoverForCreateElement(type: string, animationSpeed: number) {
    try {
      await AdditionalFunctions.delay(animationSpeed);
    } catch (error) {}
  }

  async createProcessOrOperator(animationProps: any, animationData: any, connectorType: string, prevElementType: string, animationSpeed: number) {
    try{

      const createPanelRight = document.querySelector(`#create_panel_right`);
      if(createPanelRight && createPanelRight.nextElementSibling){
        const after = animationData.after;
        const elementType = animationData.type;
        const direction = animationData.toDown;
        const createPanelElement = createPanelRight.nextElementSibling;
        const technicalLayoutRef = RefFunctions.getTechnicalLayout(this.ref);
        let currentItem = null;

        if(after && technicalLayoutRef && createPanelElement){
          const svgItems = technicalLayoutRef.props.connectionOverviewState.connection[connectorType].svgItems
          if(svgItems){
            for(let i = 0; i < svgItems.length; i++){
              if(svgItems[i].id === `${connectorType}_${after}`){

                currentItem = animationProps.connection.fromConnector.getSvgElementByIndex(after)

                break;
              }
            }
          }
        }

        if(elementType === "process" && prevElementType === "operator" && createPanelElement){
          const operatorCreatePanel = RefFunctions.getCreatePanelForOperator(this.ref);

          if(operatorCreatePanel){
            operatorCreatePanel.createProcess(createPanelElement, direction ? 'in' : 'out', currentItem);
          }
        }

        else if(elementType === "process" && prevElementType === "process" && createPanelElement){
          const processCreatePanel = RefFunctions.getCreatePanelForProcess(this.ref);

          if(processCreatePanel) {
            processCreatePanel.createProcess(createPanelElement, direction ? 'in' : 'out', currentItem);
          }
        }

        else if(elementType === "operator" && prevElementType === "process" && createPanelElement){
          const processCreatePanel = RefFunctions.getCreatePanelForProcess(this.ref);

          if(processCreatePanel){
            processCreatePanel.createOperator(createPanelElement, direction ? 'in' : 'out', currentItem);
          }
        }

        else if(elementType === "operator" && prevElementType === "operator" && createPanelElement){
          const operatorCreatePanel = RefFunctions.getCreatePanelForOperator(this.ref);

          if(operatorCreatePanel){
            operatorCreatePanel.createOperator(createPanelElement, direction ? 'in' : 'out', currentItem);
          }
        }
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover((args: any[]) => {
    const [elementType] = args;
    return elementType === 'process' ? 'create_process_container' : 'create_operator_container';
  }, "top")
  async changeElementNameOrType(elementType: string, name: string, animationSpeed: number){
    try{
      const createProcessRef = RefFunctions.getCreateProcess(this.ref);
      const createOperatorRef = RefFunctions.getCreateOperator(this.ref);

      if(createProcessRef || createOperatorRef){
        elementType === "process" ? createProcessRef.changeName({label: name, value: name}) : createOperatorRef.changeType({label: name, value: name});

        await AdditionalFunctions.delay(animationSpeed)
      }
    }
    catch(error){}
  }

  async changeProcessLabel(elementType: string, label: any, animationSpeed: number){
    try{
      const createProcessRef = RefFunctions.getCreateProcess(this.ref);
      if(elementType === "process" && label && createProcessRef){
        setFocusById('new_request_label');
        await AdditionalFunctions.delay(animationSpeed);

        createProcessRef.changeLabel(label);
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }

  async create(elementType: string){
    try{
      const createProcessRef = RefFunctions.getCreateProcess(this.ref);
      const createOperatorRef = RefFunctions.getCreateOperator(this.ref);

      if(createProcessRef || createOperatorRef){
        elementType === "process" ? createProcessRef.create() : createOperatorRef.create();
      }
    }
    catch(error){}
  }

  async setFocusOnCurrentElement(){
    try{
      const processRef = RefFunctions.getProcess(this.ref);
      if(processRef){
        processRef.onClick()
      }
    }
    catch(error){}
  }

  async setCurrentItem(connector: any, index: string, animationSpeed: number){
    try{
      const technicalLayout = RefFunctions.getTechnicalLayout(this.ref);
      if(technicalLayout){
        const currentItem = connector.getSvgElementByIndex(index);
        technicalLayout.setCurrentItem(currentItem);
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }
}
