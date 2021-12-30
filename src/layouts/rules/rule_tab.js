import React from 'react'
import AmazonTab from "../../helpers/amazon-tab";


class RuleTab extends AmazonTab {
    static SECTION = 'rules';

    constructor(props) {
        super(props);
        this.unMounted = false;
        this.setSection(RuleTab.SECTION);
    }

    componentWillUnmount() {
        this.unMounted = true;
    }
}

export default RuleTab;
