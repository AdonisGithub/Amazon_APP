/**
 * @author    Alexandre D.
 */

import React from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom";
import Informations from "./Informations";
import Cdiscount from "./Cdiscount";
import CdiscountFlux from "./CdiscountFlux";
import Connect from "./Connect";
import Support from "./Support";
import Parameters from "./Parameters";
import Order from "./Order";
import i18n from "./components/csI18n";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <Router>
                <div className="container">
                    <Route exact path="/connect" component={Connect} />
                    <Route exact path="/parameters" component={Parameters} />
                    <Route exact path="/support" component={Support} />
                    <Route exact path="/order" component={Order} />
                    {/*<Route exact path="/cdiscount_flux" component={CdiscountFlux} />
                    <Route exact path="/connect" component={Connect} />
                    <Route exact path="/support" component={Support} />*/}
                </div>
            </Router>
        );
    }
}

export default App;
