import React from "react";
import { Tabs, theme } from "antd";
import Board2 from "../dependencies/Board2";
import CompareBuild from "./CompareBuild";
import ComponentsTable from "./ComponentsTable";
import Board from "../dependencies/Board";
const onChange = (key) => {
  console.log(key);
};

function PipelineTabs({ components, builds, buildId }) {
  const items = [
    {
      key: "1",
      label: "Components",
      children: <ComponentsTable dataSource={components} />,
    },
    {
      key: "2",
      label: "Dependencies",
      children: (
          <Board buildId={buildId} />
      ),
    },
    {
      key: "3",
      label: "Compare",
      children: <CompareBuild builds={builds} />,
    },
  ];
  const {
    token: { borderRadius, padding, paddingSM, colorBgContainer },
  } = theme.useToken();
  return (
    <div
      style={{
        background: colorBgContainer,
        padding: padding,
        borderRadius: borderRadius,
      }}
    >
      <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
    </div>
  );
}
export default PipelineTabs;
