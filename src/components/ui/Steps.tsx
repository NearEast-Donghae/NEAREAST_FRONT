import { useCallback, useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import './Steps.css';

// 단계 표시(스테퍼) — 받은 프롬프트의 Steps 컴포넌트를 이 프로젝트(Tailwind·shadcn 없음)에 맞게 옮긴 것.
//  - 단계 사이 선이 '채워지며' 다음 단계로 넘어간다 (색이 툭 바뀌지 않게)
//  - 현재 단계를 표시하는 원이 다음 단계로 미끄러져 간다
//  - 끝낸 단계는 눌러서 돌아갈 수 있고, 아직 안 간 단계는 누를 수 없다
//  - 짧게 눌러도 눌림이 보이도록 최소 시간 유지 + 놓을 때 살짝 튕김

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error';
export type StepsSize = 'sm' | 'md' | 'lg';

export interface StepItem {
  title: ReactNode;
  description?: ReactNode;
  /** 실패처럼 index로 알 수 없는 상태를 직접 지정 */
  status?: StepStatus;
}

export interface StepsProps extends Omit<HTMLAttributes<HTMLOListElement>, 'onChange'> {
  items: StepItem[];
  /** 0부터 세는 현재 단계 */
  current: number;
  clickable?: boolean;
  onStepChange?: (index: number) => void;
  size?: StepsSize;
  'aria-label'?: string;
}

const STATUS_LABEL: Record<StepStatus, string> = { complete: '완료', current: '현재 단계', upcoming: '진행 전', error: '확인 필요' };
const MIN_VISIBLE = 90; // 눌림이 보이는 최소 시간(ms)

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

function usePressFeedback(disabled: boolean) {
  const [pressed, setPressed] = useState(false);
  const pressedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const press = useCallback(() => {
    if (disabled) return;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    pressedAt.current = Date.now();
    setPressed(true);
  }, [disabled]);
  const release = useCallback(() => {
    const remaining = Math.max(0, MIN_VISIBLE - (Date.now() - pressedAt.current));
    if (remaining === 0) { setPressed(false); return; }
    timer.current = setTimeout(() => setPressed(false), remaining);
  }, []);
  return { onPointerDown: press, onPointerUp: release, onPointerCancel: release, onPointerLeave: release, 'data-pressed': pressed ? 'true' : undefined };
}

const CheckIcon = () => <svg className="ui-steps__check" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 8.5l3 3 6-7" /></svg>;
const AlertIcon = () => <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 3.5v5.5M8 12.2v.3" /></svg>;

interface StepProps {
  item: StepItem; index: number; status: StepStatus; last: boolean; clickable: boolean;
  markerRef: (node: HTMLSpanElement | null) => void; onSelect?: (index: number) => void;
}

function Step({ item, index, status, last, clickable, markerRef, onSelect }: StepProps) {
  // 앞으로 가는 건 화면의 몫 — 이미 지나온 단계만 누를 수 있다
  const interactive = clickable && status !== 'upcoming' && status !== 'current';
  const pressProps = usePressFeedback(!interactive);
  const body = <>
    <span ref={markerRef} className="ui-steps__marker" aria-hidden="true">
      {status === 'complete' ? <CheckIcon /> : status === 'error' ? <AlertIcon /> : index + 1}
    </span>
    <span className="ui-steps__text">
      <span className="ui-steps__title">{item.title}</span>
      {item.description && <span className="ui-steps__description">{item.description}</span>}
    </span>
    <span className="ui-sr-only">{STATUS_LABEL[status]}</span>
  </>;
  return <li className="ui-steps__step" data-status={status} aria-current={status === 'current' ? 'step' : undefined}>
    {clickable
      ? <button {...pressProps} type="button" disabled={!interactive} onClick={() => onSelect?.(index)} className="ui-steps__body ui-steps__body--button">{body}</button>
      : <span className="ui-steps__body">{body}</span>}
    {!last && <span className="ui-steps__connector" aria-hidden="true" />}
  </li>;
}

export function Steps({ items, current, clickable = false, onStepChange, size = 'md', className, 'aria-label': ariaLabel = '진행 단계', ...rest }: StepsProps) {
  const statusAt = (index: number): StepStatus =>
    items[index]?.status ?? (index < current ? 'complete' : index === current ? 'current' : 'upcoming');

  // 현재 단계 원이 미끄러져 이동: 각 단계 원의 위치를 재서 따로 그린 원(thumb)을 옮긴다
  const listRef = useRef<HTMLOListElement>(null);
  const markers = useRef<(HTMLSpanElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ x: number; y: number; size: number } | null>(null);
  const firstMeasure = useRef(true);
  const measure = useCallback(() => {
    const list = listRef.current;
    const marker = markers.current[current];
    if (!list || !marker) return;
    const a = list.getBoundingClientRect();
    const b = marker.getBoundingClientRect();
    setThumb({ x: b.left - a.left, y: b.top - a.top, size: b.width });
  }, [current]);
  useLayoutEffect(() => { measure(); }, [measure, items.length]);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(() => { firstMeasure.current = true; measure(); });
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure]);
  const instant = firstMeasure.current;
  useEffect(() => { if (thumb) firstMeasure.current = false; }, [thumb]);

  const currentStatus = statusAt(current);
  return <ol {...rest} ref={listRef} aria-label={ariaLabel} data-size={size} className={cx('ui-steps', className)}>
    {thumb && currentStatus === 'current' && <span className={cx('ui-steps__thumb', instant && 'ui-steps__thumb--instant')} aria-hidden="true"
      style={{ width: thumb.size, height: thumb.size, transform: `translate(${thumb.x}px, ${thumb.y}px)` }}>{current + 1}</span>}
    {items.map((item, index) => <Step key={index} item={item} index={index} status={statusAt(index)} last={index === items.length - 1}
      clickable={clickable} onSelect={onStepChange} markerRef={(node) => { markers.current[index] = node; }} />)}
  </ol>;
}

export default Steps;
