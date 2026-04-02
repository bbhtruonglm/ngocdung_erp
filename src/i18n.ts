import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

/** Cấu hình ngôn ngữ mặc định và các bản dịch */
const RESOURCES = {
  vi: {
    translation: {
      /** Thông báo kích hoạt SDK */
      active_sdk_message: 'Nhấn nút bên dưới để kích hoạt SDK',
      /** Kích hoạt thành công */
      active_success: 'Kích hoạt thành công',
      /** Kích hoạt thất bại */
      active_fail: 'Kích hoạt thất bại',
      /** Thiếu token */
      missing_token: 'Không tìm thấy access token',
    },
  },  
}

i18n.use(initReactI18next).init({
  resources: RESOURCES,
  lng: 'vi',
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
