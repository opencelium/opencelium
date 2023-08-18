import { IAnimationData } from "./interfaces";


const animationData: IAnimationData = {
  firstSteps: {
    fromConnector: [
      {
        index: "0",
        type: "process",
        name: "GetBoards",
        label: "first process",
        // body: [
        //   {
        //     keyName: "firstKeyName",
        //     keyValue: "firstKeyValue",
        //   },
        //   {
        //     keyName: "secondKeyName",
        //     keyValue: "secondKeyValue",
        //   },
        // ]
      },
      {
        index: "1",
        type: "operator",
        name: "if",
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
      {
        index: "2",
        type: "process",
        name: "GetBoardList",
        label: "down",
        endpoint: {index: "0", param: "[0]", connectorType: "fromConnector"}
      },
      // {
      //   index: "1",
      //   type: "operator",
      //   name: "loop",
      //   conditionForLoop: {
      //     leftStatement: {
      //       fromConnector: "fromConnector",
      //       leftMethodIndex: "0",
      //       leftParam: '[0].loopLeftParam',
      //     },
      //     relationalOperator: "SplitString",
      //     rightStatement: {
      //       fromConnector: "fromConnector",
      //       rightMethodIndex: "0",
      //       rightParam: "[0].loopRightParam"
      //     }
      //   }
      // },
      // {
      //   index: "1_2",
      //   type: "process",
      //   name: "GetBoardList",
      // },
      // {
      //   index: "2",
      //   type: "process",
      //   name: "GetBoardList",
      //   after: "1",
      // },
    ],
    toConnector: [
      {
        index: "0",
        type: "process",
        name: "GetBoardList",
        label: "with link",
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
        endpoint: {index: "0", param: "[0]", connectorType: "toConnector"}
      },
      // {
      //   index: "2",
      //   type: "process",
      //   name: "GetBoards",
      // },
    ],
  }
};

export default animationData;
