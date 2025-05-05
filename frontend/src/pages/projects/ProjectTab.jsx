import React, { useEffect, useState } from "react";
import { Tabs, theme } from "antd";
import ProjectDetail from "./ProjectDetail";
import { useParams } from "react-router-dom";
import ProjectMember from "./ProjectMember";
import projectApi from "../../api/project";
const onChange = (key) => {
  console.log(key);
};

function ProjectTab({ components, dependencies, builds }) {
  const params = useParams();
  const projectName = params.projectName;
  const [memberships, setMemberships] = useState({});

  const fetchMemberships = async () => {
    const response = await projectApi.getMembership(projectName);
    setMemberships(response);
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const items = [
    {
      key: "1",
      label: "Pipelines",
      children: <ProjectDetail projectName={projectName} membership={memberships}/>,
    },
    {
      key: "2",
      label: "Users",
      children: <ProjectMember projectName={projectName} membership={memberships}/>,
    },
  ];
  const {
    token: { borderRadius, padding, paddingSM, colorBgContainer },
  } = theme.useToken();
  return (
    <div style={{
      background: colorBgContainer,
      padding: padding,
      borderRadius: borderRadius,
    }}>
      <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
    </div>
  ) 
}
export default ProjectTab;
