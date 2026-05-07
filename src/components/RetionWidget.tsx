import React, { useState, useEffect, useRef } from 'react'
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
import WIDGET from 'bbh-chatbox-widget-js-sdk'
import { RetionService } from '../services/RetionService'

/** Interface props cho RetionWidget */
interface IProps {
  /** Danh sách khách hàng từ Store hoặc Parent */
  customers: Customer[]
  /** Callback thực thi khi người dùng bấm liên kết khách hàng */
  onLink: (code: string) => void
}

/**
 * Component widget hiển thị thông tin khách hàng từ ERP
 * Hỗ trợ tự động nhận diện hội thoại từ SDK và tìm kiếm thông tin tương ứng
 * @param props - Props chứa danh sách khách hàng và callback liên kết
 */
const RetionWidget = ({ customers, onLink }: IProps) => {
  /** Trang thái lưu trữ mã khách hàng đang nhập trong ô search */
  const [search_code, setSearchCode] = useState<string>('')
  /** Đối tượng khách hàng tìm được từ hệ thống ERP */
  const [found_customer, setFoundCustomer] = useState<Customer | null>(null)
  /** Trạng thái loading khi đang thực hiện tác vụ tìm kiếm hoặc liên kết */
  const [is_searching, setIsSearching] = useState<boolean>(false)
  /** Thông báo lỗi hiển thị trên giao diện khi tác vụ thất bại */
  const [error, setError] = useState<string>('')
  /** Trạng thái loading toàn trang khi đang khởi tạo kết nối với SDK/API */
  const [is_initializing, setIsInitializing] = useState<boolean>(true)

  /** ID của page Facebook hiện tại lấy từ hội thoại chatbox */
  const [current_page_id, setCurrentPageId] = useState<string>('')
  /** ID của khách hàng chat hiện tại lấy từ profile chatbox */
  const [current_client_id, setCurrentClientId] = useState<string>('')

  /** Ref đánh dấu đã thực hiện gọi API khởi tạo để tránh gọi thừa do React StrictMode */
  const IS_FETCHED_API = useRef(false)

  /** Kiểm tra xem URL có chứa tham số mode=test để kích hoạt chế độ giả lập không */
  const IS_MOCK_MODE = new URLSearchParams(window.location.search).get('mode') === 'test'

  /** Log thông báo chế độ hoạt động hiện tại của Widget để dev theo dõi */
  console.log(`[RetionWidget] Chế độ: ${IS_MOCK_MODE ? 'GIẢ LẬP (TEST)' : 'THỰC TẾ (API)'}`)

  /** Khởi tạo instance của RetionService với cấu hình mock tương ứng */
  const RETION_SERVICE = new RetionService({ is_mock: IS_MOCK_MODE })

  /**
   * Chuẩn hóa định danh hội thoại từ nhiều nguồn khác nhau của SDK và URL.
   * SDK hiện có thể trả về `page_id` hoặc `fb_page_id`, còn `client_id` đôi khi
   * nằm ở `public_profile`, top-level hoặc đã được cache trong instance WIDGET.
   */
  const getNormalizedConversationIds = (conversation_info?: any) => {
    /** Dữ liệu hồ sơ công khai từ SDK */
    const PUBLIC_PROFILE = conversation_info?.public_profile || {}
    /** Query params fallback khi chạy ngoài chatbox */
    const PARAMS = new URLSearchParams(window.location.search)

    /** Ưu tiên page_id chuẩn của SDK, sau đó fallback về fb_page_id */
    const PAGE_ID = String(
      PUBLIC_PROFILE.page_id ||
        PUBLIC_PROFILE.fb_page_id ||
        conversation_info?.page_id ||
        PARAMS.get('page_id') ||
        PARAMS.get('fb_page_id') ||
        ''
    ).trim()

    /** Ưu tiên giá trị do SDK giữ trên instance, sau đó fallback các field tương thích */
    const CLIENT_ID = String(
      WIDGET.client_id ||
        PUBLIC_PROFILE.client_id ||
        PUBLIC_PROFILE.fb_client_id ||
        conversation_info?.client_id ||
        PARAMS.get('client_id') ||
        PARAMS.get('fb_client_id') ||
        ''
    ).trim()

    return { PAGE_ID, CLIENT_ID }
  }

  /**
   * Effect thực hiện kết nối với BBH SDK khi Widget vừa được gắn vào DOM
   */
  useEffect(() => {
    // Định nghĩa logic khởi động kết nối với widget cha
    const initBbhWidget = () => {
      // Đọc thông tin hội thoại lần đầu tiên ngay khi load
      getConversationInfo()

      // Đăng ký lắng nghe sự kiện từ SDK (ví dụ khi admin chuyển tab hoặc thay đổi khách hàng)
      WIDGET.onEvent(() => {
        // Cập nhật lại thông tin mới nhất từ SDK
        getConversationInfo()
      })
    }

    // Hàm thực hiện giải mã và trích xuất thông tin khách hàng từ SDK
    const getConversationInfo = async () => {
      try {
        console.log('WIDGET', WIDGET)
        /** Khai báo biến chứa thông tin hội thoại */
        let conversation_info
        // Kiểm tra xem SDK có cung cấp partner_token (kiểu mới) hay không
        if (WIDGET.partner_token) {
          // Lấy thông tin client thông qua phương thức getClientInfo chuẩn
          conversation_info = await WIDGET.getClientInfo()
        } else {
          // Fallback về phương thức giải mã token truyền thống
          conversation_info = await WIDGET.decodeClient()
        }


        console.log('conversation_info', conversation_info)

        /** Chuẩn hóa Page ID / Client ID từ dữ liệu SDK thực tế */
        const { PAGE_ID, CLIENT_ID } = getNormalizedConversationIds(conversation_info)

        console.log('[RetionWidget] Normalized conversation ids:', {
          page_id: PAGE_ID,
          client_id: CLIENT_ID,
        })

        // Luôn cập nhật thông tin định danh mới (kể cả khi rỗng) để tránh cache hội thoại cũ
        setCurrentPageId(PAGE_ID)
        setCurrentClientId(CLIENT_ID)

        // Reset dữ liệu tìm kiếm và kết quả cũ để đảm bảo không bị chồng chéo thông tin
        setSearchCode('')
        setFoundCustomer(null)
        setError('')
      } catch (e) {
        // Ghi log lỗi ra console để phục vụ troubleshooting SDK
        console.error('[RetionWidget] Lỗi SDK:', e)
      }
    }

    // Thực thi logic khởi động SDK
    initBbhWidget()
  }, [])

  /**
   * Effect tự động tìm kiếm thông tin khách hàng khi thông tin định danh từ SDK thay đổi
   */
  useEffect(() => {
    // Chỉ tự động gọi API khi đã nhận diện được cả Page ID và Client ID
    if (current_page_id && current_client_id) {
       // Kích hoạt luồng lấy ID khách hàng từ hệ thống Retion
       autoFetchConversationInfo()
    }
    // Lắng nghe sự thay đổi của bộ đôi Page ID và Client ID
  }, [current_page_id, current_client_id])

  /**
   * Cơ chế dự phòng (Fallback) khi SDK không cung cấp thông tin kịp thời
   */
  useEffect(() => {
    // Nếu SDK đã cung cấp đủ dữ liệu thì không cần fallback từ URL nữa
    if (current_page_id && current_client_id) return

    // Thiết lập một bộ hẹn giờ sau 1.5 giây nếu vẫn chưa có ID từ SDK
    const TIMER = setTimeout(() => {
      // Nếu trạng thái ID vẫn đang trống (thường xảy ra khi test ngoài chatbox)
      if (!current_page_id || !current_client_id) {
        /** Lấy Query Params từ URL hiện tại */
        const PARAMS = new URLSearchParams(window.location.search)
        /** Lấy Page ID từ URL theo cả key mới và key cũ */
        const URL_PAGE_ID = PARAMS.get('page_id') || PARAMS.get('fb_page_id')
        /** Lấy Client ID từ URL theo cả key mới và key cũ */
        const URL_CLIENT_ID = PARAMS.get('client_id') || PARAMS.get('fb_client_id')

        // Chỉ fallback khi URL thực sự có đủ dữ liệu, tránh ghi đè state hợp lệ bằng chuỗi rỗng
        if (URL_PAGE_ID && URL_CLIENT_ID) {
          console.log('[RetionWidget] Fallback conversation ids from URL:', {
            page_id: URL_PAGE_ID,
            client_id: URL_CLIENT_ID,
          })
          setCurrentPageId(URL_PAGE_ID)
          setCurrentClientId(URL_CLIENT_ID)
        }
      }
    }, 1500)

    // Cleanup timer khi component unmount để tránh rò rỉ bộ nhớ
    return () => clearTimeout(TIMER)
  }, [current_page_id, current_client_id])

  /**
   * Hàm gọi Service để lấy mã khách hàng ERP từ thông tin hội thoại Retion
   */
  const autoFetchConversationInfo = async () => {
    // Hiển thị trạng thái đang tải toàn trang
    setIsInitializing(true)
    // Xóa sạch các thông báo lỗi từ lần thực hiện trước
    setError('')

    try {
      /** Lấy Page ID hiện tại đang được quản lý bởi Widget */
      const PAGE_ID = current_page_id
      /** Lấy Client ID hiện tại đang được quản lý bởi Widget */
      const CLIENT_ID = current_client_id

      // Nếu thiếu thông tin định danh thì không thể thực hiện truy vấn
      if (!PAGE_ID || !CLIENT_ID) return

      /** Gọi Service thực hiện lấy Customer ID từ Bio Retion */
      const CUSTOMER_ID = await RETION_SERVICE.fetchCustomerId(PAGE_ID, CLIENT_ID)

      // Nếu tìm thấy mã khách hàng đã được lưu trong Bio trước đó
      if (CUSTOMER_ID) {
        // Tự động điền mã khách hàng vào ô nhập liệu cho người dùng
        setSearchCode(CUSTOMER_ID)
        // Tự động kích hoạt luồng tìm kiếm thông tin chi tiết từ ERP
        handleSearch(CUSTOMER_ID)
      } else {
        // Cập nhật thông báo trạng thái "Chưa liên kết" để người dùng biết cần map thủ công
        setError('Chưa liên kết khách hàng với Retion...')
      }
    } catch (e) {
      // Thông báo lỗi nếu quá trình gọi API gặp sự cố kỹ thuật
      setError('Đã có lỗi xảy ra khi khởi tạo dữ liệu.')
    } finally {
      // Tắt trạng thái khởi tạo dù thành công hay thất bại
      setIsInitializing(false)
    }
  }

  /**
   * Xử lý tìm kiếm thông tin khách hàng từ hệ thống ERP theo mã code
   * @param code - Mã khách hàng (Tùy chọn, nếu không có sẽ lấy từ input)
   */
  const handleSearch = async (code?: string | React.MouseEvent | React.KeyboardEvent) => {
    /** Quyết định mã cần tìm: lấy từ tham số truyền vào (auto) hoặc từ state (nhập tay) */
    const TARGET_CODE = typeof code === 'string' ? code : search_code
    
    // Ngăn chặn tìm kiếm nếu mã là chuỗi rỗng sau khi đã cắt khoảng trắng
    if (!TARGET_CODE.trim()) return
    
    // Hiển thị loading cho nút tìm kiếm hoặc thẻ kết quả
    setIsSearching(true)
    // Xóa các thông báo lỗi cũ để khách hàng không bị nhầm lẫn
    setError('')

    try {
      /** Yêu cầu Service thực hiện truy vấn khách hàng từ ERP */
      const CUSTOMER = await RETION_SERVICE.searchCustomer(TARGET_CODE)

        console.log('[RetionWidget] Search customer result:', CUSTOMER)
      // Nếu tìm thấy khách hàng khớp với mã cung cấp
      if (CUSTOMER) {
        // Cập nhật thông tin khách hàng vào state để hiển thị lên thẻ Profile
        setFoundCustomer(CUSTOMER)
      } else {
        // Xóa thông tin cũ nếu có để tránh hiển thị sai lệch
        setFoundCustomer(null)
        /** Nội dung lỗi linh hoạt dựa trên chế độ đang chạy (Mock/Real) */
        const ERR_MSG = IS_MOCK_MODE ? 'Không tìm thấy mã khách hàng (Mock).' : 'Không tìm thấy mã khách hàng trong hệ thống'
        // Hiển thị lỗi lên UI cho người dùng thấy
        setError(ERR_MSG)
      }
    } catch (error) {
      // Xử lý khi có lỗi mạng hoặc API ERP bị sập
      setFoundCustomer(null)
      setError('Đã có lỗi xảy ra vui lòng thử lại sau')
    } finally {
      // Tắt hiệu ứng loading khi đã nhận được kết quả
      setIsSearching(false)
    }
  }

  /**
   * Xử lý gửi yêu cầu liên kết (Mapping) khách hàng chat hiện hại với mã khách hàng ERP
   * @param code - Mã khách hàng ERP cần liên kết
   */
  const handleLink = async (code: string) => {
    // Khóa nút bấm và hiển thị trạng thái đang xử lý
    setIsSearching(true)
    // Đảm bảo không có thông báo lỗi cũ nào đang hiển thị
    setError('')

    try {
      /** Lấy Page ID từ định danh hiện tại */
      const PAGE_ID = current_page_id
      /** Lấy Client ID từ định danh hiện tại */
      const CLIENT_ID = current_client_id

      // Chặn thao tác liên kết nếu chưa lấy được định danh hội thoại hiện tại
      if (!PAGE_ID || !CLIENT_ID) {
        setError('Thiếu thông tin hội thoại hiện tại để thực hiện liên kết.')
        return
      }

      /** Sử dụng Service thực hiện quy trình Map và Update Bio (2 bước API) */
      const SUCCESS = await RETION_SERVICE.linkCustomer(code, PAGE_ID, CLIENT_ID)

      // Nếu quy trình liên kết hoàn tất thành công trên server
      if (SUCCESS) {
        // Kích hoạt callback của parent để đồng bộ trạng thái ở cấp ứng dụng cao hơn
        onLink(code)
        // Cập nhật trạng thái cục bộ ngay lập tức để người dùng thấy biển "Đã đồng bộ" màu xanh
        setFoundCustomer(prev =>
          prev
            ? {
                ...prev,
                isLinked: true,
                // Giả lập một userKey mới được sinh ra từ ERP để hiển thị minh họa
                userKey: `ERP-${Math.floor(1000 + Math.random() * 9000)}`,
              }
            : null
        )
      } else {
        // Thông báo nếu một trong các bước API thất bại
        setError('Liên kết khách hàng với Retion thất bại.')
      }
    } catch (e) {
      // Bắt lỗi ngoại lệ mạng hoặc crash logic
      setError('Đã có lỗi xảy ra khi thực hiện liên kết khách hàng.')
    } finally {
      // Giải phóng trạng thái khóa UI
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/** Khu vực Tìm kiếm: Chứa ô nhập liệu mã và nút hành động */}
      <div className="space-y-2">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              maxLength={15}
              placeholder="Nhập mã khách hàng..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              value={search_code}
              onChange={e => {
                // Tự động loại bỏ các ký tự không phải số để đảm bảo tính đúng đắn của mã code
                const VALUE = e.target.value.replace(/\D/g, '')
                setSearchCode(VALUE)
                // Nếu người dùng xóa hết dữ liệu trong ô nhập
                if (!VALUE) {
                  // Xóa kết quả tìm kiếm và các lỗi hiện có để UI trở lại trạng thái trống
                  setFoundCustomer(null)
                  setError('')
                } else {
                  // Xóa lỗi đang hiển thị ngay khi người dùng bắt đầu nhập lại mã mới
                  setError('')
                }
              }}
              // Hỗ trợ nhấn phím Enter để thực hiện tìm kiếm nhanh
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
            />
            {/* Biểu tượng tìm kiếm kính lúp */}
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          </div>
          <button
            // Sự kiện bấm nút tìm kiếm
            onClick={handleSearch}
            // Vô hiệu hóa nút khi đang tìm kiếm hoặc khi ô nhập liệu trống
            disabled={is_searching || search_code.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0"
          >
            {/* Hiển thị icon Loading đơn giản khi đang gọi API */}
            {is_searching ? '...' : 'Tìm'}
          </button>
        </div>
        
        {/** Banner Hiển thị lỗi nổi bật: Sử dụng khi tìm kiếm hoặc liên kết thất bại */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2.5 animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-red-700 leading-tight">
              {error}
            </p>
          </div>
        )}
      </div>

      {/** Khu vực kết quả khách hàng: Hiển thị Profile khách hàng nếu tìm được */}
      {found_customer ? (
        <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-400">
          {/* Kiểm tra trạng thái liên kết để hiển thị hành động Map */}
          {!found_customer.isLinked ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold mb-3">
                <AlertCircle className="w-4 h-4" />
                KHÁCH HÀNG CHƯA LIÊN KẾT
              </div>
              <button
                // Kích hoạt luồng liên kết khách hàng
                onClick={() => handleLink(found_customer.customer_code)}
                disabled={is_searching}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white text-[12px] font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {is_searching ? '...' : (
                  <>
                    <UserPlus className="w-4 h-4" /> LIÊN KẾT KHÁCH HÀNG
                  </>
                )}
              </button>
            </div>
          ) : (
            // Hiển thị huy hiệu đã đồng bộ thành công màu xanh lá
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

          {/** Card thông tin chi tiết: Chứa tên, điện thoại, email và điểm */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Header của thẻ Profile */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base">{found_customer.name}</h3>
                <p className="text-[11px] font-medium text-blue-400 mt-0.5 tracking-wider">
                  {found_customer.customer_code}
                </p>
              </div>
              {/* Badge hiển thị trạng thái hoạt động */}
              <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                found_customer.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {found_customer.status === 'active' ? 'Hoạt động' : 'Khóa'}
              </div>
            </div>

            {/* Phần nội dung chi tiết liên hệ */}
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Phone className="w-4 h-4" /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Số điện thoại</span>
                  <span className="text-sm text-slate-700 font-semibold">{found_customer.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Mail className="w-4 h-4" /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Email</span>
                  <span className="text-sm text-slate-700 font-semibold truncate max-w-[200px]">{found_customer.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><MapPin className="w-4 h-4" /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Địa chỉ</span>
                  <span className="text-sm text-slate-700 font-semibold line-clamp-1">{found_customer.address}</span>
                </div>
              </div>
            </div>

            {/* Footer hiển thị điểm tích lũy thành viên */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Điểm tích lũy</span>
                <span className="text-lg font-black text-slate-800">{found_customer.loyaltyPoints.toLocaleString()}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User className="w-5 h-5" /></div>
            </div>
          </div>
        </div>
      ) : (
        // Hiển thị trạng thái trống hoặc đang khởi động
        <div className="py-28 flex flex-col items-center justify-center text-center">
          {is_initializing ? (
            // Hiệu ứng Pulse khi đang lấy dữ liệu ban đầu từ SDK
            <div className="space-y-4 animate-pulse">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Search className="w-8 h-8 text-blue-300" />
              </div>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest px-10 leading-relaxed text-center">
                Đang lấy thông tin hội thoại...
              </p>
            </div>
          ) : (
            // Placeholder mặc định khi chưa có kết quả tìm kiếm
            <div className="opacity-30">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-10 leading-relaxed">
                Vui lòng nhập mã khách hàng để kiểm tra thông tin
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RetionWidget
