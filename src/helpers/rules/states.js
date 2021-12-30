
import React from "react";
import CsErrorMessage from "../../components/csErrorMessage";

class States extends React.Component {

//the states
    static NONE = -1;
    static STATE_EMPTY = 0;
    static STATE_NORMAL = 1;
    static STATE_ADD = 2;
    static STATE_EDIT = 3;

    static MODE_EDIT = 1;
    static MODE_ADD = 0;

//event
    static EVENT_ADD = 100;
    static EVENT_DELETE = 200;
    static EVENT_DELETE_DONE = 201;
    static EVENT_CLOSE = 300;
    static EVENT_EDIT = 400;
    static EVENT_SAVE = 500;
    static EVENT_SAVE_DONE = 501;
    static EVENT_REFRESH = 600;

    static EDIT_NEW = 0;
    static EDIT_EDITING = 1;
    static EDIT_SAVED = 2;
    static EDIT_UPDATING = 3;

    static STATUS_NORMAL = 0;
    static STATUS_SAVING = 1;
    static STATUS_SAVED = 2;
    static STATUS_DELETING = 3;
    static STATUS_DELETED = 4;
    static STATUS_ERROR = 5;
    static STATUS_ERROR_REQUIRE_CONDITION = 51;
    static STATUS_DUPLICATED = 6;
    static STATUS_DUPLICATING = 100;
    static STATUS_CHANGED = 7;
    static STATUS_SEARCHING = 8;
    static STATUS_SEARCHING_MORE = 9;



    cbSaveDone = (result) => {
        console.log(result);
        this.setState({status: result? States.STATUS_SAVED: States.STATUS_ERROR});

        setTimeout(() => {
            this.setState({status: States.STATUS_NORMAL});
        }, 3000);
    }

    cbSaveError = (error) => {
        console.log("FormError", error);
        this.setState({status: States.STATUS_ERROR, error: error});

        // setTimeout(() => {
        //     this.setState({status: States.STATUS_NORMAL});
        // }, 3000);
    }

    cbSimulateSuccess = (result) => {
        this.setState({simulator: result, simulating: false});
    }

    cbSimulateError = (err) => {
        this.setState({error: err, simulating: false, status: States.STATUS_ERROR})
    }

    deleteConfirmation = () => {

        this.handleToggleModal();
    }

    handleToggleModal = () => {
        this.setState(({opendeletemodal}) => ({
            opendeletemodal: !opendeletemodal
        }));
    };

    handlerDelete = () => {
        const {onDelete} = this.props;
        if( onDelete === undefined)
            return;
        this.setState(({opendeletemodal})=>({opendeletemodal: !opendeletemodal, status: States.STATUS_DELETING}));
        onDelete(this.cbSaveError);
    }

    renderError() {
        return(
          <CsErrorMessage
            errorType={this.state.error.type}
            errorMessage={this.state.error.message}
          />
        )
    }

}

export default States;
