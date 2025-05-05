import React, { useEffect, useState } from "react";
import permissionApi from "../../api/permission";
import { Input, Table } from "antd";

function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [filteredPermissions, setFilteredPermissions] = useState([]);

  const columns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
    },
    {
      title: "Permission",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
  ];

  useEffect(() => {
    const fetchPermissions = async () => {
      const data = await permissionApi.getPermissions();
      setPermissions(data);
      setFilteredPermissions(
        data.map((permission, index) => ({
          ...permission,
          no: index + 1,
          key: index,
        }))
      );
    };
    fetchPermissions();
  }, []);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "end",
        }}
      >
        <Input.Search
          style={{ width: "300px" }}
          placeholder="Search"
          onChange={(value) => {
            setFilteredPermissions(
              permissions.filter((permission) =>
                permission.name.includes(value.target.value)
              )
            );
          }}
        />
      </div>
      <Table columns={columns} dataSource={filteredPermissions} pagination />
    </div>
  );
}

export default PermissionsPage;
