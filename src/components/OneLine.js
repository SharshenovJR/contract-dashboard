import { useState } from 'react';

// Всплывающая подсказка, привязанная к элементу
export const useBubble = (width) => {
  const [pos, setPos] = useState(null);
  const show = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 8);
    setPos({ left, top: rect.bottom + 8, width });
  };
  return [pos, show, () => setPos(null)];
};

export const Bubble = ({ pos, children }) => (pos
  ? (
    <span className="hint-bubble" role="tooltip" style={{ left: pos.left, top: pos.top, width: pos.width }}>
      {children}
    </span>
  )
  : null);

// Текст в одну строку: если не помещается — многоточие, полный текст при наведении
const OneLine = ({ children, className = '', as: Tag = 'span', tip }) => {
  const [pos, show, hide] = useBubble(320);

  const handleEnter = (e) => {
    const el = e.currentTarget;
    if (el.scrollWidth > el.clientWidth) show(e);
  };

  return (
    <Tag className={`one-line ${className}`.trim()} onMouseEnter={handleEnter} onMouseLeave={hide}>
      {children}
      <Bubble pos={pos}>{tip ?? children}</Bubble>
    </Tag>
  );
};

export default OneLine;
