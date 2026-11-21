import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { atom } from 'nanostores'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { PreviewAttachment } from '@/components/chat/preview-attachment'
import type * as PreviewStore from '@/store/preview'

// #101683 regression coverage: the delivered-file card must branch on the
// target's LOCAL filesystem state — an existing directory opens natively with
// no Download and no broken preview, an existing local file reveals instead of
// re-downloading, a remote-backend file keeps the gateway-backed actions, and a
// missing path reports instead of fabricating a preview tab.

const { copyTextToClipboard, isDesktopFsRemoteMode, notify, notifyError, openPreview, readDesktopFileText } =
  vi.hoisted(() => ({
    copyTextToClipboard: vi.fn(async () => undefined),
    isDesktopFsRemoteMode: vi.fn(() => false),
    notify: vi.fn(),
    notifyError: vi.fn(),
    openPreview: vi.fn(),
    readDesktopFileText: vi.fn(async () => ({ path: '/work/report.md', text: 'hello' }))
  }))

vi.mock('@/lib/desktop-fs', () => ({
  copyTextToClipboard,
  isDesktopFsRemoteMode,
  readDesktopDir: vi.fn(),
  readDesktopFileDataUrl: vi.fn(),
  readDesktopFileText
}))

vi.mock('@/store/notifications', () => ({ notify, notifyError }))

vi.mock('@/store/preview', async importOriginal => ({
  ...(await importOriginal<typeof PreviewStore>()),
  $previewTabSources: atom<string[]>([]),
  closePreviewForSource: vi.fn(),
  openPreview
}))

const previousDesktop = window.hermesDesktop

function fileTarget(path: string, previewKind = 'text') {
  return {
    kind: 'file' as const,
    label: path.split('/').filter(Boolean).pop() || path,
    path,
    previewKind,
    source: `file://${path}`,
    url: `file://${path}`
  }
}

function mountDesktopStub(normalizePreviewTarget: (target: string, baseDir?: string) => unknown) {
  const openDir = vi.fn(async () => ({ ok: true }))
  const openExternal = vi.fn(async () => undefined)
  const openWith = vi.fn(async () => ({ ok: true }))
  const revealPath = vi.fn(async () => true)

  window.hermesDesktop = {
    normalizePreviewTarget: vi.fn(normalizePreviewTarget),
    openDir,
    openExternal,
    openWith,
    revealPath
  } as never

  return { openDir, openExternal, openWith, revealPath }
}

async function buttons() {
  return (await screen.findAllByRole('button')).map(
    button => button.textContent || button.getAttribute('aria-label') || ''
  )
}

describe('PreviewAttachment local target classification (#101683)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isDesktopFsRemoteMode.mockReturnValue(false)
  })

  afterEach(() => {
    cleanup()
    window.hermesDesktop = previousDesktop
  })

  it('opens a Windows file:///C:/... directory link natively with no Download or preview action', async () => {
    const { openDir, revealPath } = mountDesktopStub(() => fileTarget('C:/Users/E/reports/historical', 'directory'))

    render(<PreviewAttachment target="file:///C:/Users/E/reports/historical" />)

    const open = await screen.findByRole('button', { name: 'Open containing folder' })
    expect(await buttons()).toEqual(['Open containing folder', 'More file actions'])

    await act(async () => {
      fireEvent.click(open)
    })

    expect(openDir).toHaveBeenCalledWith('C:/Users/E/reports/historical')
    expect(revealPath).not.toHaveBeenCalled()
    expect(openPreview).not.toHaveBeenCalled()
  })

  it('opens a POSIX directory link through the native folder action', async () => {
    const { openDir } = mountDesktopStub(() => fileTarget('/work/reports/historical', 'directory'))

    render(<PreviewAttachment target="/work/reports/historical" />)

    const open = await screen.findByRole('button', { name: 'Open containing folder' })

    await act(async () => {
      fireEvent.click(open)
    })

    expect(openDir).toHaveBeenCalledWith('/work/reports/historical')
    expect(openPreview).not.toHaveBeenCalled()
  })

  it('reveals an existing local file in the file manager instead of offering Download', async () => {
    const { openDir, revealPath } = mountDesktopStub(() => fileTarget('/work/report.md'))

    render(<PreviewAttachment target="/work/report.md" />)

    await screen.findByRole('button', { name: 'Open containing folder' })
    expect(await buttons()).toEqual(['Open containing folder', 'Open preview', 'More file actions'])

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open containing folder' }))
    })

    expect(revealPath).toHaveBeenCalledWith('/work/report.md')
    expect(openDir).not.toHaveBeenCalled()
  })

  it('keeps Download and the preview action for a remote-backend file', async () => {
    isDesktopFsRemoteMode.mockReturnValue(true)
    const { openDir, revealPath } = mountDesktopStub(() => fileTarget('/srv/report.md'))

    render(<PreviewAttachment target="/srv/report.md" />)

    expect(await buttons()).toEqual(['Download', 'Open preview', 'More file actions'])

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Open preview' }))
    })

    // The remote path is not on this machine: no native folder action fires.
    expect(openDir).not.toHaveBeenCalled()
    expect(revealPath).not.toHaveBeenCalled()
  })

  it('reports a missing path instead of opening a broken preview tab', async () => {
    mountDesktopStub(() => fileTarget('/work/gone.md', 'missing'))

    render(<PreviewAttachment target="/work/gone.md" />)

    const preview = await screen.findByRole('button', { name: 'Preview unavailable' })

    await act(async () => {
      fireEvent.click(preview)
    })

    expect(notifyError).toHaveBeenCalled()
    expect(openPreview).not.toHaveBeenCalled()
  })
})

// The file card's action menu (#menu): the same list behind the "…" button and
// the right-click menu, with only the rows this target supports.
describe('PreviewAttachment card menu', () => {
  beforeAll(() => {
    // Radix menus use pointer capture and scrollIntoView; jsdom has neither.
    Element.prototype.hasPointerCapture ??= () => false
    Element.prototype.releasePointerCapture ??= () => undefined
    Element.prototype.scrollIntoView ??= () => undefined
  })

  beforeEach(() => {
    vi.clearAllMocks()
    isDesktopFsRemoteMode.mockReturnValue(false)
  })

  afterEach(() => {
    cleanup()
    window.hermesDesktop = previousDesktop
  })

  async function openMenu() {
    const more = await screen.findByRole('button', { name: 'More file actions' })

    await act(async () => {
      fireEvent.pointerDown(more, { button: 0, ctrlKey: false, pointerType: 'mouse' })
    })
  }

  it('offers the OS openers and copy actions for a local text file', async () => {
    mountDesktopStub(() => fileTarget('/work/notes.md'))

    render(<PreviewAttachment target="/work/notes.md" />)
    await openMenu()

    expect(await screen.findByRole('menuitem', { name: 'Open file' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Open with…' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Copy path' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Copy file contents' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Open containing folder' })).toBeTruthy()
  })

  it('opens the file with the OS default program', async () => {
    const { openExternal } = mountDesktopStub(() => fileTarget('/work/notes.md'))

    render(<PreviewAttachment target="/work/notes.md" />)
    await openMenu()

    await act(async () => {
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Open file' }))
    })

    expect(openExternal).toHaveBeenCalledWith('/work/notes.md')
  })

  it('raises the program chooser from the menu', async () => {
    const { openWith } = mountDesktopStub(() => fileTarget('/work/notes.md'))

    render(<PreviewAttachment target="/work/notes.md" />)
    await openMenu()

    await act(async () => {
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Open with…' }))
    })

    expect(openWith).toHaveBeenCalledWith('/work/notes.md')
  })

  it('copies the path and the file contents', async () => {
    mountDesktopStub(() => fileTarget('/work/notes.md'))

    render(<PreviewAttachment target="/work/notes.md" />)
    await openMenu()

    await act(async () => {
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Copy path' }))
    })

    expect(copyTextToClipboard).toHaveBeenCalledWith('/work/notes.md')

    await openMenu()

    await act(async () => {
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Copy file contents' }))
    })

    expect(readDesktopFileText).toHaveBeenCalledWith('/work/notes.md')
    expect(copyTextToClipboard).toHaveBeenCalledWith('hello')
  })

  it('leaves out "Copy file contents" for a binary target', async () => {
    mountDesktopStub(() => fileTarget('/work/report.pdf'))

    render(<PreviewAttachment target="/work/report.pdf" />)
    await openMenu()

    expect(await screen.findByRole('menuitem', { name: 'Copy path' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Copy file contents' })).toBeNull()
  })

  it('offers Save as… instead of the local openers for a remote file', async () => {
    isDesktopFsRemoteMode.mockReturnValue(true)
    mountDesktopStub(() => fileTarget('/srv/report.md'))

    render(<PreviewAttachment target="/srv/report.md" />)
    await openMenu()

    expect(await screen.findByRole('menuitem', { name: 'Save as…' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Open file' })).toBeNull()
  })
})
