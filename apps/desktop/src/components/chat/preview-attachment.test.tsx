import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type * as DesktopFs from '@/lib/desktop-fs'
import type * as LocalPreview from '@/lib/local-preview'

import { PreviewAttachment } from './preview-attachment'

// The OS file-manager bridge is Electron-only; fake it so the component's
// reveal/open-dir behavior is observable without a desktop shell.
const openDirMock = vi.hoisted(() => vi.fn(async () => undefined))
const revealMock = vi.hoisted(() => vi.fn(async () => undefined))
let remoteMode = false

vi.mock('@/lib/desktop-fs', async importOriginal => {
  const actual = await importOriginal<typeof DesktopFs>()

  return {
    ...actual,
    isDesktopFsRemoteMode: () => remoteMode,
    openDesktopDir: openDirMock,
    revealDesktopPath: revealMock
  }
})

// The preview toggle resolves through the Electron bridge; stub it out so the
// component mounts without a desktop shell.
vi.mock('@/lib/local-preview', async importOriginal => {
  const actual = await importOriginal<typeof LocalPreview>()

  return { ...actual, normalizeOrLocalPreviewTarget: vi.fn(async () => null) }
})

describe('PreviewAttachment open-in-file-manager button', () => {
  afterEach(() => {
    cleanup()
    openDirMock.mockClear()
    revealMock.mockClear()
    remoteMode = false
  })

  it('renders the reveal button on a local backend and opens a folder target with openDir', async () => {
    render(<PreviewAttachment source="explicit-link" target="file:///C:/Users/a/Relat%C3%B3rio%20Final" />)

    // Three buttons: Download + Reveal/Open folder + Open preview.
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(3)

    await fireEvent.click(buttons[1])

    // file:/// URL is decoded and a directory-looking target opens itself.
    expect(openDirMock).toHaveBeenCalledWith('C:/Users/a/Relatório Final')
    expect(revealMock).not.toHaveBeenCalled()
  })

  it('reveals a file target inside its parent instead of opening it', async () => {
    render(<PreviewAttachment source="explicit-link" target="C:/Users/a/report.pdf" />)

    const buttons = screen.getAllByRole('button')
    await fireEvent.click(buttons[1])

    expect(revealMock).toHaveBeenCalledWith('C:/Users/a/report.pdf')
    expect(openDirMock).not.toHaveBeenCalled()
  })

  it('hides the button on a remote backend (path is not on this disk)', () => {
    remoteMode = true

    render(<PreviewAttachment source="explicit-link" target="C:/Users/a/report.pdf" />)

    expect(screen.getAllByRole('button').length).toBe(2)
  })
})
