import CSvg from "@entity/connection/components/classes/components/content/connection_overview_2/CSvg";
import { setSvgViewBoxProps } from "../interfaces/IAdditionalFunctions";
import { Placement } from "react-bootstrap/esm/types";
import { positionElementOver, positionElementOverByClassName } from "@application/utils/utils";
import {store} from "@application/utils/store";

export default class AdditionalFunctions {
  static async delay(ms: any) {
    return await new Promise((resolve, reject) => {
      const isPaused = store.getState().modalConnectionReducer.isAnimationPaused;
      if (!isPaused) {
        setTimeout(resolve, ms);
      } else {
        reject();
      }
    });
  }

  static async addOutlineById (idsArray: any, withDelay = false, animationSpeed = 0) {
    if(idsArray.length > 0){
      positionElementOver(idsArray, 10);
    
      if(withDelay){
        return AdditionalFunctions.delay(animationSpeed);
      }
    }
  }

  static async removeOutlineById (idsArray: any, withDelay = false, animationSpeed = 0) {
    if(idsArray.length > 0){
      positionElementOver(idsArray, 10, true);
      if(withDelay){
        return AdditionalFunctions.delay(animationSpeed);
      }
    }
  }

  static async addOutlineByClassName (classNamesArray: any, withDelay = false, animationSpeed = 0) {
    if(classNamesArray.length > 0){
      positionElementOverByClassName(classNamesArray, 10);
      if(withDelay){
        return AdditionalFunctions.delay(animationSpeed);
      }
    }
  }

  static async removeOutlineByClassName (classNamesArray: any, withDelay = false, animationSpeed = 0) {
    if(classNamesArray.length > 0){
      positionElementOverByClassName(classNamesArray, 10, true);
      if(withDelay){
        return AdditionalFunctions.delay(animationSpeed);
      }
    }
  }

  static setSvgViewBox (props: setSvgViewBoxProps) {
    const svgElement = document.getElementById(props.elementId);
    if(svgElement){
      const viewBoxValue = svgElement.getAttribute('viewBox');
      const fromConnectorPanel = svgElement.querySelector('#fromConnector_panel_modal');
      const toConnectorPanel = svgElement.querySelector('#toConnector_panel_modal');

      const currentElement = props.currentSvgElementId ? svgElement.querySelector(`#${props.currentSvgElementId}`) : null;

      const sizes = {
        fromConnectorWidth: fromConnectorPanel.getBoundingClientRect().width,
        toConnectorWidth: toConnectorPanel.getBoundingClientRect().width,
        fromConnectorHeight: fromConnectorPanel.getBoundingClientRect().height,
        toConnectorHeight: toConnectorPanel.getBoundingClientRect().height,
        svgElementHeight: svgElement.getBoundingClientRect().height,
        svgElementWidth: svgElement.getBoundingClientRect().width
      }

      const [x, y, width, height] = viewBoxValue.split(' ').map(parseFloat);
      let offsetX;
      let offsetY;

      if(props.forResult){
        offsetX = ((sizes.fromConnectorWidth + sizes.toConnectorWidth + 50) - sizes.svgElementWidth) / 2;
        
        if(sizes.fromConnectorHeight > sizes.toConnectorHeight){
          if(sizes.fromConnectorHeight > sizes.svgElementHeight){
            offsetY = Math.abs(sizes.svgElementHeight - sizes.fromConnectorHeight);
          }
          else{
            offsetY = sizes.fromConnectorHeight - sizes.svgElementHeight 
          }
        }
        else{
          if(sizes.toConnectorHeight > sizes.svgElementHeight){
            offsetY = Math.abs(sizes.svgElementHeight - sizes.toConnectorHeight);
          }
          else{
            offsetY = sizes.toConnectorHeight - sizes.svgElementHeight
          }
        }
      } else{
        // @ts-ignore
        offsetY = currentElement.y.animVal.value / 2 - 50
    
        if(props.connectorType === 'fromConnector'){
          offsetX = sizes.fromConnectorWidth > 350 ? sizes.fromConnectorWidth / 4 : x
        }
        if(props.connectorType === 'toConnector'){
          offsetX = sizes.toConnectorWidth > 350 ? sizes.toConnectorWidth / 2 + sizes.fromConnectorWidth : sizes.fromConnectorWidth;
        }
      }

      const viewBox = {x: offsetX, y: offsetY, width: width, height: height};

      CSvg.setViewBox(props.elementId, viewBox);
    }
  }

  static getScripts(functionName: string, animationData: any): any {
    let scriptData;
    if(animationData.scripts){
      animationData.scripts.forEach((script: any) => {
        if(functionName === script.functionId){
          scriptData = {
            text: script.text
          }
          return;
        }
      })
    }
    return scriptData;
  }

  static setPopover(targetElement: string | HTMLElement | React.RefObject<HTMLElement> | ((args: any[]) => string | HTMLElement | React.RefObject<HTMLElement>), position: Placement = 'bottom') {
    if(targetElement){
      return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
          const elementTarget = typeof targetElement === 'function' ? targetElement(args) : targetElement;
          // @ts-ignore
          if(document.getElementById(elementTarget) || document.querySelector(elementTarget)){
            if(elementTarget !== ''){
              const script = AdditionalFunctions.getScripts(propertyKey, this.animationData);
              if (script) {
                this.setPopoverProps({
                  text: script.text,
                  isOpen: true,
                  target: elementTarget,
                  position: position
                });
              }
            }
            const result = await originalMethod.apply(this, args);

            this.setPopoverProps({ isOpen: false });
            
            return result;
          }
        };

        return descriptor;
    };
    }
  }
}