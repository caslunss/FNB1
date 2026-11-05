// Never include payloads, URLs with query strings, tokens or user identifiers.
export function recordFailure(operation,status){
 const requestId=crypto.randomUUID();console.error(JSON.stringify({event:'integration_failure',requestId,operation,status,time:new Date().toISOString()}));return requestId;
}
