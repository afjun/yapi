import React, { Component } from 'react'
import { connect } from 'react-redux';
import PropTypes from 'prop-types'
import { fetchInterfaceList, fetchInterfaceData, deleteInterfaceData, deleteInterfaceCatData, initInterface } from '../../../../reducer/modules/interface.js';
import { Menu, Input, Icon, Tag, Modal, message, Tree, Dropdown } from 'antd';
import AddInterfaceForm from './AddInterfaceForm';
import AddInterfaceCatForm from './AddInterfaceCatForm';
import axios from 'axios'
import { Link, withRouter } from 'react-router-dom';

const confirm = Modal.confirm;
const TreeNode = Tree.TreeNode;


@connect(
  state => {
    return {
      list: state.inter.list,
      inter: state.inter.curdata,
      curProject: state.project.currProject
    }
  },
  {
    fetchInterfaceList,
    fetchInterfaceData,
    deleteInterfaceCatData,
    deleteInterfaceData,
    initInterface
  }
)
class InterfaceMenu extends Component {
  static propTypes = {
    match: PropTypes.object,
    inter: PropTypes.object,
    projectId: PropTypes.string,
    list: PropTypes.array,
    fetchInterfaceList: PropTypes.func,
    curProject: PropTypes.object,
    fetchInterfaceData: PropTypes.func,
    addInterfaceData: PropTypes.func,
    deleteInterfaceData: PropTypes.func,
    initInterface: PropTypes.func,
    history: PropTypes.object,
    router: PropTypes.object
  }

  /**
   * @param {String} key 
   */
  changeModal = (key, status) => {
    //visible add_cat_modal_visible change_cat_modal_visible del_cat_modal_visible
    let newState = {}
    newState[key] = status
    this.setState(newState);
  }

  handleCancel = () => {
    this.setState({
      visible: false
    });
  }

  constructor(props) {
    super(props)
    this.state = {
      curKey: null,
      visible: false,
      delIcon: null,
      curCatid: null,
      add_cat_modal_visible: false,
      change_cat_modal_visible: false,
      del_cat_modal_visible: false,
      curCatdata: {}
    }
  }

  async handleRequest() {
    this.props.initInterface()
    await this.props.fetchInterfaceList(this.props.projectId);
  }

  componentWillMount() {
    this.handleRequest()
  }



  onSelect = (selectedKeys) => {
    const {history, match} = this.props;
    let curkey = selectedKeys[0];
    if(!curkey || !selectedKeys) return false;
    let basepath = "/project/" + match.params.id + "/interface/api";
    if(curkey === 'root'){
      history.push(basepath)
    }else{
      history.push(basepath + '/' + curkey)
    }
  }

  handleAddInterface = (data) => {
    data.project_id = this.props.projectId;
    axios.post('/api/interface/add', data).then((res) => {
      if (res.data.errcode !== 0) {
        return message.error(res.data.errmsg);
      }
      message.success('接口添加成功')
      this.props.fetchInterfaceList(this.props.projectId)
      this.setState({
        visible: false
      });

    })
  }

  handleAddInterfaceCat = (data) => {
    data.project_id = this.props.projectId;
    axios.post('/api/interface/add_cat', data).then((res) => {
      if (res.data.errcode !== 0) {
        return message.error(res.data.errmsg);
      }
      message.success('接口分类添加成功')
      this.props.fetchInterfaceList(this.props.projectId)
      this.setState({
        add_cat_modal_visible: false
      });

    })
  }

  handleChangeInterfaceCat = (data) => {

    let params = {
      catid: this.state.curCatdata._id,
      name: data.name
    }

    axios.post('/api/interface/up_cat', params).then((res) => {
      if (res.data.errcode !== 0) {
        return message.error(res.data.errmsg);
      }
      message.success('接口分类更新成功')
      this.props.fetchInterfaceList(this.props.projectId)
      this.setState({
        change_cat_modal_visible: false
      });

    })
  }

  showConfirm = (id) => {
    let that = this;
    const ref = confirm({
      title: '您确认删除此接口',
      content: '温馨提示：接口删除后，无法恢复',
      async onOk() {
        await that.props.deleteInterfaceData(id, that.props.projectId)
        await that.props.fetchInterfaceList(that.props.projectId)
        that.props.history.push('/project/' + that.props.match.params.id + '/interface/api')
        ref.destroy()
      },
      async onCancel() { 
        ref.destroy()
      }
    });
  }

  showDelCatConfirm = (catid) => {
    let that = this;
    const ref = confirm({
      title: '您确认删除此接口分类',
      content: '温馨提示：该操作会删除该分类下所有接口，接口删除后无法恢复',
      async onOk() {
        await that.props.deleteInterfaceCatData(catid, that.props.projectId)
        await that.props.fetchInterfaceList(that.props.projectId)
        that.props.history.push('/project/' + that.props.match.params.id + '/interface/api')
        ref.destroy()
      },
      onCancel() { }
    });
  }

  enterItem = (id) => {
    this.setState({ delIcon: id })
  }

  leaveItem = () => {
    this.setState({ delIcon: null })
  }

  onFilter = (e) => {
    this.setState({
      filter: e.target.value
    })
  }



  render() {
    const matchParams = this.props.match.params;

    const item_interface_create = (item) => {
      let color, filter = this.state.filter;
      if (filter && item.title.indexOf(filter) === -1 && item.path.indexOf(filter) === -1) {
        return null;
      }
      switch (item.method) {
        case 'GET': color = "green"; break;
        case 'POST': color = "blue"; break;
        case 'PUT': color = "yellow"; break;
        case 'DELETE': color = 'red'; break;
        default: color = "green";
      }
      return <TreeNode
        title={<div onMouseEnter={() => this.enterItem(item._id)} onMouseLeave={this.leaveItem} >
          <Link className="interface-item" to={"/project/" + matchParams.id + "/interface/api/" + item._id} ><Tag color={color} className="btn-http" >{item.method}</Tag>{item.title}</Link>
          <Icon type='delete' className="interface-delete-icon" onClick={() => { this.showConfirm(item._id) }} style={{ display: this.state.delIcon == item._id ? 'block' : 'none' }} />
        </div>}
        key={'' + item._id} />

    }

    const menu = (item) => {
      return <Menu>
        <Menu.Item>
          <span onClick={() => {
            this.changeModal('visible', true);
            this.setState({
              curCatid: item._id
            })
          }}>添加接口</span>
        </Menu.Item>
        <Menu.Item>
          <span onClick={() => {
            this.changeModal('change_cat_modal_visible', true);
            this.setState({
              curCatdata: item
            })
          }}>修改分类</span>
        </Menu.Item>
        <Menu.Item>
          <span onClick={() => {
            this.showDelCatConfirm(item._id)
          }}>删除分类</span>
        </Menu.Item>
      </Menu>
    };

    const defaultExpandedKeys = ()=>{
      const {router, inter, list} = this.props, rNull = {expands: [], selects: []};
      if(list.length === 0) return rNull;
      if(router){
        if(!isNaN(router.params.actionId)){
          let _actionId = parseInt(router.params.actionId, 10)
          if(!inter._id || inter._id !== _actionId)return rNull;
          return {
            expands: ['cat_' + inter.catid],
            selects: [inter._id+""]
          }
        }else{
          let catid = router.params.actionId.substr(4);
          return {
            expands: ['cat_' + catid],
            selects: ['cat_' + catid]
          }
        }
      }else{
        return {
          expands: ['cat_' + list[0]._id],
          selects: ['root']
        }
      }
    }

    const currentKes = defaultExpandedKeys();

    return <div>
      <div className="interface-filter">
        <Input onChange={this.onFilter} value={this.state.filter} placeholder="Filter by name" style={{ width: "70%" }} />
        <Tag color="#108ee9" style={{ marginLeft: "15px" }} ><Icon type="plus" onClick={() => this.changeModal('add_cat_modal_visible', true)} /></Tag>
        <Modal
          title="添加接口"
          visible={this.state.visible}
          footer={null}
        >
          <AddInterfaceForm catid={this.state.curCatid} onCancel={() => this.changeModal('visible', false)} onSubmit={this.handleAddInterface} />
        </Modal>

        <Modal
          title="添加分类"
          visible={this.state.add_cat_modal_visible}
          footer={null}
        >
          <AddInterfaceCatForm onCancel={() => this.changeModal('add_cat_modal_visible', false)} onSubmit={this.handleAddInterfaceCat} />
        </Modal>

        <Modal
          title="修改分类"
          visible={this.state.change_cat_modal_visible}
          footer={null}
        >
          <AddInterfaceCatForm catdata={this.state.curCatdata} onCancel={() => this.changeModal('change_cat_modal_visible', false)} onSubmit={this.handleChangeInterfaceCat} />
        </Modal>
      </div>
      {this.props.list.length > 0 ?
        <Tree
          className="interface-list"
          defaultExpandedKeys={currentKes.expands}
          defaultSelectedKeys={currentKes.selects}
          onSelect={this.onSelect}
        >
          <TreeNode title={<Link style={{ fontSize: '14px' }} to={"/project/" + matchParams.id + "/interface/api"}><Icon type="folder-open" style={{ marginRight: 5 }} />全部接口</Link>} key="root" />
          {this.props.list.map((item) => {
            return <TreeNode title={<div>
              <Link className="interface-item" to={"/project/" + matchParams.id + "/interface/api/cat_" + item._id} ><Icon type="folder-open" style={{ marginRight: 5 }} />{item.name}</Link>
              <Dropdown overlay={menu(item)}>
                <Icon type='bars' className="interface-delete-icon" />
              </Dropdown>
            </div>} key={'cat_' + item._id} >
              {item.list.map(item_interface_create)}

            </TreeNode>
          })}



        </Tree>
        : null}
    </div>

  }
}

export default withRouter(InterfaceMenu)