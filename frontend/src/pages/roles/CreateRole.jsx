import React, { useState } from "react";
import { Button, Form, Input, message, Modal, Select } from "antd";
import { FaPlus } from "react-icons/fa6";
import roleApi from "../../api/roles";
const CreateRole = ({refresh, permissionsOptions}) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onCreate = (values) => {
    const create = async () => {
      setLoading(true);
      console.log(values);
      try {
        await roleApi.addRole(values);
        setOpen(false);
        message.success("Role created successfully");
        refresh();
      } catch (error) {
        message.error("Failed to create role");
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
        title="Create new role"
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
          label="Role Name"
          rules={[
            {
              required: true,
              message: 'Please input the name of role!',
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="permissionIds" label="Permissions">
          <Select mode="multiple" options={permissionsOptions}/>
        </Form.Item>
      </Modal>
    </>
  );
};
export default CreateRole;
