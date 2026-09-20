import { describe, it } from 'vitest'

import { en } from './en'
import { pt } from './pt'
import { defineLocale } from './define-locale'

describe('debug merge', () => {
  it('mostra se override aplicou', () => {
    const p = pt as unknown as Record<string, any>
    const e = en as unknown as Record<string, any>
    // eslint-disable-next-line no-console
    console.log('DBG en uninstall:', JSON.stringify(e.settings?.uninstallSection))
    // eslint-disable-next-line no-console
    console.log('DBG pt uninstall:', JSON.stringify(p.settings?.uninstallSection))
    // eslint-disable-next-line no-console
    console.log('DBG iguais?', p.settings?.uninstallSection === e.settings?.uninstallSection)
  })
})
