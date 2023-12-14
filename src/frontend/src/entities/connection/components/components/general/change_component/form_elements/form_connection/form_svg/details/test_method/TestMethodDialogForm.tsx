import React, { useEffect, useState } from "react";
import { TestMethodFormWrapper, TestMethodFormContainer, TestMethodFormDivider, TestMethodTitle } from "./styles";
import InputText from "@app_component/base/input/text/InputText";
import { Connection } from "@entity/connection/classes/Connection";
import Button from "@app_component/base/button/Button";
import InputJsonView from "@app_component/base/input/json_view/InputJsonView";
import { useAppDispatch, useAppSelector } from "@application/utils/store";
import { requestRemoteApi } from "@entity/connection/redux_toolkit/action_creators/EditorCreators";
import { RemoteApiRequestProps } from "@application/requests/interfaces/IApplication";
import { Connector } from "@entity/connector/classes/Connector";
//@ts-ignore
import styles from './styles.scss';
import { API_REQUEST_STATE } from "@application/interfaces/IApplication";
import {setFocusById} from "@application/utils/utils";
/*
function replacePlaceholdersInUrl(inputString: any, replacementObject: any) {
  return inputString.replace(/\{([^{}]+)\}/g, (match: any, placeholderName: any) => {
    if (replacementObject.hasOwnProperty(placeholderName) && replacementObject[placeholderName]) {
      return replacementObject[placeholderName];
    } else {
      return match;
    }
  });
}*/
function replacePlaceholdersInUrl(inputString: string) {
  const referenceRegExp = /\{\%\#[0-9a-fA-F]{6}\.\((request|response)\)\.[^\%\}]*\%\}/g;
  return inputString.replace(referenceRegExp, (match: any, placeholderName: any) => {
      return `{REFERENCE}`;
  });
}
function removeReferencesInBody(body: any) {
  const referenceRegExp = /\"\#[0-9a-fA-F]{6}\.\((request|response)\)\.[^\"]*\"/g;
  return JSON.parse(JSON.stringify(body).replace(referenceRegExp, (match: any, placeholderName: any) => {
    return `""`;
  }));
}
function findPlaceholders(inputString: string) {
  return inputString.indexOf('{REFERENCE}') !== -1;
}
/*function findPlaceholders(inputString: any) {
  const placeholderRegex = /\{([^}]+)\}/g;

  const matches = inputString.match(placeholderRegex);

  if (matches) {
    const placeholderNames = matches.map((match: any) => match.slice(1, -1));
    return placeholderNames;
  } else {
    return false;
  }
}*/

const TestMethodDialogForm = (props: any) => {

  const dispatch = useAppDispatch();
  const { connectors } = Connector.getReduxState();
  const { currentTechnicalItem } = Connection.getReduxState();

  let requestData;

  connectors.forEach((connector) => {
    if(connector.connectorId === props.connection[currentTechnicalItem.connectorType].id){
      requestData = connector.requestData;
    }
  })

  let endpoint = replacePlaceholdersInUrl(currentTechnicalItem.entity.request.endpoint);
  const bodyFields = removeReferencesInBody(currentTechnicalItem.entity.request.body?.fields || {});
  const method = currentTechnicalItem.entity.request.method;
  const [ dataState, setDataState ] = useState<RemoteApiRequestProps>({url: '', header: {}, method, body: {}});
  const [ endpointValue, setEndpointValue ] = useState(endpoint);
  const [ requestHeaderData, setRequestHeaderData ] = useState(currentTechnicalItem.entity.request.header);
  const [ requestBodyData, setRequestBodyData ] = useState(bodyFields);
  const [ errorMessage, setErrorMessage ] = useState('');
  const {remoteApiData, requestingRemoteApi } = useAppSelector(state => state.connectionEditorReducer);

  const responseHeaderData = remoteApiData?.headers ? remoteApiData?.headers : null;
  const responseBodyData = remoteApiData?.body ? JSON.parse(remoteApiData?.body) : null;

  const testMethod = () => {
    const placeholders = findPlaceholders(dataState.url);
    if(placeholders){
      setErrorMessage(`Please, correct the references and try again`)
      setFocusById('input_test_method_endpoint');
    }
    else{
      setErrorMessage('');
      dispatch(requestRemoteApi(dataState))
    }
  }

  useEffect(() => {
    setDataState({
      url: endpointValue,
      header: requestHeaderData,
      method: currentTechnicalItem.entity.request.method,
      body: requestBodyData
    })
  }, [endpointValue, requestHeaderData, requestBodyData])

  return (
    <React.Fragment>
      <TestMethodFormWrapper>
        <TestMethodFormContainer>
          <TestMethodTitle>
            Request
          </TestMethodTitle>
          <InputText
            id={`input_test_method_name`}
            autoFocus={false}
            readOnly={true}
            defaultValue={currentTechnicalItem.name}
            icon={'person'}
            label={'Name'}
          />
          <InputText
            id={`input_test_method_endpoint`}
            autoFocus={false}
            readOnly={false}
            icon={'http'}
            label={'Endpoint'}
            value={endpointValue}
            onChange={(e) => {
              setErrorMessage('');
              setEndpointValue(e.target.value);
            }}
            error={errorMessage}
          />
          <InputText
            id={`input_test_method_method`}
            autoFocus={false}
            readOnly={true}
            defaultValue={currentTechnicalItem.entity.request.method}
            icon={'public'}
            label={'Method'}
          />
          <InputJsonView
            readOnly={false}
            icon={'data_object'}
            label={'Header'}
            updateJson={(e) => setRequestHeaderData(e)}
            jsonViewProps={{
              name: false,
              style: {marginBottom: '0px', position: 'relative'},
              collapsed: false,
              src: {...requestHeaderData},
            }}
            hasEdit={false}
          />
          <InputJsonView
            readOnly={false}
            icon={'data_object'}
            label={'Body'}
            updateJson={(e) => setRequestBodyData(e)}
            jsonViewProps={{
              name: false,
              style: {marginBottom: '20px', position: 'relative'},
              collapsed: false,
              src: {...requestBodyData},
            }}
            hasEdit={false}
          />
          <Button
            label={'Send'}
            icon={'play_arrow'}
            handleClick={() => testMethod()}
            className={styles.testMethodButton}
            isLoading={requestingRemoteApi === API_REQUEST_STATE.START}
            isDisabled={requestingRemoteApi === API_REQUEST_STATE.START}
          />
        </TestMethodFormContainer>
        <TestMethodFormDivider/>
        <TestMethodFormContainer>
          <TestMethodTitle>
            Response
          </TestMethodTitle>
          <InputJsonView
            readOnly={true}
            icon={'data_object'}
            label={'Header'}
            updateJson={null}
            jsonViewProps={{
              name: false,
              style: {marginBottom: '0px'},
              collapsed: false,
              src: {...responseHeaderData},
            }}
            hasEdit={false}
          />
          <InputJsonView
            readOnly={true}
            icon={'data_object'}
            label={'Body'}
            updateJson={null}
            jsonViewProps={{
              name: false,
              style: {marginBottom: '0px'},
              collapsed: false,
              src: {...responseBodyData},
            }}
            hasEdit={false}
          />
        </TestMethodFormContainer>
      </TestMethodFormWrapper>
    </React.Fragment>
  )
}


export default TestMethodDialogForm;
