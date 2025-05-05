import { Button, Dropdown, Input, Modal, Form, message } from "antd";
import React, { useEffect, useState } from "react";
import {
  FaArrowRightFromBracket,
  FaKey,
  FaRegCircleUser,
  FaRegIdCard,
} from "react-icons/fa6";
import meApi from "../../api/me";

function UserDropdown() {
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [user, setUser] = useState({});
  useEffect(() => {
    const fetchUser = async () => {
      const response = await meApi.getProfile();
      setUser(response);
    };
    fetchUser();
  }, []);
  const handleMenuClick = (e) => {
    if (e.key === "logout") {
      localStorage.removeItem("jwt");
      window.location.href = "/login";
    } else if (e.key === "change-password") {
      setOpenChangePassword(true);
    } else if (e.key === "profile") {
      setOpenProfile(true);
    }
  };

  const dropdownItem = [
    {
      label: "Profile",
      icon: <FaRegIdCard />,
      key: "profile",
    },
    {
      label: "Change Password",
      icon: <FaKey />,
      key: "change-password",
    },
    {
      label: "Logout",
      icon: <FaArrowRightFromBracket />,
      key: "logout",
    },
  ];
  const dropdownMenu = {
    items: dropdownItem,
    onClick: handleMenuClick,
  };
  return (
    <>
      <Dropdown trigger={["click"]} menu={dropdownMenu}>
        <Button type="text" icon={<FaRegCircleUser size={24} />} />
      </Dropdown>
      <Profile open={openProfile} setOpen={setOpenProfile} user={user} />
      <ChangePassword
        open={openChangePassword}
        setOpen={setOpenChangePassword}
      />
    </>
  );
}

function Profile({ open, setOpen, user }) {
  const [form] = Form.useForm();
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const onOk = (values) => {
    const updateProfile = async () => {
      setLoading(true);
      try {
        await meApi.updateProfile(values);
        setOpen(false);
        message.success("Update profile successfully");
      } catch (error) {
        message.error("Failed to update profile");
      } finally {
        setLoading(false);
      }
    };
    updateProfile();
  };
  return (
    <Modal
      title="Update Profile"
      open={open}
      okText={disabled ? "Edit" : "Update"}
      confirmLoading={loading}
      onCancel={() => setOpen(false)}
      onOk={() => setDisabled(!disabled)}
      destroyOnClose
      okButtonProps={{
        autoFocus: true,
        htmlType: "submit",
      }}
      modalRender={(dom) => (
        <Form
          layout="vertical"
          form={form}
          name="update_profile"
          onFinish={(values) => onOk(values)}
          initialValues={user}
          disabled={disabled}
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
            message: "Please input the username!",
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="fullname"
        label="Fullname"
        rules={[
          {
            required: true,
            message: "Please input the fullname!",
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="email"
        label="Email"
        rules={[
          {
            required: true,
            message: "Please input the email!",
          }
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="phoneNumber"
        label="Phone Number"
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="Description"
      >
        <Input.TextArea />
      </Form.Item>
    </Modal>
  );
}

function ChangePassword({ open, setOpen }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isPasswordMatch, setIsPasswordMatch] = useState(false);
  const onOk = (values) => {
    const changePassword = async () => {
      setLoading(true);
      try {
        await meApi.changePassword(values);
        setOpen(false);
        message.success("Change password successfully");
      } catch (error) {
        message.error("Failed to change password");
      } finally {
        setLoading(false);
      }
    };
    changePassword();
  };

  const validateConfirmPassword = (_, value) => {
    if (!value || form.getFieldValue('newPassword') === value) {
      setIsPasswordMatch(true);
      return Promise.resolve();
    }
    setIsPasswordMatch(false);
    return Promise.reject(new Error('The two passwords do not match!'));
  };
  return (
    <Modal
      title="Change Password"
      open={open}
      okText="Ok"
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
          onFinish={(values) => onOk(values)}
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        name="oldPassword"
        label="Password"
        rules={[
          {
            required: true,
            message: "Please input the current password!",
          },
        ]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        name="newPassword"
        label="New Password"
        rules={[
          {
            required: true,
            message: "Please input the new password!",
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
  );
}

export default UserDropdown;
