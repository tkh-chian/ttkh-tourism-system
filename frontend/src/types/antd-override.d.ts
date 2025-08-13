// 精确化的 antd 类型补充（最小必要声明）
// 目的：为项目中以命名导入方式使用的 antd 组件与表格类型提供最小类型占位，避免全面 any 覆盖。
// 请在后续根据项目 antd 版本替换为正式 @types 或官方类型定义。

import * as React from 'react';

declare module 'antd' {
  // 常用组件（声明为 React.ComponentType<any> 以保留 JSX 可用性）
  export const Table: React.ComponentType<any>;
  export const Button: React.ComponentType<any>;
  export const Badge: React.ComponentType<any>;
  export const Card: React.ComponentType<any>;
  export const Select: React.ComponentType<any>;
  export const Input: React.ComponentType<any>;
  export const Space: React.ComponentType<any>;
  export const Spin: React.ComponentType<any>;
  export const message: {
    success: (msg: any) => void;
    error: (msg: any) => void;
    info: (msg: any) => void;
    warning: (msg: any) => void;
    open?: (opts: any) => void;
  };
  // 导出类型别名占位
  export type ButtonProps = any;
  export type InputProps = any;
  export type SelectProps = any;
  export default any;
}

declare module 'antd/es/table' {
  // 表格相关的泛型类型占位（满足 ColumnsType, TableProps 等的 import）
  export type ColumnsType<T = any> = any;
  export type TablePaginationConfig = any;
  export type TableProps<T = any> = any;
  export type PaginationProps = any;
  export type TableCurrentDataSource<T = any> = any;
  const table: any;
  export default table;
}

declare module 'antd/es/table/interface' {
  export type SorterResult<T = any> = any;
  export type FilterValue = any;
  export type ColumnType<T = any> = any;
  const tableInterface: any;
  export default tableInterface;
}

// @ant-design/icons 最小化声明（列举项目中常见/可能使用到的图标）
declare module '@ant-design/icons' {
  import * as React from 'react';
  export const SearchOutlined: React.ComponentType<any>;
  export const FilterOutlined: React.ComponentType<any>;
  export const EyeOutlined: React.ComponentType<any>;
  export const PlusOutlined: React.ComponentType<any>;
  export const EditOutlined: React.ComponentType<any>;
  export const DeleteOutlined: React.ComponentType<any>;
  export const DownloadOutlined: React.ComponentType<any>;
  export const UploadOutlined: React.ComponentType<any>;
  export const CalendarOutlined: React.ComponentType<any>;
  export const FileOutlined: React.ComponentType<any>;
  export const ShoppingCartOutlined: React.ComponentType<any>;
  const icons: { [key: string]: React.ComponentType<any> };
  export default icons;
}