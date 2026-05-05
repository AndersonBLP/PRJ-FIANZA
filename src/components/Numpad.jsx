import { Delete } from 'lucide-react';

export default function Numpad({ value, onChange }) {
  const handlePress = (key) => {
    if (key === 'backspace') {
      onChange(value.length > 1 ? value.slice(0, -1) : '0');
    } else if (key === '.') {
      if (!value.includes('.')) {
        onChange(value + '.');
      }
    } else {
      onChange(value === '0' ? key : value + key);
    }
  };

  const buttons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '.', '0', 'backspace'
  ];

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-surface/50 rounded-2xl glass">
      {buttons.map((btn) => (
        <button
          key={btn}
          onClick={() => handlePress(btn)}
          className="h-16 flex items-center justify-center text-2xl font-semibold bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-xl transition-colors"
        >
          {btn === 'backspace' ? <Delete size={28} /> : btn}
        </button>
      ))}
    </div>
  );
}
