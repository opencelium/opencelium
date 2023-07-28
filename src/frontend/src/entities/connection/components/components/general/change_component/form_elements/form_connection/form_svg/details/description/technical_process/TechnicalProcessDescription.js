/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import {connect} from 'react-redux';
import {isString} from "@application/utils/utils";
import {Col, Row} from "react-grid-system";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import Name from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/Name";
import Label
    from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/Label";
import Url from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/Url";
import Header
    from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/Header";
import Body from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/Body";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import {setCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import { setModalCurrentTechnicalItem } from '@entity/connection/redux_toolkit/slices/ModalConnectionSlice';
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';

@GetModalProp()
@connect(null, { setCurrentTechnicalItem, setModalCurrentTechnicalItem }, null, {forwardRef: true})
class TechnicalProcessDescription extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isResponseVisible: false,
    };
    this.setCurrentTechnicalItem = props.isModal
      ? props.setModalCurrentTechnicalItem
      : props.setCurrentTechnicalItem;
    this.urlRef = React.createRef();
    this.nameRef = React.createRef();
    this.headerRef = React.createRef();
    this.labelRef = React.createRef();
    this.bodyRef = React.createRef();
  }

  

  toggleResponseVisibleIcon() {
    this.setState({
      isResponseVisible: !this.state.isResponseVisible,
    });
  }

  changeLabel(label) {
    const { connection, details, updateConnection } = this.props;
    const connector = connection.getConnectorByType(details.connectorType);
    const method = connector.getMethodByColor(details.entity.color);
    method.label = label;
    const currentTechnicalItem = connector.getSvgElementByIndex(method.index);
    updateConnection(connection);
    this.setCurrentTechnicalItem(currentTechnicalItem.getObject());
  }

  updateBody(connection) {
    const { details, updateConnection } = this.props;
    const connector = connection.getConnectorByType(details.connectorType);
    const method = connector.getMethodByColor(details.entity.color);
    const currentTechnicalItem = connector.getSvgElementByIndex(method.index);
    updateConnection(connection);
    this.setCurrentTechnicalItem(currentTechnicalItem.getObject());
  }

  render() {
    const { isResponseVisible } = this.state;
    const {
      details,
      connection,
      updateConnection,
      isExtended,
      currentInfo,
      setCurrentInfo,
      readOnly,
    } = this.props;
    const methodItem = details.entity;
    const connector = connection.getConnectorByType(details.connectorType);
    const request = methodItem.request;
    const successResponse = methodItem.response.success;
    const failResponse = methodItem.response.fail;
    let invokerName =
      methodItem && methodItem.invoker && isString(methodItem.invoker.name)
        ? methodItem.invoker.name
        : "";
    let requestFormat =
      details && isString(methodItem.bodyFormat) ? methodItem.bodyFormat : "";
    if (invokerName === "") invokerName = "is empty";
    if (requestFormat === "") requestFormat = "is empty";
    let generalDataEntries = [
      { name: "Invoker", value: invokerName },
      { name: "Format", value: requestFormat },
    ];
    const label = details && details.entity ? details.entity.label || "" : "";
    return (
      <Row className={styles.row}>
        <Name {...this.props} ref={this.nameRef} />
        <Label
          ref={this.labelRef}
          {...this.props}
          label={label}
          changeLabel={(a) => this.changeLabel(a)}
          text={"Label"}
        />
        {generalDataEntries.map((entry) => {
          return (
            <React.Fragment key={entry.name}>
              <Col xs={4} className={styles.col}>{`${entry.name}:`}</Col>
              <Col xs={8} className={`${styles.col}`}>
                <span className={styles.value}>{entry.value}</span>
              </Col>
            </React.Fragment>
          );
        })}
        <br />
        <br />
        <Col xs={12} className={styles.col}>
          <b>{`Request`}</b>
        </Col>
        <Col xs={12} className={styles.col} style={{ marginBottom: "10px" }}>
          <Row className={styles.row}>
            <Col
              xs={4}
              className={`${styles.col} ${styles.entry_padding}`}
            >{`Method:`}</Col>
            <Col xs={8} className={`${styles.col}`}>
              <span className={styles.value}>{request.method}</span>
            </Col>
            <Url
              readOnly={readOnly}
              nameOfCurrentInfo={"request_url"}
              isCurrentInfo={currentInfo === "request_url"}
              setCurrentInfo={setCurrentInfo}
              isExtended={isExtended}
              request={request}
              connection={connection}
              updateConnection={updateConnection}
              method={methodItem}
              connector={connector}
              ref={this.urlRef}
            />
            <Header
              nameOfCurrentInfo={"request_header"}
              isCurrentInfo={currentInfo === "request_header"}
              setCurrentInfo={setCurrentInfo}
              isExtended={isExtended}
              items={request.header}
              ref={this.headerRef}
            />
            <Body
              readOnly={readOnly}
              nameOfCurrentInfo={"request_body"}
              isCurrentInfo={currentInfo === "request_body"}
              setCurrentInfo={setCurrentInfo}
              isExtended={isExtended}
              source={request.getBodyFields()}
              connection={connection}
              connector={connector}
              updateConnection={(a) => this.updateBody(a)}
              method={methodItem}
              bodyTitle={"Request data"}
              ref={this.bodyRef}
            />
          </Row>
        </Col>
        <Col xs={12} className={styles.col} id="response_label">
          <b>{`Response`}</b>
          <TooltipFontIcon
            className={styles.response_toggle_icon}
            onClick={(a) => this.toggleResponseVisibleIcon(a)}
            tooltip={isResponseVisible ? "Hide" : "Show"}
            value={isResponseVisible ? "arrow_drop_up" : "arrow_drop_down"}
          />
        </Col>
        {isResponseVisible && (
          <Col xs={12} className={styles.col}>
            <Row className={styles.row}>
              <Col xs={12} className={`${styles.col} ${styles.entry_padding}`}>
                <b>{`Success`}</b>
              </Col>
              <Col
                xs={4}
                className={`${styles.col} ${styles.entry_padding}`}
              >{`Status:`}</Col>
              <Col xs={8} className={`${styles.col}`}>
                {successResponse.status}
              </Col>
              <Header
                nameOfCurrentInfo={"success_header"}
                isCurrentInfo={currentInfo === "success_header"}
                setCurrentInfo={setCurrentInfo}
                isExtended={isExtended}
                items={successResponse.header}
              />
              <Body
                nameOfCurrentInfo={"success_body"}
                isCurrentInfo={currentInfo === "success_body"}
                setCurrentInfo={setCurrentInfo}
                isExtended={isExtended}
                source={successResponse.getBodyFields()}
                readOnly={true}
                connection={connection}
                connector={connector}
                updateConnection={(a) => this.updateBody(a)}
                method={methodItem}
                bodyTitle={"Response. Success data"}
              />
              <br />
              <br />
              <Col xs={12} className={`${styles.col} ${styles.entry_padding}`}>
                <b>{`Fail`}</b>
              </Col>
              <Col
                xs={4}
                className={`${styles.col} ${styles.entry_padding}`}
              >{`Status:`}</Col>
              <Col xs={8} className={`${styles.col}`}>
                {failResponse.status}
              </Col>
              <Header
                nameOfCurrentInfo={"fail_header"}
                isCurrentInfo={currentInfo === "fail_header"}
                setCurrentInfo={setCurrentInfo}
                isExtended={isExtended}
                items={failResponse.header}
              />
              <Body
                nameOfCurrentInfo={"fail_body"}
                isCurrentInfo={currentInfo === "fail_body"}
                setCurrentInfo={setCurrentInfo}
                isExtended={isExtended}
                source={failResponse.getBodyFields()}
                readOnly={true}
                connection={connection}
                connector={connector}
                updateConnection={(a) => this.updateBody(a)}
                method={methodItem}
                bodyTitle={"Response. Fail data"}
              />
            </Row>
          </Col>
        )}
      </Row>
    );
  }
}

export default TechnicalProcessDescription;
