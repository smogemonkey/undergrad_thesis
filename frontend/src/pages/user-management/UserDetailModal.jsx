import { Form, Input, Modal } from 'antd'
import React from 'react'

function UserDetailModal({ visible, onClose }) {
  return (
    <Modal open={visible}>
      <Form>
        <Form.Item label="Username">
          <Input />
        </Form.Item>
        <Form.Item label="Fullname">
          <Input />
        </Form.Item>
        <Form.Item label="Email">
          <Input />
        </Form.Item>
        <Form.Item label="Phone Number"> 
          <Input />
        </Form.Item>
        <Form.Item label="Description">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default UserDetailModal