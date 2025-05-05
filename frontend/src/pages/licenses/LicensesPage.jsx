import { Input, Pagination, Table, Typography } from "antd";
import { Link, useLoaderData } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { FaRegCircleCheck, FaRegCircleXmark } from "react-icons/fa6";
import licenseApi from "../../api/license";


function LicensesPage() {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("licenseId");
  const [order, setOrder] = useState("asc");
  const [licenses, setLicenses] = useState([]);
  const [totalElements, setTotalElements] = useState(0);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "SPDX License ID",
      dataIndex: "licenseId",
      key: "licenseId",
      render: (value) => (
        <Link to={`/licenses/${value}`}>
          <Typography.Link>{value}</Typography.Link>
        </Link>
      ),
    },
    {
      title: "OSI Approved",
      dataIndex: "osiApproved",
      key: "osiApproved",
      render: (value) => {
        if (value) return <FaRegCircleCheck color="green" />;
        else return <FaRegCircleXmark color="red" />;
      },
    },
    {
      title: "FSF Libre",
      dataIndex: "fsfLibre",
      key: "fsfLibre",
      render: (value) => {
        if (value) return <FaRegCircleCheck color="green" />;
        else return <FaRegCircleXmark color="red" />;
      },
    },
    {
      title: "Deprecated",
      dataIndex: "deprecated",
      key: "deprecated",
      render: (value) => {
        if (value) return <FaRegCircleCheck color="green" />;
        else return <FaRegCircleXmark color="red" />;
      },
    },
  ];

  useEffect(() => {
    const fetchLicenses = async () => {
      setLoading(true);
      const searchParams = new URLSearchParams({
        search,
        page,
        size,
        sortBy,
        order,
      });
      try {
        // const data = await callApi(async () => getLicenses(searchParams));
        const data = await licenseApi.getLicenses(searchParams);
        setLicenses(data.content);
        setTotalElements(data.page.totalElements);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLicenses();
  }, [search, page, size, sortBy, order]);
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}>
      <Input.Search style={{width: "300px"}} placeholder="Search" onSearch={(value) => setSearch(value)}/>
      <Table
        loading={loading}
        columns={columns}
        dataSource={licenses}
        pagination={false}
      />
      <Pagination
        current={page}
        total={totalElements}
        pageSize={size}
        showSizeChanger={true}
        align="center"
        onChange={(page, size) => {
          setPage(page);
          setSize(size);
        }}
      />
    </div>
  );
}

export default LicensesPage;
