import React from 'react';
import {
  Banner,
  List
} from '@shopify/polaris';
import CsI18n from "../../components/csI18n";

export const ErrorType = {
  NETWORK: 1,
  INVALID_PARAM: 2,
  NORMAL: 3,
  TIMEOUT: 4,
  CUSTOM: 5,
}


export default class CsErrorMessage extends React.Component{

  constructor(props) {
    super(props);
  }

  render(){
    let {errorType, errorTitle, errorMessage} = this.props;

    switch( errorType ) {
      case ErrorType.NETWORK:
        errorTitle = CsI18n.t("Unknown error");
        break;
      case ErrorType.INVALID_PARAM:
        errorTitle = CsI18n.t("Error");
        break;
      case ErrorType.TIMEOUT:
        errorTitle = CsI18n.t("Timed Out");
        break;
    }

    if(errorMessage && Array.isArray(errorMessage) && errorMessage.length > 0) {
      return(
          <Banner
              title={errorTitle}
              status="critical"
          >
            <List type="bullet">
              {errorMessage.map((item, index) => {
                return <List.Item key={`error-line${index}`}>
                  {item}
                </List.Item>
              })}
            </List>
          </Banner>
      )
    } else if (errorMessage) {
      return(
          <Banner
              title={errorTitle}
              status="critical"
          >
            {errorMessage}
          </Banner>
      )
    } else if (errorTitle) {
      return <Banner
          title={errorTitle}
          status="critical"
      />
    } else {
      return null;
    }
  }
}

CsErrorMessage.defaultProps = {
  errorType: ErrorType.NORMAL,
  errorMessage: "",
}
