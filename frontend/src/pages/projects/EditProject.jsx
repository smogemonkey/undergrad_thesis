import React, { useState } from "react";
import { Button, Form, Input, message, Modal } from "antd";
import projectApi from "../../api/project";
import { FaRegPenToSquare } from "react-icons/fa6";
const EditProject = ({ refresh, project }) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const onUpdate = (values) => {
    const update = async () => {
      setLoading(true);
      try {
        await projectApi.updateProject(project.id, values);
        setOpen(false);
        message.success("Project updated successfully");
        refresh();
      } catch (error) {
        message.error("Failed to update project");
      } finally {
        setLoading(false);
      }
    };
    update();
  };
  return (
    <>
      <Button type="text" icon={<FaRegPenToSquare color="green" />} onClick={() => setOpen(true)} />
      <Modal
        title="Edit project"
        open={open}
        okText="Ok"
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        destroyOnClose
        okButtonProps={{
          autoFocus: true,
          htmlType: "submit",
        }}
        modalRender={(dom) => (
          <Form
            layout="vertical"
            form={form}
            name="form_in_modal"
            initialValues={{name: project.name, description: project.description}}
            onFinish={(values) => onUpdate(values)}
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
              message: "Please input the name of project!",
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
export default EditProject;
