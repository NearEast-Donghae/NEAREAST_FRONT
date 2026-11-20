import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import './Dropdown.css';

// 부드럽게 열리고 닫히는 선택 목록 (기본 <select>는 목록 모양·움직임을 바꿀 수 없어서 직접 만든다)
//  - 열림: 위에서 살짝 내려오며 나타남(Ease out) / 닫힘: 살짝 줄며 사라짐(Ease in)
//  - 키보드: ↑↓로 이동, Enter·Space로 고르기, Esc로 닫기 / 바깥을 누르면 닫힘

export interface DropdownOption { value: string; label: string; }

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  'aria-label': string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const CLOSE_MS = 150; // Dropdown.css의 닫힘 애니메이션 길이와 같게

export default function Dropdown({ value, options, onChange, 'aria-label': ariaLabel, placeholder = '선택', disabled, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const closeTimer = useRef<number>();
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  const show = () => {
    if (disabled) return;
    window.clearTimeout(closeTimer.current);
    setClosing(false);
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  };
  const hide = (focusButton = false) => {
    if (!open || closing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setOpen(false); }
    else { setClosing(true); closeTimer.current = window.setTimeout(() => { setOpen(false); setClosing(false); }, CLOSE_MS); }
    if (focusButton) buttonRef.current?.focus();
  };
  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    hide(true);
  };

  // 바깥을 누르면 닫기
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) hide(); };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  });
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  // 키보드로 고르는 항목이 목록 안에 보이게
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (disabled) return;
    if (!open || closing) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); show(); }
      return;
    }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((index) => Math.min(options.length - 1, index + 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => Math.max(0, index - 1)); }
    else if (event.key === 'Home') { event.preventDefault(); setActive(0); }
    else if (event.key === 'End') { event.preventDefault(); setActive(options.length - 1); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(active); }
    else if (event.key === 'Escape' || event.key === 'Tab') { if (event.key === 'Escape') event.preventDefault(); hide(event.key === 'Escape'); }
  };

  return <div ref={rootRef} className={`Dropdown${className ? ` ${className}` : ''}`}>
    <button ref={buttonRef} type="button" className="Dropdown-Button" disabled={disabled}
      role="combobox" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open && !closing} aria-controls={listId}
      aria-activedescendant={open ? `${listId}-${active}` : undefined}
      onClick={() => (open && !closing ? hide() : show())} onKeyDown={onKeyDown}>
      <span className={selected ? '' : 'Dropdown-Placeholder'}>{selected?.label ?? placeholder}</span>
      <svg className="Dropdown-Chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
    </button>
    {open && <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} className="Dropdown-List" data-state={closing ? 'closing' : 'open'}>
      {options.map((option, index) => <li key={option.value || '__empty'} id={`${listId}-${index}`} role="option"
        aria-selected={option.value === value}
        className={`Dropdown-Option${index === active ? ' is-active' : ''}${option.value === value ? ' is-selected' : ''}`}
        onPointerEnter={() => setActive(index)} onPointerDown={(event) => event.preventDefault()} onClick={() => choose(index)}>
        {option.label}
        {option.value === value && <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>}
      </li>)}
    </ul>}
  </div>;
}
