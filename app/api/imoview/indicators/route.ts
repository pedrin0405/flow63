import { NextResponse } from 'next/server';

const cache = new Map();

export async function POST(req: Request) { 
    try {
        const body = await req.json();
        const { filters, action } = body;
        
        // Cache inteligente baseado no estado do filtro
        const cacheKey = JSON.stringify({ action, filters });
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.time < 600000)) return NextResponse.json(cached.data);

        const credentials = {
            codigoConvenio: process.env.IMOVIEW_CONVENIO,
            rota: process.env.IMOVIEW_ROTA,
            login: process.env.IMOVIEW_LOGIN,
            senha: process.env.IMOVIEW_SENHA,
        };

        // 1. Autenticação e Extração de Cookies
        const loginRes = await fetch('https://app.imoview.com.br/Login/LogOn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        const setCookie = loginRes.headers.get('set-cookie') || "";
        const cookieStr = `ASP.NET_SessionId=${setCookie.match(/ASP.NET_SessionId=([^;]+)/)?.[1] || ''}; .ASPXAUTH=${setCookie.match(/\.ASPXAUTH=([^;]+)/)?.[1] || ''}; auth_token_apiGerencia=${setCookie.match(/auth_token_apiGerencia=([^;]+)/)?.[1] || ''};`;

        const commonHeaders = {
            'Cookie': cookieStr,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json, text/javascript, */*; q=0.01'
        };

        // 2. Roteamento de Ações Secundárias
        if (['getEquipes', 'getEtiquetas'].includes(action)) {
            const endpoint = action === 'getEtiquetas' ? 'Etiqueta/Pesquisar?tiposRels=5' : (action === 'getEquipes' ? 'Equipe/RetornarEquipes' : 'Equipe/RetornarCorretores');
            const res = await fetch(`https://app.imoview.com.br/${endpoint}?${new URLSearchParams(filters)}`, { headers: commonHeaders });
            const data = await res.json();
            return NextResponse.json(data);
        }
        if (action === 'getCorretores') {
            const params = new URLSearchParams({
                codigoEquipe: filters?.CodigoEquipe || '0',
                codigoUnidade: filters?.CodigoUnidade || '1048',
                finalidade: filters?.Finalidade || '2'
            });

            const response = await fetch(`https://app.imoview.com.br/Equipe/RetornarCorretores?${params.toString()}`, {
                headers: commonHeaders
            });

            if (!response.ok) return NextResponse.json([]); // Evita que o erro trave o front
            const data = await response.json();
            return NextResponse.json(data);
        }

        // 3. Extração Massiva de Indicadores
        const indicatorsUrl = `https://app.imoview.com.br/Atendimento/Indicadores?${new URLSearchParams(filters)}`;
        const htmlRes = await fetch(indicatorsUrl, { headers: { ...commonHeaders, 'Accept': 'text/html' } });
        const html = await htmlRes.text();

        // --- MOTOR DE EXTRAÇÃO DE ALTA CAPACIDADE ---
        const parseNum = (val: string | undefined) => parseInt(val?.replace(/\./g, '') || "0");

        function engineExtrair(html: string) {
            const res: any = { body: {} };

            // A) Extrator de JSON por Delimitador (Captura arrays de qualquer tamanho)
            const extractRawArray = (chartId: string) => {
                const trigger = `makeChart("${chartId}"`;
                const startIdx = html.indexOf(trigger);
                if (startIdx === -1) return [];

                const providerKey = '"dataProvider":';
                const providerIdx = html.indexOf(providerKey, startIdx);
                if (providerIdx === -1) return [];

                let depth = 0;
                let buffer = "";
                let recording = false;

                for (let i = providerIdx + providerKey.length; i < html.length; i++) {
                    if (html[i] === '[') { depth++; recording = true; }
                    if (recording) buffer += html[i];
                    if (html[i] === ']') {
                        depth--;
                        if (depth === 0) break;
                    }
                }

                try {
                    // Limpeza agressiva para garantir o parse de centenas de itens
                    const cleanJson = buffer.replace(/,\s*\]/g, ']').replace(/undefined/g, 'null');
                    return JSON.parse(cleanJson).map((item: any) => ({
                        categoria: item.category || item.title || item.titleSformatar || "Sem nome",
                        valor: Number(item["column-1"] || item.valueReal || item.value || 0)
                    }));
                } catch { return []; }
            };

            // B) Mapeamento de Indicadores Principais
            res.body.indicadoresGerais = {
                totalAtendimentos: parseNum(html.match(/fa-phone[\s\S]*?h1[^>]*>([\d.]+)/i)?.[1]),
                visitasSemParecer: parseNum(html.match(/semParecer[\s\S]*?h1[^>]*>([\d.]+)/i)?.[1])
            };

            // C) Funil Semanal (Extração Global)
            const rowRegex = /<tr>\s*<td>(.*?)<\/td>[\s\S]*?(\d+)<\/a>[\s\S]*?(\d+)<\/a>[\s\S]*?(\d+)<\/a>[\s\S]*?(\d+)<\/a>[\s\S]*?(\d+)<\/a>/g;
            res.body.funilDeVendasSemanal = Array.from(html.matchAll(rowRegex)).map(m => ({
                semana: m[1].trim(),
                atendimentos: parseNum(m[2]),
                visitas: parseNum(m[3]),
                propostas: parseNum(m[4]),
                negocios: parseNum(m[5]),
                descartes: parseNum(m[6])
            }));

            const totalRow = res.body.funilDeVendasSemanal.find((s: any) => s.semana.toLowerCase().includes("total")) || {};
            res.body.funilDeVendasTotal = { ...totalRow };

            // D) Atividades (Captura todas as linhas da tabela de atividades)
            res.body.atividades = {};
            const activRegex = /<tr>\s*<td>([^<]+)<\/td>\s*<td><a[^>]*>([\d.]+)<\/a><\/td>\s*<td><a[^>]*>([\d.]+)<\/a><\/td>\s*<\/tr>/g;
            Array.from(html.matchAll(activRegex)).forEach(m => {
                res.body.atividades[m[1].replace(/\s+/g, '')] = { 
                    atendimento: parseNum(m[2]), 
                    atividade: parseNum(m[3]) 
                };
            });

            // E) Dados Gráficos (Extração por Buffer para garantir volume de dados)
            res.body.dadosGraficos = {
                termometro: extractRawArray("chartTermometroV"),
                midiaDeOrigem: extractRawArray("chartMidiaV"),
                motivoDescarte: extractRawArray("chartMotivoDescarteV"),
                ultimaInteracao: extractRawArray("chartUltimaInteracaoV"),
                tipoAtendimento: extractRawArray("chartTipoAtendimentoV")
            };

            // F) Etapas da Jornada
            const etapas = ["Pré-atendimento", "Seleção do Perfil", "Seleção dos Imóveis", "Lead qualificado", "Agendamento", "Visita", "Proposta"];
            res.body.etapasAtendimento = etapas.map(nome => ({
                nome, quantidade: parseNum(html.match(new RegExp(`${nome}[\\s\\S]*?h4">(\\d+)`, "i"))?.[1])
            }));

            return res;
        }

        const data = engineExtrair(html);
        cache.set(cacheKey, { data, time: Date.now() });
        
        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: true, message: error.message }, { status: 500 });
    }
}