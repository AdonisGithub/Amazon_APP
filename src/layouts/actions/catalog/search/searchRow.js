import React from 'react';
import {
  Icon,
  Stack,
  TextStyle,
  Link,
  Tooltip, Checkbox, RadioButton
} from "@shopify/polaris";
import {ChevronDownMinor, ChevronUpMinor, ViewMinor} from "@shopify/polaris-icons";
import "../../actions.scss"
import CsI18n from "../../../../components/csI18n"
import CsImageModal from "../../../../components/csImageModal";
import CsNoImage from "../../../../components/csNoImage";

// action type
const ACTION_CHECK = 1;
const ACTION_RADIO = 2;
const ACTION_REMOVE = 3;

export default class SearchRow extends React.Component{

  state = {
    opened: true,
    show:[],
    activeImageModalIndex: "",
  }
  constructor(props){
    super(props);
  }

  handleChangeChecked = (value) => {
    this.props.onChange(ACTION_CHECK, value);
  }

  handleToggleClick = () => {
    /*this.setState(({opened}) => {opened : !opened});*/
    this.state.opened = !this.state.opened;
    this.setState({opened: this.state.opened});
  }

  handleRemoveMatch = (index) => () => {

    if(index === this.props.radio){
      for(let key in this.props.item.result){
        if(this.state.show.indexOf(parseInt(key)) === -1 && index !== parseInt(key)){
          this.props.onChange(ACTION_REMOVE, parseInt(key));
          break;
        }
      }
    }
    this.setState({show: [...this.state.show, index]})
  }

  handleChangeRadioChecked = (index) => () => {
    this.props.onChange(ACTION_RADIO ,index);
  }

  handleImageModal = (id) => () => {
    this.setState({activeImageModalIndex: id});
  }

  render(){
    console.log(this.props);
    const {source, result} = this.props.item;

    let amazon_result = result.map((res, index) => {
      let link = 'https://'+this.props.marketplaceInfo.DomainName+'/dp/'+res.asin;

      if(this.state.show.indexOf(parseInt(index)) !== -1 ||
        this.props.checked === true && this.props.radio !== parseInt(index) ||
        this.props.disable === true && this.props.radio !== parseInt(index)){
        return '';
      }
      return (
          <Stack.Item key={link + index}>
            {result.length === 1 || this.state.show.length === result.length - 1 || this.props.checked === true && this.props.radio === parseInt(index) ||
              this.props.disable === true && this.props.radio === parseInt(index) ? '' :
              <div className="shopify">
                <Stack vertical alignment="center">
                  <Stack.Item>
                    <a className="show" onClick={this.handleRemoveMatch(parseInt(index))}>&#10006;</a>
                  </Stack.Item>
                </Stack>
              </div>
            }
              <div className="amazon">
                <Stack wrap={false} spacing="tight">
                  <Stack.Item>
                    <RadioButton
                      checked={this.props.radio === parseInt(index)}
                      onChange={this.handleChangeRadioChecked(index)}
                    />
                  </Stack.Item>
                  <Stack.Item>
                    {res.image_url ?
                        <CsImageModal
                            title={res.name}
                            size="large"
                            alt={res.name}
                            source={res.image_url}
                            source_large={res.large_image_url}
                            active={this.state.activeImageModalIndex == res.image_url}
                            onToggle={this.handleImageModal(res.image_url)}
                        />
                        :
                        <CsNoImage alt={res.name}/>
                    }
                  </Stack.Item>
                  <Stack.Item >
                    <div className="display-link">
                      <Stack vertical spacing="extraTight">
                        <Stack.Item>
                          <TextStyle variation="strong">{res.name}</TextStyle>
                        </Stack.Item>
                        <Stack.Item>
                          <Stack spacing="tight">
                            <Stack.Item><TextStyle>{res.brand + " | " + res.asin}</TextStyle></Stack.Item>
                            <Stack.Item><Tooltip content={CsI18n.t("View on Amazon")} preferredPosition="above"><a
                              href={link} target="_blank"><Icon
                              source={ViewMinor}
                              color="inkLighter"/></a>
                            </Tooltip></Stack.Item>
                          </Stack>
                        </Stack.Item>
                      </Stack>
                    </div>
                  </Stack.Item>
                </Stack>
              </div>
          </Stack.Item>
      )
    })



    return(
        <Stack spacing={"loose"} wrap={false}>
          <Stack.Item>{
            <Checkbox
              disabled={this.props.disable === true}
              checked={this.props.checked === true}
              onChange={this.handleChangeChecked}/>
          }</Stack.Item>
          <Stack.Item fill>
            <Stack vertical>
              <Stack.Item>
                <div className="shopify">
                    <Stack spacing="tight" wrap={false}>
                      <Stack.Item>
                        {source.shopify_image_url ?
                            <CsImageModal
                                title={source.title}
                                size="large"
                                alt={source.title}
                                source={source.shopify_image_url}
                                active={this.state.activeImageModalIndex == source.shopify_image_url}
                                onToggle={this.handleImageModal(source.shopify_image_url)}
                            />
                            :
                            <CsNoImage alt={source.title}/>
                        }
                      </Stack.Item>
                      <Stack.Item fill>
                        <Stack vertical spacing="tight">
                          <Stack.Item>
                            <TextStyle variation="strong">{source.title}</TextStyle>
                          </Stack.Item>
                          <Stack.Item>
                            <TextStyle>{source.vendor + " | " + source.sku}</TextStyle>
                          </Stack.Item>
                        </Stack>
                      </Stack.Item>
                    </Stack>
                </div>
              <div className="amazon">
                <div className="toggle">
                    <div className="expand-search-result">
                      <Link onClick={this.handleToggleClick}>
                        <Stack.Item>
                          <Icon source={this.state.opened ? ChevronUpMinor : ChevronDownMinor}/>
                        </Stack.Item>
                      </Link>
                    </div>
                </div>
              </div>
              </Stack.Item>
              {this.state.opened === true ? amazon_result : ''}
            </Stack>
          </Stack.Item>
        </Stack>
    );
  }

}


