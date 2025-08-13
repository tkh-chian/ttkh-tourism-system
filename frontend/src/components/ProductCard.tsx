import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './UI/Button';
import { Badge } from './UI/Badge';
import { Card, CardContent } from './UI/Card';
import { Eye, ShoppingCart, Calendar, MapPin, Star } from 'lucide-react';

interface Product {
  id: string;
  title_zh: string;
  title_th: string;
  description_zh?: string;
  description_th?: string;
  base_price: number;
  poster_image?: string;
  poster_filename?: string;
  pdf_file?: string;
  pdf_filename?: string;
  status: string;
  view_count: number;
  order_count: number;
  merchant_id: string;
  created_at: string;
  // 兼容后端不同字段命名
  product_number?: string;
}

interface ProductCardProps {
  product: Product;
  onView?: () => void;
  onOrder?: (date?: Date, schedule?: any) => void;
  language?: 'zh' | 'th';
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onView,
  onOrder,
  language = 'zh'
}) => {
  const title = language === 'zh' ? product.title_zh : product.title_th;
  const description = language === 'zh' ? (product.description_zh || '') : (product.description_th || '');

  const handleView = () => {
    if (onView) {
      onView();
    }
  };

  const handleOrder = () => {
    if (onOrder) {
      onOrder();
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* 产品图片 */}
      <div className="relative">
        {product.poster_image ? (
          <img
            src={`data:image/jpeg;base64,${product.poster_image}`}
            alt={title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.jpg';
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-2" />
              <span className="text-sm">暂无图片</span>
            </div>
          </div>
        )}
        
        {/* 状态标签 */}
        {product.status === 'approved' && (
          <div className="absolute top-2 right-2">
            <Badge color="green">已认证</Badge>
          </div>
        )}
        
        {/* 浏览次数 */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center">
          <Eye className="w-3 h-3 mr-1" />
          {product.view_count}
        </div>
      </div>

      <CardContent className="p-4">
        {/* 产品标题 */}
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {title}
        </h3>
        
        {/* 产品编号 */}
        <div className="text-xs text-blue-600 font-medium mb-2">
          {language === 'zh' ? `产品编号: ${product.product_number}` : `รหัสผลิตภัณฑ์: ${product.product_number}`}
        </div>

        {/* 产品描述 */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
          {description}
        </p>

        {/* 价格和评分 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-red-500">
              ¥{product.base_price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 ml-1">起</span>
          </div>
          
          <div className="flex items-center text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm text-gray-600 ml-1">4.8</span>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>已售 {product.order_count} 份</span>
          <span>浏览 {product.view_count} 次</span>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-2">
          <Link to={`/products/${product.id}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleView}
            >
              <Eye className="w-4 h-4 mr-1" />
              查看详情
            </Button>
          </Link>
          
          <Button
            size="sm"
            className="flex-1"
            onClick={handleOrder}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            立即预订
          </Button>
        </div>

        {/* PDF下载 */}
        {product.pdf_file && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-blue-600 hover:text-blue-700"
              onClick={() => {
                const link = document.createElement('a');
                link.href = `data:application/pdf;base64,${product.pdf_file}`;
                link.download = product.pdf_filename || `${title}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Calendar className="w-4 h-4 mr-1" />
              下载行程PDF
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
export { ProductCard };