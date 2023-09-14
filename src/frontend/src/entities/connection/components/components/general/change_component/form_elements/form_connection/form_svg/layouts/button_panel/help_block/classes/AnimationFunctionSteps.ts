import { AnimationPopoverProps } from "../AnimationPopover/interfaces";
import {ConnectorPanelType, IAnimationData} from "../interfaces";
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

   async clickOnPanel(panelType: string, animationSpeed: number) {
    // @ts-ignore
    panelType.onClick();

    return AdditionalFunctions.delay(animationSpeed);
  }


  async onMouseOver(prevElementType: string, animationSpeed: number) {
    const operatorRef = this.ref.current.technicalLayoutRef.current.svgRef.current.operatorRef.current;
    const processRef = this.ref.current.technicalLayoutRef.current.svgRef.current.processRef.current;

    if(prevElementType === "operator"){
      operatorRef.onMouseOverSvg()
    }
    else{
      processRef.onMouseOverSvg()
    }

    return AdditionalFunctions.delay(animationSpeed)
  }

  @AdditionalFunctions.setPopover((args: any[]) => {
    const [type] = args;
    return type === 'process' ? 'create_process_right' : 'create_operator_right';
  })
  async showPopoverForCreateElement(type: string, animationSpeed: number){
    return AdditionalFunctions.delay(animationSpeed)
  }

  async createProcessOrOperator(type: string, animationProps: any, animationData: any, connectorType: string, prevElementType: string, animationSpeed: number) {
    const after = animationData.after;
    const elementType = animationData.type;
    const direction = animationData.direction;
    const svgRef = this.ref.current.technicalLayoutRef.current.svgRef.current;
    const createPanelElement = document.querySelector(`#create_panel_right`).nextElementSibling;
    let currentItem = null;

    if(after){
      const svgItems = this.ref.current.technicalLayoutRef.current.props.connectionOverviewState.connection[connectorType].svgItems
      for(let i = 0; i < svgItems.length; i++){
        if(svgItems[i].id === `${connectorType}_${after}`){

          currentItem = animationProps.connection.fromConnector.getSvgElementByIndex(after)

          break;
        }
      }
    }

    if(elementType === "process" && prevElementType === "operator"){
      const operatorCreatePanel = svgRef.operatorRef.current.createPanelRef.current;

      operatorCreatePanel.createProcess(createPanelElement, direction ? 'in' : 'out', currentItem);
    }

    else if(elementType === "process" && prevElementType === "process"){
      const processCreatePanel = svgRef.processRef.current.createPanelRef.current;

      processCreatePanel.createProcess(createPanelElement, direction ? 'in' : 'out', currentItem);
    }

    else if(elementType === "operator" && prevElementType === "process"){
      const processCreatePanel = svgRef.processRef.current.createPanelRef.current;

      processCreatePanel.createOperator(createPanelElement, direction ? 'in' : 'out', currentItem);
    }

    else if(elementType === "operator" && prevElementType === "operator"){
      const operatorCreatePanel = svgRef.operatorRef.current.createPanelRef.current;

      operatorCreatePanel.createOperator(createPanelElement, direction ? 'in' : 'out', currentItem);
    }
    return AdditionalFunctions.delay(animationSpeed)
  }

  async changeElementNameOrType(elementType: string, name: string, animationSpeed: number){
    const createProcessRef = this.ref.current.createElementPalenRef.current.createProcessRef.current;
    const createOperatorRef = this.ref.current.createElementPalenRef.current.createOperatorRef.current;

    if(elementType === "process"){
      createProcessRef.changeName({label: name, value: name})
    }
    else{
      createOperatorRef.changeType({label: name, value: name})
    }

    return AdditionalFunctions.delay(animationSpeed)
  }

  async changeProcessLabel(elementType: string, label: any, animationSpeed: number){
    if(elementType === "process" && label){
      setFocusById('new_request_label');
      await AdditionalFunctions.delay(animationSpeed);

      const createProcessRef = this.ref.current.createElementPalenRef.current.createProcessRef.current;
      createProcessRef.changeLabel(label);
      await AdditionalFunctions.delay(animationSpeed);
    }
  }

  async create(elementType: string){
    const createProcessRef = this.ref.current.createElementPalenRef.current.createProcessRef.current;
    const createOperatorRef = this.ref.current.createElementPalenRef.current.createOperatorRef.current;

    elementType === "process" ? createProcessRef.create() : createOperatorRef.create();
  }

  async setFocusOnCurrentElement(){
    const processRef = this.ref.current.technicalLayoutRef.current.svgRef.current.processRef.current;
    processRef.onClick()
  }

  async setCurrentItem(connector: any, index: string, animationSpeed: number){
    const technicalLayout = RefFunctions.getTechnicalLayout(this.ref);
    const currentItem = connector.getSvgElementByIndex(index);
    technicalLayout.setCurrentItem(currentItem);
    await AdditionalFunctions.delay(animationSpeed);
  }

}
