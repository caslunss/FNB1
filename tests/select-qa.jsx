import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import FinanceSelect from '../src/components/FinanceSelect.jsx';
import {GlassTextField} from '../src/components/LiquidControls.jsx';
import '../src/styles/root.css';
import '../src/styles/workspace.css';
import '@zakisheriff/liquid-glass/styles.css';
import '../src/styles/liquid-glass.css';
import '../src/styles/layout-settings.css';
import '../src/styles/mobile.css';

function QA() {
  const [value, setValue] = useState('a'), [result, setResult] = useState(''), [count, setCount] = useState(0);
  return <main style={{width:'min(100%,400px)',margin:'24px auto',padding:16}}>
    <h1>Teste de seleção</h1>
    <button onClick={() => document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'}>Tema</button>
    <form onSubmit={event => {event.preventDefault(); setResult(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));}}>
      <p>Controlado</p><GlassTextField><FinanceSelect label="Controlado" name="controlled" value={value} onChange={event => {setValue(event.target.value); setCount(n => n + 1);}}><option value="a">Essenciais</option><option value="disabled" disabled>Indisponível</option><option value="b">Variáveis</option><option value="c">Investimentos</option></FinanceSelect></GlassTextField>
      <p>Não controlado</p><GlassTextField><FinanceSelect label="Não controlado" name="uncontrolled" defaultValue="x"><option value="x">Mensal</option><option value="y">Anual</option></FinanceSelect></GlassTextField>
      <p>Obrigatório nativo</p><GlassTextField><FinanceSelect label="Obrigatório" name="required" required defaultValue=""><option value="">Escolher</option><option value="ok">Confirmado</option></FinanceSelect></GlassTextField>
      <p>Desativado</p><GlassTextField><FinanceSelect label="Desativado" name="disabled" disabled><option value="off">Sem acesso</option></FinanceSelect></GlassTextField>
      <button type="submit">Enviar</button><button type="reset">Restaurar</button>
    </form>
    <output aria-live="polite">{result}</output><p>Alterações: {count}</p>
  </main>;
}
createRoot(document.getElementById('root')).render(<QA/>);
