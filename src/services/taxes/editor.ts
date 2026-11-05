import type {TaxRecord} from '../../types/taxes';
/** Pure hydration shared by Add and Review; never reset an existing record silently. */
export function taxEditorSelection(id:string,records:TaxRecord[],supplied?:TaxRecord|null){
 const record=supplied??records.find(row=>row.itemId===id)??null;
 return {id,record,taxText:record?.input?.documentTotalCents==null?'':(record.input.documentTotalCents/100).toFixed(2).replace('.',',')};
}
