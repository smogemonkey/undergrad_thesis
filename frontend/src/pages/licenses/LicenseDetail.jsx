import { Col, Row, theme, Typography } from "antd";
import React from "react";
import { FaRegCircleCheck, FaRegCircleXmark } from "react-icons/fa6";
import { useLoaderData } from "react-router-dom";
import licenseApi from "../../api/license";

export async function loader({params}) {
  const license = await licenseApi.getLicenseById(params.id);
  return { license };
}

function LicenseDetail() {
  const {
    token: { colorBgContainer, paddingLG, borderRadiusLG },
  } = theme.useToken();

  const {license} = useLoaderData();

  return (
    <div
      style={{
        background: colorBgContainer,
        padding: paddingLG,
        borderRadius: borderRadiusLG,
      }}
    >
      <Row gutter={[0, 8]}>
        <Col span={4}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            License Name:
          </Typography.Title>
        </Col>
        <Col span={20}>{license.name}</Col>
        <Col span={4}>
          <Typography.Title level={5} style={{margin: 0}}>SPDX License ID:</Typography.Title>
        </Col>
        <Col span={20}>{license.licenseId}</Col>
        <Col span={4}>
          <Typography.Title level={5} style={{margin: 0}}>OSI Approved:</Typography.Title>
        </Col>
        <Col span={20}>
          {license.osiApproved ? (
            <FaRegCircleCheck color="green" />
          ) : (
            <FaRegCircleXmark color="red" />
          )}
        </Col>
        <Col span={4}>
          <Typography.Title level={5} style={{margin: 0}}>FSF Libre:</Typography.Title>
        </Col>
        <Col span={20}>
          {license.fsfLibre ? (
            <FaRegCircleCheck color="green" />
          ) : (
            <FaRegCircleXmark color="red" />
          )}
        </Col>
        <Col span={4}>
          <Typography.Title level={5} style={{margin: 0}}>Deprecated:</Typography.Title>
        </Col>
        <Col span={20}>
          {license.deprecated ? (
            <FaRegCircleCheck color="green" />
          ) : (
            <FaRegCircleXmark color="red" />
          )}
        </Col>
        <Col span={24}>
          <Typography.Title level={5} style={{margin: 0}}>License Text:</Typography.Title>
        </Col>
        <Col span={24}>
          <div style={{whiteSpace: "pre-line"}}>
          {license.text}
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default LicenseDetail;
