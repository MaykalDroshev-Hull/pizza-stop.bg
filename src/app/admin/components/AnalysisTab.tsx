import { Package, BarChart3, Coffee, Star } from "lucide-react";

interface MetricCard {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
}

const AnalysisTab = (): React.JSX.Element => {
  const metrics: MetricCard[] = [
    {
      id: "orders",
      icon: Package,
      label: "Total Orders",
      value: "1,247",
      bgColor: "bg-red-600/20",
      iconColor: "text-red-400"
    },
    {
      id: "revenue",
      icon: BarChart3,
      label: "Revenue",
      value: "$18,432",
      bgColor: "bg-green-600/20",
      iconColor: "text-green-400"
    },
    {
      id: "avgOrder",
      icon: Coffee,
      label: "Avg. Order",
      value: "$14.82",
      bgColor: "bg-blue-600/20",
      iconColor: "text-blue-400"
    },
    {
      id: "rating",
      icon: Star,
      label: "Rating",
      value: "4.8",
      bgColor: "bg-yellow-600/20",
      iconColor: "text-yellow-400"
    }
  ];

  const renderMetricCard = (metric: MetricCard): React.JSX.Element => {
    const Icon = metric.icon;
    return (
      <div key={metric.id} className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center space-x-3">
          <div className={`p-3 ${metric.bgColor} rounded-xl`}>
            <Icon className={`w-6 h-6 ${metric.iconColor}`} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">{metric.label}</p>
            <p className="text-2xl font-bold text-white">{metric.value}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map(renderMetricCard)}
      </div>
      
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Sales Trend</h3>
        <div className="h-64 bg-gray-800 rounded-xl flex items-center justify-center">
          <p className="text-gray-400">Chart visualization would go here</p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisTab;
