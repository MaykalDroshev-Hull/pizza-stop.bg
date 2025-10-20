import { Package, BarChart3, Coffee, Star, Filter, Calendar, TrendingUp, TrendingDown, CreditCard, ShoppingBag, ChevronDown } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface MetricCard {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
}

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

// Date Range Picker Component
const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({
    start: startDate ? new Date(startDate) : null,
    end: endDate ? new Date(endDate) : null
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedRange({
      start: startDate ? new Date(startDate) : null,
      end: endDate ? new Date(endDate) : null
    });
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateInRange = (date: Date) => {
    if (!selectedRange.start && !selectedRange.end) return false;
    if (selectedRange.start && !selectedRange.end) {
      return date >= selectedRange.start;
    }
    if (!selectedRange.start && selectedRange.end) {
      return date <= selectedRange.end;
    }
    return date >= selectedRange.start! && date <= selectedRange.end!;
  };

  const isDateSelected = (date: Date) => {
    return (selectedRange.start && date.toDateString() === selectedRange.start.toDateString()) ||
           (selectedRange.end && date.toDateString() === selectedRange.end.toDateString());
  };

  const handleDateClick = (date: Date) => {
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      // Start new selection
      setSelectedRange({ start: date, end: null });
    } else {
      // Complete the selection - ensure end date is not before start date
      if (date < selectedRange.start) {
        // If clicked date is before start, swap them
        const newRange = { start: date, end: selectedRange.start };
        setSelectedRange(newRange);
        onChange(
          newRange.start.toISOString().split('T')[0],
          newRange.end.toISOString().split('T')[0]
        );
        setIsOpen(false);
      } else {
        // Normal case: clicked date is after or equal to start date
        const newRange = { start: selectedRange.start, end: date };
        setSelectedRange(newRange);
        onChange(
          newRange.start.toISOString().split('T')[0],
          newRange.end.toISOString().split('T')[0]
        );
        setIsOpen(false);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: React.ReactElement[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isInRange = isDateInRange(date);
      const isSelected = isDateSelected(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`
            h-7 w-7 md:h-8 md:w-8 text-xs md:text-sm rounded-full transition-colors
            ${isSelected
              ? 'bg-red-600 text-white'
              : isInRange
                ? 'bg-red-600/20 text-red-400'
                : isToday
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const displayText = () => {
    if (selectedRange.start && selectedRange.end) {
      return `${formatDate(selectedRange.start)} - ${formatDate(selectedRange.end)}`;
    } else if (selectedRange.start) {
      return `${formatDate(selectedRange.start)} - Избери крайна дата`;
    }
    return 'Избери период';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm flex items-center justify-between hover:bg-gray-700 transition-colors"
      >
        <span className="truncate">{displayText()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 w-72 md:w-80 max-w-[calc(100vw-2rem)]">
          <div className="p-3 md:p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 md:p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <span className="text-white font-medium text-sm md:text-base">
                {currentMonth.toLocaleDateString('bg-BG', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1.5 md:p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-2">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(day => (
                <div key={day} className="h-7 w-7 md:h-8 md:w-8 text-xs text-gray-400 flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
              {renderCalendar()}
            </div>

            {/* Quick Presets */}
            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-600">
              <div className="text-xs text-gray-400 mb-2">Бързи периоди:</div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 7);
                    onChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 md:py-1 text-xs md:text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                >
                  Последните 7 дни
                </button>
                <button
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - 30);
                    onChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 md:py-1 text-xs md:text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors"
                >
                  Последните 30 дни
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Import the analytics service
import {
  getDashboardMetrics,
  getMostOrderedProducts,
  getLeastOrderedProducts,
  getPaymentMethodBreakdown,
  getSalesChartData,
  getFilterOptions,
  type ProductAnalytics,
  type PaymentMethodBreakdown,
  type DashboardMetrics,
  type FilterState
} from '../services/analyticsService';

const AnalysisTab = (): React.JSX.Element => {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    orderStatus: 0, // Will be set to "Completed" status once loaded
    paymentMethod: null,
    productCategory: null
  });

  const [topN, setTopN] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for real data
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    averageRating: 4.8
  });
  const [mostOrderedProducts, setMostOrderedProducts] = useState<ProductAnalytics[]>([]);
  const [leastOrderedProducts, setLeastOrderedProducts] = useState<ProductAnalytics[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentMethodBreakdown[]>([]);
  const [chartData, setChartData] = useState<Array<{ date: string; orders: number; revenue: number }>>([]);

  // Filter options from database
  const [orderStatuses, setOrderStatuses] = useState<Array<{ id: number; name: string }>>([]);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: number; name: string }>>([]);
  const [productTypes, setProductTypes] = useState<Array<{ id: number; name: string }>>([]);

  // Load filter options on component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await getFilterOptions();
        const mappedStatuses = options.orderStatuses.map(status => ({
          id: status.OrderStatusID,
          name: status.OrderStatus
        }));
        const mappedPaymentMethods = options.paymentMethods.map(method => ({
          id: method.PaymentMethodID,
          name: method.PaymentMethod
        }));
        const mappedProductTypes = options.productTypes.map(type => ({
          id: type.ProductTypeID,
          name: type.ProductType
        }));

        setOrderStatuses(mappedStatuses);
        setPaymentMethods(mappedPaymentMethods);
        setProductTypes(mappedProductTypes);

        // Set default filter values based on loaded data
        const completedStatus = mappedStatuses.find(status =>
          status.name.toLowerCase().includes('завършена') ||
          status.name.toLowerCase().includes('completed') ||
          status.id === 1 // fallback to ID 1 if text doesn't match
        );

        if (completedStatus) {
          setFilters(prev => ({
            ...prev,
            orderStatus: completedStatus.id
          }));
        }
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };

    loadFilterOptions();
  }, []);

  // Load all analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load all data in parallel
        const [
          metrics,
          mostOrdered,
          leastOrdered,
          paymentData,
          chart
        ] = await Promise.all([
          getDashboardMetrics(filters),
          getMostOrderedProducts(filters, topN),
          getLeastOrderedProducts(filters, topN),
          getPaymentMethodBreakdown(filters),
          getSalesChartData(filters)
        ]);

        setDashboardMetrics(metrics);
        setMostOrderedProducts(mostOrdered);
        setLeastOrderedProducts(leastOrdered);
        setPaymentBreakdown(paymentData);
        setChartData(chart);
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError('Грешка при зареждане на данните');
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [filters, topN]);

  const metrics: MetricCard[] = [
    {
      id: "orders",
      icon: Package,
      label: "Общо поръчки",
      value: dashboardMetrics.totalOrders.toLocaleString(),
      bgColor: "bg-red-600/20",
      iconColor: "text-red-400"
    },
    {
      id: "revenue",
      icon: BarChart3,
      label: "Приходи",
      value: `${dashboardMetrics.totalRevenue.toFixed(2)} лв`,
      bgColor: "bg-green-600/20",
      iconColor: "text-green-400"
    },
    {
      id: "avgOrder",
      icon: Coffee,
      label: "Средна поръчка",
      value: `${dashboardMetrics.averageOrderValue.toFixed(2)} лв`,
      bgColor: "bg-blue-600/20",
      iconColor: "text-blue-400"
    },
    {
      id: "rating",
      icon: Star,
      label: "Рейтинг",
      value: dashboardMetrics.averageRating.toFixed(1),
      bgColor: "bg-yellow-600/20",
      iconColor: "text-yellow-400"
    }
  ];

  const renderMetricCard = (metric: MetricCard): React.JSX.Element => {
    const Icon = metric.icon;
    return (
      <div key={metric.id} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-4 md:p-6 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10">
        <div className="flex items-center space-x-3">
          <div className={`p-2 md:p-3 ${metric.bgColor} rounded-xl shadow-lg`}>
            <Icon className={`w-5 h-5 md:w-6 md:h-6 ${metric.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 text-xs md:text-sm font-medium uppercase tracking-wide">{metric.label}</p>
            <p className="text-lg md:text-2xl font-bold text-white truncate mt-1">{metric.value}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderFilters = (): React.JSX.Element => (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 bg-red-600/20 rounded-lg">
          <Filter className="w-5 h-5 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Филтриране на данни</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">📅 Период</label>
          <DateRangePicker
            startDate={filters.dateRange.start}
            endDate={filters.dateRange.end}
            onChange={(start, end) => setFilters(prev => ({
              ...prev,
              dateRange: { start, end }
            }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">💳 Начин на плащане</label>
          <select
            value={filters.paymentMethod || ""}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              paymentMethod: e.target.value ? Number(e.target.value) : null
            }))}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
          >
            <option value="">Всички методи</option>
            {paymentMethods.map(method => (
              <option key={method.id} value={method.id}>{method.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">🍕 Категория продукт</label>
          <select
            value={filters.productCategory || ""}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              productCategory: e.target.value ? Number(e.target.value) : null
            }))}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
          >
            <option value="">Всички категории</option>
            {productTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderProductTable = (
    products: ProductAnalytics[],
    title: string,
    icon: React.ComponentType<{ className?: string }>,
    isLoading: boolean = false
  ): React.JSX.Element => {
    const Icon = icon;
    const isTopProducts = icon === TrendingUp;
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${isTopProducts ? 'bg-green-600/20' : 'bg-orange-600/20'} rounded-lg`}>
              <Icon className={`w-5 h-5 ${isTopProducts ? 'text-green-400' : 'text-orange-400'}`} />
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-400 font-medium">Показ:</label>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
            >
              <option value={5}>Топ 5</option>
              <option value={10}>Топ 10</option>
              <option value={20}>Топ 20</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Зареждане...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Няма данни за показване</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-700 bg-gray-800/50">
                  <th className="text-left text-gray-300 font-semibold py-3 px-3">Продукт</th>
                  <th className="text-left text-gray-300 font-semibold py-3 px-3">Категория</th>
                  <th className="text-right text-gray-300 font-semibold py-3 px-3">Количество</th>
                  <th className="text-right text-gray-300 font-semibold py-3 px-3">Приходи</th>
                  <th className="text-right text-gray-300 font-semibold py-3 px-3">Поръчки</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.productId} className="border-b border-gray-800 hover:bg-gray-800/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500 font-mono text-xs">#{index + 1}</span>
                        <span className="text-white font-medium">{product.productName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-600/20 text-blue-300 text-xs font-medium">
                        {product.productType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white text-right font-semibold">{product.totalQuantity} бр</td>
                    <td className="py-3 px-3 text-green-400 text-right font-bold">{product.totalRevenue.toFixed(2)} лв</td>
                    <td className="py-3 px-3 text-gray-300 text-right">{product.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderPaymentMatrix = (): React.JSX.Element => (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-purple-600/20 rounded-lg">
          <CreditCard className="w-5 h-5 text-purple-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Разбивка по начин на плащане</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Зареждане...</p>
          </div>
        </div>
      ) : paymentBreakdown.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Няма данни за показване</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {paymentBreakdown.map((payment, index) => {
            const colors = [
              { bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-500/30' },
              { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-500/30' },
              { bg: 'bg-purple-600/20', text: 'text-purple-400', border: 'border-purple-500/30' },
              { bg: 'bg-orange-600/20', text: 'text-orange-400', border: 'border-orange-500/30' }
            ];
            const color = colors[index % colors.length];
            
            return (
              <div key={payment.paymentMethodId} className={`border ${color.border} rounded-xl p-4 bg-gray-800/30`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 ${color.bg} rounded-full ring-4 ring-gray-800`}></div>
                    <h4 className="text-md font-bold text-white">{payment.paymentMethod}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Общо продажби</div>
                    <div className="text-sm font-semibold text-white">
                      {payment.totalQuantity} бр. <span className={color.text}>/ {payment.totalRevenue.toFixed(2)} лв</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 bg-gray-900/50">
                        <th className="text-left text-gray-300 font-semibold py-2 px-3">Продукт</th>
                        <th className="text-right text-gray-300 font-semibold py-2 px-3">Количество</th>
                        <th className="text-right text-gray-300 font-semibold py-2 px-3">Приходи</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payment.products.map((product) => (
                        <tr key={`${payment.paymentMethodId}-${product.productId}`} className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                          <td className="py-2 px-3 text-white">{product.productName}</td>
                          <td className="py-2 px-3 text-white text-right font-semibold">{product.quantity} бр</td>
                          <td className="py-2 px-3 text-green-400 text-right font-bold">{product.revenue.toFixed(2)} лв</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderChart = (): React.JSX.Element => (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-4 md:p-6 shadow-xl">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-600/20 rounded-lg">
          <BarChart3 className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Графика на продажбите</h3>
      </div>

      {loading ? (
        <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Зареждане на данни...</p>
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Няма данни за показване</p>
          </div>
        </div>
      ) : (
        <div className="h-64 bg-gray-800/30 rounded-xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                fontSize={11}
                tickFormatter={(value) => new Date(value).toLocaleDateString('bg-BG', { day: '2-digit', month: 'short' })}
              />
              <YAxis stroke="#9CA3AF" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #4B5563',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}
                labelStyle={{ color: '#F3F4F6', fontWeight: 'bold' }}
                itemStyle={{ color: '#D1D5DB' }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('bg-BG', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
                formatter={(value, name) => [
                  name === 'orders' ? `${value} бр.` : `${Number(value).toFixed(2)} лв`,
                  name === 'orders' ? 'Поръчки' : 'Приходи'
                ]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={3}
                name="Приходи"
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6, fill: '#10B981' }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#EF4444"
                strokeWidth={3}
                name="Поръчки"
                dot={{ fill: '#EF4444', r: 4 }}
                activeDot={{ r: 6, fill: '#EF4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-900/20 to-gray-900 border-2 border-red-600/50 rounded-2xl p-8 shadow-xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600/20 rounded-full mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-red-400 text-xl font-bold mb-2">Грешка при зареждане</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            🔄 Опитайте отново
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-600/10 via-gray-900 to-green-600/10 border border-gray-700 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-red-400" />
              <span>Анализ на продажбите</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Преглед на бизнес метрики и детайлна статистика за продуктите
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="text-sm">
              <div className="text-gray-400">Период</div>
              <div className="text-white font-semibold">
                {new Date(filters.dateRange.start).toLocaleDateString('bg-BG')} - {new Date(filters.dateRange.end).toLocaleDateString('bg-BG')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {metrics.map(renderMetricCard)}
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderChart()}
        {renderPaymentMatrix()}
      </div>

      {/* Product Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderProductTable(mostOrderedProducts, "Най-поръчвани продукти", TrendingUp, loading)}
        {renderProductTable(leastOrderedProducts, "Най-слабо поръчвани продукти", TrendingDown, loading)}
      </div>
    </div>
  );
};

export default AnalysisTab;
