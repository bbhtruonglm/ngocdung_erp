import { Customer, MessageLog } from '../types'

// Mock DB với mã khách hàng 12 số
export const initialCustomers: Customer[] = [
  {
    customerCode: '202400000001',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@example.com',
    phone: '0901234567',
    address: 'Quận 1, TP. Hồ Chí Minh',
    loyaltyPoints: 1250,
    status: 'active',
    isLinked: false,
  },
  {
    customerCode: '202400000002',
    name: 'Trần Thị Bình',
    email: 'binh.tran@example.com',
    phone: '0908888999',
    address: 'Hoàn Kiếm, Hà Nội',
    loyaltyPoints: 500,
    status: 'active',
    isLinked: true,
    userKey: 'ERP-8821',
  },
  {
    customerCode: '202400000003',
    name: 'Lê Văn Cường',
    email: 'cuong.le@example.com',
    phone: '0911112222',
    address: 'Hải Châu, Đà Nẵng',
    loyaltyPoints: 100,
    status: 'inactive',
    isLinked: false,
  },
]

export const initialLogs: MessageLog[] = []
