import React from 'react'
import {
  Popover,
  TextField,
  Tag,
} from '@shopify/polaris';

import {Tree} from 'antd';
import "./csTreeComponent.css"
import Util from "../../helpers/Util";

const TreeNode = Tree.TreeNode;

export default class CsTreeComponent extends React.Component {

  state = {
    treeData: [],              // categories
    searchValue: '',           // search value
    active: false,
    loading: false,
    selectedKeys: [],
    selectedNodes: [],
    expandedKeys:[],
  }

  constructor(props) {
    super(props);
    this.handleSelectItem = this.handleSelectItem.bind(this);
    this.handleExpand = this.handleExpand.bind(this);
    this.update = false;
    this.filteredTreeData = [];      // searched categories
    if(props.data && props.data.children){
      this.state.treeData = props.data.children;
    }

    this.state.selectedKeys = props.selected;
    this.state.selectedNodes = props.selectedNodes;
  }

  componentWillReceiveProps(nextProps, nextContext) {
    this.state.selectedNodes = nextProps.selectedNodes;
  }

  onLoadData = (treeNode) => {
    let value = treeNode.props.eventKey;
    return new Promise(resolve => {
      if (treeNode.props.children) {
        resolve();
        /*return;*/
      }
      /*this.setState({loading: true})*/
      this.props.onClickNext(value, (treeData) => {
        this.setState({treeData:treeData})
        resolve();
      });
    })
  }

  togglePopover = () => {
    
    if (!this.state.loading && !this.update) {
      this.setState({active: false})
    }
    this.update = false;
  }

  handleTextChange = (value) => {

    this.setState({searchValue: value});
  }

  handleFocused = () => {
    //console.log("onfocus")
    this.setState({active: true})
  }

  handleSelectItem(value, info) {
    let {active} = this.state;
    if(value.length > this.props.limit){
      value.shift();
    }
    if(this.props.close && value.length === this.props.limit){
      active = false;
    }
    this.props.onChange(value);
    this.setState({
      selectedKeys: value,
      active: active,
    });
  }

  handleExpand(value){
    
    setTimeout(() => {
      this.setState({active:true})
    }, 100)
    this.setState({expandedKeys: value});
    this.update = true;
  }

  handleTagRemove = (key) => () => {

    let index = this.state.selectedKeys.indexOf(key);
    //
    this.state.selectedKeys.splice(index, 1);
    this.props.onChange(this.state.selectedKeys);
    this.setState({selectedKeys: [...this.state.selectedKeys]})
    this.update = true;

  }

  initTreeData() {
    //

    let tempItem = Util.clone(this.state.treeData);
    let value = this.state.searchValue;
    let treeData = tempItem.filter(item => {
      if(item.children && item.children.length > 0){
        return this.getItems(item, value) !== null
      }else{
        /*if(this.state.searchValue !== "") item.has_children = "0";*/
        return item.label.toLowerCase().indexOf(value.toLowerCase()) !== -1
      }
    })
    this.filteredTreeData = treeData;
  }

  getItems = (item, value) => {
    let items = [];

    item.children.map((child, index) => {
      if (child.children && child.children.length > 0) {
        if (this.getItems(child, value) !== null) {
          items.push(child);
        }
      }else{
        if(child.label.toLowerCase().indexOf(value.toLowerCase()) !== -1){
          items.push(child);
        }
      }
    })
    if(items.length > 0){
      return item;
    }else{
      return null;
    }
  }

  renderTreeNodes = (data) => {
    //
    return data.map((item) => {
      if (item.children) {
        return (
          <TreeNode title={item.label} key={item.value} dataRef={item} selectable={false} isLeaf={item.has_children !== "1"}>
            {this.renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode title={item.label} key={item.value} dataRef={item} isLeaf={item.has_children !== "1"} selectable={item.has_children == "1" ? false : true}></TreeNode>;
    });
  }

  renderCategoryTags(){

    return this.state.selectedNodes.map(node => {
      return <Tag key={node.value} onRemove={this.handleTagRemove(node.value)}>{node.label}</Tag>
    })
  }

  render() {
    
    this.initTreeData();
    const activator = (
      <div className="textField">
        <TextField
          value={this.state.searchValue}
          onChange={this.handleTextChange}
          autoComplete={false}
          onFocus={this.handleFocused}
        />
      </div>
    );

    return (
      <div>
        <div className="csTreeComponent-tag">
        {this.renderCategoryTags()}
        </div>
        <div className="csTreeComponent-popover">
          <Popover
            fullWidth
            fullHeight
            active={this.state.active}
            activator={activator}
            onClose={this.togglePopover}
          >
            <Tree
              multiple
              selectedKeys={this.state.selectedKeys}
              expandedKeys={this.state.expandedKeys}
              onSelect={this.handleSelectItem}
              onExpand={this.handleExpand}
              loadData={this.onLoadData}>
              {this.renderTreeNodes(this.filteredTreeData)}
            </Tree>
          </Popover>
        </div>
      </div>

    );
  }

}

