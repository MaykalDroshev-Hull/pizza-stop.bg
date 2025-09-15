import { Coffee } from "lucide-react";

interface Beverage {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
}

const BeverageTab = (): React.JSX.Element => {
  const beverages: Beverage[] = [
    { id: 1, name: "Coca Cola", price: "2.99", category: "Soft Drinks", image: "/coca-cola.jpg" },
    { id: 2, name: "Sprite", price: "2.99", category: "Soft Drinks", image: "/sprite.jpg" },
    { id: 3, name: "Fanta", price: "2.99", category: "Soft Drinks", image: "/fanta.jpg" },
    { id: 4, name: "Water", price: "1.99", category: "Beverages", image: "/water.jpg" },
    { id: 5, name: "Orange Juice", price: "3.99", category: "Juices", image: "/orange-juice.jpg" },
    { id: 6, name: "Beer", price: "4.99", category: "Alcoholic", image: "/beer.jpg" },
  ];

  const handleEditBeverage = (beverageId: number): void => {
    console.log(`Editing beverage with ID: ${beverageId}`);
    // TODO: Implement edit functionality
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {beverages.map((beverage: Beverage) => (
        <div key={beverage.id} className="bg-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-blue-500 transition-all duration-300 group">
          <div className="w-full h-48 bg-gray-800 rounded-xl mb-4 flex items-center justify-center">
            <Coffee className="w-16 h-16 text-gray-600 group-hover:text-blue-500 transition-colors" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {beverage.name}
            </h3>
            <p className="text-gray-400">{beverage.category}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-400">${beverage.price}</span>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl transition-colors"
                onClick={() => handleEditBeverage(beverage.id)}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BeverageTab;
