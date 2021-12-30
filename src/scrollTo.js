import React from "react";

import {
  Button,
} from '@shopify/polaris';
import {ArrowUpMinor} from "@shopify/polaris-icons";

export class ScrollToButton extends React.Component{
  constructor(props){
    super(props);

    this.state = {
      intervalId: 0,
      view: false,
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = (e) => {

    if(window.pageYOffset > 300){
      if(this.state.view === false){
        this.setState({view: true});
      }
    }else{
      if(this.state.view === true){
        this.setState({view: false});
      }
    }
  }

  scrollStep = () =>{

    if(window.pageYOffset === 0){
      clearInterval(this.state.intervalId);
    }

    window.scroll(0, window.pageYOffset - this.props.scrollStepInPx);
  }

  scrollToTop = () => {

    /*let intervalId = setInterval(this.scrollStep.bind(this),
      this.props.delayInMs);
    this.setState({intervalId: intervalId});*/
    window.scrollTo(0, 0);
  }

  render(){

    if(this.state.view === false){
      return ''
    }else{
      return (
        <div className="scroll-to-top">
          <Button icon={ArrowUpMinor} onClick={this.scrollToTop}></Button>
        </div>
      )
    }
  }

}
