import { Table, theme, Typography } from "antd";
import React, { useEffect, useState } from "react";
import vulnerabilityApi from "../../api/vulnerability";
import { Link } from "react-router-dom";
import { FaBug } from "react-icons/fa6";

function VulnerabilitiesPage() {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const {
    token: { red, yellow, orange, blue },
  } = theme.useToken();
  const columns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
    },
    {
      title: "CVE",
      dataIndex: "cve",
      key: "cve",
      render: (value) => {
        return <Link to={`/vulnerabilities/${value}`}>{value}</Link>;
      },
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "CVSS Score",
      dataIndex: "cvssScore",
      key: "cvssScore",
    },
    {
      title: "Severity",
      key: "severity",
      render: (_, record) => {
        const bugColor =
          record.cvssScore >= 9
            ? red
            : record.cvssScore >= 7
            ? orange
            : record.cvssScore >= 4
            ? yellow
            : blue;
        const severity =
          record.cvssScore >= 9
            ? "Critical"
            : record.cvssScore >= 7
            ? "High"
            : record.cvssScore >= 4
            ? "Medium"
            : "Low";
        return (
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <FaBug color={bugColor} />
            <Typography.Text style={{ marginLeft: "4px" }}>
              {severity}
            </Typography.Text>
          </span>
        );
      },
    },
    {
      title: "CWE",
      dataIndex: "cwe",
      key: "cwe",
    },
  ];
  useEffect(() => {
    const fetchVulnerabilities = async () => {
      setLoading(true);
      const vulnerabilities = await vulnerabilityApi.getVulnerabilities();
      setVulnerabilities(
        vulnerabilities.map((vulnerability, index) => {
          return { ...vulnerability, no: index + 1, key: vulnerability.vulId };
        })
      );
      setLoading(false);
    };
    fetchVulnerabilities();
  }, []);
  return (
    <div>
      <Table columns={columns} dataSource={vulnerabilities} loading={loading} />
    </div>
  );
}

export default VulnerabilitiesPage;
