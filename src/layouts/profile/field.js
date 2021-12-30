import React from 'react';
import {Badge, Select, Stack} from '@shopify/polaris'

export class Field extends React.Component{

  constructor(props){
    super(props)
  }

  render(){
    const {label, options} = this.props.field;
    let type;

    if(this.props.type === 'Variant'){
      type = <Badge>{this.props.type}</Badge>
    }else if(this.props.type === 'Required'){
      type = <Badge status="warning">{this.props.type}</Badge>
    }else if(this.props.type === 'Recommended') {
      type = <Badge status="attention">{this.props.type}</Badge>
    }else if(this.props.type === 'Featured'){
      type = <Badge status="success">{this.props.type}</Badge>
    }
    return(
      <Stack>
        <Stack.Item><div className="profile-header-key">{label}</div></Stack.Item>
        <Stack.Item>
          <div style={{width: '300px'}}>
            <Select
              options={options}
            />
          </div>
        </Stack.Item>
        <Stack.Item>
          {type}
        </Stack.Item>
      </Stack>
    )
  }
}