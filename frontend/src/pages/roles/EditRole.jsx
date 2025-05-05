import React, { useState } from "react";
import { Button, Form, Input, message, Modal, Select } from "antd";
import { FaRegPenToSquare } from "react-icons/fa6";
import roleApi from "../../api/roles";
const EditRole = ({ refresh, role, permissionsOptions }) => {
  
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const onUpdate = (values) => {
    const update = async () => {
      setLoading(true);
      try {
        await roleApi.updateRole(role.id, values);
        setOpen(false);
        message.success("Role updated successfully");
        refresh();
      } catch (error) {
        message.error("Failed to update role");
      } finally {
        setLoading(false);
      }
    };
    update();
  };
  return (
    <>
      <Button
        type="text"
        icon={<FaRegPenToSquare color="green" />}
        onClick={() => setOpen(true)}
      />
      <Modal
        title="Update Role"
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
            initialValues={{ name: role.name, permissionIds: role.permissions.map(permission => permission.id) }}
            onFinish={(values) => onUpdate(values)}
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
              message: "Please input the name of role!",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="permissionIds" label="Permissions">
          <Select mode="multiple" options={permissionsOptions} />
        </Form.Item>
      </Modal>
    </>
  );
};
export default EditRole;
