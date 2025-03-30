declare module "singular-sdk-ts" {
  // 定义 SingularConfig 类的类型
  class SingularConfigClass {
    constructor(sdkKey: string, sdkSecret: string, productId: string);
  }

  // 定义通用的事件属性类型
  interface EventAttributes {
    [key: string]: string | number | boolean; // 假设属性值可以是字符串、数字或布尔值
  }

  // 定义 SingularSDK 接口，包含所有方法
  interface SingularSDK {
    // 初始化方法
    init(config: SingularConfigClass): void;

    // 登录方法，接受用户 ID
    login(userId: string): void;

    // 登出方法，无参数
    logout(): void;

    // 发送事件方法，支持无参数或带属性两种重载
    event(eventName: string): void;
    event(eventName: string, attributes: EventAttributes): void;

    // 发送收入事件方法，支持基本参数或带额外属性的重载
    revenue(eventName: string, currency: string, amount: number): void;
    revenue(
      eventName: string,
      currency: string,
      amount: number,
      attributes: EventAttributes
    ): void;

    // 获取设备 ID 方法，返回字符串
    getSingularDeviceId(): string;
  }

  // 定义 LinkParams 的类型（暂时保持模糊，等待更多信息）
  interface LinkParams {
    [key: string]: any; // 可替换为具体属性
  }

  // 定义 BannersOptions 的类型（暂时保持模糊，等待更多信息）
  interface BannersOptions {
    [key: string]: any; // 可替换为具体属性
  }

  // 全局 window 对象的类型扩展
  interface Window {
    singularSdk?: SingularSDK;
    SingularConfig?: typeof SingularConfigClass; // 类本身
  }

  // 导出类型化的常量
  export const singularSdk: SingularSDK;
  export const SingularConfig: typeof SingularConfigClass; // 导出类本身
  export const LinkParams: LinkParams;
  export const BannersOptions: BannersOptions;
}
