import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

import React from "react";
import { t } from "i18next";

type ModalProps = {
  /**
   * Loại modal
   */
  type: "warning" | "success" | "error";
  /**
   * Tiêu đề modal
   */
  title: string;
  /**
   * Nội dung modal
   */
  message: string;
  /**
   * Hàm xử lý khi click vào nút huỷ bỏ
   */
  onCancel: () => void;
  /**
   * Hàm xử lý khi click vào nút xác nhận
   */
  onConfirm: () => void;
  /**
   * Tên item cần xác nhận
   */
  item?: string;
};

const ModalContent2: React.FC<ModalProps> = ({
  type,
  title,
  message,
  onCancel,
  onConfirm,
  item,
}) => {
  /**
   * Hàm lấy màu nền và màu chữ tương ứng với loại modal
   * @returns Màu nền và màu chữ tương ứng với loại modal
   */
  const getColor = () => {
    /**
     * Kiểm tra loại modal
     */
    switch (type) {
      case "warning":
        return "bg-white text-gray-700 border-gray-300";
      case "success":
        return "bg-white text-gray-700 border-gray-300";
      case "error":
        return "bg-white text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div
        className={`w-full max-w-md p-6 rounded-lg shadow-lg border ${getColor()}`}
      >
        <div className="flex justify-center items-center ">
          <div className="flex justify-center items-center h-20 w-20">
            {type === "warning" && (
              <ExclamationCircleIcon className="size-8 text-yellow-500" />
            )}
            {type === "success" && (
              <CheckCircleIcon className="size-8 text-green-500" />
            )}
            {type === "error" && (
              <InformationCircleIcon className="size-8 text-red-500" />
            )}
          </div>
        </div>
        <h2 className=" text-center text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-lg text-center">
          {message}
          {item && <span className="">{` "${item}" ?`}</span>}
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className={`px-4 py-2 ${"bg-blue-700 hover:bg-blue-500"} text-white rounded-md`}
          >
            Xác nhận
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-500 text-white rounded-md"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalContent2;
