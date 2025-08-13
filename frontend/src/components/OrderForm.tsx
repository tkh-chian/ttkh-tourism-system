import React, { useState } from 'react';
import { Button } from './UI/Button';
import { FileUpload } from './UI/FileUpload';
import { FileUploadResult } from '../types';
import { Modal } from './UI/Modal';
import { User, Phone, Mail, Calendar, Users } from 'lucide-react';

interface OrderFormProps {
  product: {
    id: string;
    title_zh: string;
    title_th: string;
    base_price: number;
  };
  selectedDate?: Date;
  selectedSchedule?: {
    price: number;
    available_stock: number;
  };
  onSubmit: (orderData: OrderFormData) => void;
  onClose: () => void;
  isOpen: boolean;
}

export interface OrderFormData {
  travel_date: string;
  adults: number;
  children_no_bed: number;
  children_with_bed: number;
  infants: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  passport_files: FileUploadResult[];
  notes: string;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  product,
  selectedDate,
  selectedSchedule,
  onSubmit,
  onClose,
  isOpen
}) => {
  const [formData, setFormData] = useState<OrderFormData>({
    travel_date: selectedDate ? selectedDate.toISOString().substring(0, 10) : '',
    adults: 1,
    children_no_bed: 0,
    children_with_bed: 0,
    infants: 0,
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    passport_files: [],
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field: keyof OrderFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.travel_date) {
      newErrors.travel_date = '请选择出行日期';
    }

    if (formData.adults < 1) {
      newErrors.adults = '至少需要1名成人';
    }

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = '请输入客户姓名';
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = '请输入联系电话';
    } else if (!/^[\d\s\-+()]+$/.test(formData.customer_phone.trim())) {
      newErrors.customer_phone = '请输入有效的电话号码';
    }

    if (formData.customer_email && formData.customer_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email.trim())) {
      newErrors.customer_email = '请输入有效的邮箱地址';
    }

    const totalPeople = formData.adults + formData.children_no_bed + formData.children_with_bed + formData.infants;
    if (totalPeople === 0) {
      newErrors.people = '至少需要1人';
    }

    if (selectedSchedule && totalPeople > selectedSchedule.available_stock) {
      newErrors.people = `人数超过可用库存 (${selectedSchedule.available_stock})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalPrice = () => {
    const price = selectedSchedule?.price || product.base_price;
    const totalPeople = formData.adults + formData.children_no_bed + formData.children_with_bed;
    return price * totalPeople;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('提交订单失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePassportUpload = (files: FileUploadResult[]) => {
    setFormData(prev => ({
      ...prev,
      passport_files: [...prev.passport_files, ...files]
    }));
  };

  const handlePassportRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      passport_files: prev.passport_files.filter((_, i) => i !== index)
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="创建订单" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 产品信息 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">{product.title_zh}</h3>
          {selectedDate && (
            <p className="text-sm text-gray-600">
              出行日期: {selectedDate.toLocaleDateString('zh-CN')}
            </p>
          )}
          {selectedSchedule && (
            <p className="text-sm text-gray-600">
              单价: ¥{selectedSchedule.price} | 可用库存: {selectedSchedule.available_stock}
            </p>
          )}
        </div>

        {/* 出行日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            出行日期 *
          </label>
          <input
            type="date"
            value={formData.travel_date}
            onChange={(e) => handleInputChange('travel_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.travel_date && (
            <p className="mt-1 text-sm text-red-600">{errors.travel_date}</p>
          )}
        </div>

        {/* 人数选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline w-4 h-4 mr-1" />
            人数选择 *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">成人</label>
              <input
                type="number"
                min="1"
                value={formData.adults}
                onChange={(e) => handleInputChange('adults', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">不占床儿童</label>
              <input
                type="number"
                min="0"
                value={formData.children_no_bed}
                onChange={(e) => handleInputChange('children_no_bed', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">占床儿童</label>
              <input
                type="number"
                min="0"
                value={formData.children_with_bed}
                onChange={(e) => handleInputChange('children_with_bed', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">婴儿</label>
              <input
                type="number"
                min="0"
                value={formData.infants}
                onChange={(e) => handleInputChange('infants', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {errors.people && (
            <p className="mt-1 text-sm text-red-600">{errors.people}</p>
          )}
        </div>

        {/* 客户信息 */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">客户信息</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline w-4 h-4 mr-1" />
              客户姓名 *
            </label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => handleInputChange('customer_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入客户姓名"
            />
            {errors.customer_name && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline w-4 h-4 mr-1" />
              联系电话 *
            </label>
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={(e) => handleInputChange('customer_phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入联系电话"
            />
            {errors.customer_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline w-4 h-4 mr-1" />
              邮箱地址
            </label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) => handleInputChange('customer_email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入邮箱地址（可选）"
            />
            {errors.customer_email && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_email}</p>
            )}
          </div>
        </div>

        {/* 护照信息上传 */}
        <div>
          <FileUpload
            label="护照信息上传"
            helperText="请上传所有游客的护照照片或扫描件，支持 JPG、PNG、PDF 格式"
            accept="image/*,.pdf"
            multiple={true}
            maxSize={10 * 1024 * 1024} // 10MB
            onUpload={handlePassportUpload}
            onRemove={handlePassportRemove}
            files={formData.passport_files}
          />
        </div>

        {/* 备注信息 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            备注信息
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入特殊要求或备注信息（可选）"
          />
        </div>

        {/* 价格计算 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">总价格:</span>
            <span className="text-xl font-bold text-blue-600">
              ¥{calculateTotalPrice().toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {formData.adults + formData.children_no_bed + formData.children_with_bed} 人 × ¥{selectedSchedule?.price || product.base_price}
          </p>
        </div>

        {/* 提交按钮 */}
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            type="submit"
            loading={submitting}
            className="flex-1"
          >
            创建订单
          </Button>
        </div>
      </form>
    </Modal>
  );
};