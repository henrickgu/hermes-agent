import { useStore } from '@nanostores/react'

import { sessionDotClassName } from '@/app/chat/session-status-dot'
import { Button } from '@/components/ui/button'
import { Codicon } from '@/components/ui/codicon'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { translateNow, useI18n } from '@/i18n'
import { desktopGit } from '@/lib/desktop-git'
import { cn } from '@/lib/utils'
import {
  $sidebarCardRows,
  $sidebarFiltersActive,
  $sidebarGrouping,
  $sidebarListGroupIds,
  $sidebarOrdering,
  $sidebarPrFilter,
  $sidebarProfileFilter,
  $sidebarProjectFilter,
  $sidebarRowMeta,
  $sidebarShowAllSessions,
  $sidebarShowArchived,
  $sidebarStatusFilter,
  $sidebarViewCustomized,
  $sidebarWorkspaceNodeOpen,
  resetSidebarView,
  setSidebarCardRows,
  setSidebarGrouping,
  setSidebarOrdering,
  setSidebarShowAllSessions,
  setSidebarShowArchived,
  setWorkspaceNodesOpen,
  type SidebarGrouping,
  type SidebarOrdering,
  type SidebarRowMeta,
  toggleSidebarPrFilter,
  toggleSidebarProfileFilter,
  toggleSidebarProjectFilter,
  toggleSidebarRowMeta,
  toggleSidebarStatusFilter
} from '@/store/layout'
import {
  $profiles,
  $showAllProfiles,
  normalizeProfileKey,
  requestProfileCreate,
  toggleShowAllProfiles
} from '@/store/profile'
import { runImportProfileFlow } from '@/store/profile-share'
import { $projectTree } from '@/store/projects'
import type { PullRequestBucket } from '@/store/pull-requests'
import { $unreadFinishedSessionIds, markAllSessionsRead } from '@/store/session'
import type { SessionStatusBucket } from '@/store/session-dot-state'
import { $sessionsHaveCost } from '@/store/sidebar-archive'

interface Option<T extends string = string> {
  /** A status dot's full className, from the row's own vocabulary. */
  dot?: string
  icon?: string
  id: T
  label: string
}

const GROUPINGS: Option<SidebarGrouping>[] = [
  { icon: 'clock', id: 'date', label: translateNow('desktop.sidebarGroupingUpdated') },
  { icon: 'root-folder', id: 'project', label: translateNow('desktop.sidebarGroupingProject') },
  { icon: 'pulse', id: 'status', label: translateNow('desktop.sidebarGroupingStatus') },
  { icon: 'account', id: 'profile', label: translateNow('desktop.sidebarGroupingProfile') }
]

const ORDERINGS: Option<SidebarOrdering>[] = [
  { icon: 'clock', id: 'updated', label: translateNow('desktop.sidebarOrderingUpdated') },
  { icon: 'add', id: 'created', label: translateNow('desktop.sidebarOrderingCreated') },
  { icon: 'pulse', id: 'status', label: translateNow('desktop.sidebarGroupingStatus') },
  { icon: 'symbol-numeric', id: 'tokens', label: translateNow('desktop.sidebarOrderingTokens') },
  { icon: 'credit-card', id: 'cost', label: translateNow('desktop.sidebarOrderingCost') },
  { icon: 'list-ordered', id: 'manual', label: translateNow('desktop.sidebarOrderingManual') }
]

const ROW_META: Option<SidebarRowMeta>[] = [
  { icon: 'clock', id: 'updated', label: translateNow('desktop.sidebarOrderingUpdated') },
  { icon: 'comment', id: 'preview', label: translateNow('desktop.sidebarOrderingPreview') },
  { icon: 'symbol-numeric', id: 'tokens', label: translateNow('desktop.sidebarOrderingTokens') },
  { icon: 'credit-card', id: 'cost', label: translateNow('desktop.sidebarOrderingCost') },
  { icon: 'git-pull-request', id: 'pr', label: translateNow('desktop.sidebarOrderingPr') },
  { icon: 'account', id: 'profile', label: translateNow('desktop.sidebarGroupingProfile') }
]

const PR_FILTERS: Option<PullRequestBucket>[] = [
  { icon: 'git-pull-request', id: 'open', label: translateNow('desktop.sidebarFilterOpen') },
  { icon: 'git-pull-request-draft', id: 'draft', label: translateNow('desktop.sidebarFilterDraft') },
  { icon: 'git-merge', id: 'merged', label: translateNow('desktop.sidebarFilterMerged') },
  { icon: 'git-pull-request-closed', id: 'closed', label: translateNow('desktop.sidebarFilterClosed') },
  { icon: 'circle-slash', id: 'none', label: translateNow('desktop.sidebarNoPR') }
]

const STATUS_FILTERS: Option<SessionStatusBucket>[] = [
  { dot: sessionDotClassName('needs-input'), id: 'needs-input', label: translateNow('desktop.sidebarFilterNeedsInput') },
  { dot: sessionDotClassName('working'), id: 'working', label: translateNow('desktop.sidebarFilterWorking') },
  { dot: sessionDotClassName('unread'), id: 'unread', label: translateNow('desktop.sidebarFilterUnread') },
  { dot: sessionDotClassName('draft'), id: 'draft', label: translateNow('desktop.sidebarFilterDraft') },
  { dot: cn(sessionDotClassName('idle'), 'bg-(--ui-text-quaternary)'), id: 'idle', label: translateNow('desktop.sidebarFilterIdle') }
]

function OptionGlyph({ option }: { option: Option }) {
  if (option.dot) {
    return <span aria-hidden="true" className={cn('shrink-0', option.dot)} />
  }

  return option.icon ? <Codicon className="text-(--ui-text-tertiary)" name={option.icon} size="0.8125rem" /> : null
}

/** Every option row — single or multi select — leaves the menu open, so a whole
 *  view can be set up in one pass. Only the actions at the bottom dismiss it. */
const keepOpen = (event: Event) => event.preventDefault()

function OptionCheckbox({ checked, onCheck, option }: { checked: boolean; onCheck: () => void; option: Option }) {
  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      onSelect={event => {
        keepOpen(event)
        onCheck()
      }}
    >
      <OptionGlyph option={option} />
      {option.label}
    </DropdownMenuCheckboxItem>
  )
}

function OptionRadio({ option }: { option: Option }) {
  return (
    <DropdownMenuRadioItem onSelect={keepOpen} value={option.id}>
      <OptionGlyph option={option} />
      {option.label}
    </DropdownMenuRadioItem>
  )
}

export function SidebarFilterMenu({ className }: { className?: string }) {
  const { t } = useI18n()
  const grouping = useStore($sidebarGrouping)
  const ordering = useStore($sidebarOrdering)
  const rowMeta = useStore($sidebarRowMeta)
  const cardRows = useStore($sidebarCardRows)
  const showAllSessions = useStore($sidebarShowAllSessions)
  const statusFilter = useStore($sidebarStatusFilter)
  const projectFilter = useStore($sidebarProjectFilter)
  const profileFilter = useStore($sidebarProfileFilter)
  const showAllProfiles = useStore($showAllProfiles)
  const profileNames = useStore($profiles).map(profile => normalizeProfileKey(profile.name))
  const narrowsByProfile = showAllProfiles && profileNames.length > 1
  const prFilter = useStore($sidebarPrFilter)
  const showArchived = useStore($sidebarShowArchived)
  const filtersActive = useStore($sidebarFiltersActive)
  const viewCustomized = useStore($sidebarViewCustomized)
  const nodeOpen = useStore($sidebarWorkspaceNodeOpen)
  const listGroupIds = useStore($sidebarListGroupIds)
  const projects = useStore($projectTree)
  const hasCost = useStore($sessionsHaveCost)
  const unreadIds = useStore($unreadFinishedSessionIds)
  // PR state comes from `gh` on whichever machine holds the checkout — Electron
  // locally, the gateway's REST mirror remotely. Resolved per render, not once
  // at module load: switching to a remote profile swaps the bridge underneath.
  const prAvailable = Boolean(desktopGit()?.review?.prList)

  // Fold the level in view: project rows, or the date/status buckets. Project
  // rows default open, so "all collapsed" means every one of them has been
  // explicitly shut. Never sweeps Pinned or Cron.
  const foldIds =
    grouping === 'project'
      ? projects.map(project => project.id)
      : grouping === 'date' || grouping === 'status'
        ? listGroupIds
        : []

  const foldCollapsed = foldIds.length > 0 && foldIds.every(id => nodeOpen[id] === false)

  const groupings = GROUPINGS.map(option =>
    option.id === 'profile' ? { ...option, label: t.sidebar.gatewayGroups.grouping } : option
  )

  const groupingLabel = groupings.find(option => option.id === grouping)?.label

  // Two options are conditional: dragging a row is what picks manual, so it
  // only appears as a way back out once there's a hand-picked order to leave;
  // and cost is hidden until some session actually reports spend.
  const orderings = ORDERINGS.filter(option => {
    if (option.id === 'manual') {
      return ordering === 'manual'
    }

    return option.id !== 'cost' || hasCost || ordering === 'cost'
  })

  const rowMetaOptions = ROW_META.filter(option => {
    if (option.id === 'cost') {
      return hasCost || rowMeta.includes('cost')
    }

    // Preview is a card line; the one-line row has nowhere to put it.
    if (option.id === 'preview') {
      return cardRows
    }

    return option.id !== 'pr' || prAvailable
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t.desktop.sidebarFiltersLabel}
          className={cn(
            className,
            'data-[state=open]:bg-(--ui-control-active-background) data-[state=open]:text-foreground data-[state=open]:opacity-100',
            // Active filters read as "this control is engaged", the same way the
            // open menu does — never as an accent, which the sidebar reserves
            // for a session that is actually doing something.
            filtersActive && 'bg-(--ui-control-active-background) text-foreground opacity-100'
          )}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Codicon name="list-filter" size="0.75rem" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger hideChevron>
              {t.desktop.sidebarGroupingLabel}
              <span className="ml-auto flex items-center gap-1 pl-4 text-(--ui-text-tertiary)">
                {groupingLabel}
                <Codicon name="chevron-right" size="1rem" />
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                onValueChange={value => setSidebarGrouping(value as SidebarGrouping)}
                value={grouping}
              >
                {groupings.map(option => (
                  <OptionRadio key={option.id} option={option} />
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t.desktop.sidebarOrderingLabel}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                onValueChange={value => setSidebarOrdering(value as SidebarOrdering)}
                value={ordering}
              >
                {orderings.map(option => (
                  <OptionRadio key={option.id} option={option} />
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t.desktop.sidebarShowLabel}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {rowMetaOptions.map(option => (
                <OptionCheckbox
                  checked={rowMeta.includes(option.id)}
                  key={option.id}
                  onCheck={() => toggleSidebarRowMeta(option.id)}
                  option={option}
                />
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {grouping === 'project' && (
            <OptionCheckbox
              checked={showAllSessions}
              onCheck={() => setSidebarShowAllSessions(!showAllSessions)}
              option={{ icon: 'list-unordered', id: 'all-sessions', label: t.sidebar.projects.showAllSessions }}
            />
          )}

          {/* A render variant, not a grouping: three-line cards (project · age /
              title / model · size) compose with whichever grouping is active. */}
          <OptionCheckbox
            checked={cardRows}
            onCheck={() => setSidebarCardRows(!cardRows)}
            option={{ icon: 'inbox', id: 'card-rows', label: t.desktop.sidebarInboxStyle }}
          />
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>{t.desktop.sidebarFiltersLabel}</DropdownMenuLabel>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t.desktop.sidebarGroupingStatus}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {STATUS_FILTERS.map(option => (
                <OptionCheckbox
                  checked={statusFilter.includes(option.id)}
                  key={option.id}
                  onCheck={() => toggleSidebarStatusFilter(option.id)}
                  option={option}
                />
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* `gh` only exists where the checkout does, so on a remote backend
              this submenu never appears rather than filtering everything out. */}
          {prAvailable && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>{t.desktop.sidebarPullRequest}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {PR_FILTERS.map(option => (
                  <OptionCheckbox
                    checked={prFilter.includes(option.id)}
                    key={option.id}
                    onCheck={() => toggleSidebarPrFilter(option.id)}
                    option={option}
                  />
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t.desktop.sidebarGroupingProfile}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
              {/* Scoped to one profile the rail is already the filter, so the
                  per-profile boxes only appear where they can narrow something.
                  The actions below stand on their own. */}
              {narrowsByProfile && (
                <>
                  {profileNames.map(name => (
                    <OptionCheckbox
                      checked={profileFilter.includes(name)}
                      key={name}
                      onCheck={() => toggleSidebarProfileFilter(name)}
                      option={{ icon: 'account', id: name, label: name }}
                    />
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onSelect={requestProfileCreate}>{t.profiles.newProfile}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void runImportProfileFlow()}>
                {t.profiles.importProfile}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {projects.length > 1 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>{t.desktop.sidebarGroupingProject}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
                {projects.map(project => (
                  <OptionCheckbox
                    checked={projectFilter.includes(project.id)}
                    key={project.id}
                    onCheck={() => toggleSidebarProjectFilter(project.id)}
                    option={{
                      icon: project.isNoProject ? 'home' : 'root-folder',
                      id: project.id,
                      // Home is synthetic, so its label is ours to translate.
                      label: project.isNoProject ? t.sidebar.projects.home : project.label
                    }}
                  />
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          {/* Off by default: one profile's sessions are what the rail selected.
              Nothing to widen to until a second profile exists — but stay
              visible while it's on, or deleting your way back down to one
              profile would strand the sidebar in a mode nothing can leave (the
              rail hides its switcher at one profile too). */}
          {(profileNames.length > 1 || showAllProfiles) && (
            <OptionCheckbox
              checked={showAllProfiles}
              onCheck={toggleShowAllProfiles}
              option={{ id: 'all-profiles', label: t.profiles.allProfiles }}
            />
          )}

          <OptionCheckbox
            checked={showArchived}
            onCheck={() => setSidebarShowArchived(!showArchived)}
            option={{ id: 'archived', label: t.desktop.sidebarArchived }}
          />

          {/* One way back rather than two near-identical ones: this drops the
              grouping and sort too, which "clear filters" left behind. */}
          {viewCustomized && (
            <DropdownMenuItem onSelect={resetSidebarView}>{translateNow('desktop.sidebarResetToDefaults')}</DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {foldIds.length > 0 && (
          <DropdownMenuItem onSelect={() => setWorkspaceNodesOpen(foldIds, foldCollapsed)}>
            {foldCollapsed ? t.desktop.sidebarExpandAll : t.desktop.sidebarCollapseAll}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled={unreadIds.length === 0} onSelect={markAllSessionsRead}>
          {t.desktop.sidebarMarkAllRead}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
