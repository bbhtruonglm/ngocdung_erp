import React, { useState } from 'react'
import { Customer } from './types'
import { initialCustomers } from './services/mockData'
import RetionWidget from './components/RetionWidget'

/**
 * Component chính của ứng dụng
 * @returns JSX.Element - Giao diện thông tin khách hàng
 */
const App = () => {
  /** Danh sách khách hàng */
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)

  /**
   * Xử lý liên kết khách hàng với hệ thống ERP
   * @param code - Mã khách hàng cần liên kết
   */
  const handleLinkCustomer = (code: string) => {
    // Cập nhật trạng thái liên kết và tạo userKey ngẫu nhiên cho khách hàng
    setCustomers(prev =>
      prev.map(c =>
        c.customerCode === code
          ? {
              ...c,
              isLinked: true,
              userKey: `ERP-${Math.floor(1000 + Math.random() * 9000)}`,
            }
          : c
      )
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white font-sans max-w-[450px] mx-auto border-x border-slate-200 overflow-hidden shadow-sm">
      {/** Header - Tiêu đề trang */}
      <header className="px-4 py-4 border-b border-slate-100 bg-white shrink-0">
        <h1 className="font-bold text-sm text-slate-800 tracking-tight uppercase text-center">
          Thông tin khách hàng
        </h1>
      </header>

      {/** Main Content - Khu vực nội dung chính */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="p-4">
          <RetionWidget
            customers={customers}
            onLink={handleLinkCustomer}
          />
        </div>
      </main>

      {/** Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  )
}

export default App
