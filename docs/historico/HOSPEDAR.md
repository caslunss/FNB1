Versão do documento: 0.1.0-alpha.1


### Consulta pública do CDI

A nova aba inclui `netlify/functions/market-rates.mjs`. Não requer chave de API: consulta a série anualizada 4389 do Banco Central e usa cache de uma hora. Publique o projeto com o build e as Functions (integração Git do Netlify ou CLI com `netlify deploy --prod --dir=dist --functions=netlify/functions` após o build). Enviar apenas arquivos estáticos por arrastar e soltar não publica essa função. A calculadora continua funcionando com a referência datada ou uma taxa informada manualmente quando a consulta não responde. Cartões utilizam o mesmo Supabase/configuração já existente, sem SQL adicional.
