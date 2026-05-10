'use client';
import { useApp } from '@/context/AppContext';

export default function Toast() {
  const { toast } = useApp();
  return (
    <div className={`toast${toast.visible ? ' v' : ''}`}>{toast.msg}</div>
  );
}
