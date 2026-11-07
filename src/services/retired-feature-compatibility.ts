/** Compatibility only: retain retired local data without offering UI or executing it. */
export const RETIRED_STORAGE_KEYS=['plan12carbon_v1'] as const;
export function retiredLayoutSections(sections?:Record<string,boolean>):Record<string,boolean>{
 return typeof sections?.carbon==='boolean'?{carbon:sections.carbon}:{};
}
export function retiredAreaView(value:string){return value==='analysis:carbon'?'analysis:taxes':value;}
