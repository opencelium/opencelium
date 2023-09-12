import { ConnectorPanelType } from "../interfaces";
import { toggleModalDetails } from "@entity/connection/redux_toolkit/slices/ModalConnectionSlice";
import AdditionalFunctions from "./AdditionalFunctions";
import { AnimationPopoverProps } from "../AnimationPopover/interfaces";
import { IAnimationData } from "../interfaces";

export default class DetailsForProcess{
  ref: any;
  animationData: IAnimationData;
  setPopoverProps: (props: AnimationPopoverProps) => void;
  elementTarget: string;
  constructor(ref: any, setPopoverProps: any, animationData: IAnimationData){
    this.ref = ref;
    this.animationData = animationData;
    this.setPopoverProps = setPopoverProps;
  }

  static searchParentElementForBodyElement(keyName: string){
    const jsonView = document.querySelector('.react-json-view');
    const allElementsInJsonView = jsonView.querySelectorAll('*');
    let found;
    
    for (var i = 0; i < allElementsInJsonView.length; i++) {
      if (allElementsInJsonView[i].textContent == keyName) {
        found = allElementsInJsonView[i];
        break;
      }
    }

    return found.closest('.variable-row') === null ? found.closest('.object-key-val') : found.closest('.variable-row')
  }


  @AdditionalFunctions.setPopover('Label_option')
  async startEditLabel (animationSpeed: number) {
    const label = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.labelRef.current;
    AdditionalFunctions.addOutlineById(["Label", "Label_option"]);
    label.toggleEdit();
    
    return AdditionalFunctions.delay(animationSpeed);
  }

  async endEditLabel (animationSpeed: number) {
    const label = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.labelRef.current;
    AdditionalFunctions.removeOutlineById(["Label", "Label_option"]);
    label.cancelEdit();

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('url_option')
  async openUrlDialog (animationSpeed: number) {
    const urlRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current;
    urlRef.toggleUrlVisibleIcon();
    AdditionalFunctions.addOutlineById(["url_label", "url_option"]);
      
    return AdditionalFunctions.delay(animationSpeed);
  }

  
  @AdditionalFunctions.setPopover((args: any[]) => {
    const [animationData, connectorType] = args;
    return `param_generator_select_${connectorType}_${animationData.index}`;
  })
  async changeUrlMethod (animationData: any, connectorType: ConnectorPanelType, animationSpeed: number) {
    await AdditionalFunctions.addOutlineById([`param_generator_select_${connectorType}_${animationData.index}`], true, animationSpeed);

    const connectionMethods = this.ref.current.props.connection[animationData.endpoint.connectorType].methods;

    let method;

    connectionMethods.forEach((element: any) => {
      if(element.index === animationData.endpoint.index){
        method = element;
        return;
      }
    })

    const paramGeneratorRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current.endpointRef.current.paramGeneratorRef.current;

    paramGeneratorRef.updateColor(method);

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('input_no_id')
  async changeUrlParam (animationData: any, animationSpeed: number) {
    AdditionalFunctions.addOutlineById([`input_no_id`]);
    const paramGeneratorRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current.endpointRef.current.paramGeneratorRef.current;
    paramGeneratorRef.onChangeField(animationData.endpoint.param);

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover((args: any[]) => {
    const [animationData, connectorType] = args;
    return `param_generator_add_${connectorType}_${animationData.index}`;
  })
  async addUrlParam (animationData: any, connectorType: ConnectorPanelType, animationSpeed: number) {
    await AdditionalFunctions.addOutlineById([`param_generator_add_${connectorType}_${animationData.index}`])
    const paramGeneratorRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current.endpointRef.current.paramGeneratorRef.current;
    paramGeneratorRef.addParam()
    return AdditionalFunctions.delay(animationSpeed);
  }

  async closeUrlDialog (animationSpeed: number) {
    const urlRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.urlRef.current;
    urlRef.toggleUrlVisibleIcon();
    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('header_option')
  async openHeaderDialog (animationSpeed: number) {
    AdditionalFunctions.addOutlineById(["header_label", "header_option"]);
    const headerRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.headerRef.current;
    headerRef.toggleHeaderVisible();
    return AdditionalFunctions.delay(animationSpeed);
  }

  async closeHeaderDialog (animationSpeed: number) {
    AdditionalFunctions.removeOutlineById(["header_label", "header_option"]);
    const headerRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.headerRef.current;
    headerRef.toggleHeaderVisible();

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('body_option')
  async openBodyDialog (animationSpeed: number) {
    await AdditionalFunctions.addOutlineById(["body_label", "body_option"], true, animationSpeed);

    const bodyRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;

    AdditionalFunctions.removeOutlineById(["body_label", "body_option"]);
    bodyRef.toggleBodyVisible();
  
    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('.react-json-view .icon-container')
  async openBodyObject (animationSpeed: number) {
    await AdditionalFunctions.addOutlineByClassName(['.react-json-view .icon-container'], true, animationSpeed);

    const collapse = document.querySelector('.react-json-view .collapsed-icon');
    // @ts-ignore
    collapse.click()

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('.react-json-view .click-to-add')
  async displayBodyAddKeysButton (animationSpeed: number) {
    const addButton = document.querySelector('.react-json-view .click-to-add');
    // @ts-ignore
    addButton.style.display = 'inline-block';
    AdditionalFunctions.addOutlineByClassName(['.react-json-view .click-to-add']);
    return AdditionalFunctions.delay(animationSpeed);
  }

  async clickAddKeysButton (animationSpeed: number) {
    const addButton = document.querySelector('.react-json-view .click-to-add-icon');
    // @ts-ignore
    addButton.click()
      
    return AdditionalFunctions.delay(animationSpeed);
  }

  
  async addBodyKeyName (keyName: any, animationSpeed: number) {
    await AdditionalFunctions.addOutlineByClassName(['.react-json-view .key-modal-input'], true, animationSpeed);

    const input = document.querySelector('.react-json-view .key-modal-input');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(input, keyName);
    const inputEvent = new Event('input', { bubbles: true});
    input.dispatchEvent(inputEvent);
        
    return AdditionalFunctions.delay(animationSpeed);
  }

  
  async displaySubmitButtonToAddKey (animationSpeed: number) {
    const submitButton = document.querySelector('.react-json-view .key-modal-submit');
    // @ts-ignore
    submitButton.style = 'position: absolute; width: 1em; height: 1em; right: 0;';
    AdditionalFunctions.addOutlineByClassName(['.react-json-view .key-modal-submit']);
    
    return AdditionalFunctions.delay(animationSpeed);
  }

  
  async clickSubmitButtonToAddKey (animationSpeed: number) {
    AdditionalFunctions.removeOutlineByClassName(['.react-json-view .key-modal-submit']);
    const submitButton = document.querySelector('.react-json-view .key-modal-submit');
    // @ts-ignore
    submitButton.click()
    
    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('.react-json-view .click-to-edit')
  async displayEditKeyValueButton (index: any, animationSpeed: number) {
    // @ts-ignore
    const parent = DetailsForProcess.searchParentElementForBodyElement(this.animationData.body[index].keyName);

    const editButton = parent.querySelector('.click-to-edit');
    // @ts-ignore
    editButton.style.display = 'inline-block';
    AdditionalFunctions.addOutlineByClassName(['.react-json-view .click-to-edit']);

    return AdditionalFunctions.delay(animationSpeed);
  }

  async clickEditKeyValueButton (index: any, animationSpeed: number) {
    AdditionalFunctions.removeOutlineByClassName(['.react-json-view .click-to-edit']);
    // @ts-ignore
    const parent = DetailsForProcess.searchParentElementForBodyElement(this.animationData.body[index].keyName);
    const edit = parent.querySelector('.click-to-edit-icon');
    // @ts-ignore
    edit.click();

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('.react-json-view .variable-editor')
  async addBodyKeyValue (keyValue: any, animationSpeed: number) {
    const textareaClassName = '.react-json-view .variable-editor'
    await AdditionalFunctions.addOutlineByClassName([textareaClassName], true, animationSpeed);
        
    AdditionalFunctions.removeOutlineByClassName([textareaClassName])
    const textarea = document.querySelector(textareaClassName);
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    nativeTextAreaValueSetter.call(textarea, keyValue);

    await AdditionalFunctions.delay(animationSpeed);

    const inputEvent = new Event('input', { bubbles: true});
    textarea.dispatchEvent(inputEvent);

    return AdditionalFunctions.delay(animationSpeed);
  }

  
  @AdditionalFunctions.setPopover((args: any[]) => {
    const [, , , , currentItemId] = args;
    return `param_generator_select_${currentItemId}`;
  })
  async changeBodyMethod (bodyData: any, bodyDataIndex: any, referenceIndex: any, methodIndex: any, currentItemId: any, animationSpeed: number) {

    await AdditionalFunctions.addOutlineById([`param_generator_select_${currentItemId}`], true, animationSpeed);
    const bodyRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;

    const connectionMethods = this.ref.current.props.connection[bodyData[bodyDataIndex].reference[referenceIndex].method[methodIndex].fromConnector].methods;
    
    let method;

    connectionMethods.forEach((element: any) => {
      if(element.index === bodyData[bodyDataIndex].reference[referenceIndex].method[methodIndex].index){
        method = element;
        return;
      }
    });
    
    bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.updateColor(method);

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('input_no_id')
  async changeBodyParam (bodyData: any, bodyIndex: number, referenceIndex: number, methodIndex: number, animationSpeed: number) {
    await AdditionalFunctions.addOutlineById([`input_no_id`], true, animationSpeed);
    const bodyRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;

    bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.onChangeField(bodyData[bodyIndex].reference[referenceIndex].method[methodIndex].param)

    return AdditionalFunctions.delay(animationSpeed);
  }

  async addBodyMethodAndParam (currentItemId: any, animationSpeed: number) {
    
    AdditionalFunctions.addOutlineById([`param_generator_add_${currentItemId}`]);

    const bodyRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;

    AdditionalFunctions.removeOutlineById([`param_generator_add_${currentItemId}`]);
    bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.submitEdit();
    
    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover((args: any[]) => {
    const [bodyIndex] = args;
    const referenceElement = document.querySelectorAll('.reference_element');
    referenceElement[bodyIndex].classList.add(`reference_element_${bodyIndex}`);
    return `.reference_element_${bodyIndex}`;
  })
  async clickOnReferenceElements (bodyIndex: number, animationSpeed: number) {
    const referenceElement = document.querySelectorAll('.reference_element');
    referenceElement[bodyIndex].classList.add(`reference_element_${bodyIndex}`);
    await AdditionalFunctions.addOutlineByClassName([`.reference_element_${bodyIndex}`], true, animationSpeed);

    AdditionalFunctions.removeOutlineByClassName([`.reference_element_${bodyIndex}`]);

    // @ts-ignore
    referenceElement[bodyIndex].click();

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('enhancement_description')
  async changeReferenceDescription (bodyData: any, bodyIndex: number, referenceIndex: number, animationSpeed: number) {
    await AdditionalFunctions.addOutlineById(['enhancement_description'], true, animationSpeed);

    const textarea = document.querySelector('#enhancement_description');
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    nativeTextAreaValueSetter.call(textarea, bodyData[bodyIndex].reference[referenceIndex].enhancementDescription);
    const inputEvent = new Event('input', { bubbles: true});
    textarea.dispatchEvent(inputEvent);

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('.ace_content')
  async changeReferenceContent (bodyData: any, bodyDataIndex: number, referenceIndex: number, animationSpeed: number) {
    AdditionalFunctions.removeOutlineById(['enhancement_description']);
    await AdditionalFunctions.addOutlineByClassName(['.ace_content'], true, animationSpeed);

    const enhancementRefProps = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current.enhancementRef.current.props;

    enhancementRefProps.onChange(bodyData[bodyDataIndex].reference[referenceIndex].enhancementContent);

    AdditionalFunctions.removeOutlineByClassName(['.ace_content']);

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('.react-json-view .edit-check')
  async clickSubmitButtonToAddValue (index: number, animationSpeed: number) {
    
    // const editSubmitButtonClassName = '.react-json-view .edit-check';
    // AdditionalFunctions.addOutlineByClassName([editSubmitButtonClassName]);
    
    // await AdditionalFunctions.removeOutlineByClassName([editSubmitButtonClassName], true, animationSpeed);
    // @ts-ignore
    const parent = DetailsForProcess.searchParentElementForBodyElement(this.animationData.body[index].keyName);
    const editSubmitButton = parent.querySelector('.edit-check');
    // @ts-ignore
    editSubmitButton.click();

    return AdditionalFunctions.delay(animationSpeed);
  }

  async closeBodyDialog (animationSpeed: number) {
    const bodyRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current.bodyRef.current;
    bodyRef.toggleBodyVisible();

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('response_label')
  async showResponse (animationSpeed: number) {
    await AdditionalFunctions.addOutlineById(["response_label"], true, animationSpeed);
    const technicalProcessDescriptionRef = this.ref.current.detailsRef.current.descriptionRef.current.technicalProcessDescriptionRef.current;
    
    technicalProcessDescriptionRef.toggleResponseVisibleIcon();
    await AdditionalFunctions.removeOutlineById(["response_label"], true, animationSpeed);

    return AdditionalFunctions.delay(animationSpeed);
  }

  @AdditionalFunctions.setPopover('delete_icon')
  async deleteProcess (animationSpeed: number) {
    const processRef = this.ref.current.technicalLayoutRef.current.svgRef.current.processRef.current;
    await AdditionalFunctions.addOutlineById(['delete_icon'], true, animationSpeed);

    await AdditionalFunctions.removeOutlineById(['delete_icon'])
    processRef.deleteProcess();

    return AdditionalFunctions.delay(animationSpeed);
  }

  async showResult (dispatch: any, animationSpeed: number) {
    const technicalLayout = document.getElementById('modal_technical_layout_svg');
    // @ts-ignore
    technicalLayout.style = `height: auto; width: 1000px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); overflow: visible;`;

    dispatch(toggleModalDetails())
    AdditionalFunctions.setSvgViewBox({forResult: true, elementId: 'modal_technical_layout_svg'});
    return AdditionalFunctions.delay(animationSpeed);
  }
}