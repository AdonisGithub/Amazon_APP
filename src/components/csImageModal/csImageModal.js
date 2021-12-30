import React from 'react';
import {
  Popover, Thumbnail, Button, Modal, Stack, Icon, Spinner

} from '@shopify/polaris';

import {
  MobileCancelMajorMonotone
} from '@shopify/polaris-icons';
import CsI18n from "../csI18n/csI18n";
import CsNoImage from "../csNoImage";

export default class CsImageModal extends React.Component{

  static last_active_obj = null;
  state = {
    active: false,
    loaded: false,
    loaded_large: false,
    source: null,
    source_large: null,
  }
  static defaultProps = {
    size: "large",
    alt: '',
  }
  constructor(props) {
    super(props);
    let {source, source_large} = props;
    if(!source_large) {
      source_large = source;
    }
    this.state.source = source;
    this.state.source_large = source_large;

    this.loadImage(source, source_large);
  }

  componentWillMount()
  {
    require('./csImageModal.css');
  }

  componentWillUnmount() {
    if( CsImageModal.last_active_obj === this ) {
      CsImageModal.last_active_obj = null;
    }
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if( !nextProps.active && this.state.active) {
      // console.log("componentWillReceiveProps", nextProps.source, nextProps.active);
      this.setState({active: false});
    } else {
      if( nextProps.active ) {
        // console.log("componentWillReceiveProps", nextProps.source, nextProps.active);
      }
    }
    // console.log("componentWillReceiveProps", nextProps);
    let {source, source_large} = this.state;
    let {source: new_source, source_large: new_source_large} = nextProps;
    if( source != new_source ) {
      if(!new_source_large) {
        new_source_large = new_source;
      }
      this.setState({active: false, loaded: false, loaded_large: false, source: new_source, source_large: new_source_large});
      this.loadImage(new_source, new_source_large);
    }
  }

  toggleModal = () => {
    // console.log("toggleModal", this.props.source);
    this.setState({active: true});
    let {onToggle} = this.props;
    if( onToggle ) {
      onToggle();
    }
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if( this.state.active ) {
      if( CsImageModal.last_active_obj !== this ) {
        if( CsImageModal.last_active_obj ) {
          CsImageModal.last_active_obj.handleClose();
        }
        CsImageModal.last_active_obj = this;
      }
    }
  }

  handleClose = () => {
    this.setState({active: false});
  }

  loadImage(image_url1, image_url2) {
    this.img1 = new Image();
    this.img1.src = image_url1;
    this.img1.onload = () => {
      let updated = {};
      if(image_url1 == image_url2) {
        updated = {loaded: true, loaded_large: true};
      } else {
        updated = {loaded: true};
      }

      this.setState(updated);
    }

    if(image_url1 != image_url2) {
      this.img2 = new Image();
      this.img2.src = image_url2;
      this.img2.onload = () => {
        this.setState({loaded_large: true});
      }
    }
  }

  render(){
    let {loaded, loaded_large, source, source_large} = this.state;
    // console.log("render", loaded, loaded_large, source, source_large);
    if(!source_large) {
      source_large = source;
    }
    let {size} = this.props;

    let imageRender = '';

    if(loaded && loaded_large) {
      imageRender = (
          <a onClick={this.toggleModal}><Thumbnail
              alt={this.props.alt}
              source={source}
              size={size}
          /></a>
      );
    } else {
      imageRender = <Stack><div className={`thumbnail-loading thumbnail-loading--${size}`}><Spinner color={"teal"} size={"small"}/></div></Stack>;
    }

    return (
      <div className="cs-image-modal">
        <div style={{display: 'none'}}>
          <img src={source_large} alt={this.props.alt} />
        </div>

        <div className="cs-image-modal-popover">
          <Popover
              active={this.state.active}
              activator={imageRender}
              onClose={this.handleClose}
          >
              <div className="cs-image-popover-close" onClick={this.handleClose}><Icon source={MobileCancelMajorMonotone} /></div>
              <img className="cs-image-popover" src={source_large} alt={this.props.alt} />
          </Popover>
        </div>
        </div>
    );
  }
}
