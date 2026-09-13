/**
 * COMPATIBILITY RUNG — superseded by the MCP catalog's `suggest` metadata.
 *
 * The Nous-approved install catalog (`optional-mcps/<name>/manifest.yaml`)
 * is now the single source of truth for suggestible servers: each hosted
 * remote entry declares its own `suggest.keywords` / `suggest.hosts`, served
 * through `GET /api/mcp/catalog`. The suggestion provider and the inline
 * setup card read the catalog first.
 *
 * This static list remains ONLY for older backends whose catalog responses
 * carry no `suggest` field (the provider falls back to it when the catalog
 * yields zero suggestible entries). Do not add new vendors here — add a
 * manifest under `optional-mcps/` instead. Remove this file at the next
 * backend contract bump.
 *
 * GitHub is intentionally absent (here AND in the catalog): its hosted MCP
 * requires each MCP host to provide its own OAuth app (generic Dynamic
 * Client Registration 404s at /register), and the bundled github/* skills
 * via the gh CLI are the more capable integration. The composer's github
 * suggestion provider offers the `github-auth` skill instead.
 */
import { translateNow } from '@/i18n'

export interface McpDirectoryEntry {
  /** Server name as it will appear in mcp_servers config. */
  name: string
  /** Lowercase whole-word/phrase triggers matched against the draft. */
  keywords: string[]
  /** Hostname suffixes that trigger the suggestion when a pasted link points
   *  at the vendor ("yourco.atlassian.net" → atlassian). A pasted URL is the
   *  strongest intent signal there is — stronger than any keyword. */
  hosts?: string[]
  /** Streamable-HTTP/SSE endpoint from the vendor's own docs. */
  url: string
  /** Vendor documentation for the endpoint — shown on the card. */
  docs: string
  description: string
}

export const MCP_DIRECTORY: McpDirectoryEntry[] = [
  {
    description: translateNow('desktop.mcpDirectoryAtlassian'),
    docs: 'https://support.atlassian.com/rovo/docs/getting-started-with-the-atlassian-remote-mcp-server/',
    hosts: ['atlassian.net', 'atlassian.com', 'jira.com'],
    keywords: ['jira', 'confluence', 'atlassian', 'bitbucket'],
    name: 'atlassian',
    url: 'https://mcp.atlassian.com/v1/sse'
  },
  {
    description: translateNow('desktop.mcpDirectoryLinear'),
    docs: 'https://linear.app/docs/mcp',
    hosts: ['linear.app'],
    keywords: ['linear'],
    name: 'linear',
    url: 'https://mcp.linear.app/mcp'
  },
  {
    description: translateNow('desktop.mcpDirectoryFigma'),
    docs: 'https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/',
    hosts: ['figma.com'],
    keywords: ['figma', 'mockup', 'wireframe'],
    name: 'figma',
    url: 'https://mcp.figma.com/mcp'
  },
  {
    description: translateNow('desktop.mcpDirectorySentry'),
    docs: 'https://docs.sentry.io/product/sentry-mcp/',
    hosts: ['sentry.io'],
    keywords: ['sentry', 'stack trace', 'crash report'],
    name: 'sentry',
    url: 'https://mcp.sentry.dev/mcp'
  },
  {
    description: translateNow('desktop.mcpDirectoryDatadog'),
    docs: 'https://docs.datadoghq.com/bits_ai/mcp_server/',
    hosts: ['datadoghq.com', 'datadoghq.eu'],
    keywords: ['datadog', 'apm'],
    name: 'datadog',
    url: 'https://mcp.datadoghq.com/api/unstable/mcp-server/mcp'
  },
  // GitHub's hosted MCP is intentionally absent. Directory entries are wired
  // through generic Dynamic Client Registration, but GitHub requires each MCP
  // host to provide its own OAuth app (or use a PAT). Advertising it here makes
  // both the composer pill and setup_mcp fail at /register with HTTP 404.
  {
    description: translateNow('desktop.mcpDirectoryNotion'),
    docs: 'https://developers.notion.com/docs/mcp',
    hosts: ['notion.so', 'notion.site'],
    keywords: ['notion'],
    name: 'notion',
    url: 'https://mcp.notion.com/mcp'
  },
  {
    description: translateNow('desktop.mcpDirectoryStripe'),
    docs: 'https://docs.stripe.com/mcp',
    hosts: ['dashboard.stripe.com'],
    keywords: ['stripe'],
    name: 'stripe',
    url: 'https://mcp.stripe.com'
  },
  {
    description: translateNow('desktop.mcpDirectoryVercel'),
    docs: 'https://vercel.com/docs/mcp',
    // No `vercel.app` on purpose (same rule as GitHub): pasted deploy-preview
    // links are about the site being previewed, not about managing Vercel.
    hosts: ['vercel.com'],
    keywords: ['vercel'],
    name: 'vercel',
    url: 'https://mcp.vercel.com'
  },
  {
    description: translateNow('desktop.mcpDirectorySupabase'),
    docs: 'https://supabase.com/docs/guides/ai-tools/mcp',
    hosts: ['supabase.com', 'supabase.co'],
    keywords: ['supabase'],
    name: 'supabase',
    url: 'https://mcp.supabase.com/mcp'
  },
  {
    description: translateNow('desktop.mcpDirectoryNetlify'),
    docs: 'https://docs.netlify.com/build/build-with-ai/agent-setup-guides/agent-setup-overview/',
    // No `netlify.app` for the same deploy-preview reason as vercel.app.
    hosts: ['netlify.com'],
    keywords: ['netlify'],
    name: 'netlify',
    url: 'https://netlify-mcp.netlify.app/mcp'
  },
  {
    description: translateNow('desktop.mcpDirectoryHuggingface'),
    docs: 'https://huggingface.co/docs/hub/agents-mcp',
    hosts: ['huggingface.co', 'hf.co'],
    keywords: ['hugging face', 'huggingface'],
    // Underscored so prettyName renders "Hugging Face", not "Huggingface".
    name: 'hugging_face',
    url: 'https://huggingface.co/mcp'
  },
  {
    description: translateNow('desktop.mcpDirectoryAsana'),
    docs: 'https://developers.asana.com/docs/using-asanas-mcp-server',
    hosts: ['asana.com'],
    keywords: ['asana'],
    name: 'asana',
    url: 'https://mcp.asana.com/sse'
  },
  {
    description: translateNow('desktop.mcpDirectoryIntercom'),
    docs: 'https://developers.intercom.com/docs/guides/mcp',
    hosts: ['intercom.com', 'intercom.io'],
    keywords: ['intercom'],
    name: 'intercom',
    url: 'https://mcp.intercom.com/mcp'
  },
  {
    description: translateNow('desktop.mcpDirectoryAirtable'),
    docs: 'https://support.airtable.com/articles/9897799762-using-the-airtable-mcp-server',
    hosts: ['airtable.com'],
    keywords: ['airtable'],
    name: 'airtable',
    url: 'https://mcp.airtable.com/mcp'
  },
  {
    description: translateNow('desktop.mcpDirectoryWebflow'),
    docs: 'https://developers.webflow.com/mcp/reference/getting-started',
    // No `webflow.io` — that's published staging sites, not Webflow intent.
    hosts: ['webflow.com'],
    keywords: ['webflow'],
    name: 'webflow',
    url: 'https://mcp.webflow.com/mcp'
  },
  {
    description: translateNow('desktop.mcpDirectoryPaypal'),
    docs: 'https://developer.paypal.com/tools/mcp-server/',
    hosts: ['developer.paypal.com'],
    keywords: ['paypal'],
    name: 'paypal',
    url: 'https://mcp.paypal.com/sse'
  },
  {
    description: translateNow('desktop.mcpDirectorySquare'),
    docs: 'https://developer.squareup.com/docs/mcp',
    hosts: ['squareup.com'],
    // "square" the English word is everywhere ("square brackets", "square
    // corners") — only the unambiguous brand form triggers.
    keywords: ['squareup'],
    name: 'square',
    url: 'https://mcp.squareup.com/sse'
  }
]

export const directoryEntry = (name: string): McpDirectoryEntry | undefined =>
  MCP_DIRECTORY.find(entry => entry.name === name)
