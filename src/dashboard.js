import React from 'react';
import {
    Avatar,
    Badge,
    Card,
    Caption,
    Collapsible,
    DisplayText,
    Heading,
    Layout,
    Link,
    Page,
    Spinner,
    SkeletonBodyText,
    SkeletonDisplayText,
    Tabs,
    Icon,
    Stack,
    Subheading,
    TextStyle

} from '@shopify/polaris';
import CsI18n from "./components/csI18n";
import {ChevronUpMinor, ChevronDownMinor, CaretDownMinor} from "@shopify/polaris-icons";
import "./dashboard.css";
import {Chart} from 'react-google-charts';
import Util from "./helpers/Util";
import ApplicationApiCall from "./functions/application-api-call";
import shopifyContext from "./context";
import AmazonTab from "./helpers/amazon-tab";
import AccountSelector from "./layouts/accounts/helpers/account-selector"
import CsErrorMessage from "./components/csErrorMessage/csErrorMessage";
import Inventory from "./layouts/reports/Inventory";

class Dashboard extends AmazonTab  {
    default = {
        opened: [],
        selected: 0,
        loading:true,
        dashboard:null,
        error: false,
    }

    state = {
        ...this.state,
        ...this.default,
    }

    constructor(props) {
        super(props);
        this.sectionTitles = {
            //contact: CsI18n.t('Buyer communication'),
            products: CsI18n.t('Product Policy Compliance'),
            shipping: CsI18n.t('Shipping Performance'),
            orders: CsI18n.t('Customer Service Performance'),
            contact: CsI18n.t('Buyer Messages')
        }
        for(let key in this.sectionTitles) {
            this.state.opened[key] = false;
        }
        this.shopify = shopifyContext.getShared();
        this.unMounted = false;
    }

    componentDidMount() {
        this.init();
    }

    componentWillUpdate(nextProps, nextState, nextContext) {

        if(this.selectedConfiguration !== this.getConfigurationSelectedIndex()){
            this.selectedConfiguration = this.getConfigurationSelectedIndex();
            this.setState({...this.state, ...Util.clone(this.default)}, this.init);
        }
    }

    init(){

        this.setState({loading: true});

        let configuration = this.shopify.getConfigurationSelected();
        let params = {configuration};

        ApplicationApiCall.get('/application/home/dashboard', params, this.cbInitData, this.cbInitError);
    }

    cbInitData = (json) => {
        console.log("cbInitData", json);

        if (json && this.unMounted === false) {
            this.setState({dashboard:json});
            this.setState({loading:false});
        }
    }

    cbInitError = (err) => {
        console.log(err);

        if(err && this.unMounted === false){
            this.setState({error: err, loading: false})
        }
    }

    handleTabChange = (selectedTabIndex) => {
        this.setState({selected: selectedTabIndex});
    };

    render() {

        console.log(this.state);
        let content = ''

        if(this.state.error){
            content = this.renderError();
        }else if(this.state.loading){
            content = this.renderLoading();
        }else{
            content = this.renderTabs();
        }

        const activator = (
          <a onClick={this.togglePopover}>
              <Icon source={CaretDownMinor}/>
              <CsI18n>Amazon USA</CsI18n>
              <Icon source={CaretDownMinor}/>
          </a>
        );

        return <Page
        >

            <Layout.Section>
                {content}
            </Layout.Section>
        </Page>


    }

    renderError(){

        return(
              <CsErrorMessage
                errorType={this.state.error.type}
                errorMessage={this.state.error.message}
              />
        )
    }

    renderLoading()
    {
        return(
            <Card>
                <div align="center" style={{padding:50}}>
                    <Spinner size="large" color="teal" accessibilityLabel={CsI18n.t("Loading")}></Spinner>
                </div>
            </Card>
        );
    }
    renderTabs()
    {
        const {selected} = this.state;
        var tabs = [];
        console.log(this.state.dashboard)


        if(!this.state.dashboard){
            return ''
        }

        this.state.dashboard.forEach(function(marketplace, index) {
            let name = marketplace.Name;
            let iso_code = marketplace.DefaultCountryCode.toLowerCase();
            let flag_url = shopifyContext.getShared().static_content + '/amazon/flags/flag_' + iso_code + '_64px.png';
            let title =
              <Stack horizontal alignment="center">
                  <Stack.Item>
                      <Avatar source={flag_url} alt={iso_code} size="small"/>
                  </Stack.Item>
                  <Stack.Item>
                      <TextStyle>
                          {name}
                      </TextStyle>
                  </Stack.Item>
              </Stack>

            tabs[index] = {
                id:marketplace.MarketplaceId,
                content:title,
                panelID:marketplace.MarketplaceId,
            }
        });

        const inventory_empty = {summary: [
          {status: 'Active'},
          {status: 'Inactive'},
          {status: 'Incomplete'}
        ]};

        const orderSummary_empty = {
            day: [], month: [], year: []
        }

        let InventoryData;

        var sellerPerformanceReport = this.state.dashboard.length !== 0 ? this.state.dashboard[selected].PerformanceReport.sellerPerformanceReport : null;
        var orderSummary = this.state.dashboard.length !== 0 ? this.state.dashboard[selected].Orders : orderSummary_empty;

        if(this.state.dashboard.length !== 0 && this.state.dashboard[selected].Inventory && typeof (this.state.dashboard[selected].Inventory.summary ) === 'object'){
            InventoryData = this.state.dashboard[selected].Inventory;
            inventory_empty.summary.forEach(item => {
                let res = InventoryData.summary.find(item1 => {
                    return item.status === item1.status;
                })
                console.log(res);
                if(!res){
                    InventoryData.summary.push(item);
                }
            })
        }else{
            InventoryData = inventory_empty;
        }


        return(
            <div>
                {tabs.length === 0 ? '' :
                  <Card>
                      <div className="dashboard-heading">
                          <Tabs fitted tabs={tabs} selected={selected} onSelect={this.handleTabChange}></Tabs>
                      </div>
                  </Card>
                }

                <div className="dashboard-cards">
                    <Heading><CsI18n>Offers</CsI18n></Heading>
                    <Stack horizontal distribution="fillEvenly">
                        {this.inventoryReport(InventoryData)}
                    </Stack>

                </div>

                <div className="dashboard-cards">
                    <Heading><CsI18n>Orders</CsI18n></Heading>
                    <Stack horizontal distribution="fillEvenly">
                        {this.orderSummary(orderSummary)}
                    </Stack>
                </div>
                <div className="dashboard-content">
                    <Heading><CsI18n>Performance report</CsI18n></Heading>
                    {this.overallHealth(sellerPerformanceReport)}
                </div>
            </div>
        );

    }
    orderSummary(data) {
        let cards = [];

        for(let key in data) {
            let item = data[key];
            //console.log('orderSummary:', key, item)


            let status = 'default';
            let value = 0;
            let title = CsI18n.t('Today');
            let orders = CsI18n.t('No order');
            let currency = '';
            let order_total = <SkeletonDisplayText size="small" lines={2} />;
            // var store_currency = '';
            // var store_order_total = <SkeletonDisplayText size="small"  lines={2}  />;
            let className='';//'hidden';
            let empty = true;
            switch(key) {
                case 'year':
                    title=CsI18n.t('This year');
                    break;
                case 'month':
                    title=CsI18n.t('This month');
                    break;
                case 'day':
                    title=CsI18n.t('Today');
                    break;
                default: return(false);
            }

            if (item.hasOwnProperty('count')) {
                empty = false;
                orders = item.count <= 0 ? CsI18n.t('No order') : item.count == 1 ? '1 '+ CsI18n.t('order') : <CsI18n count={item.count}>{'{{count}} orders'}</CsI18n>;
                status = item.count > 0 ? 'success' : 'default';
                value = item.count;
                currency = item.order_currency_symbol;
                order_total = Number(item.total_amount).toFixed(2);
                // store_currency = item.store_currency_symbol;
                // store_order_total = Number(item.store_order_total).toFixed(2);
                className='';

            }
            //console.log('className:', className);

            cards.push(
                <Stack.Item key={key}>
                    <Card>
                        <Stack horizontal spacing="loose">
                            <Stack.Item fill>
                                <Heading>{title}</Heading>
                            </Stack.Item>
                            <Stack.Item>
                                <TextStyle variation="subdued">{orders}</TextStyle>
                            </Stack.Item>
                        </Stack>
                        <div  className={className}>
                            {empty ?
                                <SkeletonBodyText size="small" lines={3}/>
                                :
                                <Stack distribution="trailing">
                                    <Stack.Item>
                                        <TextStyle variation="strong">
                                            {currency}
                                        </TextStyle>
                                        <DisplayText size="large">{order_total}</DisplayText>
                                    </Stack.Item>

                                </Stack>
                            }
                        </div>
                    </Card>

                </Stack.Item>
            )
        };

        return(cards)
    }

    inventoryReport(data) {
        var cards = [];

        data.summary.forEach(function(item, key) {
            var status = 'default';
            var value = 0;
            var subtitle = '';
            var empty = false;

            if(item.hasOwnProperty('in_stock')){

                switch(item.status) {

                    case 'Active':
                        value = item.in_stock;
                        status = 'success';
                        subtitle = CsI18n.t('Available and active');
                        break;

                    case 'Inactive':
                        value = item.count;
                        status = 'attention';
                        subtitle = CsI18n.t('Out of stock or disabled');
                        break;

                    case 'Incomplete':
                        value = item.count;
                        status = 'warning';
                        subtitle = CsI18n.t('Offers with errors');
                        break;

                    default: return(false);
                }
            }else{
                empty = true;
                subtitle = CsI18n.t('No offers')
            }
            cards.push(
                <Stack.Item key={key}>
                    <Card>
                        <Stack vertical spacing="loose" distribution="fill">
                            <Stack.Item>
                                <Stack>
                                    <Stack.Item fill><Heading>{item.status}</Heading></Stack.Item>
                                    {empty ?
                                    <Stack.Item><TextStyle variation="subdued">{subtitle}</TextStyle></Stack.Item>
                                      : ''}
                                </Stack>

                            </Stack.Item>
                            <Stack.Item>{empty ? '' : <TextStyle variation="subdued">{subtitle}</TextStyle>}</Stack.Item>
                        </Stack>
                        {empty ?
                          <SkeletonBodyText size="small" lines={3}/>
                          : <Stack vertical spacing="loose" alignment="trailing" distribution="fill">
                              <Stack.Item>
                                  <Badge size="medium" status={status}>{value}</Badge>
                              </Stack.Item>
                          </Stack>}
                    </Card>

                </Stack.Item>
            )
        });

        return(cards)
    }

    overallHealth(sellerPerformanceReport)
    {
        let performanceChecklist = sellerPerformanceReport ? sellerPerformanceReport.performanceChecklist : null;
        const performanceCheckListParams =
            {
                orderDefectRate: {title: CsI18n.t('Order Defect Rate'), section: 'orders', metrics: 'orderDefects', metricsHistory: 'orderDefectMetrics', jauge:'orderWithDefects', jaugeTitle: CsI18n.t('Order with defects')},
                orderCancellationRate: {title: CsI18n.t('Cancellation Rate'), section: 'orders', metrics:'customerExperience', metricsHistory:'customerExperienceMetrics', jauge:'preFulfillmentCancellation', jaugeTitle: CsI18n.t('Pre-fulfillment Cancel Rate')},
                returnDissatisfactionRate: {title: CsI18n.t('Return Dissatisfaction Rate'), section: 'orders', metrics: 'returnDissatisfaction', metricsHistory: 'returnDissatisfactionMetrics', jauge: 'returnDissatisfaction', jaugeTitle: CsI18n.t('Return dissatisfaction')},

                validTrackingRate: {title: CsI18n.t('Valid Tracking Rate'),section: 'shipping', metrics: 'trackingInformation', metricsHistory: 'trackingMetrics', jauge: 'validTracking', jaugeTitle: CsI18n.t('Valid tracking')},
                onTimeDelivery: {title: CsI18n.t('On Time Delivery'), section: 'shipping', metrics:'trackingInformation', metricsHistory:'trackingMetrics', jauge:'onTimeDelivery', jaugeTitle: CsI18n.t('On time delivery')},
                lateShipmentRate: {title: CsI18n.t('Late Dispatch Rate'), section: 'shipping', metrics:'customerExperience', metricsHistory:'customerExperienceMetrics', jauge:'lateShipment', jaugeTitle: CsI18n.t('Late shipment')},

                contactResponseTime: {title: CsI18n.t('Contact Response Time'), section: 'contact', metrics:'buyerSellerContactResponseTimeMetrics', metricsHistory:'responseTimeMetrics', jauge:'averageResponseTimeInHours', jaugeTitle: CsI18n.t('Average response time in hours')},

                //intellectualPropertyStatus: {title: CsI18n.t('Intellectual Property Status'), section: 'products', metrics:'productAuthenticityData', metricsHistory:'defectCount'},
                listingPolicyStatus: {title: CsI18n.t('Listing Policy Status'), section: 'products'},
                policyViolation: {title: CsI18n.t('Policy Violations'), section: 'products'},
                productAuthenticityStatus: {title: CsI18n.t('Product Authenticity Status'), section: 'products'},
                productSafetyStatus: {title: CsI18n.t('Product Safety Status'), section: 'products'},
            };

        const targetReferences = { // target values defined by Amazon (example: orderWithDefects < 1%
            orderWithDefects: {target: 1, isPercentage: true, max: 2, negative: true},
            returnDissatisfaction: {target: 10, isPercentage: true, max: 20, negative: true},
            preFulfillmentCancellation: {target: 2.5, isPercentage: true, max: 5, negative: true},
            onTimeDelivery: {target: 97, isPercentage: true, max:100, negative: false},
            validTracking: {target: 95, isPercentage: true, max:100, negative: false},
            lateShipment: {target: 4, isPercentage: true, max:8, negative: true},
            averageResponseTimeInHours: {target: 12, isPercentage: false, max:24, negative: true},
        }

        var performanceChecklistResult = [];

        var jauges = {};
        var metrics = {};
        var trends = {};

        for(let key in this.sectionTitles) {
            jauges[key] = {};
            metrics[key] = {};
            trends[key] = {};
        }

        for (var key in performanceCheckListParams) {
            let section = performanceCheckListParams[key].section;
            performanceChecklistResult[section] = [];
            //console.log('performanceCheckListParams:', section, key, performanceCheckListParams[key]);


            if(sellerPerformanceReport){
                if (performanceCheckListParams[key].hasOwnProperty('metrics')) {
                    let metrixObject = performanceCheckListParams[key].metrics
                    let metrixHistoryObject = performanceCheckListParams[key].metricsHistory

                    if (!sellerPerformanceReport.hasOwnProperty(metrixObject))
                        continue;
                    if (! sellerPerformanceReport[metrixObject].hasOwnProperty(metrixHistoryObject))
                        continue;

                    let itemMetrics = sellerPerformanceReport[metrixObject][metrixHistoryObject];
                    let jaugeName = null;
                    let jaugeTitle = '';
                    let jauge = null;
                    let keys = ['week'];

                    if (performanceCheckListParams[key].hasOwnProperty('jauge')) {
                        jaugeName = performanceCheckListParams[key].jauge;
                    }
                    if (performanceCheckListParams[key].hasOwnProperty('jaugeTitle')) {
                        jaugeTitle = performanceCheckListParams[key].jaugeTitle;
                    }
                    metrics[section][jaugeName] = [];
                    trends[section][jaugeName] = [];
                    //console.log(metrixObject, metrixHistoryObject, itemMetrics, jaugeName)


                    itemMetrics.forEach(function (item, index) {


                        //let date_start = new Date(item.timeFrame.start).toISOString().slice(0, 10);
                        //let date_end = new Date(item.timeFrame.end).toISOString().slice(5, 10);
                        let date_start = new Date(item.timeFrame.start);
                        let date_end = new Date(item.timeFrame.end);

                        let date = Util.getWeekNumber(date_start) + '-' + Util.getWeekNumber(date_end);
                        let metricSet = [date];
                        let trendSet = [date];

                        for (let propertyName in item) {
                            if (!item.hasOwnProperty(propertyName)) continue;
                            if (!item[propertyName] instanceof Object)  continue;
                        if (propertyName === 'timeFrame') continue;
                        if (propertyName === 'requiredCategories') continue;

                            let metricObject = item[propertyName];
                            let isPercentage = false;
                            if (metricObject.hasOwnProperty('rate'))
                                isPercentage = true;

                            if (index === 0 && propertyName === jaugeName) {
                                let jaugeRate = 0;
                                if (isPercentage) {
                                    jaugeRate = parseFloat(item[jaugeName].rate.replace('%', ''));
                                } else {
                                    jaugeRate = parseFloat(item[jaugeName]);
                                }

                                var jaugeRateTarget = 0;
                                var jaugeRateMax = 0;

                                if (targetReferences[jaugeName].negative) {
                                    jaugeRateTarget = Math.max(targetReferences[jaugeName].target, jaugeRate);
                                    jaugeRateMax = Math.max(targetReferences[jaugeName].max, jaugeRate);
                                } else {
                                    jaugeRateTarget = targetReferences[jaugeName].target;
                                    jaugeRateMax = targetReferences[jaugeName].max;
                                }

                                jauge = {
                                    name: jaugeName,
                                    title: jaugeTitle,
                                    rate: jaugeRate,
                                    target: jaugeRateTarget,
                                    max: jaugeRateMax,
                                    negative: targetReferences[jaugeName].negative
                                };

                                continue;
                            } else if (propertyName === jaugeName) {
                                continue;
                            }
                            let currentValue = 0;

                            if (isPercentage) {
                                currentValue = parseFloat(Number(parseFloat(metricObject['rate'])).toFixed(2));
                            } else {
                                currentValue = parseFloat(Number(parseFloat(metricObject)).toFixed(2));
                            }
                            metricSet.push(currentValue);

                            // Create trend
                            //
                            let trend = 0;
                            let previousValue = 0;
                            let negative = targetReferences[jaugeName].negative;

                            if (index < itemMetrics.length-1) {
                                let previousObject = itemMetrics[index + 1][propertyName];
                                let previousValue = 0;
                                if (isPercentage) {
                                    previousValue = parseFloat(Number(parseFloat(previousObject.rate).toFixed(2)));
                                } else {
                                    previousValue = parseFloat(Number(parseFloat(previousObject).toFixed(2)));
                                }

                            }
                            if (currentValue <= previousValue) {
                                trend = negative ? 1 : -1;
                            } else if (currentValue >= previousValue) {
                                trend = negative ? -1 : 1;
                            }

                            trendSet.push({ v: trend, f: currentValue.toString()+(isPercentage ? '%' : '')});

                            if (index === 0) {
                                // Add keys for table header
                                keys.push(propertyName);
                            }

                        }
                        if (jaugeName) {
                            if (metricSet.length > 1)
                                metrics[section][jaugeName].push(metricSet);
                            if (trendSet.length > 1)
                                trends[section][jaugeName].push(trendSet);
                            if (jauge)
                                jauges[section][jaugeName] = jauge;
                        }
                    });

                    keys.forEach(function(value, index, array) {
                        let newTitle = value.toString().replace (/([A-Z])/g, ' $1');
                    newTitle = newTitle.replace('_', ' ', newTitle);
                    newTitle = newTitle.replace('24', ' 24', newTitle);
                        newTitle = newTitle.charAt(0).toUpperCase() + newTitle.slice(1).toLowerCase(); // capitalize first letter, lower case others;
                    newTitle = newTitle.replace('A z_', 'A-Z ', newTitle);

                        array[index] = newTitle;
                        return(true);
                    });
                    if (jaugeName && metrics[section][jaugeName].length)
                        metrics[section][jaugeName].unshift(keys);
                    trends[section][jaugeName].unshift(keys);
                }
            }
        }


        if(sellerPerformanceReport){
            for (var key in performanceChecklist) {
                // skip loop if the property is from prototype, skip to ignore unwanted items
                if (!performanceChecklist.hasOwnProperty(key)) continue;
                if (!performanceCheckListParams.hasOwnProperty(key)) continue;
                //console.log(key, performanceChecklist[key]);




                let section = performanceCheckListParams[key].section;
                let classNames="performanceChecklist " + performanceChecklist[key].status;

                let textVariation = 'positive';
                if (performanceChecklist[key].status !== 'Good' && performanceChecklist[key].status !== 'None')
                    textVariation = 'negative';

                let status =
                  <Stack alignment="center" key={key}>
                      <Stack.Item>
                          <div className={classNames} style={{padding:"10px"}}>
                              <Avatar customer={false} />
                          </div>
                      </Stack.Item>
                      <Stack.Item >
                          <TextStyle variation={textVariation}>
                              {performanceCheckListParams[key].title}
                              <Caption>{performanceChecklist[key].status}</Caption>
                          </TextStyle>
                      </Stack.Item>
                  </Stack>

                if (performanceChecklistResult[section].length >= 3) { // We display only first columns and sorted by status (Bad/poor first)
                    continue;
                }
                if (performanceChecklist[key].status === 'Good'){
                    performanceChecklistResult[section].push(status);
                }
                else
                {
                    performanceChecklistResult[section].unshift(status);

                }
            }
            //console.log(performanceChecklistResult);
            //console.log(jauges);
            //console.log(metrics);
            //console.log(trends);
        }


        var sections = [];
        for (var key in performanceChecklistResult) {

            let dashboards = [];
            let empty = false;
            let opened = false;

            if(sellerPerformanceReport){
                for(let metricType in jauges[key]) {
                    //console.log('metrics:', key, jauges[key], metrics[key]);


                    if (!jauges[key].hasOwnProperty(metricType)) continue;

                    let title=jauges[key][metricType].title;
                    let rate=jauges[key][metricType].rate;
                    let target=jauges[key][metricType].target;
                    let max=jauges[key][metricType].max;
                    let negative=jauges[key][metricType].negative;
                    let isPercentage=jauges[key][metricType].isPercentage;
                    let metricsData = [];
                    let trendsData = [];
                    //console.log('metricData:', metrics[key], metrics[key][metricType]);

                    if (metrics[key][metricType].length)
                    {
                        metricsData = metrics[key][metricType];
                    }
                    if (trends[key][metricType].length)
                    {
                        trendsData = trends[key][metricType];
                    }
                    //console.log('metricData:', metricsData)

                    let dashboard =
                      <Card.Section key={metricType} sectionned>
                          <Stack horizontal  distribution="fill" wrap={false}>
                              <Stack.Item>
                                  {this.jaugeItem(title, rate, target, max, negative, isPercentage)}
                              </Stack.Item>

                              <Stack.Item>
                                  {this.trendItem(title, trendsData)}

                              </Stack.Item>
                              <Stack.Item>
                                  {this.historyItem(title, metricsData)}
                              </Stack.Item>

                          </Stack>
                      </Card.Section>
                    dashboards.push(dashboard);
                }
                opened = this.state.opened[key];
            }else{
                empty = true;
            }
            console.log(dashboards);
            let section_summary =
                <Card key={key}>
                    <Stack horizontal  alignment="center" >
                        {empty ?
                          <Stack.Item fill>
                              <div className="dashboard-empty">
                                  <Stack vertical>
                                      <Stack.Item>
                                          <div style={{'padding': '15px 0 0 10px'}}>
                                              <Subheading>{this.sectionTitles[key]}</Subheading>
                                          </div>
                                      </Stack.Item>
                                      <Stack.Item>
                                          <SkeletonBodyText size="small" lines={3}/>
                                      </Stack.Item>
                                  </Stack>
                              </div>
                          </Stack.Item>
                          :
                          <Stack.Item fill>
                              <Stack vertical>
                                  <Stack.Item>
                                      <div style={{'padding': '15px 0 0 10px'}}>
                                          <Subheading>{this.sectionTitles[key]}</Subheading>
                                      </div>
                                  </Stack.Item>
                                  <Stack.Item fill>
                                      <Stack horizontal distribution="fillEvenly" wrap={false}>
                                          {performanceChecklistResult[key]}
                                      </Stack>
                                  </Stack.Item>
                                  <Collapsible open={opened} id={'dashboard-' + key}>
                                      <Stack.Item>
                                          {dashboards}
                                      </Stack.Item>
                                  </Collapsible>
                              </Stack>
                              {dashboards.length > 0 ?
                              <div className="expand-dashboard">
                                  <Link onClick={this.handleToggleClick(key)}>
                                      <Stack.Item>
                                          <Icon source={opened ? ChevronUpMinor : ChevronDownMinor}/>
                                      </Stack.Item>
                                  </Link>
                              </div>: ''}
                            </Stack.Item>
                        }
                    </Stack>
                </Card>
            sections.push(section_summary);
        }

        return(
            <Stack vertical>
                    {sections}
            </Stack>
        )
    }

    jaugeItem(title, rate, rateTarget, rateMax, negative, isPercentage)
    {

        // let newTitle = title.toString().replace (/([A-Z])/g, ' $1');
        // newTitle = newTitle.charAt(0).toUpperCase() + newTitle.slice(1).toLowerCase(); // capitalize first letter, lower case others;
        let way = negative ? '<' : '>';
        let chartTitle = <TextStyle>{title}<Caption>Target {way} {rateTarget}{isPercentage ? '%' : ''}</Caption></TextStyle>;

        let compareWithTarget = negative ? rate < rateTarget : rate > rateTarget;
        let compareWithMax = negative ? rate < rateMax : rate > rateMax;

        let options_negatives =
            {
                greenFrom:0,
                greenTo:rateTarget / 2,
                yellowFrom:rateTarget / 2,
                yellowTo:rateTarget,
                redFrom: rateMax  - rateTarget,
                redTo: rateMax,
                minorTicks: rateMax,
                max:rateMax
            };
        //onTimeDelivery: {target: 97, max:100, negative: false}
        let options_positives =
            {
                redFrom:0,
                redTo:50,
                yellowFrom:50,
                yellowTo:rateTarget,
                greenFrom: rateTarget,
                greenTo:rateMax,
                minorTicks: rateMax,
                max:rateMax
            };
        let options = negative ? options_negatives : options_positives;

        return(
            <Stack vertical distribution="center">
                <Stack.Item>
                    {chartTitle}
                </Stack.Item>
                <Stack.Item>
                    <Chart
                        height={150}
                        width={120}
                        chartType="Gauge"
                        loader={<div><CsI18n>Loading Chart</CsI18n></div>}
                        data={[
                            ['Label', 'Value'],
                            [compareWithTarget ? CsI18n.t('Good') : compareWithMax ? CsI18n.t('Bad') : (negative ? CsI18n.t('Over') : CsI18n.t('Under')), Number((rate).toFixed(2))],

                        ]}
                        options={options}
                    />
                </Stack.Item>
            </Stack>
        );
    }
    trendItem(title, trendData)
    {
        var formatters = [];
        var [firstRow] = trendData;
        firstRow.forEach(function(items, index) {
            if (index > 0)
                formatters.push({
                    type:'ArrowFormat',
                    column:index,
                })
        });
        return(
            <Stack vertical>
                <Stack.Item>
                    <TextStyle><CsI18n>Trend</CsI18n><Caption><CsI18n>Comparison to last period</CsI18n></Caption></TextStyle>
                </Stack.Item>

                <Stack.Item>
                    <Chart
                        className="trend"
                        height={150}
                        chartType="Table"
                        loader={<div><CsI18n>Loading Chart</CsI18n></div>}
                        data={trendData}
                        formatters={formatters}
                        options={{
                            showRowNumber: false,
                            cssClassNames: {
                                headerRow: 'none',
                                headerCell: 'trend-header'
                            }
                        }}
                    />
                </Stack.Item>
            </Stack>
        );
    }

    historyItem(title, metricData)
    {
        //console.log('historyItem:', title, metricData);


        return(
            <Stack vertical distribution="center">
                <Stack.Item>
                    <TextStyle><CsI18n>History</CsI18n></TextStyle>
                </Stack.Item>
                <Stack.Item>
                    <Chart
                        width={200}
                        height={160}
                        chartType="Bar"
                        loader={<div><CsI18n>Loading Chart</CsI18n></div>}
                        data={metricData}
                        options={{
                            legend: { position: 'none' },
                            colors: ['silver', 'silver', 'silver', 'silver'],
                        }}
                    />
                </Stack.Item>
            </Stack>
        );
    }
    handleToggleClick = (board) => () => {

        let opened = this.state.opened;
        opened[board] = !this.state.opened[board];
        this.setState({opened:opened});
    }
    handlePrevClick = () => {
        //console.log("handlePrevClick");

    }

    handleNextClick = (value) => {
        //console.log("handleNextClick", value);

    }


}
export default Dashboard;
