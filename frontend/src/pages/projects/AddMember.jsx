import React, { useEffect, useState } from "react";
import { Button, Checkbox, Form, message, Modal, Select } from "antd";
import { FaPlus } from "react-icons/fa6";
import projectApi from "../../api/project";
import pipelineApi from "../../api/pipeline";
import { useParams } from "react-router-dom";
const AddMember = ({refresh}) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [pipelines, setPipelines] = useState([]);

  const params = useParams();
  const projectName = params.projectName;
  const fetchUsers = async () => {
    const response = await projectApi.getUsersNotInProject(projectName);
    setUsers(response.map((item) => ({ ...item, label: item.username, value: item.id})));
  }
  useEffect(() => {
    const fetchPipelines = async () => {
      const response = await pipelineApi.getPipelinesByProjectName(projectName);
      setPipelines(response.map((item) => ({...item, label: item.name, value: item.id})));
    }
    fetchPipelines();
  }, []);

  const onAddMember = (values) => {
    const addMember = async () => {
      setLoading(true);
      try {
        await projectApi.addMember({...values, projectName});
        setOpen(false);
        message.success("Add member successfully");
        refresh();
      } catch (error) {
        message.error("Failed to add member");
      } finally {
        setLoading(false);
      }
    };
    addMember();
  };
  return (
    <>
      <Button type="primary" icon={<FaPlus />} onClick={() => setOpen(true)}>
          Add member
      </Button>
      <Modal
        title="Add member to project"
        open={open}
        okText="Add"
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        destroyOnClose
        okButtonProps={{
          autoFocus: true,
          htmlType: 'submit',
        }}
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            name="form_in_modal"
            clearOnDestroy
            onFinish={(values) => onAddMember(values)}
          >
            {dom}
          </Form>
        )}
      >
        <Form.Item
          name="userId"
          label="User"
          rules={[
            {
              required: true,
              message: 'Please select user!',
            },
          ]}
        >
          <Select options={users} onFocus={() => fetchUsers()} optionRender={(optionData) => optionItem(optionData.data)}/>
        </Form.Item>
        <Form.Item name="pipelineIds" label="Pipelines">
          <Select mode="multiple" options={pipelines} />
        </Form.Item>
        <Form.Item name="isAdmin" valuePropName="checked">
          <Checkbox>Admin</Checkbox>
        </Form.Item>
      </Modal>
    </>
  );
};

const optionItem = (item) => {
  return (
    <div style={{
      padding: '4px',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div>{item.username}</div>
      <div>{item.fullname}</div>
    </div>
  );
};
export default AddMember;
