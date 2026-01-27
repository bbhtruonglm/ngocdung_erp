import { useState } from 'react'
import { Customer } from '../types'
import {
  Search,
  UserPlus,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  User,
} from 'lucide-react'

/** Interface props cho RetionWidget */
interface IProps {
  /** Danh sách khách hàng */
  customers: Customer[]
  /** Callback khi liên kết khách hàng */
  onLink: (code: string) => void
}

/**
 * Component widget hiển thị thông tin khách hàng từ ERP
 * @param props - Props chứa danh sách khách hàng và callback liên kết
 */
const RetionWidget = ({ customers, onLink }: IProps) => {
  /** Mã khách hàng đang tìm kiếm */
  const [search_code, setSearchCode] = useState<string>('')
  /** Khách hàng tìm được */
  const [found_customer, setFoundCustomer] = useState<Customer | null>(null)
  /** Trạng thái đang tìm kiếm */
  const [is_searching, setIsSearching] = useState<boolean>(false)
  /** Thông báo lỗi */
  const [error, setError] = useState<string>('')

  /**
   * Xử lý tìm kiếm khách hàng theo mã
   */
  const handleSearch = () => {
    // Kiểm tra mã rỗng
    if (!search_code.trim()) return
    // cập nhật trạng thái tìm kiếm
    setIsSearching(true)
    // xóa thông báo lỗi
    setError('')

    // Giả lập gọi API ERP với độ trễ 600ms
    setTimeout(() => {
      // Tìm khách hàng theo mã
      const MATCH = customers.find(c => c.customerCode === search_code.trim())
      // cập nhật trạng thái tìm thấy
      if (MATCH) {
        // lưu thông tin khách hàng tìm được
        setFoundCustomer(MATCH)
      } else {
        // xóa thông tin khách hàng tìm được
        setFoundCustomer(null)
        // hiển thị thông báo lỗi
        setError('Không tìm thấy mã khách hàng trong hệ thống')
      }
      // cập nhật trạng thái tìm kiếm
      setIsSearching(false)
    }, 600)
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/** Khu vực tìm kiếm */}
      <div className="space-y-2">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              maxLength={12}
              placeholder="Nhập mã khách hàng..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              value={search_code}
              onChange={e => setSearchCode(e.target.value.replace(/\D/g, ''))}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          </div>
          <button
            onClick={handleSearch}
            disabled={is_searching || search_code.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0"
          >
            {is_searching ? '...' : 'Tìm'}
          </button>
        </div>
        {/** Hiển thị lỗi nếu có */}
        {error && (
          <p className="text-[11px] font-medium text-red-500 px-1">{error}</p>
        )}
      </div>

      {found_customer ? (
        <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-400">
          {/** Khu vực trạng thái liên kết */}
          {!found_customer.isLinked ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold mb-3">
                <AlertCircle className="w-4 h-4" />
                KHÁCH HÀNG CHƯA LIÊN KẾT
              </div>
              <button
                onClick={() => onLink(found_customer.customerCode)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> LIÊN KẾT KHÁCH HÀNG
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-tight">
                <ShieldCheck className="w-4 h-4" />
                Khách hàng đã đồng bộ
              </div>
              <span className="text-[11px] font-mono text-emerald-600 font-bold bg-emerald-100/50 px-2 py-1 rounded">
                #{found_customer.userKey}
              </span>
            </div>
          )}

          {/** Card thông tin chi tiết khách hàng */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/** Header với tên và trạng thái */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base">{found_customer.name}</h3>
                <p className="text-[11px] font-medium text-blue-400 mt-0.5 tracking-wider">
                  {found_customer.customerCode}
                </p>
              </div>
              <div
                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  found_customer.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {found_customer.status === 'active' ? 'Hoạt động' : 'Khóa'}
              </div>
            </div>

            {/** Thông tin liên hệ */}
            <div className="p-4 space-y-4">
              {/** Số điện thoại */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    Số điện thoại
                  </span>
                  <span className="text-sm text-slate-700 font-semibold">
                    {found_customer.phone}
                  </span>
                </div>
              </div>

              {/** Email */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    Email
                  </span>
                  <span className="text-sm text-slate-700 font-semibold truncate max-w-[200px]">
                    {found_customer.email}
                  </span>
                </div>
              </div>

              {/** Địa chỉ */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    Địa chỉ
                  </span>
                  <span className="text-sm text-slate-700 font-semibold line-clamp-1">
                    {found_customer.address}
                  </span>
                </div>
              </div>
            </div>

            {/** Footer với điểm tích lũy */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Điểm tích lũy
                </span>
                <span className="text-lg font-black text-slate-800">
                  {found_customer.loyaltyPoints.toLocaleString()}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-28 flex flex-col items-center justify-center text-center opacity-30">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-10 leading-relaxed">
            Vui lòng nhập mã khách hàng để kiểm tra thông tin
          </p>
        </div>
      )}
    </div>
  )
}

export default RetionWidget
