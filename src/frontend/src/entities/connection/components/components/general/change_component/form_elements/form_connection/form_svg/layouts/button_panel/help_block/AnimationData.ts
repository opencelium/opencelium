import { IAnimationData } from "./interfaces";
import {
  configureAPIInitialConnection
} from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/InitialConnections";


const animationData: IAnimationData = {
  apiMethods: {
    fromConnector: {
      invoker: {
        name: 'otrs'
      },
      items: [
        {
          index: "0",
          type: "process",
          name: "TicketSearch",
        },
        {
          index: "1",
          type: "process",
          name: "TicketGet",
          label: 'Label'
        },
      ]
    },
    toConnector: {
      invoker: {
        name: 'otrs'
      },
      items: [],
    }
  },
  operators: {
    fromConnector: {
      invoker: {
        name: 'otrs',
      },
      items: [
        {
          index: "0",
          type: "process",
          name: "TicketSearch",
          label: 'Label'
        },
        {
          index: "1",
          type: "operator",
          name: "loop",
          conditionForLoop: {
            leftStatement: {
              fromConnector: "fromConnector",
              leftMethodIndex: '0',
              leftParam: '[0].id'
            },
            relationalOperator: "SplitString",
            rightStatement: {
              fromConnector: "fromConnector",
              rightMethodIndex: '0',
              rightParam: '[0].name'
            }
          }
        },
        {
          index: "1_0",
          type: "operator",
          name: "if",
          toDown: true,
          conditionForIf: {
            leftStatement: {
              fromConnector: "fromConnector",
              leftMethodIndex: '0',
              leftParam: '[0].id'
            },
            relationalOperator: "Contains",
            rightStatement: {
              fromConnector: "fromConnector",
              property: 'id',
              rightMethodIndex: '0',
              rightParam: '[0].name'
            }
          }
        },
        
      ]
    },
    toConnector: {
      invoker: {
        name: 'otrs'
      },
      items: []
    },
  },
  fieldMapping: {
    fromConnector: {
      invoker: {
        name: 'otrs',
      },
      items: [
        {
          index: "0",
          type: "process",
          name: "LinkCreate",
          body: [
            {
              keyName: 'SourceObject',
              keyValue: "key value",
              available: true
            },
            {
              keyName: 'additionalKeyName',
              keyValue: "additional key value",
            },
          ]
        },

      ]
    },
    toConnector: {
      invoker: {
        name: 'otrs'
      },
      items: [
      ]
    }
  },
  enhancement: {
    fromConnector: {
      invoker: {
        name: 'otrs',
      },
      items: [
        {
          index: "2",
          type: "process",
          name: "LinkList",
          endpoint: {
            connectorType: "fromConnector",
            index: '1',
            param: '[0].id'
          }
        },
      ]
    },
    toConnector: {
      invoker: {
        name: 'otrs'
      },
      items: [
        {
          index: "0",
          type: "process",
          name: "LinkList",
          body: [
            {
              keyName: 'State',
              keyValue: '#',
              available: true,
              reference: [
                {
                  method: [
                    {
                      fromConnector: "fromConnector",
                      index: '1',
                      param: '[0].id'
                    }
                  ],
                  enhancementDescription: "reference description",
                  enhancementContent: "RESULT_VAR = VAR_0; var TEST_VAR = RESULT_VAR;\nvar SECOND_LINE = 'some text';"
                }
              ]
            }
          ]
        },
      ]
    },
    initialConnection: configureAPIInitialConnection,
  },
};

export default animationData;
