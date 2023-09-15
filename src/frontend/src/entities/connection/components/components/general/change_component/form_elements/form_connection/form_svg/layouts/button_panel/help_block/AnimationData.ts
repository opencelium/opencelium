import { IAnimationData } from "./interfaces";
import {
  configureAPIInitialConnection
} from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/InitialConnections";


const animationData: IAnimationData = {
  firstSteps: {
    fromConnector: {
      invoker: {
        name: 'trello'
      },
      items: [
        {
          index: "0",
          type: "process",
          name: "GetBoards",
          label: "first process",
          scripts: [
            {
              functionId: "startEditLabel",
              text: "edit label",
            },
            {
              functionId: "openHeaderDialog",
              text: "open header dialog",
            },
            {
              functionId: "showPopoverForOpenBodyDialog",
              text: "open body dialog",
            },
            {
              functionId: "openBodyObject",
              text: "open body object",
            },
            {
              functionId: "displayBodyAddKeysButton",
              text: "click add keys button",
            },
            {
              functionId: "addBodyKeyValue",
              text: "add body key value",
            },
            {
              functionId: "clickSubmitButtonToAddValue",
              text: "click submit button to add value",
            },
            {
              functionId: "showResponse",
              text: "show response",
            },
          ],
          body: [
            {
              keyName: "firstKeyName",
              keyValue: "firstKeyValue",
            },
            {
              keyName: "secondKeyName",
              keyValue: "secondKeyValue",
            },
          ]
        },
        {
          index: "1",
          type: "operator",
          name: "if",
          scripts: [
            {
              functionId: "showPopoverForCreateElement",
              text: "click to add operator",
            },
            {
              functionId: "openConditionDialog",
              text: "open condition dialog",
            },
            {
              functionId: "changeLeftMethod",
              text: "change left method",
            },
            {
              functionId: "setFocusOnLeftParam",
              text: "change left param",
            },
            {
              functionId: "changeRelationalOperator",
              text: "change relational operator",
            },
            {
              functionId: "setFocusOnRightProperty",
              text: "change property",
            },
            {
              functionId: "changeRightMethod",
              text: "change right method",
            },
            {
              functionId: "setFocusOnRightParam",
              text: "change right param",
            },
          ],
          conditionForIf: {
            leftStatement: {
              fromConnector: "fromConnector",
              leftMethodIndex: "0",
              leftParam: '[0].ifLeftParam',
            },
            relationalOperator: "Contains",
            rightStatement: {
              fromConnector: "fromConnector",
              property: 'id',
              rightMethodIndex: '0',
              rightParam: '[0].ifRightParam',
            }
          }
        },
      ]
    },
    toConnector: {
      invoker: {
        name: 'trello'
      },
      items: [
        {
          index: "0",
          type: "process",
          name: "GetBoardList",
          label: "with reference",
          scripts: [
            {
              functionId: "addBodyKeyValue",
              text: "###",
            },
            {
              functionId: "changeBodyMethod",
              text: "change body method",
            },
            {
              functionId: "changeBodyParam",
              text: "change body param",
            },
            {
              functionId: "addBodyMethodAndParam",
              text: "add body method and param",
            },
            {
              functionId: "clickOnReferenceElements",
              text: "click on reference elements",
            },
            {
              functionId: "changeReferenceDescription",
              text: "change reference description",
            },
            {
              functionId: "changeReferenceContent",
              text: "change reference content",
            },
          ],
          body: [
            {
              keyName: "firstKeyName",
              keyValue: "#",
              reference: [
                {
                  method: [
                    {
                      fromConnector: "fromConnector",
                      index: "0",
                      param: "[0].firstParam",
                    },
                    {
                      fromConnector: "fromConnector",
                      index: "0",
                      param: "[0].secondParam",
                    },
                  ],
                  enhancementDescription: "first reference description",
                  enhancementContent: "RESULT_VAR = VAR_0; var TEST_VAR = RESULT_VAR;\nvar SECOND_LINE = 'some text';"
                },
              ]
            },
          ]
        },
        {
          index: "1",
          type: "process",
          name: "GetBoards",
          label: "with endpoint",
          scripts: [
            {
              functionId: "deleteLastProcess",
              text: "delete last process",
            },
            {
              functionId: "showPopoverForCreateElement",
              text: "click to add process",
            }
          ],
          endpoint: {index: "0", param: "[0]", connectorType: "toConnector"}
        },
      ],
    }
  },
  configureAPI: {
    fromConnector: {
      invoker: {
        name: 'otrs',
      },
      items: [
        {
          index: "2",
          type: "process",
          name: "ServiceGet",
          delete: false,
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
          name: "LinkDelete",
          delete: false,
        },
      ]
    },
    initialConnection: configureAPIInitialConnection,
  },
  usingOperators: {
    fromConnector: {
      invoker: {
        name: 'otrs',
      },
      items: [
        {
          index: "0",
          type: "process",
          name: "LinkCreate",
          delete: false,
        },

      ]
    },
    toConnector: {
      invoker: {
        name: 'otrs'
      },
      items: [
      ]
    },
  },
  loremIpsum: {
    fromConnector: {
      invoker: {
        name: 'otrs',
      },
      items: [
        {
          index: "0",
          type: "process",
          name: "LinkList",
          delete: false,
        },
      ]
    },
    toConnector: {
      invoker: {
        name: 'otrs'
      },
      items: [
      ]
    },
  },
};

export default animationData;
