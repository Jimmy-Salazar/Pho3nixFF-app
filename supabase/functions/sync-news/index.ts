import { DOMParser } from "deno_dom"
import { createClient } from "@supabase/supabase-js"

type NewsRow = {
  titulo: string
  resumen: string | null
  contenido: string | null
  fuente: string
  tipo: "externa"
  categoria: string | null
  url: string
  imagen_url: string | null
  fecha_publicacion: string
  activo: boolean
  destacada: boolean
  hash_unico: string
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const SYNC_NEWS_SECRET = Deno.env.get("SYNC_NEWS_SECRET") || ""

const DEFAULT_NEWS_IMAGE =
  "https://rmolvzjluxutxmxzthjp.supabase.co/storage/v1/object/public/images/news-default.jpg"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405)
    }

    if (SYNC_NEWS_SECRET) {
      const incoming = req.headers.get("x-sync-secret")
      if (incoming !== SYNC_NEWS_SECRET) {
        return json({ ok: false, error: "Unauthorized" }, 401)
      }
    }

    console.log("[sync-news] starting sync")

    const crossfitRows = await collectCrossFitMediaNews()
    console.log("[sync-news] CrossFit rows:", crossfitRows.length)

    const allRows = dedupeByHash(crossfitRows)
    const freshRows = keepLast15Days(allRows)

    console.log("[sync-news] total rows:", allRows.length)
    console.log("[sync-news] fresh rows:", freshRows.length)

    if (freshRows.length > 0) {
      const rowsToUpsert = freshRows.map((row, index) => ({
        ...row,
        destacada: index === 0,
      }))

      const { error: resetFeaturedError } = await supabase
        .from("noticias")
        .update({ destacada: false })
        .eq("tipo", "externa")

      if (resetFeaturedError) throw resetFeaturedError

      const { error: upsertError } = await supabase
        .from("noticias")
        .upsert(rowsToUpsert, { onConflict: "hash_unico" })

      if (upsertError) throw upsertError
    }

    const cutoffIso = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()

    const { error: cleanupError } = await supabase
      .from("noticias")
      .update({ activo: false, destacada: false })
      .eq("tipo", "externa")
      .lt("fecha_publicacion", cutoffIso)

    if (cleanupError) throw cleanupError

    return json({
      ok: true,
      inserted_or_updated: freshRows.length,
      kept_days: 15,
      newest_url: freshRows[0]?.url || null,
    })
  } catch (error) {
    console.error("[sync-news] fatal error:", error)

    let message = "Unknown error"
    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === "object" && error !== null) {
      try {
        message = JSON.stringify(error)
      } catch {
        message = String(error)
      }
    } else {
      message = String(error)
    }

    return json({ ok: false, error: message }, 500)
  }
})

async function collectCrossFitMediaNews(): Promise<NewsRow[]> {
  const listUrl = "https://www.crossfit.com/media"
  const html = await fetchHtml(listUrl)
  const doc = parseHtml(html)
  if (!doc) return []

  const anchors = [...doc.querySelectorAll("a")]
  const rows: NewsRow[] = []
  const seen = new Set<string>()

  console.log("[sync-news] anchors found:", anchors.length)

  for (const a of anchors) {
    try {
      const href = a.getAttribute("href")
      if (!href) continue
      if (!href.startsWith("/")) continue

      const fullUrl = "https://www.crossfit.com" + href

      if (seen.has(fullUrl)) continue
      seen.add(fullUrl)

      const blocked = [
        "/media",
        "/courses",
        "/workout",
        "/workouts",
        "/faq",
        "/about",
        "/careers",
        "/pricing",
      ]

      if (blocked.some((x) => href.startsWith(x))) continue

      const title = cleanText(a.textContent || "")
      if (!title || title.length < 8) continue
      if (isBadTitle(title)) continue

      const container =
        a.closest("article") ||
        a.closest("section") ||
        a.parentElement ||
        a

      const dateText =
        extractPublishedFromText(container?.textContent || "") ||
        null

      const details = await fetchArticleDetails(fullUrl)

      const fecha_publicacion =
        details.fecha_publicacion ||
        (dateText ? toIso(dateText) : null) ||
        new Date().toISOString()

      const hash_unico = await sha256(fullUrl)

      rows.push({
        titulo: normalizeTitle(title),
        resumen: null,
        contenido: null,
        fuente: "CrossFit",
        tipo: "externa",
        categoria: "general",
        url: fullUrl,
        imagen_url: details.imagen_url || DEFAULT_NEWS_IMAGE,
        fecha_publicacion,
        activo: true,
        destacada: false,
        hash_unico,
      })
    } catch (err) {
      console.warn("[sync-news] parse anchor error:", err)
    }
  }

  console.log("[sync-news] rows parsed:", rows.length)
  return rows
}

async function fetchArticleDetails(url: string): Promise<{
  fecha_publicacion: string | null
  imagen_url: string | null
}> {
  try {
    const html = await fetchHtml(url)
    const doc = parseHtml(html)
    if (!doc) {
      return {
        fecha_publicacion: null,
        imagen_url: null,
      }
    }

    const published =
      getMeta(doc, 'meta[property="article:published_time"]') ||
      getMeta(doc, 'meta[name="article:published_time"]') ||
      getAttr(doc, "time[datetime]", "datetime") ||
      extractPublishedFromDoc(doc)

    const imagen =
      getMeta(doc, 'meta[property="og:image"]') ||
      getMeta(doc, 'meta[name="twitter:image"]') ||
      getFirstUsefulImage(doc, url) ||
      null

    return {
      fecha_publicacion: published ? toIso(published) : null,
      imagen_url: imagen,
    }
  } catch {
    return {
      fecha_publicacion: null,
      imagen_url: null,
    }
  }
}

function dedupeByHash(rows: NewsRow[]): NewsRow[] {
  const seen = new Map<string, NewsRow>()
  for (const row of rows) {
    if (!seen.has(row.hash_unico)) {
      seen.set(row.hash_unico, row)
    }
  }
  return [...seen.values()]
}

function keepLast15Days(rows: NewsRow[]): NewsRow[] {
  const cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000
  return rows.filter((row) => new Date(row.fecha_publicacion).getTime() >= cutoff)
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Pho3nixNewsBot/1.0",
      accept: "text/html,application/xhtml+xml",
    },
  })

  if (!res.ok) {
    throw new Error(`Failed fetching ${url}: ${res.status}`)
  }

  return await res.text()
}

function parseHtml(html: string) {
  return new DOMParser().parseFromString(html, "text/html")
}

function getMeta(doc: any, selector: string): string | null {
  const el = doc.querySelector(selector)
  if (!el) return null
  return el.getAttribute("content")
}

function getAttr(doc: any, selector: string, attr: string): string | null {
  const el = doc.querySelector(selector)
  if (!el) return null
  return el.getAttribute(attr)
}

function extractPublishedFromDoc(doc: any): string | null {
  const text = doc?.body?.textContent || ""
  return extractPublishedFromText(text)
}

function extractPublishedFromText(text: string): string | null {
  const patterns = [
    /Published on\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i,
    /\b([A-Za-z]+\s+\d{1,2},\s+\d{4})\b/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

function toIso(input: string): string | null {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

function normalizeTitle(text: string): string {
  return cleanText(
    text
      .replace(/\s*\|\s*CrossFit\s*$/i, "")
      .replace(/\s*\|\s*CrossFit Games\s*$/i, "")
      .replace(/\s*-\s*CrossFit\s*$/i, "")
      .replace(/\s*-\s*CrossFit Games\s*$/i, "")
  )
}

function isBadTitle(title: string): boolean {
  const t = title.trim().toLowerCase()
  return [
    "crossfit",
    "crossfit games",
    "media",
    "home",
    "sport",
    "essentials",
  ].includes(t)
}

function getFirstUsefulImage(doc: any, baseUrl: string): string | null {
  const directSrc = getAttr(doc, 'img[src]', "src")
  if (directSrc && !directSrc.startsWith("data:")) {
    return absolutizeUrl(baseUrl, directSrc)
  }

  const imgSrcset = getAttr(doc, 'img[srcset]', "srcset")
  const bestImgSrcset = pickBestFromSrcset(imgSrcset)
  if (bestImgSrcset) {
    return absolutizeUrl(baseUrl, bestImgSrcset)
  }

  const sourceSrcset = getAttr(doc, 'source[srcset]', "srcset")
  const bestSourceSrcset = pickBestFromSrcset(sourceSrcset)
  if (bestSourceSrcset) {
    return absolutizeUrl(baseUrl, bestSourceSrcset)
  }

  return null
}

function pickBestFromSrcset(srcset: string | null): string | null {
  if (!srcset) return null

  const candidates = srcset
    .split(",")
    .map((part) => part.trim())
    .map((entry) => {
      const [url, size] = entry.split(/\s+/)
      const width = size?.endsWith("w") ? parseInt(size.replace("w", ""), 10) : 0
      return { url, width: Number.isFinite(width) ? width : 0 }
    })
    .filter((x) => !!x.url)

  if (candidates.length === 0) return null

  candidates.sort((a, b) => b.width - a.width)
  return candidates[0].url || null
}

function absolutizeUrl(baseUrl: string, maybeUrl: string | null): string | null {
  if (!maybeUrl) return null
  try {
    return new URL(maybeUrl, baseUrl).toString()
  } catch {
    return maybeUrl
  }
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  })
}




//https://rmolvzjluxutxmxzthjp.supabase.co/storage/v1/object/public/images/news-default.jpg