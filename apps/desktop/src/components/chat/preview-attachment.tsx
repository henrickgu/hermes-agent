import { useStore } from '@nanostores/react'
import { useEffect, useRef, useState } from 'react'

import { useSessionView } from '@/app/chat/session-view'
import { useI18n } from '@/i18n'
import { isDesktopFsRemoteMode, openDesktopDir, revealDesktopPath } from '@/lib/desktop-fs'
import { Download, FolderOpen, MonitorPlay } from '@/lib/icons'
import { localPreviewTarget, normalizeOrLocalPreviewTarget } from '@/lib/local-preview'
import { downloadGatewayMediaFile } from '@/lib/media'
import { previewName } from '@/lib/preview-targets'
import { notifyError } from '@/store/notifications'
import { $previewTabSources, closePreviewForSource, openPreview, type PreviewRecordSource } from '@/store/preview'

const IS_MAC = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || navigator.userAgent || '')
const IS_WIN = typeof navigator !== 'undefined' && /win/i.test(navigator.platform || navigator.userAgent || '')

export function PreviewAttachment({ source = 'manual', target }: { source?: PreviewRecordSource; target: string }) {
  const { t } = useI18n()
  // This link lives in one session's transcript; resolve it against THAT
  // session's cwd, not the primary chat's.
  const cwd = useStore(useSessionView().$cwd)
  const openSources = useStore($previewTabSources)
  const [opening, setOpening] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const cwdRef = useRef(cwd)
  const mountedRef = useRef(false)
  const requestTokenRef = useRef(0)
  const targetRef = useRef(target)
  const name = previewName(target)
  const isActive = openSources.includes(target)

  // A folder link (no file extension in the last segment — a chat delivery
  // folder like "Hermes - Revisão de Skills") should open ITSELF, not its
  // parent: `reveal` would select it inside the parent, `openDir` opens it.
  const looksLikeDirectory =
    !/\.[a-z0-9]{1,8}$/i.test(target.replace(/[?#].*$/, '').split(/[\\/]/).pop() || '') &&
    !/^https?:\/\//i.test(target)

  // Card label: folder-shaped targets get the friendly "View in folder"
  // wording (and only this button — download/preview make no sense for a
  // directory); file targets keep the platform reveal label alongside the
  // other actions.
  const revealLabel = looksLikeDirectory
    ? t.fileMenu.viewInFolder
    : IS_MAC
      ? t.fileMenu.revealFinder
      : IS_WIN
        ? t.fileMenu.revealExplorer
        : t.fileMenu.revealFileManager

  // Local filesystem only: the path this card points at lives on this machine,
  // so the OS file manager can open it. Hidden on remote backends.
  const canReveal = !isDesktopFsRemoteMode()

  // Directory-shaped card: a single "View in folder" action. Download and
  // preview target file bytes/preview pipelines that do not apply to a
  // directory (and the preview resolver requires an entry file anyway).
  const isDirCard = canReveal && looksLikeDirectory

  cwdRef.current = cwd
  targetRef.current = target

  // eslint-disable-next-line no-restricted-syntax -- legitimate non-atom ref write (see eslint rule comment)
  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      requestTokenRef.current += 1
    }
  }, [])

  // eslint-disable-next-line no-restricted-syntax -- legitimate non-atom ref write (see eslint rule comment)
  useEffect(() => {
    requestTokenRef.current += 1
    setOpening(false)
  }, [cwd, target])

  async function togglePreview() {
    if (opening) {
      return
    }

    if (isActive) {
      closePreviewForSource(target)

      return
    }

    const requestToken = ++requestTokenRef.current
    const requestTarget = target
    const requestCwd = cwd

    setOpening(true)

    try {
      const preview = await normalizeOrLocalPreviewTarget(requestTarget, requestCwd || undefined)

      if (
        !mountedRef.current ||
        requestTokenRef.current !== requestToken ||
        targetRef.current !== requestTarget ||
        cwdRef.current !== requestCwd
      ) {
        return
      }

      if (!preview) {
        throw new Error(`Could not open preview target: ${requestTarget}`)
      }

      openPreview(preview, source)
    } catch (error) {
      if (
        !mountedRef.current ||
        requestTokenRef.current !== requestToken ||
        targetRef.current !== requestTarget ||
        cwdRef.current !== requestCwd
      ) {
        return
      }

      notifyError(error, t.preview.unavailable)
    } finally {
      if (mountedRef.current && requestTokenRef.current === requestToken) {
        setOpening(false)
      }
    }
  }

  async function downloadFile() {
    if (downloading) {
      return
    }

    setDownloading(true)

    try {
      // Works in both modes: the Electron main process fetches the bytes
      // through the session's backend connection (local gateway or remote)
      // and prompts for a save location.
      const result = await downloadGatewayMediaFile(target)

      if (mountedRef.current && result.saved) {
        setDownloaded(true)
        setTimeout(() => mountedRef.current && setDownloaded(false), 2000)
      }
    } catch (error) {
      if (mountedRef.current) {
        notifyError(error, t.fileMenu.downloadFailed)
      }
    } finally {
      if (mountedRef.current) {
        setDownloading(false)
      }
    }
  }

  // Open the card's target in the OS file manager. A folder-looking target
  // opens itself (openDir); a file is selected inside its parent (reveal).
  // The renderer-side resolver is enough here — no preview round-trip needed,
  // which also keeps folders (no index.html) working.
  async function openInFileManager() {
    if (revealing) {
      return
    }

    setRevealing(true)

    try {
      const resolved = localPreviewTarget(target, cwd || undefined)

      // The renderer-side resolver keeps a leading slash on Windows drive
      // paths (new URL('file:///C:/…').pathname === '/C:/…'); the file-manager
      // bridges want the bare drive form. Trailing slashes confuse the
      // directory-vs-file heuristic, so trim those too.
      const path = (resolved?.path || target)
        .replace(/^\/([a-z]:\/)/i, '$1')
        .replace(/\/+$/, '')

      const isDir = looksLikeDirectory || !path.includes('.')

      if (isDir) {
        await openDesktopDir(path)
      } else {
        await revealDesktopPath(path)
      }
    } catch (error) {
      if (mountedRef.current) {
        notifyError(error, t.errors.genericFailure)
      }
    } finally {
      if (mountedRef.current) {
        setRevealing(false)
      }
    }
  }

  return (
    <div className="flex w-full max-w-160 items-center gap-2 rounded-lg border border-(--ui-stroke-tertiary) bg-card/55 px-2.5 py-1.5 text-sm">
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted/55 text-muted-foreground/85">
        <MonitorPlay className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[0.78rem] font-medium text-foreground/90" title={target}>
        {name}
      </span>
      {!isDirCard && (
        <button
          aria-label={t.fileMenu.download}
          className="flex shrink-0 items-center gap-1 rounded-md border border-(--ui-stroke-tertiary) bg-background/40 px-2 py-1 text-[0.7rem] font-medium text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground disabled:opacity-50"
          disabled={downloading}
          onClick={() => void downloadFile()}
          title={t.fileMenu.download}
          type="button"
        >
          <Download className="size-3" />
          {downloaded ? t.fileMenu.downloadSaved : t.fileMenu.download}
        </button>
      )}
      {canReveal && (
        <button
          aria-label={revealLabel}
          className="flex shrink-0 items-center gap-1 rounded-md border border-(--ui-stroke-tertiary) bg-background/40 px-2 py-1 text-[0.7rem] font-medium text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground disabled:opacity-50"
          disabled={revealing}
          onClick={() => void openInFileManager()}
          title={revealLabel}
          type="button"
        >
          <FolderOpen className="size-3" />
          {revealLabel}
        </button>
      )}
      {!isDirCard && (
        <button
          className="shrink-0 rounded-md border border-(--ui-stroke-tertiary) bg-background/40 px-2 py-1 text-[0.7rem] font-medium text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground disabled:opacity-50"
          disabled={opening}
          onClick={() => void togglePreview()}
          type="button"
        >
          {opening ? t.preview.opening : isActive ? t.preview.hide : t.preview.openPreview}
        </button>
      )}
    </div>
  )
}
