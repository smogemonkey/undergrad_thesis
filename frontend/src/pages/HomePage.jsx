import React, { useEffect, useState } from "react";
import {
  accountOptions,
  convertBEtoFE,
  fileColumns,
  rowsPerPageOptions,
  sortByOptions,
  sortOrderOptions,
  tableColumns,
} from "../ultil";
import {
  theme,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Pagination,
  Row,
  Select,
  Table,
  Switch,
  Typography,
} from "antd";
import dayjs from "dayjs";

function HomePage() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [data, setData] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState({
    page: 1,
    search: "",
    dateRange: [dayjs("01-09-2024", "DD-MM-YYYY"), dayjs()],
    rowsPerPage: 10,
    sortBy: "amount",
    sortOrder: "desc",
  });
  const onSubmit = (query) => {
    setIsLoading(true);
    const { page, search, dateRange, rowsPerPage, sortBy, sortOrder } = query;
    const startDate = dateRange[0].format("YYYY-MM-DD");
    const endDate = dateRange[1].format("YYYY-MM-DD");
    fetch(
      `http://localhost:8081/?page=${page}&search=${search}&startDate=${startDate}&endDate=${endDate}&rowsPerPage=${rowsPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    )
      .then((response) => response.json())
      .then((response) => setData(convertBEtoFE(response)))
      .finally(() => setIsLoading(false));
  };
  const onSearchClick = () => {
    const newQuery = { ...query, page: 1 };
    setQuery(newQuery);
    onSubmit(newQuery);
  };
  const onPageChange = (page) => {
    const newQuery = { ...query, page };
    setQuery(newQuery);
    onSubmit(newQuery);
  };
  useEffect(() => {
    setIsLoading(true);
    fetch("http://localhost:8081/files")
      .then((response) => response.json())
      .then((response) => setFiles(response));

    onSubmit(query);
  }, []);
  return (
    <>
      <div
        style={{
          padding: 24,
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
          marginBottom: "24px",
        }}
      >
        <Table columns={fileColumns} dataSource={files} pagination={false} />
      </div>
      <div
        style={{
          padding: 24,
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
        }}
      >
        <Form
          size="large"
          layout="vertical"
          onValuesChange={(changedValues) =>
            setQuery({ ...query, ...changedValues })
          }
          onFinish={onSearchClick}
          initialValues={query}
        >
          <Row gutter={16}>
            <Col md={8} xs={24}>
              <Form.Item label="Tìm kiếm" name="search">
                <Input placeholder="Từ tìm kiếm" />
              </Form.Item>
            </Col>
            <Col md={8} xs={24}>
              <Form.Item label="Khoảng thời gian" name="dateRange">
                <DatePicker.RangePicker
                  style={{ width: "-webkit-fill-available" }}
                  format="DD-MM-YYYY"
                />
              </Form.Item>
            </Col>
            <Col md={8} xs={24}>
              <Form.Item label="Số dòng mỗi trang" name="rowsPerPage">
                <Select options={rowsPerPageOptions} />
              </Form.Item>
            </Col>
            <Col md={8} xs={24}>
              <Form.Item label="Sắp xếp theo" name="sortBy">
                <Select options={sortByOptions} />
              </Form.Item>
            </Col>
            <Col md={8} xs={24}>
              <Form.Item label="Thứ tự" name="sortOrder">
                <Select options={sortOrderOptions} />
              </Form.Item>
            </Col>
            <Col md={8} xs={24}>
              <Form.Item label="Tài khoản nhận" name="account">
                <Select options={accountOptions} />
              </Form.Item>
            </Col>
            {/* <Col span={8}>
              <div style={{display: 'flex', justifyContent: "space-between"}}>
                <Typography.Title level={5}>Hiển thị từ tìm kiếm</Typography.Title>
                <Switch />
              </div>
            </Col> */}
            <Col span={24}>
              <Form.Item>
                <Button
                  style={{ width: "-webkit-fill-available" }}
                  type="primary"
                  htmlType="submit"
                >
                  Tìm kiếm
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Table
          columns={tableColumns}
          dataSource={data.content}
          pagination={false}
          loading={isLoading}
        />
        {!isLoading && (
          <Pagination
            current={query.page}
            total={data.totalElements}
            pageSize={data.rowsPerPage}
            showSizeChanger={false}
            align="center"
            onChange={onPageChange}
            style={{
              marginTop: "8px",
            }}
          />
        )}
      </div>
    </>
  );
}

export default HomePage;
