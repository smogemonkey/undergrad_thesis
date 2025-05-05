import { Button, Input, message, Empty, Table } from "antd";
import React, { useEffect, useState } from "react";
import projectApi from "../../api/project";
import { FaRegTrashCan } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import CreateProject from "./CreateProject";
import EditProject from "./EditProject";
import { hasAnyPermission, isSysAdmin } from "../../ultil";

function ProjectsPage() {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [filterProjects, setFilterProjects] = useState([]);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const deleteProject = async (id) => {
    try {
      await projectApi.deleteProject(id);
      fetchProjects();
      message.success("Delete project successfully");
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to delete project");
      console.error(error);
    }
  };

  const columns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
    },
    {
      title: "Project Name",
      dataIndex: "name",
      key: "name",
      render: (item) => {
        return (
          <Button type="link" onClick={() => navigate(`/projects/${item}`)}>
            {item}
          </Button>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Repository",
      dataIndex: "repository",
      key: "repository",
      render: (item) => {
        return item ? (
          <Button type="link" onClick={() => window.open(item, '_blank')}>
            {item}
          </Button>
        ) : '-';
      }
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      key: "action",
      render: (_, record) => {
        return (
          <div
            style={{
              display: "flex",
              gap: "2px",
            }}
          >
            <EditProject refresh={fetchProjects} project={record} />
            <Button
              danger
              type="text"
              icon={<FaRegTrashCan />}
              onClick={() => {
                Modal.confirm({
                  title: "Delete Project",
                  content: "Are you sure you want to delete this project?",
                  okText: "Yes",
                  cancelText: "No",
                  onOk: () => deleteProject(record.id),
                });
              }}
            />
          </div>
        );
      },
    },
  ];

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectApi.getProjects();
      if (response.success) {
        const projectData = response.data || [];
        const formattedData = projectData.map((item, index) => ({
          ...item,
          no: index + 1,
          key: item.id,
        }));
        setProjects(formattedData);
        setFilterProjects(formattedData);
      } else {
        throw new Error(response.message || "Failed to fetch projects");
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || "Failed to fetch projects");
      message.error(error.response?.data?.message || error.message || "Failed to fetch projects");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSearch = (value) => {
    if (!value.trim()) {
      setFilterProjects(projects);
    } else {
      setFilterProjects(
        projects.filter((project) => 
          project.name.toLowerCase().includes(value.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(value.toLowerCase()))
        )
      );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {(isSysAdmin() || hasAnyPermission(['CREATE_PROJECT'])) ? <CreateProject refresh={fetchProjects} /> : <div></div>}
        <Input.Search
          style={{ width: "300px" }}
          placeholder="Search by name or description"
          onSearch={handleSearch}
          allowClear
        />
      </div>
      
      <Table
        columns={columns}
        dataSource={filterProjects}
        pagination={{
          total: filterProjects.length,
          pageSize: 10,
          showTotal: (total) => `Total ${total} projects`,
        }}
        loading={loading}
        locale={{
          emptyText: error ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={error}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  No projects found.
                  {(isSysAdmin() || hasAnyPermission(['CREATE_PROJECT'])) && 
                    " Click the 'Create Project' button to add one."}
                </span>
              }
            />
          ),
        }}
      />
    </div>
  );
}

export default ProjectsPage;
