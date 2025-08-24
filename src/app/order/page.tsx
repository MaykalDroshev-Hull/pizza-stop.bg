'use client'

import { useState } from 'react'
import { Search, Star, Clock, Plus } from 'lucide-react'

// Mock data (same as main page)
const menuData = {
  pizza: [
    { id: 1, name: 'Маргарита', price: 18.90, image: '🍕', category: 'pizza', rating: 4.8, time: '15-20 мин' },
    { id: 2, name: 'Пепперони', price: 22.90, image: '🍕', category: 'pizza', rating: 4.9, time: '15-20 мин' },
    { id: 3, name: 'Капричоза', price: 24.90, image: '🍕', category: 'pizza', rating: 4.7, time: '15-20 мин' },
    { id: 4, name: 'Кватро Формаджи', price: 26.90, image: '🍕', category: 'pizza', rating: 4.9, time: '15-20 мин' },
    { id: 5, name: 'Вегетарианска', price: 20.90, image: '🍕', category: 'pizza', rating: 4.6, time: '15-20 мин' }
  ],
  doners: [
    { id: 11, name: 'Класически дюнер', price: 8.50, image: '🥙', category: 'doners', rating: 4.7, time: '8-12 мин' },
    { id: 12, name: 'Пилешки дюнер', price: 9.50, image: '🥙', category: 'doners', rating: 4.8, time: '8-12 мин' },
    { id: 13, name: 'Вегански дюнер', price: 7.50, image: '🥙', category: 'doners', rating: 4.5, time: '8-12 мин' },
    { id: 14, name: 'Дюнер с риба', price: 10.50, image: '🥙', category: 'doners', rating: 4.6, time: '8-12 мин' }
  ],
  burgers: [
    { id: 21, name: 'Класически бургер', price: 12.90, image: '🍔', category: 'burgers', rating: 4.6, time: '10-15 мин' },
    { id: 22, name: 'Чийзбургер', price: 14.90, image: '🍔', category: 'burgers', rating: 4.7, time: '10-15 мин' },
    { id: 23, name: 'Бейкън бургер', price: 16.90, image: '🍔', category: 'burgers', rating: 4.8, time: '10-15 мин' },
    { id: 24, name: 'Вегански бургер', price: 13.90, image: '🍔', category: 'burgers', rating: 4.5, time: '10-15 мин' }
  ],
  drinks: [
    { id: 31, name: 'Кока-кола', price: 3.50, image: '🥤', category: 'drinks', sizes: ['330ml', '500ml'], rating: 4.5, time: '2-5 мин' },
    { id: 32, name: 'Фанта', price: 3.50, image: '🥤', category: 'drinks', sizes: ['330ml', '500ml'], rating: 4.5, time: '2-5 мин' },
    { id: 33, name: 'Вода', price: 2.50, image: '💧', category: 'drinks', sizes: ['500ml', '1.5L'], rating: 4.4, time: '2-5 мин' },
    { id: 34, name: 'Сок портокал', price: 4.50, image: '🧃', category: 'drinks', sizes: ['330ml'], rating: 4.6, time: '2-5 мин' }
  ]
}

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('pizza')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = [
    { key: 'pizza', label: '🍕 Пица', count: menuData.pizza.length },
    { key: 'doners', label: '🥙 Дюнер', count: menuData.doners.length },
    { key: 'burgers', label: '🍔 Бургери', count: menuData.burgers.length },
    { key: 'drinks', label: '🥤 Напитки', count: menuData.drinks.length }
  ]

  const filteredItems = menuData[activeCategory]?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-white/8 sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <h1 className="text-3xl font-bold text-text">Поръчай сега!</h1>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Търсене в менюто..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 bg-card border border-white/12 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent w-64 text-text placeholder-muted"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Category tabs */}
      <div className="bg-card border-b border-white/8 sticky top-20 z-30">
        <div className="container py-4">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`px-6 py-3 rounded-xl whitespace-nowrap transition-all transform hover:scale-105 ${
                  activeCategory === category.key
                    ? 'bg-gradient-to-r from-red to-orange text-white shadow-lg'
                    : 'text-muted hover:text-orange hover:bg-white/6'
                }`}
              >
                <span className="font-medium">{category.label}</span>
                <span className="ml-2 text-sm opacity-75">({category.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="container py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-muted text-xl mb-4">Няма намерени резултати</p>
            <button
              onClick={() => { setSearchTerm(''); setActiveCategory('pizza'); }}
              className="bg-gradient-to-r from-red to-orange text-white px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105"
            >
              Изчисти филтрите
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="card group hover:shadow-xl transition-all transform hover:-translate-y-2 overflow-hidden">
                <div className="text-6xl text-center py-8 bg-gradient-to-br from-red/10 to-orange/10 group-hover:scale-110 transition-transform duration-300">
                  {item.image}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-text">{item.name}</h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-orange font-bold text-2xl">{item.price.toFixed(2)} лв.</span>
                    <div className="flex items-center text-sm text-muted">
                      <Star className="w-4 h-4 text-yellow fill-current mr-1" />
                      {item.rating}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted mb-4">
                    <Clock className="w-4 h-4 mr-1" />
                    {item.time}
                  </div>

                  {item.sizes && (
                    <div className="mb-4">
                      <p className="text-sm text-muted mb-2">Размери:</p>
                      <div className="flex space-x-2">
                        {item.sizes.map(size => (
                          <span key={size} className="px-3 py-1 bg-white/8 text-text rounded-lg text-sm border border-white/12">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      // This would open the configurator in a real app
                      alert(`Добавено в количката: ${item.name}`)
                    }}
                    className="w-full bg-gradient-to-r from-red to-orange text-white py-3 px-4 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Добави в количката</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to home button */}
      <div className="text-center py-8">
        <a
          href="/"
          className="inline-flex items-center space-x-2 bg-white/8 hover:bg-white/12 text-text px-6 py-3 rounded-xl font-medium transition-all border border-white/12 hover:border-white/20"
        >
          ← Назад към началната страница
        </a>
      </div>
    </div>
  )
}
