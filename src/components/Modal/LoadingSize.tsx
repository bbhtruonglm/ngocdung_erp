/**
 * @description: Loading component
 */
interface ILoading {
  /**
   * @description: Color of loading
   */
  color_white?: boolean;
  /**
   * @description: Size of loading
   */
  size?: "sm" | "md" | "lg";
}

const LoadingSize = ({ color_white, size = "sm" }: ILoading) => {
  return (
    <div className="flex items-center w-full h-full py-0.5 justify-center">
      <div
        className={`${
          size === "sm"
            ? "size-4"
            : size === "md"
            ? "size-8 border-2"
            : "size-12 border-4"
        } border-2 ${
          color_white ? "border-white" : "border-blue-500"
        } border-t-transparent border-solid rounded-full animate-spin`}
      ></div>
    </div>
  );
};

export default LoadingSize;
