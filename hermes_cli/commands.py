"""Slash command registry for the Hermes CLI and gateway.

Every consumer -- CLI help, gateway dispatch, Telegram BotCommands, Slack
subcommand mapping, autocomplete -- derives from ``COMMAND_REGISTRY``. To add a
command, append a ``CommandDef``; to add an alias, set ``aliases=("short",)``.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass

from utils import is_truthy_value
from hermes_constants import INDICATOR_STYLES

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class CommandDef:
    """Definition of a single slash command."""
    name: str                          # canonical name without slash: "background"
    description: str                   # human-readable description
    category: str                      # "Session", "Configuration", etc.
    aliases: tuple[str, ...] = ()      # alternative names: ("bg",)
    args_hint: str = ""                # argument placeholder: "<prompt>", "[name]"
    subcommands: tuple[str, ...] = ()  # tab-completable subcommands
    cli_only: bool = False             # only available in CLI
    gateway_only: bool = False         # only available in gateway/messaging
    gateway_config_gate: str | None = None  # config dotpath; truthy overrides cli_only for gateway
    # Mid-run (agent busy) gateway behavior (gateway/run.py Guard-2 dispatcher): "dispatch" = run
    # while busy (normal handler or the ``busy_handler`` variant); "reject" = refuse mid-run
    # (generic "Agent is running" unless ``busy_handler`` names a reject message);
    # "interrupt_then_dispatch" = interrupt first (/stop, /new, /reset; Guard 1, platforms/base.py).
    busy_policy: str = "reject"
    busy_handler: str | None = None  # key of a special mid-run handler in Guard-2 table
    # Key in ``hermes_cli.slash_exec.EXECUTORS`` (a string, not a callable: keeps this module
    # import-light for the gateway).
    execute: str | None = None
    argument_mode: str | None = None  # desktop composer: options|text|mixed; None inferred
    # Desktop availability: None = offered; "hidden" = runs but out of the popover; else a reason.
    desktop: str | None = None


VALID_BUSY_POLICIES: frozenset[str] = frozenset({"dispatch", "reject", "interrupt_then_dispatch"})


COMMAND_REGISTRY: list[CommandDef] = [
    # Session
    CommandDef("start", "Confirma pings de start sem responder", "Session",
               gateway_only=True, busy_policy="dispatch", busy_handler="start"),
    CommandDef("new", "Nova sessão (ID e histórico novos)", "Session",
               aliases=("reset",), args_hint="[name]",
               busy_policy="interrupt_then_dispatch", busy_handler="new"),
    CommandDef("topic", "Sessões por tópico no Telegram (DM)", "Session",
               gateway_only=True, args_hint="[off|help|session-id]"),
    CommandDef("clear", "Limpa a tela e começa sessão nova", "Session",
               cli_only=True, desktop="terminal"),
    CommandDef("redraw", "Redesenha a UI (recupera o terminal)", "Session",
               cli_only=True, desktop="terminal"),
    CommandDef("history", "Mostra o histórico da conversa", "Session",
               cli_only=True, desktop="terminal"),
    CommandDef("save", "Exporta a conversa atual", "Session",
               args_hint="<json|md|html> [filename] [redact]"),
    CommandDef("retry", "Reenvia a última mensagem ao agente", "Session"),
    CommandDef("prompt", "Escreve o prompt no editor e envia", "Session",
               cli_only=True, args_hint="[initial text]", aliases=("compose",)),
    CommandDef("undo", "Volta N turnos e refaz (padrão 1)", "Session",
               args_hint="[N]"),
    CommandDef("title", "Define título da sessão atual", "Session", args_hint="[name]"),
    CommandDef("handoff", "Transfere a sessão p/ Telegram etc.", "Session",
               args_hint="<platform>", cli_only=True, argument_mode="options"),
    CommandDef("branch", "Cria um ramo da sessão atual", "Session",
               aliases=("fork",), args_hint="[name]"),
    CommandDef("worktree", "Gerencia worktrees git isoladas", "Session",
               cli_only=True, args_hint="[new [name]|list|prune [--dry-run]]",
               subcommands=("new", "list", "prune")),
    CommandDef("compress", "Comprime o contexto da conversa", "Session",
               aliases=("compact",), args_hint="[here [N] | focus topic | --preview|--dry-run]"),
    CommandDef("rollback", "Restaura checkpoints de arquivos", "Session",
               args_hint="[number] [--all]"),
    CommandDef("snapshot", "Snapshots do estado do Hermes", "Session",
               cli_only=True, aliases=("snap",), args_hint="[create|restore <id>|prune]",
               desktop="terminal"),
    CommandDef("export", "Exporta um perfil (config/skills/tema)", "Configuration",
               cli_only=True, args_hint="[profile] [-o output.tar.gz]"),
    CommandDef("import", "Importa um perfil compartilhado", "Configuration",
               cli_only=True, args_hint="<archive.tar.gz> [--name <name>]"),
    CommandDef("stop", "Mata processos em background", "Session",
               busy_policy="interrupt_then_dispatch", busy_handler="stop"),
    CommandDef("pause", "Pausa global (parada de emergência)", "Session",
               gateway_only=True, args_hint="[reason | off]", busy_policy="dispatch"),
    CommandDef("approve", "Aprova comando perigoso pendente", "Session",
               gateway_only=True, args_hint="[session|always]", busy_policy="dispatch",
               desktop="messaging"),
    CommandDef("deny", "Recusa comando perigoso pendente", "Session",
               gateway_only=True, args_hint="[all] [reason]", busy_policy="dispatch",
               desktop="messaging"),
    CommandDef("bg", "Roda prompt em sessão em background", "Session",
               args_hint="<prompt>", busy_policy="dispatch"),
    CommandDef("btw", "Pergunta avulsa sem interromper", "Session",
               args_hint="<question>", busy_policy="dispatch"),
    CommandDef("agents", "Mostra agentes e tarefas ativos", "Session",
               aliases=("tasks",), busy_policy="dispatch"),
    CommandDef("journey", "Linha do tempo de aprendizado",
               "Session", aliases=("learning", "memory-graph"), cli_only=True,
               args_hint="[list|delete <id>|edit <id>]", subcommands=("list", "delete", "edit")),
    CommandDef("queue", "Enfileira prompt p/ próximo turno", "Session",
               aliases=("q",), args_hint="<prompt>", busy_policy="dispatch", busy_handler="queue"),
    CommandDef("steer", "Injeta msg após próxima ferramenta", "Session",
               args_hint="<prompt>", busy_policy="dispatch", busy_handler="steer"),
    CommandDef("goal", "Define objetivo permanente do Hermes", "Session",
               args_hint="[text | draft <text> | show | gate add <cmd> | pause | resume | clear | status | wait <pid> | unwait]",
               argument_mode="mixed", busy_policy="dispatch", busy_handler="goal"),
    CommandDef("heartbeat", "Prompt recorrente nesta sessão", "Session",
               aliases=("hb",), args_hint="[every <interval> <prompt> | status | pause | resume | clear]",
               subcommands=("status", "pause", "resume", "clear"),
               busy_policy="dispatch"),
    CommandDef("refine", "Revisa a conversa e salva lições", "Session",
               args_hint="[focus instructions]"),
    CommandDef("review", "Subagente revisa o trabalho atual", "Session",
               args_hint="[review instructions]"),
    CommandDef("loop", "Reexecuta prompt em intervalos", "Session",
               aliases=("proactive",),
               args_hint="[interval] <prompt> [--times N] [--until <condition>] | status | pause | resume | stop",
               argument_mode="mixed", busy_policy="dispatch", busy_handler="loop"),
    CommandDef("plan", "Plano de implementação em markdown", "Session",
               args_hint="[task]"),
    CommandDef("moa", "Roda pelo preset Mixture of Agents", "Session",
               args_hint="<prompt>", busy_policy="reject", busy_handler="moa"),
    CommandDef("subgoal", "Critérios extras do objetivo ativo", "Session",
               args_hint="[text | remove N | clear]", busy_policy="dispatch"),
    CommandDef("status", "Info de sessão, modelo e contexto", "Session",
               busy_policy="dispatch"),
    CommandDef("egress", "Status do proxy egress do Docker", "Session",
               args_hint="[status]", subcommands=("status",), busy_policy="dispatch",
               busy_handler="egress", execute="egress"),
    CommandDef("context", "Janela de contexto em detalhe", "Session",
               aliases=("ctx",), args_hint="[all]", subcommands=("all",), busy_policy="dispatch"),
    CommandDef("whoami", "Seu nível de acesso (admin/usuário)", "Info"),
    CommandDef("profile", "Perfil ativo e diretório home", "Info",
               busy_policy="dispatch", execute="profile"),
    CommandDef("sethome", "Define este chat como canal home", "Session",
               gateway_only=True, aliases=("set-home",), desktop="terminal"),
    CommandDef("resume", "Retoma sessão nomeada anterior", "Session",
               args_hint="[name]", argument_mode="mixed"),
    CommandDef("sessions", "Navega e retoma sessões anteriores", "Session"),

    # Configuration
    CommandDef("config", "Mostra a configuração atual", "Configuration",
               cli_only=True, desktop="terminal"),
    CommandDef("model", "Troca de modelo (--global persiste)", "Configuration",
               args_hint="[model] [--provider name] [--global|--session] [--refresh]",
               busy_policy="reject", busy_handler="model", desktop="hidden"),
    CommandDef("codex-runtime", "Runtime codex app-server (OpenAI)",
               "Configuration", aliases=("codex_runtime",), args_hint="[auto|codex_app_server]",
               busy_policy="reject", busy_handler="codex-runtime"),
    CommandDef("personality", "Define personalidade pré-definida", "Configuration",
               args_hint="[name]", argument_mode="options"),
    CommandDef("statusbar", "Barra de status contexto/modelo", "Configuration",
               cli_only=True, aliases=("sb",), desktop="terminal"),
    CommandDef("battery", "Indicador de bateria na barra",
               "Configuration", cli_only=True, args_hint="[on|off|status]",
               subcommands=("on", "off", "status")),
    CommandDef("timestamps", "Timestamps [HH:MM] nas mensagens", "Configuration",
               cli_only=True, args_hint="[on|off|status]",
               subcommands=("on", "off", "status"), aliases=("ts",)),
    CommandDef("diff", "Mudanças git no diretório atual", "Info",
               args_hint="[staged|all|session] [--stat] [path...]",
               subcommands=("staged", "all", "session")),
    CommandDef("verbose", "Progresso das ferramentas (ciclo)",
               "Configuration", cli_only=True, gateway_config_gate="display.tool_progress_command",
               busy_policy="dispatch", desktop="terminal"),
    CommandDef("focus", "Modo foco: prompt e resposta final",
               "Configuration", cli_only=True, args_hint="[on|off|status]",
               subcommands=("on", "off", "status")),
    CommandDef("footer", "Rodapé de metadados nas respostas",
               "Configuration", args_hint="[on|off|status]", subcommands=("on", "off", "status"),
               busy_policy="dispatch", desktop="terminal"),
    CommandDef("yolo", "Modo YOLO (pula aprovações)",
               "Configuration", busy_policy="dispatch"),
    CommandDef("approvals", "Modo de aprovação de comandos",
               "Configuration", args_hint="[manual|smart|off]",
               subcommands=("manual", "smart", "off")),
    CommandDef("reasoning", "Esforço e exibição do raciocínio", "Configuration",
               args_hint="[level|show|hide|full|clamp] [--global]",
               subcommands=("none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra", "show", "hide", "on", "off", "full", "clamp", "--global"),
               desktop="advanced"),
    CommandDef("fast", "Modo rápido OpenAI/Anthropic", "Configuration",
               args_hint="[normal|fast|auto|cold|status] [--global]",
               subcommands=("normal", "fast", "auto", "cold", "status", "on", "off", "--global"),
               desktop="advanced"),
    CommandDef("skin", "Tema/skin da interface", "Configuration",
               cli_only=True, args_hint="[name]", argument_mode="options"),
    CommandDef("indicator", "Estilo do indicador de atividade", "Configuration",
               cli_only=True, args_hint=f"[{'|'.join(INDICATOR_STYLES)}]",
               subcommands=INDICATOR_STYLES, desktop="terminal"),
    CommandDef("voice", "Liga/desliga o modo voz", "Configuration",
               args_hint="[on|off|tts|status]", subcommands=("on", "off", "tts", "status"),
               desktop="composer-voice"),
    CommandDef("wake", "Wake word 'Hey Hermes'", "Configuration",
               cli_only=True, args_hint="[on|off|status]", subcommands=("on", "off", "status")),
    CommandDef("busy", "Msgs enquanto o Hermes trabalha", "Configuration",
               args_hint="[queue|steer|interrupt|status]",
               subcommands=("queue", "steer", "interrupt", "status"),
               busy_policy="dispatch", desktop="terminal"),

    # Tools & Skills
    CommandDef("tools", "Gerencia ferramentas", "Tools & Skills",
               args_hint="[list|disable|enable] [name...]", cli_only=True, argument_mode="options"),
    CommandDef("toolsets", "Lista toolsets disponíveis", "Tools & Skills",
               cli_only=True, desktop="terminal"),
    CommandDef("skills", "Busca, instala e gerencia skills",
               "Tools & Skills", cli_only=True,
               gateway_config_gate="skills.write_approval",
               subcommands=("search", "browse", "inspect", "install", "audit",
                            "pending", "approve", "reject", "diff", "approval"),
               desktop="settings"),
    CommandDef("memory", "Memórias pendentes / aprovação",
               "Tools & Skills", args_hint="[pending|approve|reject|approval] [id|on|off]",
               subcommands=("pending", "approve", "reject", "approval")),
    CommandDef("bundles", "Bundles de skills (alias /<nome>)",
               "Tools & Skills", execute="bundles"),
    CommandDef("pet", "Mascote petdex (/pet, /pet list)", "Tools & Skills",
               cli_only=True, args_hint="[toggle|list|scale <n>|<slug>]", subcommands=("toggle", "list", "scale", "off")),
    CommandDef("hatch", "Gera pet petdex de uma descrição",
               "Tools & Skills", cli_only=True, aliases=("generate-pet",), args_hint="[description]"),
    CommandDef("learn", "Aprende skill do que você descrever",
               "Tools & Skills", args_hint="<what to learn from>"),
    CommandDef("init", "Gera/atualiza AGENTS.md do projeto",
               "Tools & Skills", args_hint="[notes]"),
    CommandDef("cron", "Gerencia tarefas agendadas", "Tools & Skills",
               cli_only=True, args_hint="[subcommand]",
               subcommands=("list", "add", "create", "edit", "pause", "resume", "run", "remove"),
               desktop="terminal"),
    CommandDef("suggestions", "Revisa automações sugeridas",
               "Tools & Skills", aliases=("suggest",), args_hint="[accept|dismiss N | catalog]",
               subcommands=("accept", "dismiss", "catalog", "clear")),
    CommandDef("blueprint", "Automação de um template blueprint",
               "Tools & Skills", aliases=("bp",), args_hint="[name] [slot=value ...]"),
    CommandDef("curator", "Manutenção de skills em background",
               "Tools & Skills", args_hint="[subcommand]",
               subcommands=("status", "run", "pause", "resume", "pin", "unpin", "restore", "list-archived"),
               desktop="advanced"),
    CommandDef("kanban", "Quadro multi-perfil (tarefas etc.)",
               "Tools & Skills", args_hint="[subcommand]",
               subcommands=("init", "boards", "create", "list", "ls", "show", "assign",
                            "reclaim", "reassign", "diagnostics", "diag", "link", "unlink",
                            "claim", "comment", "complete", "edit", "block", "unblock",
                            "archive", "tail", "dispatch", "stats", "notify-subscribe",
                            "notify-list", "notify-unsubscribe", "log", "runs",
                            "heartbeat", "assignees", "context", "specify", "gc"),
               busy_policy="dispatch", desktop="advanced"),
    CommandDef("reload", "Recarrega .env na sessão atual", "Tools & Skills",
               cli_only=True, desktop="terminal"),
    CommandDef("reload-mcp", "Recarrega servidores MCP", "Tools & Skills",
               aliases=("reload_mcp",), desktop="advanced"),
    CommandDef("reload-skills", "Re-escaneia skills instaladas",
               "Tools & Skills", aliases=("reload_skills",), desktop="advanced"),
    CommandDef("browser", "Conecta navegador via CDP", "Tools & Skills",
               cli_only=True, args_hint="[connect|disconnect|status|use]",
               subcommands=("connect", "disconnect", "status", "use")),
    CommandDef("plugins", "Lista plugins e status",
               "Tools & Skills", cli_only=True, desktop="terminal"),

    # Info
    CommandDef("commands", "Todos os comandos e skills", "Info",
               gateway_only=True, args_hint="[page]", busy_policy="dispatch",
               execute="gateway_commands"),
    CommandDef("help", "Comandos disponíveis (filtra)", "Info", busy_policy="dispatch",
               execute="gateway_help", args_hint="[skills|<filter>]"),
    CommandDef("palette", "Paleta de comandos (Ctrl+P)", "Info",
               cli_only=True, busy_policy="dispatch"),
    CommandDef("restart", "Reinicia o gateway com cuidado", "Session",
               gateway_only=True, busy_policy="dispatch", desktop="terminal"),
    CommandDef("usage", "Uso de tokens e limites", "Info",
               args_hint="[reset [--force]]"),
    CommandDef("subscription", "Plano Nous (muda no navegador)", "Info",
               cli_only=True, aliases=("upgrade",)),
    CommandDef("login", "Entra com conta Nous", "Info",
               busy_policy="dispatch", desktop="settings"),
    CommandDef("topup", "Saldo Nous e cobrança no portal", "Info"),
    CommandDef("insights", "Métricas e análises de uso", "Info",
               args_hint="[days]", desktop="advanced"),
    CommandDef("platforms", "Status das plataformas do gateway", "Info",
               cli_only=True, aliases=("gateway",), desktop="terminal"),
    CommandDef("platform", "Pausa/retoma plataforma com falha", "Info",
               gateway_only=True, args_hint="<pause|resume|list> [name]"),
    CommandDef("copy", "Copia última resposta p/ clipboard", "Info",
               cli_only=True, args_hint="[number]", desktop="terminal"),
    CommandDef("paste", "Anexa imagem do clipboard", "Info",
               cli_only=True, desktop="terminal"),
    CommandDef("image", "Anexa imagem local ao prompt", "Info",
               cli_only=True, args_hint="<path>", desktop="terminal"),
    CommandDef("update", "Atualiza o Hermes Agent", "Info",
               busy_policy="dispatch", desktop="terminal"),
    CommandDef("version", "Mostra a versão do Hermes Agent", "Info", aliases=("v",),
               busy_policy="dispatch", execute="version"),
    CommandDef("debug", "Relatório de debug com links", "Info",
               args_hint="[nous|local]"),

    # Exit
    CommandDef("quit", "Sai da CLI (--delete apaga sessão)", "Exit",
               cli_only=True, aliases=("exit",), args_hint="[--delete]", desktop="terminal")]


# Distinguishes ``mixed`` (subcommands plus free-text) from ``options``; no subcommands => ``text``.
_PROSE_HINTS = ("<prompt>", "[text", "instructions", "[interval]", "<what")


def infer_argument_mode(cmd: CommandDef) -> str | None:
    """Composer mode: explicit on the CommandDef, else inferred from its args."""
    if cmd.argument_mode in {"options", "text", "mixed"}:
        return cmd.argument_mode
    hint = (cmd.args_hint or "").strip()
    if cmd.subcommands:
        prose = hint and any(token in hint.lower() for token in _PROSE_HINTS)
        return "mixed" if prose else "options"
    return "text" if hint else None


def command_desktop_meta(cmd: CommandDef) -> dict[str, str | None]:
    """Wire shape for ``commands.catalog`` — reads the CommandDef, nothing else."""
    return {"argument_mode": infer_argument_mode(cmd), "desktop": cmd.desktop}


# Every name and alias -> its CommandDef.
_COMMAND_LOOKUP: dict[str, CommandDef] = {
    key: cmd for cmd in COMMAND_REGISTRY for key in (cmd.name, *cmd.aliases)}


def resolve_command(name: str) -> CommandDef | None:
    """Resolve a command name or alias (leading slash optional) to its CommandDef."""
    return _COMMAND_LOOKUP.get(name.lower().lstrip("/"))


def _build_description(cmd: CommandDef) -> str:
    """CLI-facing description including the usage hint."""
    if not cmd.args_hint:
        return cmd.description
    return f"{cmd.description} (usage: /{cmd.name} {cmd.args_hint})"


# Flat "/command" -> description, and the same grouped by category; both exclude gateway_only.
COMMANDS: dict[str, str] = {}
COMMANDS_BY_CATEGORY: dict[str, dict[str, str]] = {}
# Subcommands lookup: "/cmd" -> ["sub1", ...]; explicit ``subcommands`` first (in
# registry order), then pipe patterns in args_hint ("[on|off|status]") as fallback.
SUBCOMMANDS: dict[str, list[str]] = {
    f"/{_cmd.name}": list(_cmd.subcommands) for _cmd in COMMAND_REGISTRY if _cmd.subcommands}
for _cmd in COMMAND_REGISTRY:
    if _cmd.gateway_only:
        continue
    _entries = {f"/{_cmd.name}": _build_description(_cmd)}
    for _alias in _cmd.aliases:
        _entries[f"/{_alias}"] = f"{_cmd.description} (alias for /{_cmd.name})"
    COMMANDS.update(_entries)
    COMMANDS_BY_CATEGORY.setdefault(_cmd.category, {}).update(_entries)

_PIPE_SUBS_RE = re.compile(r"[a-z]+(?:\|[a-z]+)+")
for _cmd in COMMAND_REGISTRY:
    _m = _PIPE_SUBS_RE.search(_cmd.args_hint) if _cmd.args_hint else None
    if _m and f"/{_cmd.name}" not in SUBCOMMANDS:
        SUBCOMMANDS[f"/{_cmd.name}"] = _m.group(0).split("|")


# /help sub-groups for the large "Session" category (category itself is load-bearing for gateway
# help, so commands are not re-tagged); unlisted Session commands fall under the base header.
HELP_SESSION_SUBGROUPS: dict[str, tuple[str, ...]] = {
    "Context": ("compress", "compact", "context", "ctx", "status"),
    "Background & Automation": (
        "bg", "btw", "agents", "tasks", "queue", "q", "steer", "goal", "subgoal", "heartbeat", "hb",
        "refine", "loop", "proactive", "moa", "journey", "learning", "memory-graph")}

# All names + aliases the gateway dispatches. Config-gated commands are
# included; their handler checks the gate at runtime.
GATEWAY_KNOWN_COMMANDS: frozenset[str] = frozenset(
    name for cmd in COMMAND_REGISTRY if not cmd.cli_only or cmd.gateway_config_gate
    for name in (cmd.name, *cmd.aliases))


def is_gateway_known_command(name: str | None) -> bool:
    """True if ``name`` is a built-in or plugin gateway slash command (plugins looked
    up lazily); decides whether the gateway emits ``command:<name>`` hooks."""
    if not name:
        return False
    return name in GATEWAY_KNOWN_COMMANDS or any(
        plugin_name == name for plugin_name, _d, _h in _iter_plugin_command_entries())


# Commands with explicit mid-run handling (busy_policy != "reject"). Kept
# under its historical name for introspection/tests; the real bypass set is
# every resolvable command (see should_bypass_active_session).
ACTIVE_SESSION_BYPASS_COMMANDS: frozenset[str] = frozenset(
    cmd.name for cmd in COMMAND_REGISTRY if cmd.busy_policy != "reject")


def is_interrupt_then_dispatch(command_name: str | None) -> bool:
    """Guard 1 (gateway/platforms/base.py) routes these through the cancel-handoff path."""
    cmd = resolve_command(command_name) if command_name else None
    return cmd is not None and cmd.busy_policy == "interrupt_then_dispatch"


def should_bypass_active_session(command_name: str | None) -> bool:
    """True for any resolvable slash command: every recognized command is dispatched mid-run
    (Guard-2 handler or the "busy" catch-all), never queued — gateway.run's safety net discards
    command text reaching the pending queue, so a queued mid-run /model (or /reasoning, /voice,
    /insights, /title, /resume, /retry, /undo, /compress, /usage, /reload-mcp, /sethome, /reset)
    would silently interrupt the agent AND get discarded — a zero-char response. See issue
    #5057 / PRs #6252, #10370, #4665. ACTIVE_SESSION_BYPASS_COMMANDS remains the subset with
    explicit Level-2 handlers; the rest fall through to the catch-all.

    See #10370, #4665, #5057, #6252.
    """
    return resolve_command(command_name) is not None if command_name else False


def _resolve_config_gates() -> set[str]:
    """Canonical names of commands whose ``gateway_config_gate`` dotpath is truthy in
    config.yaml (empty set on any error)."""
    gated = [c for c in COMMAND_REGISTRY if c.gateway_config_gate]
    if not gated:
        return set()
    try:
        from hermes_cli.config import cfg_get, read_raw_config
        cfg = read_raw_config()
    except Exception:
        return set()
    return {cmd.name for cmd in gated
            if is_truthy_value(cfg_get(cfg, *cmd.gateway_config_gate.split(".")), default=False)}


def _is_gateway_available(cmd: CommandDef, config_overrides: set[str] | None = None) -> bool:
    """Not ``cli_only``, or its config gate is truthy (*config_overrides* from
    ``_resolve_config_gates()`` avoids re-reading config per command)."""
    if not cmd.cli_only:
        return True
    if not cmd.gateway_config_gate:
        return False
    overrides = config_overrides if config_overrides is not None else _resolve_config_gates()
    return cmd.name in overrides


def gateway_help_lines() -> list[str]:
    """Generate gateway help text lines from the registry."""
    overrides = _resolve_config_gates()
    lines: list[str] = []
    for cmd in COMMAND_REGISTRY:
        if not _is_gateway_available(cmd, overrides):
            continue
        args = f" {cmd.args_hint}" if cmd.args_hint else ""
        # Skip internal aliases like reload_mcp (underscore variant of the name).
        alias_parts = [f"`/{a}`" for a in cmd.aliases
                       if not (a.replace("-", "_") == cmd.name.replace("-", "_") and a != cmd.name)]
        alias_note = f" (alias: {', '.join(alias_parts)})" if alias_parts else ""
        lines.append(f"`/{cmd.name}{args}` -- {cmd.description}{alias_note}")
    return lines


def _iter_plugin_command_entries() -> list[tuple[str, str, str]]:
    """(name, description, args_hint) for ``PluginContext.register_command`` slash commands.
    Lazy so importing this module never forces plugin discovery."""
    try:
        from hermes_cli.plugins import get_plugin_commands
        commands = get_plugin_commands() or {}
    except Exception:
        return []
    return [(name, str(meta.get("description") or f"Run /{name}"),
             str(meta.get("args_hint") or "").strip())
            for name, meta in commands.items() if isinstance(name, str) and isinstance(meta, dict)]


# ---- BEGIN PLUGIN-COMPAT (revert-scheduled; see COMPAT_MANIFEST.md) ----
# Names external plugins imported from this module before the Sep 2026 decomposition.
# Internal code MUST NOT use these (scripts/check_compat_pointers.py fails CI if it does).
# The whole block is removed by reverting the commit that added it.
from typing import Any  # noqa: F401,E402
from collections.abc import Callable  # noqa: F401,E402
from typing import Dict  # noqa: F401,E402
from collections.abc import Mapping  # noqa: F401,E402
from typing import Optional  # noqa: F401,E402
from collections.abc import Sequence  # noqa: F401,E402
from typing import Tuple  # noqa: F401,E402
from dataclasses import field  # noqa: F401,E402
import os  # noqa: F401,E402
import shutil  # noqa: F401,E402
import subprocess  # noqa: F401,E402
import time  # noqa: F401,E402

def _requires_argument(args_hint: str) -> bool:
    """Return True when selecting a command without text would be incomplete."""
    return args_hint.strip().startswith("<")

_CMD_NAME_LIMIT = 32

def _clamp_command_names(
    entries: Sequence[tuple[str, ...]],
    reserved: set[str],
) -> list[tuple[str, ...]]:
    """Enforce 32-char command name limit with collision avoidance.

    Both Telegram and Discord cap slash command names at 32 characters.
    Names exceeding the limit are truncated.  If truncation creates a duplicate
    (against *reserved* names or earlier entries in the same batch), the name is
    shortened to 31 chars and a digit ``0``-``9`` is appended to differentiate.
    If all 10 digit slots are taken the entry is silently dropped.

    Accepts tuples of any length >= 2.  Extra elements beyond ``(name, desc)``
    (e.g. ``cmd_key``) are passed through unchanged, so callers can attach
    metadata that survives the rename.
    """
    used: set[str] = set(reserved)
    result: list[tuple] = []
    for entry in entries:
        name, desc, *extra = entry
        if len(name) > _CMD_NAME_LIMIT:
            candidate = name[:_CMD_NAME_LIMIT]
            if candidate in used:
                prefix = name[:_CMD_NAME_LIMIT - 1]
                for digit in range(10):
                    candidate = f"{prefix}{digit}"
                    if candidate not in used:
                        break
                else:
                    # All 10 digit slots exhausted — skip entry
                    continue
            name = candidate
        if name in used:
            continue
        used.add(name)
        result.append((name, desc, *extra))
    return result

def _collect_gateway_skill_entries(
    platform: str,
    max_slots: int | None,
    reserved_names: set[str],
    desc_limit: int = 100,
    sanitize_name: "Callable[[str], str] | None" = None,
) -> tuple[list[tuple[str, str, str, str]], int]:
    """Collect plugin + skill entries for a gateway platform.

    Priority order:
      1. Plugin slash commands (take precedence over skills)
      2. Built-in skill commands (fill remaining slots, alphabetical)

    Only skills are trimmed when the cap is reached.
    Hub-installed skills are excluded.  Per-platform disabled skills are
    excluded.

    Args:
        platform: Platform identifier for per-platform skill filtering
            (``"telegram"``, ``"discord"``, etc.).
        max_slots: Maximum number of entries to return (remaining slots after
            built-in/core commands), or ``None`` to return every eligible
            plugin and skill candidate for a caller that applies a global cap.
        reserved_names: Names already taken by built-in commands.  Mutated
            in-place as new names are added.
        desc_limit: Max description length (40 for Telegram, 100 for Discord).
        sanitize_name: Optional name transform applied before clamping, e.g.
            :func:`_sanitize_telegram_name` for Telegram.  May return an
            empty string to signal "skip this entry".

    Returns:
        ``(entries, hidden_count)`` where *entries* contains
        ``(name, description, cmd_key, raw_name)`` tuples. ``cmd_key`` is the
        original skill key (empty for plugins); ``raw_name`` is the sanitized
        pre-clamp name used for configured priority matching.
    """
    all_entries: list[tuple[str, str, str, str]] = []

    # --- Tier 1: Plugin slash commands (never trimmed) ---------------------
    plugin_pairs: list[tuple[str, str, str]] = []
    try:
        from hermes_cli.plugins import get_plugin_commands
        plugin_cmds = get_plugin_commands()
        for cmd_name in sorted(plugin_cmds):
            if platform == "telegram":
                args_hint = str(plugin_cmds[cmd_name].get("args_hint") or "").strip()
                if _requires_argument(args_hint):
                    continue
            name = sanitize_name(cmd_name) if sanitize_name else cmd_name
            if not name:
                continue
            desc = plugin_cmds[cmd_name].get("description", "Plugin command")
            if len(desc) > desc_limit:
                desc = desc[:desc_limit - 3] + "..."
            plugin_pairs.append((name, desc, name))
    except Exception:
        pass

    plugin_pairs = [
        (name, desc, raw_name)
        for name, desc, raw_name in _clamp_command_names(plugin_pairs, reserved_names)
    ]
    reserved_names.update(n for n, _d, _raw_name in plugin_pairs)
    # Plugins have no cmd_key — use empty string as placeholder.
    for name, desc, raw_name in plugin_pairs:
        all_entries.append((name, desc, "", raw_name))

    # --- Tier 2: Built-in skill commands (trimmed at cap) -----------------
    _platform_disabled: set[str] = set()
    try:
        from agent.skill_utils import get_disabled_skill_names
        _platform_disabled = get_disabled_skill_names(platform=platform)
    except Exception:
        pass

    skill_entries: list[tuple[str, str, str, str]] = []
    try:
        from agent.skill_commands import get_skill_commands
        from tools.skills_tool import SKILLS_DIR
        from agent.skill_utils import get_external_skills_dirs, get_project_skills_dirs
        _skills_dir = str(SKILLS_DIR.resolve())
        _hub_dir = str((SKILLS_DIR / ".hub").resolve()).rstrip("/") + "/"
        # Build set of allowed directory prefixes: local skills dir + any
        # user-configured ``skills.external_dirs`` + trusted project dirs.
        # Ensure each prefix ends
        # with ``/`` so ``/my-skills`` does not also match ``/my-skills-extra``.
        # Without this widening, external skills are visible in
        # ``hermes skills list`` and the agent's ``/skill-name`` dispatch but
        # silently excluded from gateway slash menus (#8110).
        _allowed_prefixes = [_skills_dir.rstrip("/") + "/"]
        _allowed_prefixes.extend(
            str(d).rstrip("/") + "/" for d in get_external_skills_dirs()
        )
        _allowed_prefixes.extend(
            str(d).rstrip("/") + "/" for d in get_project_skills_dirs()
        )
        skill_cmds = get_skill_commands()
        for cmd_key in sorted(skill_cmds):
            info = skill_cmds[cmd_key]
            skill_path = info.get("skill_md_path", "")
            if not skill_path:
                continue
            if not any(skill_path.startswith(prefix) for prefix in _allowed_prefixes):
                continue
            if skill_path.startswith(_hub_dir):
                continue
            skill_name = info.get("name", "")
            if skill_name in _platform_disabled:
                continue
            raw_name = cmd_key.lstrip("/")
            name = sanitize_name(raw_name) if sanitize_name else raw_name
            if not name:
                continue
            desc = info.get("description", "")
            if len(desc) > desc_limit:
                desc = desc[:desc_limit - 3] + "..."
            skill_entries.append((name, desc, cmd_key, name))
    except Exception:
        pass

    # Clamp names; cmd_key and raw_name survive any clamp-induced rename.
    skill_entries = [
        (name, desc, cmd_key, raw_name)
        for name, desc, cmd_key, raw_name in _clamp_command_names(
            skill_entries, reserved_names
        )
    ]

    if max_slots is None:
        return all_entries + skill_entries, 0

    # Skills fill remaining slots — only tier that gets trimmed
    remaining = max(0, max_slots - len(all_entries))
    hidden_count = max(0, len(skill_entries) - remaining)
    for name, desc, cmd_key, raw_name in skill_entries[:remaining]:
        all_entries.append((name, desc, cmd_key, raw_name))

    return all_entries[:max_slots], hidden_count

def discord_skill_commands(
    max_slots: int,
    reserved_names: set[str],
) -> tuple[list[tuple[str, str, str]], int]:
    """Return skill entries for Discord slash command registration.

    Same priority and filtering logic as :func:`telegram_menu_commands`
    (plugins > skills, hub excluded, per-platform disabled excluded), but
    adapted for Discord's constraints:

    - Hyphens are allowed in names (no ``-`` → ``_`` sanitization)
    - Descriptions capped at 100 chars (Discord's per-field max)

    Args:
        max_slots: Available command slots (100 minus existing built-in count).
        reserved_names: Names of already-registered built-in commands.

    Returns:
        ``(entries, hidden_count)`` where *entries* is a list of
        ``(discord_name, description, cmd_key)`` triples.  ``cmd_key`` is
        the original ``/skill-name`` key needed for the slash handler callback.
    """
    entries, hidden_count = _collect_gateway_skill_entries(
        platform="discord",
        max_slots=max_slots,
        reserved_names=set(reserved_names),  # copy — don't mutate caller's set
        desc_limit=100,
    )
    return [
        (name, desc, cmd_key) for name, desc, cmd_key, _raw_name in entries
    ], hidden_count


_PLUGIN_COMPAT_LAZY = {
    'SlashCommandAutoSuggest': ('hermes_cli.commands_completion', 'SlashCommandAutoSuggest'),
    'SlashCommandCompleter': ('hermes_cli.commands_completion', 'SlashCommandCompleter'),
    'discord_skill_commands_by_category': ('hermes_cli.commands_platforms', 'discord_skill_commands_by_category'),
    'slack_app_manifest': ('hermes_cli.commands_platforms', 'slack_app_manifest'),
    'slack_native_slashes': ('hermes_cli.commands_platforms', 'slack_native_slashes'),
    'slack_subcommand_map': ('hermes_cli.commands_platforms', 'slack_subcommand_map'),
    'telegram_bot_commands': ('hermes_cli.commands_platforms', 'telegram_bot_commands'),
    'telegram_menu_commands': ('hermes_cli.commands_platforms', 'telegram_menu_commands'),
    'telegram_menu_max_commands': ('hermes_cli.commands_platforms', 'telegram_menu_max_commands'),
}


def __getattr__(name):  # PEP 562 — lazy so no import cycles
    target = _PLUGIN_COMPAT_LAZY.get(name)
    if target is None:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    import importlib
    from hermes_cli.plugin_compat import warn_once
    warn_once(__name__, name, *target)
    return getattr(importlib.import_module(target[0]), target[1])
# ---- END PLUGIN-COMPAT ----
