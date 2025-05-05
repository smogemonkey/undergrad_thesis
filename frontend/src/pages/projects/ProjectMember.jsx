import { Button, Input, message, Popconfirm, Table, Tag } from "antd";
import React, { useEffect, useState } from "react";
import projectApi from "../../api/project";
import { FaRegTrashCan } from "react-icons/fa6";
import AddMember from "./AddMember";
import { isSysAdmin } from "../../ultil";

function ProjectMember({ projectName, membership }) {
  const [members, setMembers] = useState([]);

  const removeMember = async (userId) => {
    try {
      await projectApi.removeMember(projectName, userId);
      fetchMembers();
      message.success("Remove member successfully");
    } catch (error) {
      console.error(error);
      message.error("Failed to remove member");
    }
  }

  const columns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Full Name",
      dataIndex: "fullname",
      key: "fullname",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "isAdmin",
      key: "isAdmin",
      render: (isAdmin) => {
        return isAdmin ? (
          <Tag color="green">Admin</Tag>
        ) : (
          <Tag color="blue">Member</Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        if (isSysAdmin() || !record.isAdmin) {
          return (
            <div
              style={{
                display: "flex",
                gap: "2px",
              }}
            >
              <Popconfirm
                title="Remove this member?"
                description="Are you sure to remove this member?"
                okText="Yes"
                cancelText="No"
                onConfirm={() => removeMember(record.id)}
              >
                <Button danger type="text" icon={<FaRegTrashCan />} />
              </Popconfirm>
            </div>
          );
        }
      },
    },
  ];

  const fetchMembers = async () => {
    const repsonse = await projectApi.getAllMembers(projectName);
    console.log(repsonse);
    setMembers(
      repsonse.map((member, index) => {
        return {
          ...member,
          no: index + 1,
        };
      })
    );
  };

  useEffect(() => {
    fetchMembers();
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
        {(isSysAdmin() || membership.isAdmin) ? <AddMember refresh={fetchMembers}/> : <div></div>}
        <Input.Search
          style={{ width: "300px" }}
          placeholder="Search"
          // onSearch={(value) => setSearch(value)}
        />
      </div>
      <Table columns={columns} dataSource={members} />
    </div>
  );
}

export default ProjectMember;
