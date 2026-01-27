import { useEffect, useState } from 'react'

import LoadingSize from './Modal/LoadingSize'
import ModalContent2 from './Modal/ModalContent2'
import WIDGET from 'bbh-chatbox-widget-js-sdk'
import { t } from 'i18next'

const ActiveSDK = () => {
  /**
   * State lưu access_token
   */
  const [access_token, setAccessToken] = useState('')
  /** State loading */
  const [loading, setLoading] = useState(false)
  /** State mở cảnh báo */
  const [open_warning, setOpenWarning] = useState(false)
  /** Loại modal */
  const [type, setType] = useState<'warning' | 'success' | 'error'>('warning')
  /** Message    */
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    /** Lấy access_token từ URL */
    const PARAMS = new URLSearchParams(window.location.search)
    /**
     * Lấy access_token từ URL
     */
    const TOKEN = PARAMS.get('access_token')
    /**
     * Nếu có access_token thì lưu vào state và in ra console
     */
    if (TOKEN) {
      setAccessToken(TOKEN)
      console.log('Access Token:', TOKEN) // In ra console để kiểm tra
    }
  }, [])

  // const handleActive = async () => {
  //   /**
  //    * Set loading
  //    */
  //   setLoading(true);
  //   /**
  //    * Body gửi lên server
  //    */
  //   const BODY = {
  //     access_token: access_token,
  //     token_partner: "active",
  //     _type: "oauth-access-token",
  //   };
  //   /**
  //    * Nếu có access_token thì gửi request lên server
  //    */
  //   if (access_token) {
  //     try {
  //       /** Goị hàm OAuth */
  //       // await WIDGET.oAuth();

  //       const END_POINT =
  //         "https://chatbox-app.botbanhang.vn/v1/app/app-installed/update";

  //       /** Gửi request lên server */
  //       setOpenWarning(true);
  //       /** Set loại modal */
  //       setType("success");
  //       /** Set message */
  //       setMessage(t("active_success"));
  //     } catch (error) {
  //       /** Hiện thị cảnh báo */
  //       setOpenWarning(true);
  //       /** Set loại modal */
  //       setType("error");
  //       /** Set message */
  //       setMessage(t("active_fail"));
  //     } finally {
  //       /** Set loading */
  //       setLoading(false);
  //     }
  //   }
  // };
  const handleActive = async () => {
    setLoading(true)

    const BODY = {
      access_token: access_token,
      token_partner: 'active',
      _type: 'oauth-access-token',
    }

    if (!access_token) {
      setOpenWarning(true)
      setType('error')
      setMessage(t('missing_token'))
      setLoading(false)
      return
    }

    try {
      // 'https://chatbox-app.botbanhang.vn/v1/app/app-installed/update'
      const END_POINT =
        'https://wcss4s40o4g4c4wgc44w0gsw.35.198.216.143.sslip.io/v1/app/app-installed/update'

      const response = await fetch(END_POINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(BODY),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // 🔹 Fix: Response dùng key "succes" (thiếu chữ s)
      const isSuccess = result?.succes === true || result?.success === true

      if (isSuccess && result?.code === 200) {
        const appData = result?.data?.app_installed

        // ✅ Nếu muốn lưu thông tin app active để hiển thị ở giao diện khác
        // setAppInfo(appData); // (nếu bạn có state appInfo)

        setOpenWarning(true)
        setType('success')
        setMessage(
          'Kích hoạt thành công' +
            (appData?.snap_app?.name ? ` (${appData.snap_app.name})` : '')
        )

        console.log('App activated:', appData)
      } else {
        setOpenWarning(true)
        setType('error')
        setMessage(result?.message || t('active_fail'))
      }
    } catch (error) {
      console.error('Active SDK error:', error)
      setOpenWarning(true)
      setType('error')
      setMessage(t('active_fail'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen gap-y-2">
      <h1 className="text-2xl">{t('active_sdk_message')}</h1>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer flex gap-x-2 items-center truncate"
        onClick={handleActive}
        disabled={loading}
      >
        Kích hoạt
        {loading && (
          <LoadingSize
            color_white
            size="sm"
          />
        )}
      </button>

      {open_warning && (
        <ModalContent2
          type={type}
          title={
            type === 'success'
              ? 'Thành công'
              : type === 'error'
                ? 'Thất bại'
                : 'Cảnh báo'
          }
          message={message}
          onCancel={() => {
            setOpenWarning(false)
          }}
          onConfirm={() => {
            setOpenWarning(false)
            window.close()
          }}
        />
      )}
    </div>
  )
}

export default ActiveSDK
