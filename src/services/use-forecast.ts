import {useEffect,useMemo,useState} from 'react';
import {auth} from './auth.ts';
import {useFinanceSnapshot} from './use-finance';
import {FORECAST_EVENT,FORECAST_KEY,forecastModel,readForecastSettings} from './forecast-settings';
import {RECURRENCE_EVENT,RECURRENCE_KEY,readRecurrenceDecisions} from './recurrence-decisions';
export function useForecast(){
 const source=useFinanceSnapshot('forecast'),[revision,update]=useState(0);
 useEffect(()=>{const sync=()=>update(value=>value+1),storage=(event:StorageEvent)=>{if(event.key===null||event.key===auth.key(FORECAST_KEY)||event.key===auth.key(RECURRENCE_KEY))sync()};addEventListener(FORECAST_EVENT,sync);addEventListener(RECURRENCE_EVENT,sync);addEventListener('storage',storage);return()=>{removeEventListener(FORECAST_EVENT,sync);removeEventListener(RECURRENCE_EVENT,sync);removeEventListener('storage',storage)}},[]);
 const settings=useMemo(()=>readForecastSettings(auth.storage,source.today),[source,revision]);
 const decisions=useMemo(()=>readRecurrenceDecisions(auth.storage),[source,revision]);
 const result=useMemo(()=>forecastModel(source,settings,decisions),[source,settings,decisions]);return {source,settings,result};
}
