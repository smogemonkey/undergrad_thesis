import { theme, Typography } from 'antd';
import React from 'react'

function OverviewCard({title, value}) {
  const {token : {borderRadius, padding, colorBgContainer}} = theme.useToken();
  return (
    <div style={{
      borderRadius: borderRadius,
      padding: padding,
      background: colorBgContainer,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Typography.Title level={4} style={{margin: 0}}>{title}</Typography.Title>
      <Typography.Title level={2}>{value}</Typography.Title>
    </div>
  )
}

export default OverviewCard