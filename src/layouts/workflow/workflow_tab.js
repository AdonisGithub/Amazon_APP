import React from 'react'
import AmazonTab from "../../helpers/amazon-tab";


class WorkflowTab extends AmazonTab {
    static SECTION = 'workflow';

    constructor(props) {
        super(props);
        this.unMounted = false;
        this.setSection(WorkflowTab.SECTION);
    }

    componentWillUnmount() {
        this.unMounted = true;
    }
}

export default WorkflowTab;
