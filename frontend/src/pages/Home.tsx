import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Search, Filter, MapPin, Star, Download } from 'lucide-react';

const Home: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从后端API获取产品数据和价格日历
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/products?status=approved');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          const productList = Array.isArray(data.data) ? data.data : [];
          setProducts(productList);
          
          // 为每个产品获取价格日历数据
          const productsWithScheduleData = await Promise.all(
            productList.map(async (product: any) => {
              try {
                const scheduleResponse = await fetch(`http://localhost:3001/api/products/${product.id}/schedules`);
                
                if (scheduleResponse.ok) {
                  const scheduleData = await scheduleResponse.json();
                  
                  if (scheduleData.success) {
                    const schedules = Array.isArray(scheduleData.data) ? scheduleData.data : [];
                    // 获取未来7天的可用日期
                    const today = new Date();
                    const availableDates = schedules
                      .filter((schedule: any) => {
                        const scheduleDate = new Date(schedule.travel_date);
                        return scheduleDate >= today && schedule.available_stock > 0;
                      })
                      .slice(0, 7)
                      .sort((a: any, b: any) => new Date(a.travel_date).getTime() - new Date(b.travel_date).getTime());
                    
                    return {
                      ...product,
                      schedules: schedules,
                      availableDates: availableDates,
                      hasAvailableStock: availableDates.length > 0
                    };
                  }
                }
                return { ...product, schedules: [], availableDates: [], hasAvailableStock: false };
              } catch (err) {
                console.error(`获取产品${product.id}的价格日历失败:`, err);
                return { ...product, schedules: [], availableDates: [], hasAvailableStock: false };
              }
            })
          );
          
          setProducts(productsWithScheduleData);
        } else {
          setError(data.message || '获取产品数据失败');
        }
      } catch (err) {
        console.error('获取产品数据错误:', err);
        setError('网络连接错误，请检查后端服务是否启动');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 处理产品详情页面跳转
  const handleProductDetail = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const filteredProducts = products.filter(product => {
    const title = product.title_zh || product.title_th;
    const description = product.description_zh || product.description_th || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const categories = [
    { id: 'all', name: '全部', nameEn: 'All' },
    { id: 'tour', name: '旅游团', nameEn: 'Tours' },
    { id: 'hotel', name: '酒店', nameEn: 'Hotels' },
    { id: 'transport', name: '交通', nameEn: 'Transport' },
    { id: 'activity', name: '活动', nameEn: 'Activities' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 英雄区域 */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t('欢迎来到TTKH旅游')}
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {t('发现中国最美的旅游目的地')}
          </p>
          
          {/* 搜索栏 */}
          <div className="max-w-2xl mx-auto bg-white rounded-lg p-4 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder={t('搜索目的地、酒店、活动...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                  className="text-gray-800"
                />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 px-8">
                <Search className="w-5 h-5 mr-2" />
                {t('搜索')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 分类筛选 */}
      <section className="py-8 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t(category.name)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 热门推荐 */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {t('热门推荐')}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('精选最受欢迎的旅游产品')}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('加载中...')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">
                {t('加载失败')}
              </h3>
              <p className="text-gray-500">{error}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                      <div className="text-center text-white">
                        <MapPin className="w-12 h-12 mx-auto mb-2" />
                        <span className="text-sm">精美风景</span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">
                        {product.title_zh || product.title_th || product.name}
                      </h3>
                      
                      {/* 产品编号 */}
                      <div className="text-xs text-blue-600 font-medium mb-2">
                        产品编号: #{product.id}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">
                        {product.description_zh || product.description_th || product.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-2xl font-bold text-red-500">
                            ¥{(product.base_price || product.price || 0).toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">起</span>
                        </div>
                        
                        <div className="flex items-center text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">4.8</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>已售 {product.order_count || 0} 份</span>
                        <span>浏览 {product.view_count || 0} 次</span>
                      </div>

                      <div className="flex flex-col space-y-2">
                        {/* 下载行程按钮 */}
                        {product.pdf_file && (
                          <button
                            onClick={() => {
                              try {
                                const link = document.createElement('a');
                                link.href = `data:application/pdf;base64,${product.pdf_file}`;
                                link.download = product.pdf_filename || `${product.title_zh || product.name || 'product'}-行程.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } catch (error) {
                                console.error('下载PDF失败:', error);
                              }
                            }}
                            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            下载行程
                          </button>
                        )}
                        
                        {/* 操作按钮 */}
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleProductDetail(product.id)}
                          >
                            查看详情
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleProductDetail(product.id)}
                          >
                            立即预订
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {t('没有找到相关产品')}
                  </h3>
                  <p className="text-gray-500">
                    {t('请尝试其他搜索关键词或分类')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 特色服务 */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {t('为什么选择我们')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('本地专家')}</h3>
              <p className="text-gray-600">
                {t('我们的本地导游和专家为您提供最地道的旅游体验')}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('品质保证')}</h3>
              <p className="text-gray-600">
                {t('严格筛选合作伙伴，确保每一次旅行都是完美体验')}
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('个性定制')}</h3>
              <p className="text-gray-600">
                {t('根据您的需求和预算，为您量身定制专属旅行方案')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
export { Home };