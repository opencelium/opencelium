export default class RefFunctions {
  static getTechnicalLayout(ref: any): any {
    const current = ref.current;
    if(current){
      if(current.technicalLayoutRef.current){
        const technicalLayout = current.technicalLayoutRef.current;
        if(technicalLayout){
          return technicalLayout;
        }
      }
    }
    return null;
  }

  static getDetails(ref: any): any {
    const current = ref.current;
    if(current){
      if(current.detailsRef.current){
        const details = current.detailsRef.current;
        if(details){
          return details;
        }
      }
    }
    return null;
  }

  static getDescription(ref: any): any {
    const details = this.getDetails(ref);
    if(details){
      if(details.descriptionRef.current){
        const description = details.descriptionRef.current;
        if(description){
          return description;
        }
      }
    }
    return null;
  }

  static getTechnicalProcessDescription(ref: any): any {
    const description = this.getDescription(ref);
    if(description){
      if(description.technicalProcessDescriptionRef.current){
        const technicalProcessDescription = description.technicalProcessDescriptionRef.current;
        if(technicalProcessDescription){
          return technicalProcessDescription;
        }
      }
    }
    return null;
  }

  static getLabel(ref: any): any {
    const technicalProcessDescription = this.getTechnicalProcessDescription(ref);
    if(technicalProcessDescription){
      if(technicalProcessDescription.labelRef.current){
        const label = technicalProcessDescription.labelRef.current;
        if(label) {
          return label;
        }
      }
    }
    return null;
  }

  static getUrl(ref: any): any {
    const technicalProcessDescription = this.getTechnicalProcessDescription(ref);
    if(technicalProcessDescription){
      if(technicalProcessDescription.urlRef.current){
        const url = technicalProcessDescription.urlRef.current;
        if(url){
          return url;
        }
      }
    }
    return null;
  }

  static getHeader(ref: any): any {
    const technicalProcessDescription = this.getTechnicalProcessDescription(ref);
    if(technicalProcessDescription){
      if(technicalProcessDescription.headerRef.current){
        const header = technicalProcessDescription.headerRef.current;
        if(header){
          return header;
        }
      }
    }
    return null;
  }

  static getBody(ref: any): any {
    const technicalProcessDescription = this.getTechnicalProcessDescription(ref);
    if(technicalProcessDescription){
      if(technicalProcessDescription.bodyRef.current){
        const body = technicalProcessDescription.bodyRef.current;
        if(body){
          return body;
        }
      }
    }
    return null;
  }

  static getEnhancement(ref: any): any {
    const body = this.getBody(ref);
    if(body){
      if(body.enhancementRef.current){
        const enhancement = body.enhancementRef.current;
        if(enhancement){
          return enhancement;
        }
      }
    }
    return null;
  }

  static getEndpoint(ref: any): any {
    const url = this.getUrl(ref);
    if(url){
      if(url.endpointRef.current){
        const endpoint = url.endpointRef.current;
        if(endpoint){
          return endpoint;
        }
      }
    }
    return null;
  }

  static getParamGenerator(ref: any): any {
    const endpoint = this.getEndpoint(ref);
    if(endpoint){
      if(endpoint.paramGeneratorRef.current){
        const paramGenerator = endpoint.paramGeneratorRef.current;
        if(paramGenerator){
          return paramGenerator;
        }
      }
    }
    return null;
  }

  static getCondition(ref: any): any {
    const description = this.getDescription(ref);
    if(description){
      if(description.conditionRef.current){
        const condition = description.conditionRef.current;
        if(condition){
          return condition;
        }
      }
    }
    return null;
  }

  static getLeftStatement(ref: any): any {
    const condition = this.getCondition(ref);
    if(condition){
      if(condition.leftStatementRef.current){
        const leftStatement = condition.leftStatementRef.current;
        if(leftStatement){
          return leftStatement;
        }
      }
    }
    return null;
  }

  static getRightStatement(ref: any): any {
    const condition = this.getCondition(ref);
    if(condition){
      if(condition.rightStatementRef.current){
        const rightStatement = condition.rightStatementRef.current;
        if(rightStatement){
          return rightStatement;
        }
      }
    }
    return null;
  }

  static getLeftParamInput(ref: any): any {
    const leftStatement = this.getLeftStatement(ref);
    if(leftStatement){
      if(leftStatement.paramInputRef.current){
        const paramInput = leftStatement.paramInputRef.current;
        if(paramInput){
          return paramInput;
        }
      }
    }
    return null;
  }

  static getRightParamInput(ref: any): any {
    const rightStatement = this.getRightStatement(ref);
    if(rightStatement){
      if(rightStatement.paramInputRef.current){
        const paramInput = rightStatement.paramInputRef.current;
        if(paramInput){
          return paramInput;
        }
      }
    }
    return null;
  }

  static getSvg(ref: any): any {
    const technicalLayout = this.getTechnicalLayout(ref);
    if(technicalLayout){
      if(technicalLayout.svgRef.current){
        const svg = technicalLayout.svgRef.current;
        if(svg){
          return svg;
        }
      }
    }
    return null;
  }

  static getFromConnectorPanel(ref: any): any {
    const svg = this.getSvg(ref);
    if(svg){
      if(svg.fromConnectorPanelRef.current){
        const fromConnectorPanel = svg.fromConnectorPanelRef.current;
        if(fromConnectorPanel){
          return fromConnectorPanel;
        }
      }
    }
    return null;
  }

  static getToConnectorPanel(ref: any): any {
    const svg = this.getSvg(ref);
    if(svg){
      if(svg.toConnectorPanelRef.current){
        const toConnectorPanel = svg.toConnectorPanelRef.current;
        if(toConnectorPanel){
          return toConnectorPanel;
        }
      }
    }
    return null;
  }

  static getOperator(ref: any): any {
    const svg = this.getSvg(ref);
    if(svg){
      if(svg.operatorRef.current){
        const operator = svg.operatorRef.current;
        if(operator){
          return operator;
        }
      }
    }
    return null;
  }

  static getProcess(ref: any): any {
    const svg = this.getSvg(ref);
    if(svg){
      if(svg.processRef.current){
        const process = svg.processRef.current;
        if(process){
          return process;
        }
      }
    }
    return null;
  }

  static getCreatePanelForOperator(ref: any): any {
    const operator = this.getOperator(ref);
    if(operator){
      if(operator.createPanelRef.current){
        const createPanel = operator.createPanelRef.current;
        if(createPanel){
          return createPanel;
        }
      }
    }
    return null;
  }

  static getCreatePanelForProcess(ref: any): any {
    const process = this.getProcess(ref);
    if(process){
      if(process.createPanelRef.current){
        const createPanel = process.createPanelRef.current;
        if(createPanel){
          return createPanel;
        }
      }
    }
    return null;
  }

  static getCreateElementPanel(ref: any): any {
    const current = ref.current;
    if(current){
      if(current.createElementPalenRef.current){
        const createElementPanel = current.createElementPalenRef.current;
        if(createElementPanel){
          return createElementPanel;
        }
      }
    }
    return null;
  }

  static getCreateProcess(ref: any): any {
    const createElementPanel = this.getCreateElementPanel(ref);
    if(createElementPanel){
      if(createElementPanel.createProcessRef.current){
        const createProcess = createElementPanel.createProcessRef.current;
        if(createProcess){
          return createProcess;
        }
      }
    }
    return null;
  }

  static getCreateOperator(ref: any): any {
    const createElementPanel = this.getCreateElementPanel(ref);
    if(createElementPanel){
      if(createElementPanel.createOperatorRef.current){
        const createOperator = createElementPanel.createOperatorRef.current;
        if(createOperator){
          return createOperator;
        }
      }
    }
    return null;
  }
}
