import Link from 'next/link'
import { FaArrowLeft, FaClipboardList, FaPizzaSlice, FaChartBar, FaUsers, FaCog, FaBell } from 'react-icons/fa'

/**
 * Administration page for Pizza Stop with dashboard-style layout and management tools.
 * @returns {JSX.Element} The JSX code for the Admin page.
 */
const AdminPage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-pizza-red hover:text-pizza-green transition-colors duration-200"
              >
                <FaArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-2xl font-bold text-white">🍕 Pizza Stop - Администрация</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-300 hover:text-white transition-colors duration-200">
                <FaBell className="h-6 w-6" />
              </button>
              <button className="text-gray-300 hover:text-white transition-colors duration-200">
                <FaCog className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center">
              <div className="p-3 bg-pizza-red rounded-xl">
                <FaClipboardList className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Поръчки днес</p>
                <p className="text-2xl font-bold text-white">24</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center">
              <div className="p-3 bg-pizza-green rounded-xl">
                <FaPizzaSlice className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Продукти</p>
                <p className="text-2xl font-bold text-white">156</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center">
              <div className="p-3 bg-blue-600 rounded-xl">
                <FaChartBar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Приходи днес</p>
                <p className="text-2xl font-bold text-white">1,240 лв.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center">
              <div className="p-3 bg-purple-600 rounded-xl">
                <FaUsers className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Клиенти</p>
                <p className="text-2xl font-bold text-white">89</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Orders Management */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <FaClipboardList className="h-5 w-5 mr-2 text-pizza-red" />
              Управление на поръчки
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div>
                  <p className="font-medium text-white">Поръчка #1234</p>
                  <p className="text-sm text-gray-400">2x Маргарита, 1x Пеперони</p>
                  <p className="text-sm text-pizza-green">В процес на приготвяне</p>
                </div>
                <button className="bg-pizza-red hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors duration-200">
                  Обработи
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div>
                  <p className="font-medium text-white">Поръчка #1235</p>
                  <p className="text-sm text-gray-400">1x Дюнер, 1x Бургер</p>
                  <p className="text-sm text-yellow-500">Чака потвърждение</p>
                </div>
                <button className="bg-pizza-green hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors duration-200">
                  Потвърди
                </button>
              </div>
            </div>
            <Link 
              href="/admin/orders" 
              className="inline-block mt-4 text-pizza-red hover:text-pizza-green transition-colors duration-200"
            >
              Виж всички поръчки →
            </Link>
          </div>

          {/* Menu Management */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <FaPizzaSlice className="h-5 w-5 mr-2 text-pizza-green" />
              Управление на меню
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div>
                  <p className="font-medium text-white">Маргарита</p>
                  <p className="text-sm text-gray-400">Домати, моцарела, босилек</p>
                  <p className="text-sm text-pizza-green">15.90 лв.</p>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors duration-200">
                    Редактирай
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg transition-colors duration-200">
                    Скрый
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div>
                  <p className="font-medium text-white">Пеперони</p>
                  <p className="text-sm text-gray-400">Пеперони, моцарела, домати</p>
                  <p className="text-sm text-pizza-green">17.90 лв.</p>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors duration-200">
                    Редактирай
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg transition-colors duration-200">
                    Скрый
                  </button>
                </div>
              </div>
            </div>
            <Link 
              href="/admin/menu" 
              className="inline-block mt-4 text-pizza-red hover:text-pizza-green transition-colors duration-200"
            >
              Управлявай менюто →
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Последна активност</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
              <div className="w-2 h-2 bg-pizza-green rounded-full"></div>
              <span className="text-gray-300">Нова поръчка получена - #1236</span>
              <span className="text-sm text-gray-500 ml-auto">2 мин. назад</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Поръчка #1234 е готова за доставка</span>
              <span className="text-sm text-gray-500 ml-auto">15 мин. назад</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300">Нов продукт добавен - "Студена кафе"</span>
              <span className="text-sm text-gray-500 ml-auto">1 час назад</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminPage
