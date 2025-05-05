import React, { useState } from "react";
import { Button, Form, Input, message, Modal } from "antd";
import { FaPlus } from "react-icons/fa6";
import userApi from "../../api/user";
const CreateUser = ({ refresh }) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPasswordMatch, setIsPasswordMatch] = useState(false);
  const validateConfirmPassword = (_, value) => {
    if (!value || form.getFieldValue("password") === value) {
      setIsPasswordMatch(true);
      return Promise.resolve();
    }
    setIsPasswordMatch(false);
    return Promise.reject(new Error("The two passwords do not match!"));
  };
  const onCreate = (values) => {
    const create = async () => {
      setLoading(true);
      try {
        await userApi.create(values);
        setOpen(false);
        message.success("User created successfully");
        refresh();
      } catch (error) {
        message.error("Failed to create user");
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
        title="Create new user"
        open={open}
        okText="Create"
        confirmLoading={loading}
        onCancel={() => setOpen(false)}
        destroyOnClose
        okButtonProps={{
          autoFocus: true,
          htmlType: "submit",
          disabled: !isPasswordMatch,
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
          name="username"
          label="Username"
          rules={[
            {
              required: true,
              message: "Please input username!",
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[
            {
              required: true,
              message: "Please input the password!",
            },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          rules={[
            {
              required: true,
              message: "Please input the confirm password!",
            },
            {
              validator: validateConfirmPassword,
            },
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Modal>
    </>
  );
};
export default CreateUser;
