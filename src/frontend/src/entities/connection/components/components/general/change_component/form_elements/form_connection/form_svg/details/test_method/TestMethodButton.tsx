import React, {useState} from "react";
import Button from "@app_component/base/button/Button";
import Dialog from "@app_component/base/dialog/Dialog";
import { Connection } from "@entity/connection/classes/Connection";
import TestMethodDialogForm from "./TestMethodDialogForm";

//@ts-ignore
import styles from './styles.scss';

const TestMethodButton = (props: any) => {
  const { connection } = props;
  const { currentTechnicalItem } = Connection.getReduxState();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const setShowDialog = () => {
    setIsDialogOpen(!isDialogOpen);
  }

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
          <TestMethodDialogForm connection={connection}/>
        </Dialog>
    </React.Fragment>
  )
}

export default TestMethodButton;