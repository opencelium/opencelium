import { positionElementOver, positionElementOverByClassName } from "@application/utils/utils";
import { ConnectorPanelType } from "../interfaces";
import { toggleModalDetails } from "@entity/connection/redux_toolkit/slices/ModalConnectionSlice";
import CSvg from "@entity/connection/components/classes/components/content/connection_overview_2/CSvg";

export default class DetailsForProcess{

  static async delay(ms: any) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  static async addOutlineById (idsArray: any, withDelay = false, animationSpeed = 0) {
    positionElementOver(idsArray, 10);
    
    if(withDelay){
      return DetailsForProcess.delay(animationSpeed);
    }
  }

  static async removeOutlineById (idsArray: any, withDelay = false, animationSpeed = 0) {
    positionElementOver(idsArray, 10, true);
    if(withDelay){
      return DetailsForProcess.delay(animationSpeed);
    }
  }

  static async addOutlineByClassName (classNamesArray: any, withDelay = false, animationSpeed = 0) {
    positionElementOverByClassName(classNamesArray, 10);
    if(withDelay){
      return DetailsForProcess.delay(animationSpeed);
    }
  }

  static async removeOutlineByClassName (classNamesArray: any, withDelay = false, animationSpeed = 0) {
    positionElementOverByClassName(classNamesArray, 10, true);
    if(withDelay){
      return DetailsForProcess.delay(animationSpeed);
    }
  }

  static async startEditLabel (ref: any, animationSpeed: number) {
    const label = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.labelRef.current;
    DetailsForProcess.addOutlineById(["Label", "Label_option"]);
    label.toggleEdit();

    return DetailsForProcess.delay(animationSpeed);
  }

  static async endEditLabel (ref: any, animationSpeed: number) {
    const label = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.labelRef.current;
    DetailsForProcess.removeOutlineById(["Label", "Label_option"]);
    label.cancelEdit();

    return DetailsForProcess.delay(animationSpeed);
  }

  static async openUrlDialog (ref: any, animationSpeed: number) {
    const urlRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current;
    urlRef.toggleUrlVisibleIcon();
    DetailsForProcess.addOutlineById(["url_label", "url_option"]);
      
    return DetailsForProcess.delay(animationSpeed);
  }

  static async changeUrlMethod (ref: any, animationData: any, connectorType: ConnectorPanelType, animationSpeed: number) {
    await DetailsForProcess.addOutlineById([`param_generator_select_${connectorType}_${animationData.index}`], true, animationSpeed);

    const connectionMethods = ref.current.props.connection[animationData.endpoint.connectorType].methods;

    let method;

    connectionMethods.forEach((element: any) => {
      if(element.index === animationData.endpoint.index){
        method = element;
        return;
      }
    })

    const paramGeneratorRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current.endpointRef.current.paramGeneratorRef.current;

    paramGeneratorRef.updateColor(method);

    DetailsForProcess.addOutlineById([`param_generator_select_${connectorType}_${animationData.index}`]);

    return DetailsForProcess.delay(animationSpeed);
  }

  static async changeUrlParam (ref: any, animationData: any, animationSpeed: number) {
    DetailsForProcess.addOutlineById([`input_no_id`]);
    const paramGeneratorRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current.endpointRef.current.paramGeneratorRef.current;
    paramGeneratorRef.onChangeField(animationData.endpoint.param);

    return DetailsForProcess.delay(animationSpeed);
  }

  static async addUrlParam (ref: any, animationData: any, connectorType: ConnectorPanelType, animationSpeed: number) {
    await DetailsForProcess.addOutlineById([`param_generator_add_${connectorType}_${animationData.index}`])
    const paramGeneratorRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current.endpointRef.current.paramGeneratorRef.current;
    paramGeneratorRef.addParam()
    DetailsForProcess.removeOutlineById([`param_generator_add_${connectorType}_${animationData.index}`]);
    return DetailsForProcess.delay(animationSpeed);
  }

  static async closeUrlDialog (ref: any, animationSpeed: number) {
    const urlRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current;
    urlRef.toggleUrlVisibleIcon();
    return DetailsForProcess.delay(animationSpeed);
  }

  static async openHeaderDialog (ref: any, animationSpeed: number) {
    DetailsForProcess.addOutlineById(["header_label", "header_option"]);
    const headerRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.headerRef.current;
    headerRef.toggleHeaderVisible();
    return DetailsForProcess.delay(animationSpeed);
  }

  static async closeHeaderDialog (ref: any, animationSpeed: number) {
    DetailsForProcess.removeOutlineById(["header_label", "header_option"]);
    const headerRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.headerRef.current;
    headerRef.toggleHeaderVisible();

    return DetailsForProcess.delay(animationSpeed);
  }

  static async openBodyDialog (ref: any, animationSpeed: number) {
    await DetailsForProcess.addOutlineById(["body_label", "body_option"], true, animationSpeed);

    const bodyRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;

    DetailsForProcess.removeOutlineById(["body_label", "body_option"]);
    bodyRef.toggleBodyVisible();
  
    return DetailsForProcess.delay(animationSpeed);
  }

  static async openBodyObject (animationSpeed: number) {
    await DetailsForProcess.addOutlineByClassName(['.react-json-view .icon-container'], true, animationSpeed);

    const collapse = document.querySelector('.react-json-view .collapsed-icon');
    // @ts-ignore
    collapse.click()

    return DetailsForProcess.delay(animationSpeed);
  }

  static async displayBodyAddKeysButton (animationSpeed: number) {
    const addButton = document.querySelector('.react-json-view .click-to-add');
    // @ts-ignore
    addButton.style.display = 'inline-block';
    DetailsForProcess.addOutlineByClassName(['.react-json-view .click-to-add']);
    return DetailsForProcess.delay(animationSpeed);
  }

  static async clickAddKeysButton (animationSpeed: number) {
    const addButton = document.querySelector('.react-json-view .click-to-add-icon');
    // @ts-ignore
    addButton.click()
      
    return DetailsForProcess.delay(animationSpeed);
  }

  static async addBodyKeyName (keyName: any, animationSpeed: number) {
    await DetailsForProcess.addOutlineByClassName(['.react-json-view .key-modal-input'], true, animationSpeed);

    const input = document.querySelector('.react-json-view .key-modal-input')
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(input, keyName);
    const inputEvent = new Event('input', { bubbles: true});
    input.dispatchEvent(inputEvent);
        
    return DetailsForProcess.delay(animationSpeed);
  }

  static async displaySubmitButtonToAddKey (animationSpeed: number) {
    const submitButton = document.querySelector('.react-json-view .key-modal-submit');
    // @ts-ignore
    submitButton.style = 'position: absolute; width: 1em; height: 1em; right: 0;';
    DetailsForProcess.addOutlineByClassName(['.react-json-view .key-modal-submit']);
    
    return DetailsForProcess.delay(animationSpeed);
  }

  static async clickSubmitButtonToAddKey (animationSpeed: number) {
    DetailsForProcess.removeOutlineByClassName(['.react-json-view .key-modal-submit']);
    const submitButton = document.querySelector('.react-json-view .key-modal-submit');
    // @ts-ignore
    submitButton.click()
    
    return DetailsForProcess.delay(animationSpeed);
  }

  static async displayEditKeyValueButton (index: any, animationSpeed: number) {
    const editButton = document.querySelectorAll('.react-json-view .click-to-edit');
    // @ts-ignore
    editButton[index].style.display = 'inline-block';
    DetailsForProcess.addOutlineByClassName(['.react-json-view .click-to-edit']);

    return DetailsForProcess.delay(animationSpeed);
  }

  static async clickEditKeyValueButton (index: any, animationSpeed: number) {
    DetailsForProcess.removeOutlineByClassName(['.react-json-view .click-to-edit']);
    const edit = document.querySelectorAll('.react-json-view .click-to-edit-icon');
    // @ts-ignore
    edit[index].click();

    return DetailsForProcess.delay(animationSpeed);
  }

  static async addBodyKeyValue (keyValue: any, animationSpeed: number) {
    await DetailsForProcess.addOutlineByClassName(['.react-json-view .variable-editor'], true, animationSpeed);
        
    DetailsForProcess.removeOutlineByClassName(['.react-json-view .variable-editor'])
    const textarea = document.querySelector('.react-json-view .variable-editor');
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    nativeTextAreaValueSetter.call(textarea, keyValue);
    const inputEvent = new Event('input', { bubbles: true});
    textarea.dispatchEvent(inputEvent);

    return DetailsForProcess.delay(animationSpeed);
  }

  static async changeBodyMethod (ref: any, bodyData: any, bodyDataIndex: any, referenceIndex: any, methodIndex: any, animationSpeed: number) {

    const currentItemId = ref.current.props.currentTechnicalItem.id;
    await DetailsForProcess.addOutlineById([`param_generator_select_${currentItemId}`], true, animationSpeed);
    const bodyRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;

    const connectionMethods = ref.current.props.connection[bodyData[bodyDataIndex].reference[referenceIndex].method[methodIndex].fromConnector].methods;
    
    let method;

    connectionMethods.forEach((element: any) => {
      if(element.index === bodyData[bodyDataIndex].reference[referenceIndex].method[methodIndex].index){
        method = element;
        return;
      }
    });
    
    bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.updateColor(method);

    return DetailsForProcess.delay(animationSpeed);
  }

  static async changeBodyParam (ref: any, bodyData: any, bodyIndex: number, referenceIndex: number, methodIndex: number, animationSpeed: number) {
    await DetailsForProcess.addOutlineById([`input_no_id`], true, animationSpeed);
    const bodyRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;

    bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.onChangeField(bodyData[bodyIndex].reference[referenceIndex].method[methodIndex].param)

    return DetailsForProcess.delay(animationSpeed);
  }

  static async addBodyMethodAndParam (ref: any, animationSpeed: number) {
    const currentItemId = ref.current.props.currentTechnicalItem.id;
    DetailsForProcess.addOutlineById([`param_generator_add_${currentItemId}`]);

    const bodyRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;

    DetailsForProcess.removeOutlineById([`param_generator_add_${currentItemId}`]);
    bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.submitEdit();
    
    return DetailsForProcess.delay(animationSpeed);
  }

  static async clickOnReferenceElements (bodyIndex: number, animationSpeed: number) {
    const referenceElement = document.querySelectorAll('.reference_element');
    referenceElement[bodyIndex].classList.add(`reference_element_${bodyIndex}`);
    await DetailsForProcess.addOutlineByClassName([`.reference_element_${bodyIndex}`], true, animationSpeed);

    DetailsForProcess.removeOutlineByClassName([`.reference_element_${bodyIndex}`]);

    // @ts-ignore
    referenceElement[bodyIndex].click();

    return DetailsForProcess.delay(animationSpeed);
  }

  static async changeReferenceDescription (bodyData: any, bodyIndex: number, referenceIndex: number, animationSpeed: number) {
    await DetailsForProcess.addOutlineById(['enhancement_description'], true, animationSpeed);

    const textarea = document.querySelector('#enhancement_description');
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    nativeTextAreaValueSetter.call(textarea, bodyData[bodyIndex].reference[referenceIndex].enhancementDescription);
    const inputEvent = new Event('input', { bubbles: true});
    textarea.dispatchEvent(inputEvent);

    return DetailsForProcess.delay(animationSpeed);
  }

  static async changeReferenceContent (ref: any, bodyData: any, bodyDataIndex: number, referenceIndex: number, animationSpeed: number) {
    DetailsForProcess.removeOutlineById(['enhancement_description']);
    await DetailsForProcess.addOutlineByClassName(['.ace_content'], true, animationSpeed);

    const enhancementRefProps = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current.enhancementRef.current.props;

    enhancementRefProps.onChange(bodyData[bodyDataIndex].reference[referenceIndex].enhancementContent);

    DetailsForProcess.removeOutlineByClassName(['.ace_content']);

    return DetailsForProcess.delay(animationSpeed);
  }

  static async clickSubmitButtonToAddValue (animationSpeed: number) {
    DetailsForProcess.addOutlineByClassName(['.react-json-view .edit-check']);

    await DetailsForProcess.removeOutlineByClassName(['.react-json-view .edit-check'], true, animationSpeed);
    const editSubmitButton = document.querySelector('.react-json-view .edit-check');
    // @ts-ignore
    editSubmitButton.click();

    return DetailsForProcess.delay(animationSpeed);
  }

  static async closeBodyDialog (ref: any, animationSpeed: number) {
    const bodyRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;
    bodyRef.toggleBodyVisible();

    return DetailsForProcess.delay(animationSpeed);
  }

  static async showResponse (ref: any, animationSpeed: number) {
    await DetailsForProcess.addOutlineById(["response_label"], true, animationSpeed);
    const technicalProcessDescriptionRef = ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current;
    
    technicalProcessDescriptionRef.toggleResponseVisibleIcon();
    await DetailsForProcess.removeOutlineById(["response_label"], true, animationSpeed);

    return DetailsForProcess.delay(animationSpeed);
  }

  static async deleteLastProcess (ref: any, animationSpeed: number) {
    const processRef = ref.current.technicalLayoutRef.current.svgRef.current.processRef.current;
    await DetailsForProcess.addOutlineById(['delete_icon'], true, animationSpeed);

    await DetailsForProcess.removeOutlineById(['delete_icon'])
    processRef.deleteProcess();

    return DetailsForProcess.delay(animationSpeed);
  }

  static async showResult (dispatch: any, animationSpeed: number) {
    const technicalLayout = document.getElementById('modal_technical_layout_svg');
      // @ts-ignore
      technicalLayout.style = `
        height: auto;
        width: 1000px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        overflow: visible;
      `;

      const setSvgViewBox = (elementId: string) => {
        const svgElement = document.getElementById(elementId);
        const viewBoxValue = svgElement.getAttribute('viewBox');
        const fromConnectorPanel = svgElement.querySelector('#fromConnector_panel_modal');
        const toConnectorPanel = svgElement.querySelector('#toConnector_panel_modal');

        const fromConnectorHeight = fromConnectorPanel.getBoundingClientRect().height;
        const toConnectorHeight = toConnectorPanel.getBoundingClientRect().height;

        const svgElementHeight = svgElement.getBoundingClientRect().height;
        const svgElementWidth = svgElement.getBoundingClientRect().width;
  
        const fromConnectorWidth = fromConnectorPanel.getBoundingClientRect().width;
        const toConnectorWidth = toConnectorPanel.getBoundingClientRect().width;
  
        const [x, y, width, height] = viewBoxValue.split(' ').map(parseFloat);
  
        let offsetX = ((fromConnectorWidth + toConnectorWidth + 50) - svgElementWidth) / 2;
        let offsetY;

        if(fromConnectorHeight > toConnectorHeight){
          if(fromConnectorHeight > svgElementHeight){
            offsetY = Math.abs(svgElementHeight - fromConnectorHeight);
          }
          else{
            offsetY = fromConnectorHeight - svgElementHeight 
          }
        }
        else{
          if(toConnectorHeight > svgElementHeight){
            offsetY = Math.abs(svgElementHeight - toConnectorHeight);
          }
          else{
            offsetY = toConnectorHeight - svgElementHeight
          }
        }

        const viewBox = {x: offsetX, y: offsetY, width: width, height: height};
  
        CSvg.setViewBox(elementId, viewBox)
      }
      dispatch(toggleModalDetails())
      setSvgViewBox('modal_technical_layout_svg');
      return DetailsForProcess.delay(animationSpeed);
  }
}