import AmazonTab from "../../helpers/amazon-tab";
import React from 'react'
import CsI18n from "../../components/csI18n"

import {
    Card,
    Layout,
    Page,
    Stack,
    Heading,
    Button, DisplayText,
    Subheading, Banner, Spinner
} from '@shopify/polaris';

import {
    ChevronRightMinor,
    ClockMajorMonotone
} from '@shopify/polaris-icons';
import "./actions.scss"

import ShopifyContext, {TAB} from "../../context"
import Util from "../../helpers/Util";
import ApplicationApiCall from "../../functions/application-api-call";

//import test_operation from "../../testData/test_operation";
import CsErrorMessage from "../../components/csErrorMessage/csErrorMessage";

class Operations extends AmazonTab {

    getName() {
        return "Operations";
    }

    // labels = [
    //     "Update entire shopify catalog",
    //     "Import entire Amazon catalog",
    //     "Update Amazon Inventory",
    //     "Import Amazon orders",
    //     "Send offers to Amazon"
    // ];
    //
    // operations = [
    //     "update_shopify_catalog",
    //     "import_amazon_catalog",
    //     "update_amazon_inventory",
    //     "import_amazon_order",
    //     "update_amazon_offers"
    // ];

    //ready, processing, waiting
    state = {
        operations: [
            // {status: 'ready', remain_time: 0 }, //update shopify catalog
            // {status: 'ready', remain_time: 0 }, //import amazon catalog
            // {status: 'ready', remain_time: 0 }, //update amazon inventory
            // {status: 'ready', remain_time: 0 }, //import amazon orders
            // {status: 'ready', remain_time: 0 }, //update amazon offers
        ],
        operationResult: 0, // result: 1: success, 2: scheduler triggered already so wait again
        error: null,
        wait: true,
    }

    constructor(props) {
        super(props);
        this.initialState = Util.clone(this.state);
        this.shopify = ShopifyContext.getShared();
        this.unMounted = false;
        this.init();
    }

    componentDidMount() {
        this.myInterval = setInterval(()=>{
            this.setState( prevState => {
                let operations = prevState.operations.map( item => {
                    let {status, remain_time} = item;
                    if( status == 'waiting' && remain_time >= 0 ) {
                        remain_time -= 1;
                        if( remain_time <= 0 ) {
                            status = 'ready';
                            remain_time = 0;
                        }
                    }
                    return {...item, status, remain_time};
                });
                return {operations};
            });
        }, 1000);
    }

    componentWillUnmount() {
        this.unMounted = true;
        clearInterval(this.myInterval);
    }

    componentWillReceiveProps(nextProps) {
        super.componentWillReceiveProps(nextProps);
        // console.log("[componentWillReceiveProps]", nextProps);

        if (this.selectedConfiguration !== this.getConfigurationSelectedIndex()) {
            this.selectedConfiguration = this.getConfigurationSelectedIndex();
            this.setState(Util.clone(this.initialState), this.init);
        }
    }

    init = () => {
        let params = {configuration: this.shopify.getConfigurationSelected()};
        ApplicationApiCall.get('/application/operation/list', params, this.cbInitSuccess, this.cbInitError);
        // setTimeout(()=>{
        //     this.cbInitSuccess(test_operation);
        // },3000);
    }

    cbInitSuccess = (result) => {
        if( this.unMounted ) {
            return;
        }

        if( result.data ) {

            let operations = [];
            for(let i in result.data ) {
                let item = result.data[i];
                operations.push(item);
                // if( i >= this.operations.length ) {
                //     break;
                // }
                // let item = result.data[i];
                // if( item.operation == this.operations[i] ) {
                //
                //     operation[i].status = item.status;
                //     operation[i].remain_time = item.remain_time;
                //
                //}

                this.setState({operations, wait: false});
            }
            console.log(operations);
        }
    }

    cbInitError = (err) => {
        console.log(err);
        if (err && this.unMounted === false) {
            this.setState({error: err, wait: false})
        }

    }

    handleExecute = (operation_code) => () => {
        let {operations} = this.state;
        let index = -1;
        for(let i in operations) {
            if (operations[i].operation == operation_code) {
                index = i;
                break;
            }
        }
        if (index == -1) {
            return;
        }

        operations[index].status = 'processing';
        operations[index].remain_time = 0;

        let params = {
            configuration: this.shopify.getConfigurationSelected(),
            operation: operations[index].operation
        };
        ApplicationApiCall.get('/application/operation/execute', params, (result) => { this.cbExecuteSuccess(result, index); }, this.cbExecuteError);
        // setTimeout(() => {
        //     this.cbExecuteSuccess({code: 1, time: 100}, index);
        // }, 3000);

        this.setState({operations});
    }

    //code: 1: success, 2: scheduler is started so wait again
    cbExecuteSuccess = (result, index) => {
        if( this.unMounted ) {
            return ;
        }


        this.setState( prevState => {
            let operations = prevState.operations.map( (item, i) => {
                let {status, remain_time} = item;
                if( i == index ) {
                    status = 'waiting';
                    remain_time = result.time;
                }
                return {...item, status, remain_time};
            });

            return {operations, operationResult: result.code};
        });

        setTimeout(() => {
            this.setState({operationResult: 0});
        }, 5000);
    }

    cbExecuteError = () => {
        if( this.unMounted ) {
            return ;
        }
    }

    renderLoading() {
        return (
            <Layout.Section>
                <div align="center" className={"mb-5 mt-5"}>
                    <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                </div>
            </Layout.Section>
        )
    }

    renderError() {
        return (
            <Layout.Section>
                <CsErrorMessage
                    errorType={this.state.error.type}
                    errorMessage={this.state.error.message}
                />
            </Layout.Section>
        )
    }


    render() {
        if( this.state.wait ) {
            return this.renderLoading();
        }
        if( this.state.error ) {
            return this.renderError();
        }


        let operation_result = '';
        switch( this.state.operationResult ) {
            case 1:
                operation_result = <div className={"mb-4"}><Banner status="success" title={CsI18n.t('Operation triggered successfully in the background, result will be available in Scheduler tab')}/></div>
                break;
            case 2:
                operation_result = <div className={"mb-4"}><Banner status="warning" title={CsI18n.t('Operation already triggered in the background, result will be available in Scheduler tab')}/></div>
                break;
            default:
                operation_result = <div className={"mb-4"}><Banner status="info"
                                                                   title={CsI18n.t('Don\'t forget that operations are automatically triggered by the Scheduler')}/>
                </div>
        }

        let {operations} = this.state;

        let section_search = 'amazon';
//filter(item => item.section == section_search).
        const groups = ['shopify', 'amazon', 'fba', 'vcs', 'amazon miscellaneous'];

        let buttons = [];
        for (const [index, group] of groups.entries()) {
            buttons[group] = [];
            buttons[group].push(operations.filter(item => item.group == group).map((item, index) => {
                let {operation, status, remain_time, title} = item;
                let minutes = Math.floor(parseInt(remain_time) / 60);
                let seconds = parseInt(remain_time) % 60;

                let button = (<Stack.Item key={"operation" + operation}>
                    <Stack alignment={"center"}>
                        <Stack.Item fill>
                            <div className={'operations-label'}><CsI18n>{title}</CsI18n></div>
                        </Stack.Item>
                        <Stack.Item>
                            {status == 'ready' ?
                                <Button icon={ChevronRightMinor} onClick={this.handleExecute(operation)}>Execute</Button>
                                :
                                status == 'waiting' ? <Button icon={ClockMajorMonotone}
                                                              disabled={true}>{` ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`}</Button>
                                    :
                                    <Button disabled={true}
                                            loading={true}>{` ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`}</Button>
                            }
                        </Stack.Item>
                    </Stack>
                </Stack.Item>);

                return (button)
            }));
        }

        console.log(buttons);

        return (
            <Page fullWidth>
                <Layout>
                    <Layout.Section>
                        <Banner
                            title={CsI18n.t("Manual operations")}
                            status="info"
                        >
                            <p>
                                <CsI18n>All operations are triggered automatically by the scheduler.</CsI18n><br/>
                                <CsI18n>However, here, in case of need, you can for one task.</CsI18n>
                            </p>
                        </Banner>
                        <div className={'operations-container'}>
                            <Card title="Operation you need immediately" sectioned>
                                <Card.Section title="Shopify">
                                    <Card.Subsection>
                                        <Stack vertical={true}>
                                            {buttons['shopify']}
                                        </Stack>
                                    </Card.Subsection>
                                </Card.Section>
                                <Card.Section title="Amazon">
                                    <Card.Subsection>
                                        <Stack vertical={true}>
                                            {buttons['amazon']}
                                        </Stack>
                                    </Card.Subsection>
                                </Card.Section>
                                <Card.Section title="Amazon FbA">
                                    <Card.Subsection>
                                        <Stack vertical={true}>
                                            {buttons['fba']}
                                        </Stack>
                                    </Card.Subsection>
                                </Card.Section>
                                <Card.Section title="Amazon VCS">
                                    <Card.Subsection>
                                        <Stack vertical={true}>
                                            {buttons['vcs']}
                                        </Stack>
                                    </Card.Subsection>
                                </Card.Section>
                                <Card.Section title="Amazon Miscellaneous">
                                    <Card.Subsection>
                                        <Stack vertical={true}>
                                            {buttons['amazon miscellaneous']}
                                        </Stack>
                                    </Card.Subsection>
                                </Card.Section>
                            </Card>

                            {/*<Card>*/}
                            {/*<Card title="Amazon" sectioned>*/}
                            {/*    <Stack vertical={true}>*/}
                            {/*        {buttons['amazon']}*/}
                            {/*    </Stack>*/}
                            {/*</Card>*/}
                            {/*<Card title="Amazon FBA" sectioned>*/}
                            {/*    <Stack vertical={true}>*/}
                            {/*        {buttons['fba']}*/}
                            {/*    </Stack>*/}
                            {/*    </Card>*/}
                            {/*    <Card title="Amazon VCS" sectioned>*/}
                            {/*        <Stack vertical={true}>*/}
                            {/*            {buttons['vcs']}*/}
                            {/*        </Stack>*/}
                            {/*    </Card>*/}
                            {/*</Card>*/}


                        </div>
                    </Layout.Section>
                </Layout>
            </Page>
        )
    }
}

export default Operations;
