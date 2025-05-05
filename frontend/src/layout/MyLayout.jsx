import React, { useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Breadcrumb,
  Layout,
  Menu,
  theme,
} from "antd";
import {
  ApartmentOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import { FaShieldHalved, FaScaleBalanced } from "react-icons/fa6";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import MyHeader from "./header/MyHeader";
import { isSysAdmin } from "../ultil";
const { Content, Footer, Sider } = Layout;

const createSidebarItems = () => {
  const sideBarItems = [
    {
      key: "0",
      label: "Dashboard",
      type: "group",
      children: [
        {
          key: "1",
          icon: <ProjectOutlined />,
          label: <NavLink to="/projects">Projects</NavLink>,
        },
        // {
        //   key: "2",
        //   icon: <ApartmentOutlined />,
        //   label: <NavLink to="/components">Components</NavLink>,
        // },
        {
          key: "3",
          icon: <FaShieldHalved />,
          label: <NavLink to="/vulnerabilities">Vulnerabilities</NavLink>,
        },
        {
          key: "4",
          icon: <FaScaleBalanced />,
          label: <NavLink to="/licenses">Licenses</NavLink>,
        },
      ],
    }
  ];
  if(isSysAdmin()) {
    sideBarItems.push({
      key: "5",
      label: "Administration",
      type: "group",
      children: [
        {
          key: "6",
          label: <Link to="/users">User Management</Link>,
        },
        {
          key: "7",
          label: <Link to="/roles">Role</Link>,
        },
        {
          key: "8",
          label: <Link to="/permissions">Permission</Link>,
        },
      ],
    })
  }
  return sideBarItems;
}

const MyLayout = ({ setDarkMode }) => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const navigate = useNavigate();
  const location = useLocation();
  const breadCrumdItems = location.pathname
    .split("/")
    .reduce((acc, item, index) => {
      if (index === 0) {
        return acc;
      }
      return [...acc, { title: item }];
    });

  const checkJwtValidity = () => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!checkJwtValidity()) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <Layout style={{minHeight: "100vh"}}>
      <MyHeader setDarkMode={setDarkMode} />
      <Layout>
        <Sider
          width={200}
          style={{
            background: colorBgContainer,
            position: "fixed",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <Menu
            mode="inline"
            defaultSelectedKeys={["1"]}
            style={{
              borderRight: 0,
            }}
            items={createSidebarItems()}
          />
        </Sider>
        <Layout
          style={{
            marginLeft: "200px",
            minHeight: "100%"
          }}
        >
          <Breadcrumb
            separator=">"
            items={breadCrumdItems}
            style={{
              margin: "16px 0 16px 16px",
            }}
          />
          <Content
            style={{
              padding: "0 48px",
            }}
          >
            <Outlet />
          </Content>
          <Footer
            style={{
              textAlign: "center"
            }}
          >
            ©{new Date().getFullYear()} Made by vinhdd
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};
export default MyLayout;
