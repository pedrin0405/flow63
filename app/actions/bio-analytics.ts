"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function getDeviceType(userAgent: string = "") {
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "Tablet";
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) return "Celular";
  return "Desktop";
}

export async function trackBioView(bioId: string) {
  if (!bioId) return;
  try { await supabaseAdmin.rpc('increment_bio_views', { bio_id: bioId }); } 
  catch (error) { console.error("Erro trackBioView:", error); }
}

export async function trackBioEvent(payload: {
  bio_id: string;
  tipo: 'view' | 'click';
  link_url?: string;
  device_info?: any;
}) {
  try {
    if (!payload.bio_id) return;
    const { error } = await supabaseAdmin.from('bio_analytics').insert([payload]);
    if (error) console.error("Erro ao inserir bio_analytics:", error);
  } catch (err) { console.error("Erro crítico trackBioEvent:", err); }
}

export async function getBioInsights(bioId: string, days: number = 30) {
  try {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const { data: events, error } = await supabaseAdmin
      .from('bio_analytics')
      .select('*')
      .eq('bio_id', bioId)
      .gte('created_at', dateLimit.toISOString());

    if (error) throw error;

    if (!events || events.length === 0) {
      const { data: bio } = await supabaseAdmin.from('bio_pages').select('views_count').eq('id', bioId).single();
      return { total_views: bio?.views_count || 0, unique_visitors: 0, total_clicks: 0, ctr: 0, bounce_rate: 0, avg_duration: 0, avg_scroll: 0, conversion_rate: 0, avg_lcp: 0, history: [], periods: [], clicks_by_button: [], referrers: [], devices: [] };
    }

    const viewEvents = events.filter(e => e.tipo === 'view' && !e.device_info?.is_final);
    const clickEvents = events.filter(e => e.tipo === 'click');
    const finalEvents = events.filter(e => e.device_info?.is_final);
    
    const totalViews = viewEvents.length || 1;
    const totalClicks = clickEvents.length;
    const uniqueSessions = new Set(events.map(e => e.device_info?.session_id || e.id)).size;

    const ctr = (totalClicks / totalViews) * 100;
    const sessionsWithClicks = new Set(clickEvents.map(e => e.device_info?.session_id));
    const allSessionIds = Array.from(new Set(events.map(e => e.device_info?.session_id)));
    const bounceSessions = allSessionIds.filter(sid => !sessionsWithClicks.has(sid)).length;
    const bounceRate = (bounceSessions / (allSessionIds.length || 1)) * 100;

    const avgDuration = finalEvents.length > 0 ? finalEvents.reduce((acc, e) => acc + (e.device_info?.duration || 0), 0) / finalEvents.length : 0;
    const avgScroll = finalEvents.length > 0 ? finalEvents.reduce((acc, e) => acc + (e.device_info?.max_scroll || 0), 0) / finalEvents.length : 0;

    const conversionClicks = clickEvents.filter(e => e.link_url?.includes('wa.me') || e.link_url?.includes('whatsapp') || e.device_info?.is_conversion).length;
    const conversionRate = (conversionClicks / totalViews) * 100;

    const lcpEvents = events.filter(e => e.device_info?.lcp);
    const avgLcp = lcpEvents.length > 0 ? lcpEvents.reduce((acc, e) => acc + (e.device_info.lcp || 0), 0) / lcpEvents.length : 0.8;

    const historyMap: Record<string, any> = {};
    const periodsMap = { 'Madrugada': 0, 'Manhã': 0, 'Tarde': 0, 'Noite': 0 };
    const devicesMap = { 'Celular': 0, 'Desktop': 0, 'Tablet': 0 };

    events.forEach(e => {
      const dateObj = new Date(e.created_at);
      const hour = dateObj.getHours();
      const label = `${dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${hour}h`;

      if (e.tipo === 'view' && !e.device_info?.is_final) {
        if (!historyMap[label]) historyMap[label] = { label, views: 0, clicks: 0 };
        historyMap[label].views++;
        if (hour >= 0 && hour < 6) periodsMap['Madrugada']++;
        else if (hour >= 6 && hour < 12) periodsMap['Manhã']++;
        else if (hour >= 12 && hour < 18) periodsMap['Tarde']++;
        else periodsMap['Noite']++;

        // Processar dispositivo
        const devType = getDeviceType(e.device_info?.user_agent);
        devicesMap[devType as keyof typeof devicesMap]++;
      }
      
      if (e.tipo === 'click') {
        if (!historyMap[label]) historyMap[label] = { label, views: 0, clicks: 0 };
        historyMap[label].clicks++;
      }
    });

    return {
      total_views: totalViews,
      unique_visitors: uniqueSessions,
      total_clicks: totalClicks,
      ctr: parseFloat(ctr.toFixed(2)),
      bounce_rate: parseFloat(bounceRate.toFixed(2)),
      avg_duration: Math.round(avgDuration),
      avg_scroll: Math.round(avgScroll),
      conversion_rate: parseFloat(conversionRate.toFixed(2)),
      avg_lcp: parseFloat(avgLcp.toFixed(2)),
      history: Object.values(historyMap).slice(-20),
      periods: Object.entries(periodsMap).map(([name, value]) => ({ name, value })),
      devices: Object.entries(devicesMap).map(([name, value]) => ({ name, value })),
      clicks_by_button: Object.entries(clickEvents.reduce((acc: any, e) => {
          const key = e.device_info?.link_title || e.link_url || 'Outros';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {})).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
      referrers: Object.entries(viewEvents.reduce((acc: any, e) => {
          const ref = e.device_info?.referrer || 'Direto';
          try { const domain = ref.includes('http') ? new URL(ref).hostname.replace('www.', '') : ref; acc[domain] = (acc[domain] || 0) + 1; } 
          catch { acc['Direto'] = (acc['Direto'] || 0) + 1; }
          return acc;
        }, {})).map(([name, value]) => ({ name, value }))
    };
  } catch (err) { console.error("Erro getBioInsights:", err); return null; }
}

export async function saveBioLead(bioId: string, leadData: { nome: string, email: string, telefone?: string }) {
  const { error } = await supabaseAdmin.from("bio_leads").insert([{ bio_id: bioId, ...leadData, created_at: new Date().toISOString() }]);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
