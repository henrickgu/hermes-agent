import { useStore } from '@nanostores/react'
import { Fragment, useEffect, useRef, useState } from 'react'

import { useSessionView } from '@/app/chat/session-view'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/i18n'
import { copyTextToClipboard, isDesktopFsRemoteMode, readDesktopFileText } from '@/lib/desktop-fs'
import { Copy, Download, ExternalLink, FileText, FolderOpen, MonitorPlay, MoreHorizontal } from '@/lib/icons'
import { normalizeOrLocalPreviewTarget } from '@/lib/local-preview'
import { downloadGatewayMediaFile } from '@/lib/media'
import { previewName } from '@/lib/preview-targets'
import { notify, notifyError } from '@/store/notifications'
import { $previewTabSources, closePreviewForSource, openPreview } from '@/store/preview'

/** What the Electron main process said about this target's LOCAL filesystem
 * state (#101683). `null` keeps the stock card — remote-backend targets keep
 * Download, and a bridge-less dev server can't classify. */
type LocalTargetState = { path: string; type: 'directory' | 'file' } | { type: 'missing' } | null

/** One row of the card's action menu. Shared by the right-click menu and the
 * "…" button so both always offer the same set. */
interface CardAction {
  icon: typeof Copy
  key: string
  label: string
  run: () => void
}

/** Extensions worth offering "Copy file contents" for: the text formats the
 * preview pane itself renders. A PDF or an image has no text to copy here, so
 * the row stays out instead of copying binary noise. */
const COPYABLE_TEXT_EXTENSIONS = new Set([
  'css',
  'csv',
  'html',
  'ini',
  'js',
  'json',
  'jsx',
  'log',
  'markdown',
  'md',
  'mjs',
  'py',
  'sh',
  'sql',
  'svg',
  'toml',
  'ts',
  'tsv',
  'tsx',
  'txt',
  'xml',
  'yaml',
  'yml'
])

function isCopyableText(target: string): boolean {
  const name = previewName(target)
  const dot = name.lastIndexOf('.')

  return dot > 0 && COPYABLE_TEXT_EXTENSIONS.has(name.slice(dot + 1).toLowerCase())
}

async function classifyLocalTarget(rawTarget: string, cwd?: string | null): Promise<LocalTargetState> {
  const bridge = window.hermesDesktop

  // Only the Electron host's filesystem is knowable here; a remote backend's
  // paths are not on this machine, so they keep the gateway-backed actions.
  if (!bridge?.normalizePreviewTarget || isDesktopFsRemoteMode()) {
    return null
  }

  try {
    const resolved = await bridge.normalizePreviewTarget(rawTarget, cwd || undefined)

    if (!resolved || resolved.previewKind === 'missing') {
      return { type: 'missing' }
    }

    if (resolved.previewKind === 'directory' && resolved.path) {
      return { path: resolved.path, type: 'directory' }
    }

    if (resolved.kind === 'file' && resolved.path) {
      return { path: resolved.path, type: 'file' }
    }
  } catch {
    // An old Electron build without the normalizer keeps the stock card.
  }

  return null
}

export function PreviewAttachment({ target }: { target: string }) {
  const { t } = useI18n()
  // This link lives in one session's transcript; resolve it against THAT
  // session's cwd, not the primary chat's.
  const view = useSessionView()
  const cwd = useStore(view.$cwd)
  const storedId = useStore(view.$storedId)
  const runtimeId = useStore(view.$runtimeId)
  const sessionId = storedId || runtimeId || ''
  const openSources = useStore($previewTabSources)
  const [opening, setOpening] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [localTarget, setLocalTarget] = useState<LocalTargetState>(null)
  const cwdRef = useRef(cwd)
  const mountedRef = useRef(false)
  const requestTokenRef = useRef(0)
  const targetRef = useRef(target)
  const name = previewName(target)
  const isActive = openSources.includes(target)
  // An older Electron build has no chooser bridge: hide the row instead of
  // listing an action that can only fail on click.
  const canOpenWith = Boolean(window.hermesDesktop?.openWith)

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

  // Classify the target against the local filesystem so the card offers the
  // native action instead of a Download this machine already has (#101683).
  useEffect(() => {
    let current = true
    setLocalTarget(null)

    void classifyLocalTarget(target, cwd).then(state => {
      if (current) {
        setLocalTarget(state)
      }
    })

    return () => {
      current = false
    }
  }, [cwd, target])

  async function openInFileManager(path: string, directory: boolean) {
    if (opening) {
      return
    }

    setOpening(true)

    try {
      if (directory) {
        const result = await window.hermesDesktop?.openDir?.(path)

        if (!result?.ok) {
          throw new Error(result?.error || `Could not open directory: ${path}`)
        }
      } else {
        const revealed = await window.hermesDesktop?.revealPath?.(path)

        if (revealed === false) {
          throw new Error(`${path} — ${t.fileMenu.revealMissing}`)
        }
      }
    } catch (error) {
      if (mountedRef.current) {
        notifyError(error, t.preview.unavailable)
      }
    } finally {
      if (mountedRef.current) {
        setOpening(false)
      }
    }
  }

  /** Hand the file to the OS: the default program opens it. The main process
   *  falls back to revealing it when nothing is associated with the type. */
  async function openWithDefaultApp(path: string) {
    try {
      await window.hermesDesktop?.openExternal?.(path)
    } catch (error) {
      if (mountedRef.current) {
        notifyError(error, t.preview.unavailable)
      }
    }
  }

  /** Raise the OS program chooser for this file, like Explorer's "Open with". */
  async function chooseProgram(path: string) {
    try {
      const result = await window.hermesDesktop?.openWith?.(path)

      if (!result?.ok) {
        throw new Error(result?.error || `Could not open the program chooser: ${path}`)
      }
    } catch (error) {
      if (mountedRef.current) {
        notifyError(error, t.preview.unavailable)
      }
    }
  }

  async function copyPath(path: string) {
    try {
      await copyTextToClipboard(path)
      notify({ durationMs: 1500, kind: 'info', message: t.fileMenu.pathCopied })
    } catch (error) {
      if (mountedRef.current) {
        notifyError(error, t.common.copyFailed)
      }
    }
  }

  async function copyContents(path: string) {
    try {
      const result = await readDesktopFileText(path)
      await copyTextToClipboard(result.text)
      notify({ durationMs: 1500, kind: 'info', message: t.fileMenu.contentCopied })
    } catch (error) {
      if (mountedRef.current) {
        notifyError(error, t.preview.unavailable)
      }
    }
  }

  async function togglePreview() {
    if (opening) {
      return
    }

    if (isActive) {
      closePreviewForSource(target)

      return
    }

    // The classifier already knows this path is not on this computer: report
    // instead of running a pipeline that would fabricate a broken tab.
    if (localTarget?.type === 'missing') {
      notifyError(new Error(`${target} — ${t.preview.missingTarget}`), t.preview.unavailable)

      return
    }

    const requestToken = ++requestTokenRef.current
    const requestTarget = target
    const requestCwd = cwd

    setOpening(true)

    try {
      const preview = await normalizeOrLocalPreviewTarget(requestTarget, requestCwd || undefined, { sessionId })

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

      openPreview(preview)
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
      const result = await downloadGatewayMediaFile(target, sessionId ? { sessionId } : undefined)

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

  const localPath = localTarget && 'path' in localTarget ? localTarget.path : null

  // The card's action menu, in groups separated by a rule: the OS openers,
  // then the copy actions, then the file-manager action. Only what this target
  // supports is listed — a remote path has no local opener, a PDF has no text
  // to copy, and "Open with…" needs a bridge that can raise the chooser.
  const menuGroups: CardAction[][] = []

  if (localTarget?.type === 'file' && localPath) {
    const openers: CardAction[] = [
      { icon: ExternalLink, key: 'open', label: t.fileMenu.openFile, run: () => void openWithDefaultApp(localPath) }
    ]

    if (canOpenWith) {
      openers.push({
        icon: MonitorPlay,
        key: 'openWith',
        label: t.fileMenu.openWith,
        run: () => void chooseProgram(localPath)
      })
    }

    const copies: CardAction[] = [
      { icon: Copy, key: 'copyPath', label: t.fileMenu.copyPath, run: () => void copyPath(localPath) }
    ]

    if (isCopyableText(target)) {
      copies.push({
        icon: FileText,
        key: 'copyContent',
        label: t.fileMenu.copyContent,
        run: () => void copyContents(localPath)
      })
    }

    menuGroups.push(openers, copies, [
      {
        icon: FolderOpen,
        key: 'reveal',
        label: t.fileMenu.revealFileManager,
        run: () => void openInFileManager(localPath, false)
      }
    ])
  } else if (localTarget?.type === 'directory' && localPath) {
    menuGroups.push(
      [{ icon: Copy, key: 'copyPath', label: t.fileMenu.copyPath, run: () => void copyPath(localPath) }],
      [
        {
          icon: FolderOpen,
          key: 'reveal',
          label: t.fileMenu.revealFileManager,
          run: () => void openInFileManager(localPath, true)
        }
      ]
    )
  } else if (localTarget?.type === 'missing') {
    menuGroups.push([{ icon: Copy, key: 'copyPath', label: t.fileMenu.copyPath, run: () => void copyPath(target) }])
  } else {
    menuGroups.push(
      [{ icon: Download, key: 'saveAs', label: t.fileMenu.saveAs, run: () => void downloadFile() }],
      [{ icon: Copy, key: 'copyPath', label: t.fileMenu.copyPath, run: () => void copyPath(target) }]
    )
  }

  function renderMenuItems(kind: 'context' | 'dropdown') {
    // Both primitives take the same onSelect + children, so one item list
    // feeds the right-click menu and the "…" dropdown.
    const Item = (kind === 'context' ? ContextMenuItem : DropdownMenuItem) as typeof ContextMenuItem
    const Separator = (kind === 'context' ? ContextMenuSeparator : DropdownMenuSeparator) as typeof ContextMenuSeparator

    return menuGroups.map((group, index) => (
      <Fragment key={group[0].key}>
        {index > 0 && <Separator />}
        {group.map(({ icon: Icon, key, label, run }) => (
          <Item key={key} onSelect={run}>
            <Icon className="size-3.5" />
            {label}
          </Item>
        ))}
      </Fragment>
    ))
  }

  // A local directory is not previewable: one native folder action — no
  // Download, no preview button that used to open a broken text tab (#101683).
  const card = (
    <div className="flex w-full max-w-160 items-center gap-2 rounded-lg border border-(--ui-stroke-tertiary) bg-card/55 px-2.5 py-1.5 text-sm">
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted/55 text-muted-foreground/85">
        <MonitorPlay className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[0.78rem] font-medium text-foreground/90" title={target}>
        {name}
      </span>
      {localTarget?.type === 'directory' ? (
        <button
          className="flex shrink-0 items-center gap-1 rounded-md border border-(--ui-stroke-tertiary) bg-background/40 px-2 py-1 text-[0.7rem] font-medium text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground disabled:opacity-50"
          disabled={opening}
          onClick={() => void openInFileManager(localTarget.path, true)}
          type="button"
        >
          <FolderOpen className="size-3" />
          {t.fileMenu.revealFileManager}
        </button>
      ) : localTarget?.type === 'file' ? (
        // The file already exists on this machine: reveal it in the OS file
        // manager instead of offering to download it again (#101683).
        <button
          className="flex shrink-0 items-center gap-1 rounded-md border border-(--ui-stroke-tertiary) bg-background/40 px-2 py-1 text-[0.7rem] font-medium text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground disabled:opacity-50"
          disabled={opening}
          onClick={() => void openInFileManager(localTarget.path, false)}
          type="button"
        >
          <FolderOpen className="size-3" />
          {t.fileMenu.revealFileManager}
        </button>
      ) : (
        <button
          aria-label={t.fileMenu.download}
          className="flex shrink-0 items-center gap-1 rounded-md border border-(--ui-stroke-tertiary) bg-background/40 px-2 py-1 text-[0.7rem] font-medium text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground disabled:opacity-50"
          disabled={downloading}
          onClick={() => void downloadFile()}
          type="button"
        >
          <Download className="size-3" />
          {downloaded ? t.fileMenu.downloadSaved : t.fileMenu.download}
        </button>
      )}
      {localTarget?.type === 'directory' ? null : (
        <button
          className="shrink-0 rounded-md border border-(--ui-stroke-tertiary) bg-background/40 px-2 py-1 text-[0.7rem] font-medium text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground disabled:opacity-50"
          disabled={opening}
          onClick={() => void togglePreview()}
          type="button"
        >
          {opening
            ? t.preview.opening
            : localTarget?.type === 'missing'
              ? t.preview.unavailable
              : isActive
                ? t.preview.hide
                : t.preview.openPreview}
        </button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={t.fileMenu.moreActions}
            className="grid size-6 shrink-0 place-items-center rounded-md border border-(--ui-stroke-tertiary) bg-background/40 text-muted-foreground transition-colors hover:bg-accent/55 hover:text-foreground"
            type="button"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">{renderMenuItems('dropdown')}</DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  // Right-click anywhere on the card opens the very same menu.
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
      <ContextMenuContent>{renderMenuItems('context')}</ContextMenuContent>
    </ContextMenu>
  )
}
