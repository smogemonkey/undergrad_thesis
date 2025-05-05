import { Table } from 'antd'
import React from 'react'
import { Link } from 'react-router-dom'

const columns = [
  {
    title: 'No',
    dataIndex: 'no',
    key: 'no',
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Group',
    dataIndex: 'groupName',
    key: 'groupName',
  },
  {
    title: 'Publisher',
    dataIndex: 'publisher',
    key: 'publisher',
    render: (value) => {
      return value ? value : '-'
    }
  },
  {
    title: 'Version',
    key: 'version',
    dataIndex: 'version',
  },
  {
    title: 'License',
    key: 'licenseId',
    dataIndex: 'licenseId',
    render: (value) => {
      return value.map((item) => <Link style={{display: "block"}} to={`/licenses/${item}`}>{item}</Link>)
    }
  }
]

function VulnerabilitiesTable({dataSource}) {
  return (
    <div>
      <Table columns={columns} dataSource={dataSource}/>
    </div>
  )
}

export default VulnerabilitiesTable