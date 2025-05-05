import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Checkbox,
  theme,
  Typography,
  message,
  Modal,
} from "antd";
import authApi from "../../api/auth";
import { useLocation, useNavigate } from "react-router-dom";

function Login() {
  const {
    token: { colorBgContainer, colorBgLayout, borderRadiusLG, paddingLG },
  } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/projects";
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      if (response.success && response.data && response.data.token) {
        localStorage.setItem("jwt", response.data.token);
        navigate(from, {replace: true});
      } else {
        message.error(response.message || "Invalid response from server");
      }
    } catch (error) {
      if(error.response?.data?.message === "User is disabled") {
        Modal.error({
          title: "Your account is disabled!",
          content: "Please contact the administrator to enable your account.",
        })
      } else {
        message.error("Login failed. Please check your credentials and try again.");
      }
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <div
      style={{
        background: colorBgLayout,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: colorBgContainer,
          padding: paddingLG,
          borderRadius: borderRadiusLG,
          width: "400px",
        }}
      >
        <Typography.Title level={2} style={{ textAlign: "center", marginBottom: "24px" }}>
          Login
        </Typography.Title>
        <Form
          name="login"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          layout="vertical"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Log in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default Login;
