import { useState, useRef, useEffect } from 'react';
import { useMarketState } from './useMarketState';
import { CATEGORIES } from './items';
import './App.css';

function PriceTag({ item }) {
  if (item.actualPrice !== null)
    return <span className="price actual">GH₵ {parseFloat(item.actualPrice).toFixed(2)}</span>;
  if (item.est)
    return <span className="price est">est. GH₵{item.est}</span>;
  return <span className="price tbd">price TBD</span>;
}

function ItemCard({ item, onToggle, onPrice, onDelete }) {
  return (
    <div className={`item-card${item.bought ? ' bought' : ''}`}>
      <div className="item-row" onClick={() => onToggle(item.id)}>
        <div className="check-circle">
          {item.bought && (
            <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
              <path d="M1 5L4.5 8.5L12 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div className="item-info">
          <div className="item-name">{item.name}</div>
        </div>
        <PriceTag item={item} />
        <button
          className="delete-btn"
          onClick={e => { e.stopPropagation(); onDelete(item.id); }}
          aria-label="Remove item"
        >✕</button>
      </div>
      {item.bought && (
        <div className="price-input-row">
          <label>Actual price (GH₵):</label>
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="0.00"
            defaultValue={item.actualPrice ?? ''}
            onChange={e => onPrice(item.id, e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function AddPanel({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [est, setEst] = useState('');
  const nameRef = useRef();

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleAdd = () => {
    if (!name.trim()) { nameRef.current?.focus(); return; }
    onAdd({ name: name.trim(), cat, est: parseFloat(est) || null });
    setName(''); setEst('');
  };

  const handleKey = e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onClose(); };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="add-panel" onKeyDown={handleKey}>
        <h3>Add Item</h3>
        <input
          ref={nameRef}
          type="text"
          placeholder="Item name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <select value={cat} onChange={e => setCat(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="number"
          placeholder="Est. price (GH₵) — optional"
          min="0"
          step="0.5"
          value={est}
          onChange={e => setEst(e.target.value)}
        />
        <button className="btn-add" onClick={handleAdd}>Add to List</button>
      </div>
    </>
  );
}

export default function App() {
  const { state, savedAt, toggleBought, setPrice, addItem, deleteItem, resetAll } = useMarketState();
  const [showAdd, setShowAdd] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const newItemRef = useRef(null);

  const handleAdd = (data) => {
    const id = addItem(data);
    newItemRef.current = id;
    setShowAdd(false);
    setTimeout(() => {
      document.querySelector(`[data-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handleReset = () => { resetAll(); setShowReset(false); };

  const bought = state.filter(s => s.bought).length;
  const total = state.length;
  const spent = state.reduce((sum, s) => s.actualPrice != null ? sum + s.actualPrice : sum, 0);
  const remaining = total - bought;

  // Group by category
  const cats = {};
  state.forEach(item => {
    if (!cats[item.cat]) cats[item.cat] = [];
    cats[item.cat].push(item);
  });

  return (
    <div className="app">
      <header>
        <div className="header-top">
          <div>
            <h1>🛒 Market Assist</h1>
            <p>Tap to check off · Enter actual price</p>
          </div>
          <div className="header-right">
            {savedAt && <span className="saved-badge"><span className="saved-dot" />Saved</span>}
            <button className="btn-reset-sm" onClick={() => setShowReset(true)}>Reset</button>
          </div>
        </div>
      </header>

      <div className="summary-bar">
        <span><strong>{bought}</strong> of <strong>{total}</strong> bought</span>
        <span>GH₵ <strong>{spent.toFixed(2)}</strong> spent</span>
      </div>

      <main>
        {Object.entries(cats).map(([cat, items]) => (
          <section key={cat} className="category">
            <div className="category-label">{cat}</div>
            {items.map(item => (
              <div key={item.id} data-id={item.id}>
                <ItemCard
                  item={item}
                  onToggle={toggleBought}
                  onPrice={setPrice}
                  onDelete={deleteItem}
                />
              </div>
            ))}
          </section>
        ))}
        <div className="footer-note">
          {remaining > 0
            ? `${remaining} item${remaining !== 1 ? 's' : ''} still to buy`
            : '✓ All done — happy cooking!'}
        </div>
      </main>

      {showAdd && <AddPanel onAdd={handleAdd} onClose={() => setShowAdd(false)} />}

      {showReset && (
        <div className="overlay" onClick={() => setShowReset(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <p>Reset all items and prices?<br/><small>Custom items will also be removed.</small></p>
            <div className="confirm-btns">
              <button onClick={() => setShowReset(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleReset}>Yes, Reset</button>
            </div>
          </div>
        </div>
      )}

      <button
        className={`fab${showAdd ? ' open' : ''}`}
        onClick={() => setShowAdd(v => !v)}
        aria-label="Add item"
      >+</button>
    </div>
  );
}
