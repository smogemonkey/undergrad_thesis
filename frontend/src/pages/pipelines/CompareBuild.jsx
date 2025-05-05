import { Button, Collapse, Select, Space, Table } from "antd";
import React from "react";
import buildApi from "../../api/build";

function CompareBuild({builds}) {
  const [insertedComponents, setInsertedComponents] = React.useState([]);
  const [removedComponents, setRemovedComponents] = React.useState([]);
  const [upgradedComponents, setUpgradedComponents] = React.useState([]);
  const [downgradedComponents, setDowngradedComponents] = React.useState([]);
  const [unchangedComponents, setUnchangedComponents] = React.useState([]);
  const [from, setFrom] = React.useState(builds[0].id);
  const [to, setTo] = React.useState(builds[1].id);

  const handleCompare = () => {
    const compare = async () => {
      const data = await buildApi.compareBuild(from, to);
      setInsertedComponents(data.insertedComponents);
      setRemovedComponents(data.removedComponents);
      setUpgradedComponents(data.upgradedComponents);
      setDowngradedComponents(data.downgradedComponents);
      setUnchangedComponents(data.unchangedComponents);
    }
    compare();
  }

  const options = builds.map((build) => {
    return {
      label: `#${build.number}`,
      value: build.id,
    }
  })

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
    },
    {
      title: "Group",
      dataIndex: "groupName",
      key: "groupName",
    },
    {
      title: "Publisher",
      dataIndex: "publisher",
      key: "publisher",
    },
  ]

  const collapseItems = [
    {
      key: "inserted",
      label: "Inserted Components",
      children: <Table columns={columns} dataSource={insertedComponents} pagination={false}/>,
      extra: `${insertedComponents.length} components`,
    },
    {
      key: "removed",
      label: "Removed Components",
      children: <Table columns={columns} dataSource={removedComponents}/>,
      extra: `${removedComponents.length} components`
    },
    {
      key: "upgraded",
      label: "Upgraded Components",
      children: <Table columns={columns} dataSource={upgradedComponents}/>,
      extra: `${upgradedComponents.length} components`
    },
    {
      key: "downgraded",
      label: "Dowgraded Components",
      children: <Table columns={columns} dataSource={downgradedComponents}/>,
      extra: `${downgradedComponents.length} components`
    },
    {
      key: "unchanged",
      label: "Unchanged Components",
      children: <Table columns={columns} dataSource={unchangedComponents}/>,
      extra: `${unchangedComponents.length} components`
    },
  ]
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <Select
          style={{
            minWidth: "200px",
          }}
          options={options}
          onChange={(value) => {
            setFrom(value);
            console.log(value);
          }}
        />
        <Select
          style={{
            minWidth: "200px",
          }}
          options={options}
          onChange={(value) => setTo(value)}
        />
        <Button type="primary" onClick={handleCompare}>Compare</Button>
      </div>
      <Collapse items={collapseItems}/>
    </div>
  );
}

export default CompareBuild;
