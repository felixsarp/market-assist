import { useState, useEffect, useRef } from 'react';
import { DEFAULT_ITEMS } from './items';

const SAVE_KEY = 'market-assist-v1';

function buildInitialState() {
  return DEFAULT_ITEMS.map((item, i) => ({
    ...item,
    id: `base-${i}`,
    bought: false,
    actualPrice: null,
    custom: false,
  }));
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return buildInitialState();
    const saved = JSON.parse(raw);

    // Restore base items with saved bought/price
    const base = buildInitialState().map(item => {
      const s = saved.base?.find(b => b.id === item.id);
      return s ? { ...item, bought: s.bought, actualPrice: s.actualPrice } : item;
    });

    // Append custom items
    const custom = (saved.custom || []).map(c => ({ ...c, custom: true }));
    return [...base, ...custom];
  } catch {
    return buildInitialState();
  }
}

export function useMarketState() {
  const [state, setState] = useState(loadState);
  const [savedAt, setSavedAt] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      const base = state.filter(s => !s.custom).map(({ id, bought, actualPrice }) => ({ id, bought, actualPrice }));
      const custom = state.filter(s => s.custom);
      localStorage.setItem(SAVE_KEY, JSON.stringify({ base, custom }));
    } catch {}

    setSavedAt(Date.now());
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSavedAt(null), 2000);
  }, [state]);

  const toggleBought = (id) => {
    setState(prev => prev.map(item =>
      item.id === id ? { ...item, bought: !item.bought } : item
    ));
  };

  const setPrice = (id, val) => {
    const v = parseFloat(val);
    setState(prev => prev.map(item =>
      item.id === id ? { ...item, actualPrice: isNaN(v) || v < 0 ? null : v } : item
    ));
  };

  const addItem = ({ name, cat, est }) => {
    const newItem = {
      id: `custom-${Date.now()}`,
      name,
      cat,
      est: est || null,
      bought: false,
      actualPrice: null,
      custom: true,
    };
    setState(prev => [...prev, newItem]);
    return newItem.id;
  };

  const deleteItem = (id) => {
    setState(prev => prev.filter(item => item.id !== id));
  };

  const resetAll = () => {
    setState(buildInitialState());
  };

  return { state, savedAt, toggleBought, setPrice, addItem, deleteItem, resetAll };
}
