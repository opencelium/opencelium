import React, {useEffect, useState} from "react";
import Button from "@app_component/base/button/Button";
import Dialog from "@app_component/base/dialog/Dialog";
import { Connection } from "@entity/connection/classes/Connection";
import TestMethodDialogForm from "./TestMethodDialogForm";
import { clearRemoteApiData } from "@entity/connection/redux_toolkit/slices/EditorSlice";
import { useAppDispatch } from "@application/utils/store";

//@ts-ignore
import styles from './styles.scss';

const TestMethodButton = (props: any) => {
  const { connection } = props;
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
      <Button
        isDisabled={false}
        label={'Test Method'}
        handleClick={() => setShowDialog()}
        className={styles.openTestMethodDialogButton}
      />
      <Dialog
          actions={[
            {id: 'testMethod', label: 'Close', onClick: () => setShowDialog()}
          ]}
          active={isDialogOpen}
          toggle={setShowDialog}
          title={currentTechnicalItem.name}
          dialogTheme={{
            title: `${styles.testMethod_title}`
          }}
          dialogClassname={`${styles.testMethod_dialog}`}
        >
          <TestMethodDialogForm connection={connection} isDialogOpen={isDialogOpen}/>
        </Dialog>
    </React.Fragment>
  )
}

export default TestMethodButton;