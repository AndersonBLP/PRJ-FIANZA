import { useStore } from '../store/useStore';

export default function CategorySelector({ onSelect, disabled }) {
  const categories = useStore((state) => state.categories);

  return (
    <div className="flex space-x-4 overflow-x-auto p-4 snap-x hide-scrollbar">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat)}
          disabled={disabled}
          className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 active:scale-95 cursor-pointer'}
            ${cat.type === 'income' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}
            glass snap-center`}
        >
          <span className="text-3xl mb-2">{cat.icon}</span>
          <span className="text-xs font-medium text-text">{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
