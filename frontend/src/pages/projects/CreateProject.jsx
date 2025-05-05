import React, { useState } from "react";
import { Button, Form, Input, message, Modal } from "antd";
import { FaPlus } from "react-icons/fa6";
import projectApi from "../../api/project";
const CreateProject = ({refresh}) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const onCreate = (values) => {
    const create = async () => {
      setLoading(true);
      try {
        await projectApi.createProject(values);
        setOpen(false);
        message.success("Project created successfully");
        refresh();
      } catch (error) {
        message.error("Failed to create project");
      } finally {
        setLoading(false);
      }
    };
    create();
  };
  return (
    <>
      <Button type="primary" icon={<FaPlus />} onClick={() => setOpen(true)}>
          Create
        </Button>
      <Modal
        title="Create new project"
        open={open}
        okText="Create"
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
            onFinish={(values) => onCreate(values)}
          >
            {dom}
          </Form>
        )}
      >
        <Form.Item
          name="name"
          label="Project Name"
          rules={[
            {
              required: true,
              message: 'Please input the name of project!',
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input type="textarea" />
        </Form.Item>
      </Modal>
    </>
  );
};
export default CreateProject;
