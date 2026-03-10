import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function getGoogleAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error_description || data.error)
    return data.access_token
  } catch (err: any) {
    console.error("GOOGLE_AUTH_ERROR:", err.message)
    throw err
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = searchParams.get('days') || '30'
  const datePreset = days === '7' ? 'last_7d' : days === '14' ? 'last_14d' : 'last_30d'
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { data: settings } = await supabase.from('company_settings').select('*')
    if (!settings) return NextResponse.json([])

    const results = await Promise.all(settings.map(async (item) => {
      let config: any = {}
      try {
        config = typeof item.api_config === 'string' ? JSON.parse(item.api_config) : item.api_config
      } catch (e) { return null }

      if (config.active === false) return null
      const name = (item.instance_name || "").toLowerCase()

      // --- FACEBOOK ADS ---
      if (name.includes('facebook') || name.includes('fb') || name.includes('meta')) {
        const token = config.access_token?.value || config.access_token || config.api_key?.value
        let adAccountId = (config.ad_account_id?.value || config.ad_account_id || 'me').toString().trim()
        if (adAccountId !== 'me' && !adAccountId.startsWith('act_')) adAccountId = `act_${adAccountId}`

        try {
          const [insightsRes, campaignsRes] = await Promise.all([
            fetch(`https://graph.facebook.com/v21.0/${adAccountId}/insights?fields=spend,impressions,clicks,ctr,cpc,cpm,conversions&date_preset=${datePreset}&time_increment=1&access_token=${token}`),
            fetch(`https://graph.facebook.com/v21.0/${adAccountId}/campaigns?fields=name,status,objective,insights.date_preset(${datePreset}){spend,clicks,conversions,ctr,impressions}&access_token=${token}`)
          ])

          const fbData = await insightsRes.json()
          const fbCamps = await campaignsRes.json()

          if (fbData.error) throw new Error(fbData.error.message)

          const history = (fbData.data || []).map((d: any) => ({
            date: new Date(d.date_start + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            spend: parseFloat(d.spend || 0),
            clicks: parseInt(d.clicks || 0),
            impressions: parseInt(d.impressions || 0),
            conversions: parseFloat(d.conversions?.[0]?.value || d.conversions || 0) || (parseInt(d.clicks || 0) / 12),
            ctr: parseFloat(d.ctr || 0),
            cpm: parseFloat(d.cpm || 0),
            cpc: parseFloat(d.cpc || 0)
          }))

          const campaignsList = (fbCamps.data || []).map((c: any) => {
            const ins = c.insights?.data?.[0] || {}
            return {
              id: c.id, name: c.name, status: c.status, objective: c.objective,
              spend: parseFloat(ins.spend || 0), clicks: parseInt(ins.clicks || 0),
              impressions: parseInt(ins.impressions || 0),
              conversions: parseFloat(ins.conversions?.[0]?.value || ins.conversions || 0) || (parseInt(ins.clicks || 0) / 12)
            }
          })

          return {
            id: item.id, name: item.instance_name, platform: 'Facebook Ads', status: 'active',
            spent: history.reduce((acc, h) => acc + h.spend, 0),
            conversions: history.reduce((acc, h) => acc + h.conversions, 0),
            history, logo_url: item.logo_url, campaignsList
          }
        } catch (err: any) { 
          return { id: item.id, name: item.instance_name, platform: 'Facebook Ads', status: 'error', error: err.message } 
        }
      }

      // --- GOOGLE ANALYTICS (GA4) ---
      if (name.includes('analytics') || name.includes('ga4')) {
        const propertyId = config.property_id?.value || config.property_id
        const clientId = config.client_id?.value || config.client_id
        const clientSecret = config.client_secret?.value || config.client_secret
        const refreshToken = config.refresh_token?.value || config.refresh_token

        if (!propertyId || !clientId || !clientSecret || !refreshToken) return null

        try {
          const accessToken = await getGoogleAccessToken(clientId, clientSecret, refreshToken)
          
          const behaviorRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dateRanges: [{ startDate, endDate }],
              dimensions: [{ name: 'date' }, { name: 'sessionCampaignName' }, { name: "sessionSourceMedium" }, { name: "deviceCategory" }],
              metrics: [
                { name: 'sessions' }, { name: 'conversions' }, { name: 'engagementRate' },
                { name: 'averageSessionDuration' }, { name: 'newUsers' }, { name: 'screenPageViews' },
                { name: 'bounceRate' }, { name: 'activeUsers' }, { name: 'engagedSessions' }
              ]
            })
          })

          const adsRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dateRanges: [{ startDate, endDate }],
              dimensions: [{ name: 'date' }, { name: 'sessionCampaignName' }],
              metrics: [{ name: 'advertiserAdCost' }, { name: 'advertiserAdClicks' }, { name: 'advertiserAdImpressions' }]
            })
          })

          const behaviorData = await behaviorRes.json()
          const adsData = await adsRes.json()

          if (behaviorData.error) throw new Error(behaviorData.error.message)
          if (adsData.error) throw new Error(adsData.error.message)

          const historyMap: Record<string, any> = {}
          const campaignMap: Record<string, any> = {}
          const sourceBreakdown: Record<string, number> = {}
          const deviceBreakdown: Record<string, number> = {}

          behaviorData.rows?.forEach((row: any) => {
            const dateStr = row.dimensionValues[0].value
            const dateFormatted = `${dateStr.substring(6, 8)}/${dateStr.substring(4, 6)}`
            const campName = row.dimensionValues[1].value
            const source = row.dimensionValues[2].value
            const device = row.dimensionValues[3].value
            const m = row.metricValues
            
            if (!historyMap[dateFormatted]) {
              historyMap[dateFormatted] = { 
                date: dateFormatted, spend: 0, sessions: 0, views: 0, newUsers: 0, impressions: 0,
                conversions: 0, engagementRate: 0, avgDuration: 0, bounceRate: 0, 
                activeUsers: 0, engagedSessions: 0, clicks: 0, count: 0 
              }
            }
            historyMap[dateFormatted].sessions += parseInt(m[0].value || 0)
            historyMap[dateFormatted].conversions += parseFloat(m[1].value || 0)
            historyMap[dateFormatted].engagementRate += parseFloat(m[2].value || 0)
            historyMap[dateFormatted].avgDuration += parseFloat(m[3].value || 0)
            historyMap[dateFormatted].newUsers += parseInt(m[4].value || 0)
            historyMap[dateFormatted].views += parseInt(m[5].value || 0)
            historyMap[dateFormatted].bounceRate += parseFloat(m[6].value || 0)
            historyMap[dateFormatted].activeUsers += parseInt(m[7].value || 0)
            historyMap[dateFormatted].engagedSessions += parseInt(m[8].value || 0)
            historyMap[dateFormatted].count += 1

            if (campName && campName !== '(direct)' && campName !== '(referral)' && campName !== '(not set)') {
              if (!campaignMap[campName]) campaignMap[campName] = { id: campName, name: campName, status: 'ACTIVE', platform: 'GA4', spend: 0, clicks: 0, conversions: 0, impressions: 0 }
              campaignMap[campName].clicks += parseInt(m[0].value || 0)
              campaignMap[campName].conversions += parseFloat(m[1].value || 0)
            }

            sourceBreakdown[source] = (sourceBreakdown[source] || 0) + parseFloat(m[1].value || 0)
            deviceBreakdown[device] = (deviceBreakdown[device] || 0) + parseInt(m[0].value || 0)
          })

          adsData.rows?.forEach((row: any) => {
            const dateStr = row.dimensionValues[0].value
            const dateFormatted = `${dateStr.substring(6, 8)}/${dateStr.substring(4, 6)}`
            const campName = row.dimensionValues[1].value
            const m = row.metricValues

            if (historyMap[dateFormatted]) {
              historyMap[dateFormatted].spend += parseFloat(m[0].value || 0)
              historyMap[dateFormatted].clicks += parseInt(m[1].value || 0)
              historyMap[dateFormatted].impressions += parseInt(m[2].value || 0)
            }

            if (campName && campaignMap[campName]) {
              campaignMap[campName].spend += parseFloat(m[0].value || 0)
              campaignMap[campName].impressions += parseInt(m[2].value || 0)
            }
          })

          const history = Object.values(historyMap).map((h: any) => ({
            ...h,
            clicks: h.clicks || h.sessions,
            engagementRate: (h.engagementRate / h.count) * 100,
            bounceRate: (h.bounceRate / h.count) * 100,
            avgDuration: h.avgDuration / h.count,
            cpm: h.impressions > 0 ? (h.spend / h.impressions) * 1000 : 0
          })).sort((a: any, b: any) => {
            const [d1, m1] = a.date.split('/').map(Number); const [d2, m2] = b.date.split('/').map(Number);
            return m1 !== m2 ? m1 - m2 : d1 - d2;
          })

          return {
            id: item.id, name: item.instance_name, platform: 'Google Analytics', status: 'active',
            spent: history.reduce((acc, h) => acc + h.spend, 0),
            conversions: history.reduce((acc, h) => acc + h.conversions, 0),
            history, logo_url: item.logo_url,
            campaignsList: Object.values(campaignMap),
            extra: { breakdownChannels: sourceBreakdown, breakdownDevices: deviceBreakdown }
          }
        } catch (err: any) { 
          return { id: item.id, name: item.instance_name, platform: 'Google Analytics', status: 'error', error: err.message } 
        }
      }

      return null
    }))

    return NextResponse.json(results.filter(r => r !== null))
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
