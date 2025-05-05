import {
  Badge,
  Button,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  Pagination,
  Table,
  theme,
} from "antd";
import {
  FaPlus,
  FaEllipsis,
  FaRegAddressCard,
  FaRegTrashCan,
  FaKey,
  FaLock,
  FaUnlock,
} from "react-icons/fa6";
import React, { useEffect, useState } from "react";
import userApi from "../../api/user";
import { useNavigate } from "react-router-dom";
import CreateUser from "./CreateUser";

function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [users, setUsers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [changePasswordUser, setChangePasswordUser] = useState(null);
  const { token : { colorBgContainer, paddingLG, borderRadiusLG } } = theme.useToken();

  const navigate = useNavigate();

  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Fullname",
      dataIndex: "fullname",
      key: "fullname",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone Number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        return status === 1 ? (
          <>
            <Badge style={{ marginRight: "6px" }} status="success" /> Active
          </>
        ) : (
          <>
            <Badge style={{ marginRight: "6px" }} status="error" /> Inactive
          </>
        );
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      title: "More",
      key: "more",
      render: (text, record) => (
        <>
          <Dropdown
            menu={{
              items: [
                {
                  label: "Detail",
                  icon: <FaRegAddressCard />,
                  key: "detail",
                },
                {
                  label: record.status === 1 ? "Block" : "Unblock",
                  icon: record.status === 1 ? <FaLock /> : <FaUnlock />,
                  key: "status",
                },
                {
                  label: "Change Password",
                  icon: <FaKey />,
                  key: "change-password",
                },
                {
                  label: "Delete",
                  icon: <FaRegTrashCan color="red" />,
                  key: "delete",
                },
              ],
              onClick: (e) => {
                if (e.key === "detail") {
                  navigate(`${record.username}`);
                  console.log("detail", record);
                } else if (e.key === "status") {
                  const title = "Are you sure to " + (record.status === 1 ? "block" : "unblock") + " user " + record.username + "?";
                  Modal.confirm({
                    title,
                    onOk: () => {
                      const patchUpdate = async () => {
                        try {
                          await userApi.patchUpdate(record.id, { status: record.status === 1 ? 0 : 1 });
                          message.success("Update user status successfully");
                        } catch (error) {
                          message.error("Failed to update user status");
                        } finally {
                          fetchUsers();
                        }
                      }
                      patchUpdate();
                    },
                  })
                } else if (e.key === "delete") {
                  console.log("delete", record);
                } else if (e.key === "change-password") {
                  setChangePasswordUser(record);
                  setOpenChangePassword(true);
                  console.log("change-password", record);
                }
              },
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<FaEllipsis />} />
          </Dropdown>
        </>
      ),
    },
  ];
  const fetchUsers = async () => {
    const searchParams = new URLSearchParams({
      search,
      page,
      size,
      sortBy,
      order,
    });
    const data = await userApi.getUsers(searchParams);
    setUsers(data.content.map((user, index) => ({ ...user, key: index })));
    setTotalElements(data.page.totalElements);
  };
  useEffect(() => {
    fetchUsers();
  }, [search, page, size, sortBy, order]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: paddingLG,
        background: colorBgContainer,
        borderRadius: borderRadiusLG,
        gap: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <CreateUser refresh={fetchUsers}/>
        <Input.Search
          style={{ width: "300px" }}
          placeholder="Search"
          onSearch={(value) => setSearch(value)}
        />
      </div>
      <Table columns={columns} dataSource={users} pagination={false} />
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
      <ChangePasswordModal
        open={openChangePassword}
        setOpen={setOpenChangePassword}
        user={changePasswordUser}
      />
    </div>
  );
}

function ChangePasswordModal({ open, setOpen, user }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isPasswordMatch, setIsPasswordMatch] = useState(false);
  const onOk = (values) => {
    const changePassword = async () => {
      setLoading(true);
      try {
        await userApi.changePassword({ userId: user.id, ...values });
        setOpen(false);
        message.success("Change password successfully");
      } catch (error) {
        message.error("Failed to change password");
      } finally {
        setLoading(false);
      }
    };
    changePassword();
  };

  const validateConfirmPassword = (_, value) => {
    if (!value || form.getFieldValue("newPassword") === value) {
      setIsPasswordMatch(true);
      return Promise.resolve();
    }
    setIsPasswordMatch(false);
    return Promise.reject(new Error("The two passwords do not match!"));
  };
  return (
    <Modal
      title={`Change Password for ${user ? user.username : ""}`}
      open={open}
      okText="Ok"
      confirmLoading={loading}
      onCancel={() => setOpen(false)}
      destroyOnClose
      okButtonProps={{
        autoFocus: true,
        htmlType: "submit",
        disabled: !isPasswordMatch,
      }}
      modalRender={(dom) => (
        <Form
          layout="vertical"
          form={form}
          name="form_in_modal"
          clearOnDestroy
          onFinish={(values) => onOk(values)}
        >
          {dom}
        </Form>
      )}
    >
      <Form.Item
        name="newPassword"
        label="New Password"
        rules={[
          {
            required: true,
            message: "Please input the new password!",
          },
        ]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="Confirm Password"
        rules={[
          {
            required: true,
            message: "Please input the confirm password!",
          },
          {
            validator: validateConfirmPassword,
          },
        ]}
      >
        <Input.Password />
      </Form.Item>
    </Modal>
  );
}

export default UserManagementPage;
