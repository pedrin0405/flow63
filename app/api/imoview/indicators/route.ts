import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicialização do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const cache = new Map();

export async function POST(req: Request) { 
    try {
        const body = await req.json();
        const { filters, action, instanceName } = body;

        if (!instanceName) {
            return NextResponse.json({ error: true, message: "instanceName é obrigatório" }, { status: 400 });
        }
        
        // Cache inteligente baseado no estado do filtro e na instância selecionada
        const cacheKey = JSON.stringify({ action, filters, instanceName });
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.time < 600000)) return NextResponse.json(cached.data);

        // 1. Buscar configurações da instância no Supabase
        const { data: settings, error: settingsError } = await supabase
            .from('company_settings')
            .select('*')
            .eq('instance_name', instanceName)
            .single();

        if (settingsError || !settings) {
            return NextResponse.json({ error: true, message: "Instância não encontrada no banco de dados" }, { status: 404 });
        }

        // Parse do api_config (JSON)
        const config = typeof settings.api_config === 'string' 
            ? JSON.parse(settings.api_config) 
            : settings.api_config;

        const credentials = {
            codigoConvenio: config.codigoConvenio?.value,
            rota: config.rota?.value,
            login: config.login?.value,
            senha: config.senha?.value,
        };

        const baseUrl = settings.url_site.replace(/\/$/, ''); // Remove barra final da URL se existir

        // 2. Autenticação e Extração de Cookies usando a URL e credenciais dinâmicas
        const loginRes = await fetch(`${baseUrl}/Login/LogOn`, {
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

        // 3. Roteamento de Ações Secundárias com URL dinâmica
        if (['getEquipes', 'getEtiquetas'].includes(action)) {
            const endpoint = action === 'getEtiquetas' ? 'Etiqueta/Pesquisar?tiposRels=5' : (action === 'getEquipes' ? 'Equipe/RetornarEquipes' : 'Equipe/RetornarCorretores');
            const res = await fetch(`${baseUrl}/${endpoint}?${new URLSearchParams(filters)}`, { headers: commonHeaders });
            const data = await res.json();
            return NextResponse.json(data);
        }
        
        if (action === 'getCorretores') {
            const params = new URLSearchParams({
                codigoEquipe: filters?.CodigoEquipe || '0',
                codigoUnidade: filters?.CodigoUnidade || '1048',
                finalidade: filters?.Finalidade || '2'
            });

            const response = await fetch(`${baseUrl}/Equipe/RetornarCorretores?${params.toString()}`, {
                headers: commonHeaders
            });

            if (!response.ok) return NextResponse.json([]); 
            const data = await response.json();
            return NextResponse.json(data);
        }

        // 4. Extração Massiva de Indicadores
        const indicatorsUrl = `${baseUrl}/Atendimento/Indicadores?${new URLSearchParams(filters)}`;
        const htmlRes = await fetch(indicatorsUrl, { headers: { ...commonHeaders, 'Accept': 'text/html' } });
        const html = await htmlRes.text();

        // --- MOTOR DE EXTRAÇÃO DE ALTA CAPACIDADE (MANTIDO ORIGINAL) ---
        const parseNum = (val: string | undefined) => parseInt(val?.replace(/\./g, '') || "0");

        function engineExtrair(html: string) {
            const res: any = { body: {} };

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
                    const cleanJson = buffer.replace(/,\s*\]/g, ']').replace(/undefined/g, 'null');
                    return JSON.parse(cleanJson).map((item: any) => ({
                        categoria: item.category || item.title || item.titleSformatar || "Sem nome",
                        valor: Number(item["column-1"] || item.valueReal || item.value || 0)
                    }));
                } catch { return []; }
            };

            res.body.indicadoresGerais = {
                totalAtendimentos: parseNum(html.match(/fa-phone[\s\S]*?h1[^>]*>([\d.]+)/i)?.[1]),
                visitasSemParecer: parseNum(html.match(/semParecer[\s\S]*?h1[^>]*>([\d.]+)/i)?.[1])
            };

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

            res.body.atividades = {};
            const activRegex = /<tr>\s*<td>([^<]+)<\/td>\s*<td><a[^>]*>([\d.]+)<\/a><\/td>\s*<td><a[^>]*>([\d.]+)<\/a><\/td>\s*<\/tr>/g;
            Array.from(html.matchAll(activRegex)).forEach(m => {
                res.body.atividades[m[1].replace(/\s+/g, '')] = { 
                    atendimento: parseNum(m[2]), 
                    atividade: parseNum(m[3]) 
                };
            });

            res.body.dadosGraficos = {
                termometro: extractRawArray("chartTermometroV"),
                midiaDeOrigem: extractRawArray("chartMidiaV"),
                motivoDescarte: extractRawArray("chartMotivoDescarteV"),
                ultimaInteracao: extractRawArray("chartUltimaInteracaoV"),
                tipoAtendimento: extractRawArray("chartTipoAtendimentoV")
            };

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
        console.error("Erro na API Route:", error);
        return NextResponse.json({ error: true, message: error.message }, { status: 500 });
    }
}