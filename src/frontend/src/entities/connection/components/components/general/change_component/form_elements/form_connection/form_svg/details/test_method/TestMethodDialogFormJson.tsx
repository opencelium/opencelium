import React from "react";
import JsonBody from "../../../form_methods/method/JsonBody";
import Icon from "@app_component/base/icon/Icon";
import { ColorTheme } from "@style/Theme";
import { TextSize } from "@app_component/base/text/interfaces";
import { TestMethodDialogFormJsonWrap, TestMethodDialogFormJsonLabel } from "./styles";
//@ts-ignore
import styles from './styles.scss';
import InputJsonView from "@app_component/base/input/json_view/InputJsonView";

const TestMethodDialogFormJson = (props: any) => {

  const { method, connection, connector, label, readOnly, source } = props;

  const updateEntity = (a: any) => {}

  return (
    <TestMethodDialogFormJsonWrap>
      <InputJsonView
        readOnly={readOnly}
        icon={'data_object'}
        label={label}
        updateJson={(e) => console.log(e)}
        jsonViewProps={{
            name: false,
            style: {marginBottom: '0px', zIndex: 1},
            collapsed: false,
            src: {},
        }}
        hasEdit={false}
      />
    </TestMethodDialogFormJsonWrap>
  )
}

export default TestMethodDialogFormJson;