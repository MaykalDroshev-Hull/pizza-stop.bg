import { Plus } from "lucide-react";

interface Addon {
  id: number;
  name: string;
  price: string;
  category: string;
}

const AddonsTab = (): React.JSX.Element => {
  const addons: Addon[] = [
    { id: 1, name: "Extra Cheese", price: "2.99", category: "Toppings" },
    { id: 2, name: "Mushrooms", price: "1.99", category: "Toppings" },
    { id: 3, name: "Pepperoni", price: "2.99", category: "Toppings" },
    { id: 4, name: "Olives", price: "1.99", category: "Toppings" },
    { id: 5, name: "Bacon", price: "3.99", category: "Toppings" },
    { id: 6, name: "Pineapple", price: "1.99", category: "Toppings" },
  ];

  const handleEditAddon = (addonId: number): void => {
    console.log(`Editing addon with ID: ${addonId}`);
    // TODO: Implement edit functionality
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {addons.map((addon: Addon) => (
        <div key={addon.id} className="bg-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-green-500 transition-all duration-300 group">
          <div className="w-full h-32 bg-gray-800 rounded-xl mb-4 flex items-center justify-center">
            <Plus className="w-12 h-12 text-gray-600 group-hover:text-green-500 transition-colors" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">
              {addon.name}
            </h3>
            <p className="text-gray-400">{addon.category}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-400">${addon.price}</span>
              <button 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-2xl transition-colors"
                onClick={() => handleEditAddon(addon.id)}
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

export default AddonsTab;
