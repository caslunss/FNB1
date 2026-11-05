import '../src/styles/app-entry.css';
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import FinanceSelect from '../src/components/FinanceSelect.tsx';
import {GlassTextField} from '../src/components/LiquidControls.tsx';

function QA() {
  const [value, setValue] = useState('a'), [result, setResult] = useState(''), [count, setCount] = useState(0);
  return <main style={{width:'min(100%,400px)',margin:'24px auto',padding:16}}>
    <h1>Teste de seleção</h1>
    <button onClick={() => document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'}>Tema</button>
    <form onSubmit={event => {event.preventDefault(); setResult(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));}}>
      <p>Controlado</p><GlassTextField><FinanceSelect label="Controlado" name="controlled" value={value} onChange={event => {setValue(event.target.value); setCount(n => n + 1);}}><option value="a">Essenciais</option><option value="disabled" disabled>Indisponível</option><option value="b">Variáveis</option><option value="c">Investimentos</option></FinanceSelect></GlassTextField>
      <p>Não controlado</p><GlassTextField><FinanceSelect label="Não controlado" name="uncontrolled" defaultValue="x"><option value="x">Mensal</option><option value="y">Anual</option></FinanceSelect></GlassTextField>
      <p>Obrigatório com validação</p><GlassTextField><FinanceSelect label="Obrigatório" name="required" required defaultValue=""><option value="">Escolher</option><option value="ok">Confirmado</option></FinanceSelect></GlassTextField>
      <p>Legado</p><label htmlFor="legacySelect">Pagamento legado</label><GlassTextField><FinanceSelect id="legacySelect" name="legacy" label="Pagamento legado" nativeControl defaultValue="Pix"><option>Pix</option><option>Débito</option><option>Cartão de crédito</option></FinanceSelect></GlassTextField>
      <p>Data</p><GlassTextField><input type="date" name="date" defaultValue="2026-11-04" min="2026-11-01" max="2026-11-30" aria-label="Data de teste"/></GlassTextField>
      <p>Desativado</p><GlassTextField><FinanceSelect label="Desativado" name="disabled" disabled><option value="off">Sem acesso</option></FinanceSelect></GlassTextField>
      <button type="submit">Enviar</button><button type="reset">Restaurar</button>
    </form>
    <output aria-live="polite">{result}</output><p>Alterações: {count}</p>
  </main>;
}
createRoot(document.getElementById('root')).render(<QA/>);
