const assert=require('node:assert/strict');
const {taxEditorSelection}=require('../src/services/taxes/editor.ts');
const record={itemId:'purchase',input:{documentTotalCents:1000,uf:'SP',documentName:'nota',items:[]},revision:7};
assert.deepEqual(taxEditorSelection('purchase',[record]),taxEditorSelection('purchase',[record],record));
assert.equal(taxEditorSelection('purchase',[record]).taxText,'10,00');assert.equal(taxEditorSelection('purchase',[record]).record.revision,7);assert.equal(taxEditorSelection('new',[record]).record,null);
console.log('PASS tax editor: Add/Review share existing input, document and revision');
