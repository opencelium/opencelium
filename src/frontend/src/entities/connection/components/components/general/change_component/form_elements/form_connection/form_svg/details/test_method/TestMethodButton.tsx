import React, {useEffect, useState} from "react";
import Button from "@app_component/base/button/Button";
import Dialog from "@app_component/base/dialog/Dialog";
import { Connection } from "@entity/connection/classes/Connection";
import TestMethodDialogForm from "./TestMethodDialogForm";
import { clearRemoteApiData } from "@entity/connection/redux_toolkit/slices/EditorSlice";
import { useAppDispatch } from "@application/utils/store";

//@ts-ignore
import styles from './styles.scss';
import {Col} from "react-grid-system";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import { withTheme } from "styled-components";

const TestMethodButton = (props: any) => {
  const { connection, theme } = props;
  const { currentTechnicalItem } = Connection.getReduxState();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const dispatch = useAppDispatch();

  const setShowDialog = () => {
    setIsDialogOpen(!isDialogOpen);
  }

  useEffect(() => {
    if(isDialogOpen){
      dispatch(clearRemoteApiData())
    }
  }, [isDialogOpen])

  return (
    <React.Fragment>
        <Col xs={4} className={styles.col}>{`Test Method:`}</Col>
        <Col xs={8} className={`${styles.col}`}>
          <TooltipFontIcon onClick={() => setShowDialog()} size={11} value={<span className={styles.testMethod_icon} style={{fontFamily: theme.text.fontFamily}}>{`▶`}</span>} tooltip={'Open'}/>
        </Col>
      <Dialog
          actions={[
            {id: 'testMethod', label: 'Close', onClick: () => setShowDialog()}
          ]}
          active={isDialogOpen}
          toggle={setShowDialog}
          title={'Test Method'}
          dialogClassname={`${styles.testMethod_dialog}`}
        >
          <TestMethodDialogForm connection={connection} isDialogOpen={isDialogOpen}/>
        </Dialog>
    </React.Fragment>
  )
}

export default withTheme(TestMethodButton);
