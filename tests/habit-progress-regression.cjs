const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=require('./controller-source.cjs'),context=vm.createContext({esc:x=>String(x),brl:x=>String(x)});
vm.runInContext(source.slice(source.indexOf('function habitBars(rows){'),source.indexOf('\nfunction behaviorView(){')),context);
const output=context.habitBars([{label:'A',cents:300,attention:false},{label:'B',cents:100,attention:true}]);
assert.match(output,/data-value="75"/);assert.match(output,/data-value="25"/);assert.match(output,/data-status="Do total"/);assert.match(output,/data-attention="true"/);
const empty=context.habitBars([{label:'Zero',cents:0}]);assert.match(empty,/Sem gastos/);assert.doesNotMatch(empty,/NaN|Infinity/);
console.log('PASS indicadores de hábitos: participação real do total, atenção e zero sem divisão inválida.');
