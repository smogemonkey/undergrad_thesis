import React, { useEffect, useState } from "react";
import roleApi from "../../api/roles";
import { Button, Input, message, Popconfirm, Table } from "antd";
import { FaPlus, FaRegTrashCan } from "react-icons/fa6";
import CreateRole from "./CreateRole";
import EditRole from "./EditRole";
import permissionApi from "../../api/permission";

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissionsOptions, setPermissionsOptions] = useState([]);

  useEffect(() => {
    fetchPermissions();
  }, []);
  const fetchPermissions = async () => {
    const data = await permissionApi.getPermissions();
    setPermissionsOptions(
      data.map((permission) => ({
        label: permission.name,
        value: permission.id,
      }))
    );
  };

  const deleteRole = async (id) => {
    try {
      await roleApi.deleteRole(id);
      fetchRoles();
      message.success("Delete role successfully");
    } catch (error) {
      console.error(error);
      message.error("Failed to delete role");
    }
  }

  const columns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
    },
    {
      title: "Role",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_, record) => {
        return (
          <div
            style={{
              display: "flex",
              gap: "2px",
            }}
          >
            <EditRole refresh={fetchRoles} role={record} permissionsOptions={permissionsOptions} />
            <Popconfirm
              title="Delete the role"
              description="Are you sure to delete this role?"
              okText="Yes"
              cancelText="No"
              onConfirm={() =>  deleteRole(record.id)}
            >
              <Button danger type="text" icon={<FaRegTrashCan />} />
            </Popconfirm>
          </div>
        );
      }
    }
  ];

  const fetchRoles = async () => {
    const data = await roleApi.getRoles();
    setRoles(
      data.map((role, index) => ({ ...role, no: index + 1, key: index }))
    );
  };
  useEffect(() => {
    fetchRoles();
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
          justifyContent: "space-between",
        }}
      >
        <CreateRole refresh={fetchRoles} permissionsOptions={permissionsOptions} />
        <Input.Search
          style={{ width: "300px" }}
          placeholder="Search"
          // onChange={(value) => {
          //   setFilteredPermissions(
          //     permissions.filter((permission) =>
          //       permission.permission.includes(value.target.value)
          //     )
          //   );
          // }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={roles}
        pagination
        expandable={{
          expandedRowRender: (record) => (
            <div>
              <p style={{ margin: 0 }}>Permissions:</p>
              <ul>
                {record.permissions.map((permission, index) => (
                  <li key={index}>{permission.name}</li>
                ))}
              </ul>
            </div>
          ),
          rowExpandable: (record) => record.permissions.length > 0,
        }}
      />
    </div>
  );
}

export default RolesPage;
