import {isSafeInteger} from './type-guards.ts';
/** Decimal half-up conversion at external API boundaries; calculations use integer cents. */
export function decimalCents(value:unknown){
 if(typeof value!=='number'&&typeof value!=='string')throw Error('Valor monetário inválido.');
 if(String(value).length>100)throw Error('Valor fora do limite.');
 const match=String(value).trim().match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
 if(!match)throw Error('Valor monetário inválido.');
 const exponent=Number(match[4]||0);if(Math.abs(exponent)>100)throw Error('Valor fora do limite.');
 const digits=BigInt(match[2]+(match[3]||'')),scale=(match[3]||'').length-exponent-2;
 const divisor=scale>0?10n**BigInt(scale):1n;
 const cents=scale>0?(digits+divisor/2n)/divisor:digits*10n**BigInt(-scale);
 const result=Number(match[1]==='-'?-cents:cents);
 if(!isSafeInteger(result))throw Error('Valor fora do limite.');return result;
}
