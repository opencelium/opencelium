import { ConnectorPanelType } from "../interfaces";
import { toggleModalDetails } from "@entity/connection/redux_toolkit/slices/ModalConnectionSlice";
import AdditionalFunctions from "./AdditionalFunctions";
import { AnimationPopoverProps } from "../AnimationPopover/interfaces";
import { IAnimationData } from "../interfaces";
import RefFunctions from "./RefFunctions";

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
    if(jsonView){
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
    return null;
  }


  @AdditionalFunctions.setPopover('Label_option')
  async startEditLabel (animationSpeed: number) {
    try{
      const label = RefFunctions.getLabel(this.ref);
      if(label){
        AdditionalFunctions.addOutlineById(["Label", "Label_option"]);
        label.toggleEdit();
        
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  async endEditLabel (animationSpeed: number) {
    try{
      const label = RefFunctions.getLabel(this.ref);
      if(label){
        AdditionalFunctions.removeOutlineById(["Label", "Label_option"]);
        label.cancelEdit();
  
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('url_option')
  async openUrlDialog (animationSpeed: number) {
    try{
      const urlRef = RefFunctions.getUrl(this.ref);
      if(urlRef){
        urlRef.toggleUrlVisibleIcon();
        AdditionalFunctions.addOutlineById(["url_label", "url_option"]);
          
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  
  @AdditionalFunctions.setPopover((args: any[]) => {
    const [animationData, connectorType] = args;
    return `param_generator_select_${connectorType}_${animationData.index}`;
  })
  async changeUrlMethod (animationData: any, connectorType: ConnectorPanelType, animationSpeed: number) {
    try{
      if(connectorType && animationData.index && this.ref.current.props){
        await AdditionalFunctions.addOutlineById([`param_generator_select_${connectorType}_${animationData.index}`], true, animationSpeed);
  
        const connectionMethods = this.ref.current.props.connection[animationData.endpoint.connectorType].methods;
  
        if(connectionMethods){
          let method;
  
          connectionMethods.forEach((element: any) => {
            if(element.index === animationData.endpoint.index){
              method = element;
              return;
            }
          })
  
          const paramGeneratorRef = RefFunctions.getParamGenerator(this.ref);
  
          if(paramGeneratorRef){
            paramGeneratorRef.updateColor(method);
  
            await AdditionalFunctions.delay(animationSpeed);
          }
        }
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('input_no_id')
  async changeUrlParam (animationData: any, animationSpeed: number) {
    try{
      AdditionalFunctions.addOutlineById([`input_no_id`]);
      const paramGeneratorRef = RefFunctions.getParamGenerator(this.ref);
      if(paramGeneratorRef){
        paramGeneratorRef.onChangeField(animationData.endpoint.param);
  
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover((args: any[]) => {
    const [animationData, connectorType] = args;
    return `param_generator_add_${connectorType}_${animationData.index}`;
  })
  async addUrlParam (animationData: any, connectorType: ConnectorPanelType, animationSpeed: number) {
    try{
      if(connectorType && animationData.index){
        await AdditionalFunctions.addOutlineById([`param_generator_add_${connectorType}_${animationData.index}`]);
  
        const paramGeneratorRef = RefFunctions.getParamGenerator(this.ref);
        if(paramGeneratorRef) {
          paramGeneratorRef.addParam()
          await AdditionalFunctions.removeOutlineById([`param_generator_add_${connectorType}_${animationData.index}`], true, animationSpeed)
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){
      console.log(error);
    }
  }

  async closeUrlDialog (animationSpeed: number) {
    try{
      const urlRef = RefFunctions.getUrl(this.ref);
      if(urlRef){
        urlRef.toggleUrlVisibleIcon();
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('header_option')
  async openHeaderDialog (animationSpeed: number) {
    try{
      AdditionalFunctions.addOutlineById(["header_label", "header_option"]);
      const headerRef = RefFunctions.getHeader(this.ref);
      if(headerRef){
        headerRef.toggleHeaderVisible();
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  async closeHeaderDialog (animationSpeed: number) {
    try{
      AdditionalFunctions.removeOutlineById(["header_label", "header_option"]);
      const headerRef = RefFunctions.getHeader(this.ref);
      if(headerRef){
        headerRef.toggleHeaderVisible();
  
        return AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('body_option')
  async showPopoverForOpenBodyDialog (animationSpeed: number) {
    try{
      await AdditionalFunctions.addOutlineById(["body_label", "body_option"], true, animationSpeed);
  
      AdditionalFunctions.removeOutlineById(["body_label", "body_option"]);
    }
    catch(error){
      console.log(error);
    }
  }

  async openBodyDialog (animationSpeed: number) {
    try{
      const bodyRef = RefFunctions.getBody(this.ref);
      if(bodyRef){
        bodyRef.toggleBodyVisible();
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('.react-json-view .icon-container')
  async openBodyObject (animationSpeed: number) {
    try{
      await AdditionalFunctions.addOutlineByClassName(['.react-json-view .icon-container'], true, animationSpeed);
  
      const collapse = document.querySelector('.react-json-view .collapsed-icon');
      if(collapse){
        // @ts-ignore
        collapse.click();
  
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('.react-json-view .click-to-add')
  async displayBodyAddKeysButton (animationSpeed: number) {
    try{
      const addButton = document.querySelector('.react-json-view .click-to-add');
      if(addButton){
        // @ts-ignore
        addButton.style.display = 'inline-block';
        AdditionalFunctions.addOutlineByClassName(['.react-json-view .click-to-add']);
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  async clickAddKeysButton (animationSpeed: number) {
    try{
      const addButton = document.querySelector('.react-json-view .click-to-add-icon');
      if(addButton){
        // @ts-ignore
        addButton.click()
          
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  
  async addBodyKeyName (keyName: any, animationSpeed: number) {
    try{
      await AdditionalFunctions.addOutlineByClassName(['.react-json-view .key-modal-input'], true, animationSpeed);
  
      const input = document.querySelector('.react-json-view .key-modal-input');
      if(input){
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        if(nativeInputValueSetter){
          nativeInputValueSetter.call(input, keyName);
          const inputEvent = new Event('input', { bubbles: true});
          input.dispatchEvent(inputEvent);
  
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){
      console.log(error);
    }
  }

  
  async displaySubmitButtonToAddKey (animationSpeed: number) {
    try{
      const submitButton = document.querySelector('.react-json-view .key-modal-submit');
      if(submitButton){
        // @ts-ignore
        submitButton.style = 'position: absolute; width: 1em; height: 1em; right: 0;';
        AdditionalFunctions.addOutlineByClassName(['.react-json-view .key-modal-submit']);
        
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  
  async clickSubmitButtonToAddKey (animationSpeed: number) {
    try{
      AdditionalFunctions.removeOutlineByClassName(['.react-json-view .key-modal-submit']);
      const submitButton = document.querySelector('.react-json-view .key-modal-submit');
      if(submitButton){
        // @ts-ignore
        submitButton.click();
        
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('.react-json-view .click-to-edit')
  async displayEditKeyValueButton (index: any, animationSpeed: number) {
    try{
      // @ts-ignore
      const parent = DetailsForProcess.searchParentElementForBodyElement(this.animationData.body[index].keyName);
  
      if(parent){
        const editButton = parent.querySelector('.click-to-edit');
        if(editButton){
          // @ts-ignore
          editButton.style.display = 'inline-block';
          AdditionalFunctions.addOutlineByClassName(['.react-json-view .click-to-edit']);
  
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){
      console.log(error);
    }
  }

  async clickEditKeyValueButton (index: any, animationSpeed: number) {
    try{
      AdditionalFunctions.removeOutlineByClassName(['.react-json-view .click-to-edit']);
      // @ts-ignore
      const parent = DetailsForProcess.searchParentElementForBodyElement(this.animationData.body[index].keyName);
      if(parent){
        const edit = parent.querySelector('.click-to-edit-icon');
        if(edit){
          // @ts-ignore
          edit.click();
  
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('.react-json-view .variable-editor')
  async addBodyKeyValue (keyValue: any, animationSpeed: number) {
    try{
      const textareaClassName = '.react-json-view .variable-editor'
      await AdditionalFunctions.addOutlineByClassName([textareaClassName], true, animationSpeed);
          
      AdditionalFunctions.removeOutlineByClassName([textareaClassName])
      const textarea = document.querySelector(textareaClassName);
      if(textarea){
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        if(nativeTextAreaValueSetter){
          nativeTextAreaValueSetter.call(textarea, keyValue);
  
          await AdditionalFunctions.delay(animationSpeed);
  
          const inputEvent = new Event('input', { bubbles: true});
          textarea.dispatchEvent(inputEvent);
  
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){
      console.log(error);
    }
  }

  
  @AdditionalFunctions.setPopover((args: any[]) => {
    const [, , , , currentItemId] = args;
    return `param_generator_select_${currentItemId}`;
  })
  async changeBodyMethod (bodyData: any, bodyDataIndex: any, referenceIndex: any, methodIndex: any, currentItemId: any, animationSpeed: number) {
    try{
      if(this.ref.current.props){
        await AdditionalFunctions.addOutlineById([`param_generator_select_${currentItemId}`], true, animationSpeed);
        const bodyRef = RefFunctions.getBody(this.ref);
    
        const connectionMethods = this.ref.current.props.connection[bodyData[bodyDataIndex].reference[referenceIndex].method[methodIndex].fromConnector].methods;
        
        if(bodyRef && connectionMethods){
          let method;
    
          connectionMethods.forEach((element: any) => {
            if(element.index === bodyData[bodyDataIndex].reference[referenceIndex].method[methodIndex].index){
              method = element;
              return;
            }
          });
          
          if(bodyRef.JsonBodyRef.current && bodyRef.JsonBodyRef.current.props){
            bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.updateColor(method);
      
            await AdditionalFunctions.delay(animationSpeed);
          }
        }
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('input_no_id')
  async changeBodyParam (bodyData: any, bodyIndex: number, referenceIndex: number, methodIndex: number, animationSpeed: number) {
    try{
      await AdditionalFunctions.addOutlineById([`input_no_id`], true, animationSpeed);
      const bodyRef = RefFunctions.getBody(this.ref);
  
      if(bodyRef && bodyRef.JsonBodyRef.current && bodyRef.JsonBodyRef.current.props){
        bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.onChangeField(bodyData[bodyIndex].reference[referenceIndex].method[methodIndex].param)
  
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  async addBodyMethodAndParam (currentItemId: any, animationSpeed: number) {
    try{
      const bodyRef = RefFunctions.getBody(this.ref);
      if(bodyRef && bodyRef.JsonBodyRef.current && bodyRef.JsonBodyRef.current.props){
        AdditionalFunctions.addOutlineById([`param_generator_add_${currentItemId}`]);
  
        AdditionalFunctions.removeOutlineById([`param_generator_add_${currentItemId}`]);
        bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.submitEdit();
        
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover((args: any[]) => {
    const [bodyIndex] = args;
    const referenceElement = document.querySelectorAll('.reference_element');
    if(referenceElement && referenceElement[bodyIndex]){
      referenceElement[bodyIndex].classList.add(`reference_element_${bodyIndex}`);
    }
    return `.reference_element_${bodyIndex}`;
  })
  async clickOnReferenceElements (bodyIndex: number, animationSpeed: number) {
    try{
      const referenceElement = document.querySelectorAll('.reference_element');
      if(referenceElement){
        referenceElement[bodyIndex].classList.add(`reference_element_${bodyIndex}`);
        await AdditionalFunctions.addOutlineByClassName([`.reference_element_${bodyIndex}`], true, animationSpeed);
  
        AdditionalFunctions.removeOutlineByClassName([`.reference_element_${bodyIndex}`]);
  
        // @ts-ignore
        referenceElement[bodyIndex].click();
  
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('enhancement_description')
  async changeReferenceDescription (bodyData: any, bodyIndex: number, referenceIndex: number, animationSpeed: number) {
    try{
      const textarea = document.querySelector('#enhancement_description');
      if(textarea){
        await AdditionalFunctions.addOutlineById(['enhancement_description'], true, animationSpeed);
  
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        if(nativeTextAreaValueSetter){
          nativeTextAreaValueSetter.call(textarea, bodyData[bodyIndex].reference[referenceIndex].enhancementDescription);
          const inputEvent = new Event('input', { bubbles: true});
          textarea.dispatchEvent(inputEvent);
  
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('.ace_content')
  async changeReferenceContent (bodyData: any, bodyDataIndex: number, referenceIndex: number, animationSpeed: number) {
    try{
      AdditionalFunctions.removeOutlineById(['enhancement_description']);
      const enhancementRefProps = RefFunctions.getEnhancement(this.ref).props;
      if(enhancementRefProps){
        await AdditionalFunctions.addOutlineByClassName(['.ace_content'], true, animationSpeed);
  
        enhancementRefProps.onChange(bodyData[bodyDataIndex].reference[referenceIndex].enhancementContent);
  
        AdditionalFunctions.removeOutlineByClassName(['.ace_content']);
  
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  
  async clickSubmitButtonToAddValue (index: number, animationSpeed: number) {
    try{
      // @ts-ignore
      const parent = DetailsForProcess.searchParentElementForBodyElement(this.animationData.body[index].keyName);
      
      if(parent){
        const editSubmitButtonClassName = '.react-json-view .edit-check';
        AdditionalFunctions.addOutlineByClassName([editSubmitButtonClassName]);
        
        await AdditionalFunctions.removeOutlineByClassName([editSubmitButtonClassName], true, animationSpeed);
        const editSubmitButton = parent.querySelector('.edit-check');
        if(editSubmitButton){
          // @ts-ignore
          editSubmitButton.click();
    
          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){
      console.log(error);
    }
  }
  
  async closeBodyDialog (animationSpeed: number) {
    try{
      const bodyRef = RefFunctions.getBody(this.ref);
      if(bodyRef){
        bodyRef.toggleBodyVisible();
  
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('response_label')
  async showResponse (animationSpeed: number) {
    try{
      const technicalProcessDescriptionRef = RefFunctions.getTechnicalProcessDescription(this.ref);
      if(technicalProcessDescriptionRef){
        await AdditionalFunctions.addOutlineById(["response_label"], true, animationSpeed);
      
        technicalProcessDescriptionRef.toggleResponseVisibleIcon();
        await AdditionalFunctions.removeOutlineById(["response_label"], true, animationSpeed);
  
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  @AdditionalFunctions.setPopover('delete_icon')
  async deleteProcess (animationSpeed: number) {
    try{
      const processRef = RefFunctions.getProcess(this.ref);
      if(processRef){
        await AdditionalFunctions.addOutlineById(['delete_icon'], true, animationSpeed);
  
        await AdditionalFunctions.removeOutlineById(['delete_icon'])
        processRef.deleteProcess();
  
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }

  async showResult (dispatch: any, animationSpeed: number) {
    try{
      const technicalLayout = document.getElementById('modal_technical_layout_svg');
      if(technicalLayout){
        // @ts-ignore
        technicalLayout.style = `height: auto; width: 1000px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); overflow: visible;`;
  
        dispatch(toggleModalDetails())
        AdditionalFunctions.setSvgViewBox({forResult: true, elementId: 'modal_technical_layout_svg'});
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){
      console.log(error);
    }
  }
}