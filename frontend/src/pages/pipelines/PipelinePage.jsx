import React, { useEffect, useState } from "react";
import { Col, Row } from "antd";
import BuildList from "./BuildList";
import OverviewCard from "./OverviewCard";
import PipelineTabs from "./PipelineTabs";
import buildApi from "../../api/build";
import { useParams } from "react-router-dom";

function PipelinePage() {
  const [size, setSize] = useState(10);
  const [components, setComponents] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const params = useParams();
  const projectName = params.projectName;
  const pipelineName = params.pipelineName;
  useEffect(() => {
    const fetchBuilds = async () => {
      const searchParams = new URLSearchParams({
        search: "",
        page: "1",
        size,
        sortBy: "createdAt",
        order: "desc",
      });
      const data = await buildApi.getBuilds(
        projectName,
        pipelineName,
        searchParams
      );
      setSelectedBuild(data.content[0].id);
      setBuilds(data.content);
    };
    fetchBuilds();
  }, [size]);

  useEffect(() => {
    const fetchComponents = async () => {
      const data = await buildApi.getComponentsByBuildId(selectedBuild);
      const vulns = new Set();
      const licenses = new Set();
      data.forEach((item) => {
        item.vulnerabilities.forEach((vuln) => {
          vulns.add(vuln);
        });
        item.licenses.forEach((license) => {
          licenses.add(license.licenseId);
        });
      });
      setLicenses([...licenses]);
      setVulnerabilities([...vulns]);
      setComponents(
        data.map((item, index) => {
          return { ...item, no: index + 1 };
        })
      );
    };
    if(selectedBuild !== null){
      fetchComponents();
    }
  }, [selectedBuild]);

  return (
    <div>
      <Row gutter={8} style={{ marginBottom: "8px" }}>
        <Col span={6}>
          <OverviewCard title="Builds" value={builds.length} />
        </Col>
        <Col span={6}>
          <OverviewCard title="Components" value={components.length} />
        </Col>
        <Col span={6}>
          <OverviewCard title="Vulnerabilities" value={vulnerabilities.length} />
        </Col>
        <Col span={6}>
          <OverviewCard title="Licenses" value={licenses.length} />
        </Col>
      </Row>
      <Row gutter={8}>
        <Col span={4}>
          <BuildList builds={builds} setSelectedBuild={setSelectedBuild} selectedBuild={selectedBuild}/>
        </Col>
        <Col span={20}>
          <PipelineTabs components={components} builds={builds} buildId={selectedBuild} />
        </Col>
      </Row>
    </div>
  );
}

export default PipelinePage;
