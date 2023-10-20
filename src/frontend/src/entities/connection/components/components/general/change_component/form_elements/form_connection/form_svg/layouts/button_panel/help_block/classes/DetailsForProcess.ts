import { ConnectorPanelType } from "../interfaces";
import { toggleModalDetails } from "@entity/connection/redux_toolkit/slices/ModalConnectionSlice";
import AdditionalFunctions from "./AdditionalFunctions";
import { AnimationPopoverProps } from "../AnimationPopover/interfaces";
import { IAnimationData } from "../interfaces";
import RefFunctions from "./RefFunctions";
import IDetailsForProcess
  from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/interfaces/IDetailsForProcess";

export default class DetailsForProcess implements IDetailsForProcess{
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

      for (let i = 0; i < allElementsInJsonView.length; i++) {
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
        await AdditionalFunctions.addOutlineById(["Label", "Label_option"]);
        label.toggleEdit();

        await AdditionalFunctions.delay(animationSpeed);

        await AdditionalFunctions.removeOutlineById(["Label", "Label_option"]);
      }
    }
    catch(error){}
  }

  async endEditLabel (animationSpeed: number) {
    try{
      const label = RefFunctions.getLabel(this.ref);
      if(label){
        label.cancelEdit();

        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover('url_option')
  async openUrlDialog (animationSpeed: number) {
    try{
      const urlRef = RefFunctions.getUrl(this.ref);
      if(urlRef){
        urlRef.toggleUrlVisibleIcon();
        await AdditionalFunctions.addOutlineById(["url_label", "url_option"]);

        await AdditionalFunctions.delay(animationSpeed);

        await AdditionalFunctions.removeOutlineById(["url_label", "url_option"]);
      }
    }
    catch(error){}
  }


  @AdditionalFunctions.setPopover((args: any[]) => {
    const [, animationData, connectorType] = args;
    return `param_generator_select_${connectorType}_${animationData.index}`;
  })
  async changeUrlMethod (animationSpeed: number, animationData: any, connectorType: ConnectorPanelType) {
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
    catch(error){}
  }

  @AdditionalFunctions.setPopover('input_no_id')
  async changeUrlParam (animationSpeed: number, animationData: any) {
    try{
      await AdditionalFunctions.addOutlineById([`input_no_id`]);
      const paramGeneratorRef = RefFunctions.getParamGenerator(this.ref);
      if(paramGeneratorRef){
        paramGeneratorRef.onChangeField(animationData.endpoint.param);

        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover((args: any[]) => {
    const [, animationData, connectorType] = args;
    return `param_generator_add_${connectorType}_${animationData.index}`;
  })
  async addUrlParam (animationSpeed: number, animationData: any, connectorType: ConnectorPanelType) {
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
    catch(error){}
  }

  async closeUrlDialog (animationSpeed: number) {
    try{
      const urlRef = RefFunctions.getUrl(this.ref);
      if(urlRef){
        urlRef.toggleUrlVisibleIcon();
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover('header_option')
  async openHeaderDialog (animationSpeed: number) {
    try{
      await AdditionalFunctions.addOutlineById(["header_label", "header_option"]);
      const headerRef = RefFunctions.getHeader(this.ref);
      if(headerRef){
        headerRef.toggleHeaderVisible();
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }

  async closeHeaderDialog (animationSpeed: number) {
    try{
      await AdditionalFunctions.removeOutlineById(["header_label", "header_option"]);
      const headerRef = RefFunctions.getHeader(this.ref);
      if(headerRef){
        headerRef.toggleHeaderVisible();

        return AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover('body_option')
  async showPopoverForOpenBodyDialog (animationSpeed: number) {
    try{
      await AdditionalFunctions.addOutlineById(["body_label", "body_option"], true, animationSpeed);

      await AdditionalFunctions.removeOutlineById(["body_label", "body_option"]);
    }
    catch(error){}
  }

  async openBodyDialog (animationSpeed: number) {
    try{
      const bodyRef = RefFunctions.getBody(this.ref);
      if(bodyRef){
        bodyRef.toggleBodyVisible();
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
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
    catch(error){}
  }


  async displayBodyAddKeysButton (animationSpeed: number) {
    try{
      const addButton = document.querySelector('.react-json-view .click-to-add');
      if(addButton){
        // @ts-ignore
        addButton.style.display = 'inline-block';
        await AdditionalFunctions.addOutlineByClassName([".react-json-view .click-to-add"], true, animationSpeed);
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover('wrapActiveElement')
  async showPopoverForBodyAddKeysButton (animationSpeed: number){
    try{
      // await AdditionalFunctions.addOutlineByClassName([".react-json-view .click-to-add"], true, animationSpeed);

      await AdditionalFunctions.removeOutlineByClassName([".react-json-view .click-to-add"]);
    }
    catch(error){}
  }

  async clickAddKeysButton (animationSpeed: number) {
    try{
      const addButton = document.querySelector('.react-json-view .click-to-add-icon') as HTMLSpanElement ;
      if(addButton){
        addButton.click()

        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }


  async addBodyKeyName (animationSpeed: number, keyName: any) {
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
    catch(error){}
  }


  async displaySubmitButtonToAddKey (animationSpeed: number) {
    try{
      const submitButton = document.querySelector('.react-json-view .key-modal-submit');
      if(submitButton){
        // @ts-ignore
        submitButton.style = 'position: absolute; width: 1em; height: 1em; right: 0;';
        await AdditionalFunctions.addOutlineByClassName(['.react-json-view .key-modal-submit']);

        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }


  async clickSubmitButtonToAddKey (animationSpeed: number) {
    try{
      await AdditionalFunctions.removeOutlineByClassName(['.react-json-view .key-modal-submit']);
      const submitButton = document.querySelector('.react-json-view .key-modal-submit');
      if(submitButton){
        // @ts-ignore
        submitButton.click();

        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }


  async displayRemoveKeyButton(animationSpeed: number, index: any) {
    try{
      // @ts-ignore
      const parent = DetailsForProcess.searchParentElementForBodyElement(this.animationData.body[index].keyName);

      if(parent){
        const editButton = parent.querySelector('.click-to-remove');
        if(editButton){
          // @ts-ignore
          editButton.style.display = 'inline-block';

          await AdditionalFunctions.addOutlineByClassName([".react-json-view .click-to-remove"], true, animationSpeed);
        }
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover('wrapActiveElement')
  async showPopoverForBodyRemoveKeysButton (animationSpeed: number){
    try{
      await AdditionalFunctions.removeOutlineByClassName([".react-json-view .click-to-remove"]);
    }
    catch(error){}
  }


  async clickRemoveKeyButton (animationSpeed: number, index: any) {
    try{
      await AdditionalFunctions.removeOutlineByClassName(['.react-json-view .click-to-remove']);
      // @ts-ignore
      const parent = DetailsForProcess.searchParentElementForBodyElement(this.animationData.body[index].keyName);
      if(parent){
        const remove = parent.querySelector('.click-to-remove-icon');
        if(remove){
          // @ts-ignore
          remove.click();

          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover('.react-json-view .click-to-edit')
  async displayEditKeyValueButton (animationSpeed: number, index: any) {
    try{
      // @ts-ignore
      const parent = DetailsForProcess.searchParentElementForBodyElement(this.animationData.body[index].keyName);

      if(parent){
        const editButton = parent.querySelector('.click-to-edit');
        if(editButton){
          // @ts-ignore
          editButton.style.display = 'inline-block';
          await AdditionalFunctions.addOutlineByClassName(['.react-json-view .click-to-edit']);

          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){}
  }

  async clickEditKeyValueButton (animationSpeed: number, index: any) {
    try{
      await AdditionalFunctions.removeOutlineByClassName(['.react-json-view .click-to-edit']);
      // @ts-ignore
      const parent = DetailsForProcess.searchParentElementForBodyElement(this.animationData.body[index].keyName);
      if(parent){
        const edit = parent.querySelector('.click-to-edit-icon');
        if(edit){
          // @ts-ignore
          edit.click();

          await AdditionalFunctions.delay(animationSpeed);
          await AdditionalFunctions.addOutlineByClassName(['.react-json-view .variable-editor']);
          document.querySelector('#wrapActiveElement').classList.add('addBodyKeyValue')
        }
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover('.addBodyKeyValue')
  async showPopoverForAddBodyKeyValue(){
    await AdditionalFunctions.removeOutlineByClassName(['.react-json-view .variable-editor'])
  }

  async addBodyKeyValue (animationSpeed: number, keyValue: any) {
    try{
      const textareaClassName = '.react-json-view .variable-editor'

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
    catch(error){}
  }


  @AdditionalFunctions.setPopover((args: any[]) => {
    const [, , , , , currentItemId] = args;
    return `param_generator_select_${currentItemId}`;
  })
  async changeBodyMethod (animationSpeed: number, bodyData: any, bodyDataIndex: any, referenceIndex: any, methodIndex: any, currentItemId: any) {
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

            await AdditionalFunctions.addOutlineById([`input_no_id`], true, animationSpeed);
          }
        }
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover('input_no_id', 'bottom')
  async changeBodyParam (animationSpeed: number, bodyData: any, bodyIndex: number, referenceIndex: number, methodIndex: number) {
    try{

      const bodyRef = RefFunctions.getBody(this.ref);

      if(bodyRef && bodyRef.JsonBodyRef.current && bodyRef.JsonBodyRef.current.props){
        bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.onChangeField(bodyData[bodyIndex].reference[referenceIndex].method[methodIndex].param)

        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }

  async addBodyMethodAndParam (animationSpeed: number, arg1: any, arg2: any, arg3: any, arg4: any, currentItemId: any) {
    try{
      const bodyRef = RefFunctions.getBody(this.ref);
      if(bodyRef && bodyRef.JsonBodyRef.current && bodyRef.JsonBodyRef.current.props){
        await AdditionalFunctions.addOutlineById([`param_generator_add_${currentItemId}`]);

        await AdditionalFunctions.removeOutlineById([`param_generator_add_${currentItemId}`]);
        bodyRef.JsonBodyRef.current.props.ReferenceComponent.self.current.submitEdit();

        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover((args: any[]) => {
    const [, bodyIndex] = args;
    const referenceElement = document.querySelectorAll('.reference_element');
    if(referenceElement && referenceElement[bodyIndex]){
      referenceElement[bodyIndex].classList.add(`reference_element_${bodyIndex}`);
    }
    AdditionalFunctions.addOutlineByClassName([`.reference_element_${bodyIndex}`]);
    return `wrapActiveElement`;
  })
  async clickOnReferenceElements (animationSpeed: number, bodyIndex: number) {
    try{
      const referenceElements = document.querySelectorAll('.reference_element');
      if(referenceElements){
        const referenceElement = referenceElements[bodyIndex] as HTMLDivElement;
        referenceElement.classList.add(`reference_element_${bodyIndex}`);
        await AdditionalFunctions.addOutlineByClassName([`.reference_element_${bodyIndex}`], true, animationSpeed);

        await AdditionalFunctions.removeOutlineByClassName([`.reference_element_${bodyIndex}`]);

        referenceElement.click();

        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover('enhancement_description')
  async changeReferenceDescription (animationSpeed: number, bodyData: any, bodyIndex: number, referenceIndex: number) {
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
          await AdditionalFunctions.removeOutlineById(['enhancement_description']);
        }
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover('.ace_content')
  async changeReferenceContent (animationSpeed: number, bodyData: any, bodyDataIndex: number, referenceIndex: number) {
    try{
      const enhancementRefProps = RefFunctions.getEnhancement(this.ref).props;
      if(enhancementRefProps){
        await AdditionalFunctions.addOutlineByClassName(['.ace_content'], true, animationSpeed);

        enhancementRefProps.onChange(bodyData[bodyDataIndex].reference[referenceIndex].enhancementContent);

        await AdditionalFunctions.removeOutlineByClassName(['.ace_content']);

        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }


  async clickSubmitButtonToAddValue (animationSpeed: number, index: number) {
    try{
      // @ts-ignore
      const parent = DetailsForProcess.searchParentElementForBodyElement(this.animationData.body[index].keyName);

      if(parent){
        const editSubmitButtonClassName = '.react-json-view .edit-check';
        await AdditionalFunctions.addOutlineByClassName([editSubmitButtonClassName]);

        await AdditionalFunctions.removeOutlineByClassName([editSubmitButtonClassName], true, animationSpeed);
        const editSubmitButton = parent.querySelector('.edit-check');
        if(editSubmitButton){
          // @ts-ignore
          editSubmitButton.click();

          await AdditionalFunctions.delay(animationSpeed);
        }
      }
    }
    catch(error){}
  }

  async closeBodyDialog (animationSpeed: number) {
    try{
      const bodyRef = RefFunctions.getBody(this.ref);
      if(bodyRef){
        bodyRef.toggleBodyVisible();

        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }

  @AdditionalFunctions.setPopover('response_label', 'top')
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
    catch(error){}
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
    catch(error){}
  }

  async showResult (animationSpeed: number, dispatch: any) {
    try{
      const technicalLayout = document.getElementById('modal_technical_layout_svg') as HTMLElement;
      if(technicalLayout){
        technicalLayout.style.height = `auto`;
        technicalLayout.style.width = "1000px";
        technicalLayout.style.position = "absolute";
        technicalLayout.style.top = "50%";
        technicalLayout.style.left = "50%";
        technicalLayout.style.transform = "translate(-50%, -50%)";
        technicalLayout.style.overflow = "visible";

        dispatch(toggleModalDetails())
        AdditionalFunctions.setSvgViewBox({forResult: true, elementId: 'modal_technical_layout_svg'});
        await AdditionalFunctions.delay(animationSpeed);
      }
    }
    catch(error){}
  }
}
