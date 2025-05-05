import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { Switch, theme, Typography } from 'antd'
import { Header } from 'antd/es/layout/layout'
import React from 'react'
import Notification from './Notification'
import UserDropdown from './UserDropdown'

function MyHeader({setDarkMode}) {
  const {
    token: { colorBgContainer, borderRadiusLG, colorBorder },
  } = theme.useToken();
  return (
    <Header
        style={{
          background: colorBgContainer,
          position: "sticky",
          top: 0,
          zIndex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography.Title level={2} style={{ margin: 0 }}>
          SBOM Management
        </Typography.Title>
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <Switch
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined style={{color: "yellow"}} />}
            onChange={(checked) => setDarkMode(checked)}
          />
          <Notification />
          <UserDropdown />
        </div>
      </Header>
  )
}

export default MyHeader