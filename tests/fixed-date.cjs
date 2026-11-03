// Historical financial fixtures stay reproducible after the month closes.
const NativeDate=Date;
module.exports=class FixedDate extends NativeDate{constructor(...args){super(...(args.length?args:['2026-10-31T12:00:00-03:00']))}static now(){return NativeDate.parse('2026-10-31T12:00:00-03:00')}};
