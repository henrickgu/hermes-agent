import type { TranslationOverrides } from './define-locale'

export const ptSettings = {
  closeSettings: 'Fechar configurações',
  exportConfig: 'Exportar configuração',
  importConfig: 'Importar configuração',
  resetToDefaults: 'Restaurar padrões',
  resetConfirm: 'Restaurar todas as configurações para o padrão do Hermes?',
  exportFailed: 'Falha ao exportar',
  resetFailed: 'Falha ao restaurar',
  nav: {
    providers: 'Provedores',
    providerAccounts: 'Contas',
    providerApiKeys: 'Chaves de API',
    providerCustomEndpoints: 'Endpoints personalizados',
    providerLocalModels: 'Modelos locais',
    gateway: 'Gateways',
    apiKeys: 'Ferramentas e chaves',
    keybinds: 'Atalhos de teclado',
    keysTools: 'Ferramentas',
    keysSettings: 'Configurações',
    mcp: 'MCP',
    archivedChats: 'Conversas arquivadas',
    about: 'Sobre',
    billing: 'Cobrança',
    notifications: 'Notificações',
    vault: 'Senhas e logins',
    sessions: 'Sessões',
    plugins: 'Plugins'
  },
  vault: {
    title: 'Senhas e logins',
    blurb:
      'Logins salvos neste computador. O agente os usa para entrar em sites — sem nunca mostrar a senha ao modelo.',
    count: n => `${n} salvo${n === 1 ? '' : 's'}`,
    add: 'Adicionar',
    addTitle: 'Adicionar item ao cofre',
    addDescription: 'Guarde um login, cartão ou endereço para o agente usar quando precisar.',
    addConfirm: 'Salvar',
    added: 'Item adicionado ao cofre.',
    adding: 'Adicionando…',
    loadFailed: 'Não foi possível carregar os itens do cofre',
    empty: 'Nada salvo ainda',
    emptyDesc:
      'Você não precisa adicionar nada aqui. Peça ao agente para entrar num site e ele pedirá o login na hora, uma vez só. Use Adicionar se preferir cadastrar um antes.',
    createdOn: date => `Adicionado ${date}`,
    deleteAction: 'Remover item salvo',
    deleteConfirm: 'Excluir',
    deleteTitle: 'Excluir este item?',
    deleteDescription: label => `"${label}" ser\xE1 removido. Isso n\xE3o pode ser desfeito.`,
    identifierField: 'Identificador',
    identifierShown: identifier => `${identifier}`,
    identifierTypeField: 'Tipo de identificador',
    identifierTypes: {
      email: 'E-mail',
      phone: 'Telefone',
      username: 'Nome de usuário'
    },
    passwordField: 'Senha',
    otpField: 'Chave do autenticador',
    otpPlaceholder: 'Segredo Base32 ou link otpauth://',
    otpHint:
      'A "chave de configuração" que o site mostra ao ativar o 2FA. Com ela salva, o Hermes gera os códigos por conta própria.',
    labelField: 'Rótulo',
    labelPlaceholder: 'ex.: conta do trabalho no GitHub',
    labelRequired: 'Um rótulo é obrigatório.',
    loginFieldsRequired: 'Identificador e senha são obrigatórios.',
    optional: '(opcional)',
    originField: 'Origem do site',
    originPlaceholder: 'https://github.com',
    originPlaceholderCheckout: 'https://loja.exemplo.com',
    originInvalid: 'Informe uma URL válida como https://exemplo.com.',
    kindField: 'Tipo',
    kinds: {
      login: 'Login',
      payment: 'Cartão de pagamento',
      address: 'Endereço'
    },
    cardNameField: 'Nome no cartão',
    cardNumberField: 'Número do cartão',
    cvcField: 'CVC',
    expMonthField: 'Mês de expiração',
    expYearField: 'Ano de expiração',
    addressLine1Field: 'Endereço (linha 1)',
    addressLine2Field: 'Endereço (linha 2)',
    cityField: 'Cidade',
    stateField: 'Estado',
    postalField: 'CEP',
    countryField: 'País',
    twoFactorBadge: '2FA automático',
    sources: {
      title: 'Gerenciadores de senhas',
      blurb:
        'Gerenciadores de senhas instalados são detectados automaticamente. O agente pede para você desbloquear um na primeira vez que precisar de um login dele (uma vez por sessão); só um token de sessão fica na memória, e o agente nunca vê sua senha mestra nem nenhum login.',
      toggleFailed: 'Não foi possível atualizar o gerenciador de senhas',
      notInstalled: name =>
        `N\xE3o detectado. Instale a ferramenta de linha de comando ${name} e entre nela; o Hermes detecta automaticamente.`,
      disabledDesc: 'Detectado, mas desativado para o Hermes.',
      lockedDesc: 'Detectado. O agente pedirá para desbloquear quando precisar de um login, ou desbloqueie agora.',
      unlockedDesc:
        'Desbloqueado nesta sessão. Bloqueia automaticamente após 30 minutos ocioso ou quando o Hermes fechar.',
      statusLocked: 'Bloqueado',
      statusNotDetected: 'Não detectado',
      statusOff: 'Desligado',
      statusUnlocked: 'Desbloqueado',
      unlock: 'Desbloquear',
      unlocking: 'Desbloqueando…',
      lock: 'Bloquear',
      unlocked: name => `${name} desbloqueado nesta sess\xE3o.`,
      unlockTitle: name => `Desbloquear ${name}`,
      unlockDescription:
        'Digite sua senha mestra. Ela é entregue ao gerenciador de senhas nesta máquina e descartada — nunca é armazenada, registrada em log ou mostrada ao agente.',
      masterPasswordPlaceholder: 'Senha mestra'
    }
  },
  plugins: {
    title: 'Plugins do desktop',
    openFolder: 'Abrir pasta de plugins',
    rescan: 'Verificar novamente',
    enable: 'Ativar',
    disable: 'Desativar',
    reveal: 'Revelar no gerenciador de arquivos',
    failed: 'falhou',
    kinds: {
      bundled: 'incluso',
      disk: 'em disco',
      runtime: 'em execução'
    },
    installModal: {
      installFromGit: 'Instalar do Git',
      reviewRepository: 'Revisar repositório',
      repoPlaceholder: 'https://github.com/proprietario/repo',
      title: 'Instalar plugin',
      description: 'Revise o que este repositório contém antes de instalar.',
      repoLabel: 'Repositório',
      includesHeading: 'Este pacote inclui',
      agentLabel: 'Plugin do agente',
      desktopLabel: 'Interface do desktop',
      agentTargetLocal: (profile, path) => `Instala no backend ${profile} (${path})`,
      agentTargetRemote: profile => `Instala no backend conectado ${profile}`,
      desktopTarget: 'Instala na pasta local desktop-plugins deste app',
      desktopOnlyNote: 'Pacotes só de desktop não instalam plugin de agente no backend.',
      insecureWarning: 'Esta URL usa esquema inseguro ou local. Prefira https:// ou git@ em produção.',
      securityIntro:
        'Instale apenas de fontes confiáveis — revise o repositório abaixo se quiser ver o que será adicionado.',
      sourceHeading: 'Código-fonte',
      viewRepository: 'Ver repositório',
      viewPluginFiles: 'Ver arquivos do plugin',
      enableAgent: 'Ativar plugin do agente após instalar',
      forceReinstall: 'Forçar reinstalação (substituir se já instalado)',
      install: 'Instalar',
      installing: 'Instalando…',
      probing: 'Inspecionando repositório…',
      probeUnavailable: 'Inspeção de plugin indisponível neste ambiente.',
      desktopUnavailable: 'Instalação de plugin de desktop indisponível neste ambiente.',
      selectComponent: 'Selecione pelo menos um componente para instalar.',
      agentSuccess: name => `Plugin de agente ${name} instalado`,
      desktopSuccess: name => `Plugin de desktop ${name} instalado`,
      agentFailed: 'Falha ao instalar plugin de agente',
      desktopFailed: 'Falha ao instalar plugin de desktop',
      sourceMoved: sha =>
        sha
          ? `O repositório mudou desde a sua revisão. Revise a nova versão (commit ${sha}) antes de instalar.`
          : 'O repositório mudou desde a sua revisão. Lendo a nova versão…',
      legacyBackendConfirm:
        'Este backend é mais antigo que este app, então não pode garantir que a versão que você revisou é a que será instalada: se o repositório mudou desde então, a versão mais nova é a instalada. Atualize o backend para ter essa garantia.',
      installAnyway: 'Instalar mesmo assim',
      partialInstall: sha =>
        sha
          ? `Só uma parte deste plugin está instalada: a metade do agente está no commit ${sha}, mas a metade do desktop não conseguiu acompanhar porque o repositório mudou desde a sua revisão. Ative Forçar reinstalação em Avançado para substituir as duas metades pela versão exibida, ou cancele para manter apenas a metade do agente.`
          : 'Só uma parte deste plugin está instalada: a metade do agente está dentro, mas a metade do desktop não conseguiu acompanhar porque o repositório mudou desde a sua revisão. Ative Forçar reinstalação em Avançado para substituir as duas metades pela versão exibida, ou cancele para manter apenas a metade do agente.',
      missingEnv: (name, vars) =>
        `${name} está instalado, mas precisa de uma chave para funcionar: ${vars}. Adicione-a agora para evitar falhas nas ferramentas do plugin.`,
      missingEnvAction: 'Configurar',
      alreadyInstalled: name => `${name} j\xE1 est\xE1 instalado.`,
      desktopTargetFromPackage: 'Carregado neste app a partir do pacote acima — igual para todo perfil',
      pinToCommit: 'Fixar em commit (opcional)',
      pinToCommitPlaceholder: 'SHA de commit completo de 40 caracteres',
      pinToCommitHint:
        'Quem instalar este SHA recebe o mesmo código; o plugin passa a recusar atualizações até ser re-fixado. Deixe vazio para o último commit.',
      pinToCommitInvalid: 'Deve ser um SHA de commit completo de 40 caracteres (branches e tags não são aceitos).',
      verified: 'Verificado',
      unverified: 'Não verificado',
      reviewedByNous: 'Revisado pela Nous.',
      installsAndEnables: profile => `Instala para ${profile} e ativa imediatamente.`,
      installsOnly: profile => `Instala para ${profile}.`,
      advanced: 'Avançado',
      versionLabel: 'Versão',
      reviewedPin: sha => (sha ? `Revisão verificada ${sha}` : 'Revisão verificada'),
      latestCommit: 'Commit mais recente',
      nothingToInstall: 'Este pacote não tem nada para instalar aqui.',
      profileLabel: 'Instalar para o perfil',
      toolsConnected: n => (n === 1 ? '1 ferramenta conectada' : `${n} ferramentas conectadas`),
      skillsReady: names => (names.length === 1 ? `skill ${names[0]} pronta` : `${names.length} skills prontas`),
      nextChat: 'mais ferramentas disponíveis na sua próxima conversa',
      serverNotConnected: (server, reason) =>
        `O servidor MCP ${server} não está conectado${reason ? `: ${reason}` : '.'}`,
      installUncertain:
        'O Hermes parou de aguardar o resultado, mas o plugin ainda pode estar sendo instalado. Feche esta janela e use Verificar novamente em Plugins antes de tentar instalar de novo.'
    }
  },
  notifications: {
    muteSoundsDesc: 'Silencia os sons automáticos de conclusão, palavra de ativação e raciocínio, o feedback háptico e os sons de notificação do sistema. Prévias de som e respostas faladas continuam tocando.',
    muteSoundsTitle: 'Silenciar sons da interface',
    title: 'Notificações',
    intro: 'Notificações do sistema (não toasts internos). Por dispositivo.',
    enableAll: 'Ativar notificações',
    enableAllDesc: 'Desativado silencia todas as notificações abaixo.',
    focusedHint: 'Alertas de conclusão só disparam com o Hermes em segundo plano.',
    kinds: {
      approval: {
        label: 'Aprovação necessária',
        description: 'Um comando aguarda sua aprovação ou rejeição.'
      },
      input: {
        label: 'Entrada necessária',
        description: 'Hermes fez uma pergunta ou precisa de senha/segredo.'
      },
      turnDone: {
        label: 'Resposta pronta',
        description: 'Um turno terminou enquanto o Hermes estava em segundo plano.'
      },
      turnError: {
        label: 'Falha no turno',
        description: 'Erros de turnos em segundo plano.'
      },
      backgroundDone: {
        label: 'Tarefa em segundo plano concluída',
        description: 'Um comando de terminal em segundo plano foi concluído.'
      },
      credits: {
        label: 'Alerta de créditos',
        description: 'Acesso a créditos pausado ou restabelecido.'
      },
      plugin: {
        label: 'Notificações de plugin',
        description: 'Um plugin do desktop enviou uma notificação com o Hermes em segundo plano.'
      }
    },
    test: 'Enviar notificação de teste',
    testTitle: 'Hermes',
    testBody: 'Notificações estão funcionando.',
    testSent:
      'Teste enviado. Se nada aparecer, verifique as permissões de notificação do sistema e o Foco/Não Perturbe.',
    testUnsupported: 'Este sistema não suporta notificações nativas.',
    completionSoundTitle: 'Som de conclusão',
    completionSoundDesc: 'Toca quando um turno do agente termina. Escolha um preset e ouça a prévia aqui.',
    completionSoundPreview: 'Prévia'
  },
  sections: {
    model: 'Modelo',
    chat: 'Conversa',
    appearance: 'Aparência',
    workspace: 'Espaço de trabalho',
    safety: 'Segurança',
    memory: 'Memória e contexto',
    voice: 'Voz',
    advanced: 'Avançado'
  },
  enumOptionLabels: {
    'approvals.mode': {
      manual: 'Manual',
      smart: 'Inteligente',
      off: 'Desligado'
    },
    'agent.image_input_mode': {
      auto: 'Automático',
      native: 'Nativo',
      text: 'Texto'
    },
    'code_execution.mode': {
      project: 'Projeto',
      strict: 'Rigoroso'
    },
    'context.engine': {
      compressor: 'Compressão',
      default: 'Padrão',
      custom: 'Personalizado'
    },
    'delegation.reasoning_effort': {
      low: 'Baixo',
      medium: 'Médio',
      high: 'Alto',
      xhigh: 'Muito alto',
      ultra: 'Ultra'
    },
    'terminal.backend': {
      local: 'Local',
      docker: 'Docker',
      singularity: 'Singularity',
      modal: 'Modal',
      daytona: 'Daytona',
      ssh: 'SSH'
    },
    'voice.voice_chat_mode': {
      chained: 'Encadeado (texto e voz)',
      'gpt-live': 'GPT-Live (voz em tempo real)'
    },
    'updates.non_interactive_local_changes': {
      stash: 'Manter alterações (stash)',
      discard: 'Descartar alterações'
    }
  },
  searchPlaceholder: {
    about: 'Sobre o Hermes Desktop',
    config: 'Buscar configurações...',
    gateway: 'Conexão do gateway...',
    keys: 'Buscar chaves de API...',
    mcp: 'Buscar servidores MCP...',
    sessions: 'Buscar sessões arquivadas...'
  },
  modeOptions: {
    light: {
      label: 'Claro',
      description: 'Superfícies claras do desktop'
    },
    dark: {
      label: 'Escuro',
      description: 'Área de trabalho com menos brilho'
    },
    system: {
      label: 'Sistema',
      description: 'Segue a aparência do sistema'
    }
  },
  appearance: {
    title: 'Aparência',
    themeSearchPlaceholder: 'Busque nos seus temas ou no VS Code Marketplace…',
    intro: 'Somente no Desktop. O modo define a luminosidade; o tema define a paleta e o visual do chat.',
    colorMode: 'Modo de cor',
    colorModeDesc: 'Escolha um modo fixo ou deixe o Hermes seguir a configuração do sistema.',
    toolViewTitle: 'Exibição das chamadas de ferramentas',
    toolViewDesc: 'Produto oculta os dados brutos das ferramentas; Técnico mostra entradas e saídas completas.',
    reasoningCollapsedTitle: 'Recolher o raciocínio por padrão',
    reasoningCollapsedDesc: 'Mantenha o raciocínio transmitido disponível, sem expandi-lo até que você o abra.',
    resumeLastSessionTitle: 'Reabrir o último chat ao iniciar',
    resumeLastSessionDesc:
      'Quando ativado, o app reabre seu chat mais recente ao iniciar. Desative para começar sempre com um novo chat.',
    dimUnfocusedChatsTitle: 'Esmaecer conversas sem foco',
    dimUnfocusedChatsDesc: 'Deixa acinzentadas as conversas abertas ao lado daquela que você está usando.',
    toolEditsCollapsedTitle: 'Recolher edições de código por padrão',
    toolEditsCollapsedDesc: 'As diferenças de edição de arquivos ficam recolhidas em uma linha até você abri-las.',
    userBubbleTitle: 'Bolha de mensagem',
    userBubbleDesc: 'O quanto suas próprias mensagens ficam transparentes. Sólida em 0; só o contorno em 100.',
    uiScaleTitle: 'Escala da interface',
    uiScaleDesc: percent =>
      `Ajusta o tamanho do texto e dos controles em todo o app. Cmd/Ctrl com +, - e 0 tamb\xE9m funciona. Atual: ${percent}%.`,
    sessionDensityTitle: 'Densidade da lista de sessões',
    sessionDensityDesc: 'Escolha quanto contexto aparece abaixo dos títulos das sessões na barra lateral.',
    sessionDensityCompact: 'Compacta',
    sessionDensityComfortable: 'Confortável',
    sessionDensityDetailed: 'Detalhada',
    tabStripTitle: 'Barra de abas',
    tabStripDesc:
      'Mostra abas acima de uma área. No modo Automático, elas ficam ocultas quando a área contém apenas um painel.',
    tabStripAuto: 'Automático',
    tabStripAlways: 'Sempre',
    tabStripNever: 'Nunca',
    terminalFontTitle: 'Fonte do terminal',
    terminalFontDesc:
      'Escolha uma fonte instalada para os terminais do Desktop. Nerd Fonts exibem corretamente o Powerlevel10k e os ícones do shell; deixe em branco para usar a JetBrains Mono incluída.',
    terminalFontPlaceholder: 'MesloLGS NF ou uma lista de fontes CSS',
    terminalFontPreview: 'Prévia dos glifos',
    terminalFontReset: 'Usar padrão',
    appActionsTitle: 'Ações do app',
    appActionsDesc:
      'Onde ficam Configurações, Layout e HUD na barra de título. À direita, deixa espaço para abas à esquerda.',
    appActionsLeft: 'Esquerda',
    appActionsRight: 'Direita',
    translucencyTitle: 'Translucidez da janela',
    translucencyDesc:
      'Veja sua área de trabalho através de toda a janela, inclusive do texto. O ajuste é separado para os modos claro e escuro.',
    translucencyGlassDesc:
      'Vidro fosco: a área de trabalho aparece através de um desfoque suave, enquanto o texto permanece nítido. O ajuste é separado para os modos claro e escuro.',
    translucencyModeClear: 'Transparente',
    translucencyModeGlass: 'Vidro',
    translucencyTintTitle: 'Tonalidade',
    translucencyFadeTitle: 'Atenuação',
    translucencyFrostTitle: 'Desfoque',
    translucencyFrost: {
      'under-window': 'Profundo',
      popover: 'Suave',
      titlebar: 'Claro',
      header: 'Brilho'
    },
    translucencyScopeTitle: 'Área',
    translucencyScope: {
      window: 'Janela inteira',
      sidebar: 'Somente a barra lateral'
    },
    backdropTitle: 'Plano de fundo do chat',
    backdropDesc: 'A imagem discreta da estátua atrás da conversa.',
    introSplashTitle: 'Apresentação inicial',
    introSplashDesc: 'O logotipo e a sugestão exibidos em um chat vazio.',
    reactionsTitle: 'Reações às mensagens',
    reactionsDesc:
      'Reações com emojis no estilo do iMessage — reaja às mensagens, e o Hermes também pode reagir às suas.',
    tipsTitle: 'Dicas no app',
    tipsDesc:
      'Uma pequena bolha que aponta para uma parte do app, exibida ocasionalmente quando ele está ocioso e pelo Hermes quando for útil. Fechar uma dica a desativa de vez.',
    tipsReset: count => `Restaurar ${count} ${count === 1 ? 'dica fechada' : 'dicas fechadas'}`,
    toursTitle: 'Tours guiados',
    toursDesc: 'Deixe o Hermes guiar você pelo app, escurecendo a tela e destacando cada etapa.',
    composerPopoutTitle: 'Compositor flutuante',
    composerPopoutDesc:
      'Permita arrastar o compositor para fora do encaixe. Desative esta opção para mantê-lo preso à parte inferior.',
    vibeHeartsTitle: 'Corações de vibe',
    vibeHeartsDesc:
      'Corações flutuantes quando você diz thanks, ily, good bot ou envia um coração. É um recurso separado das Reações às mensagens acima.',
    embedsTitle: 'Incorporações no conteúdo',
    embedsDesc:
      'Prévias avançadas são carregadas de sites de terceiros (YouTube, X, …). Perguntar mostra um espaço reservado até você permitir cada uma; Sempre as carrega automaticamente; Desativado mantém apenas links simples.',
    embedsAsk: 'Perguntar',
    embedsAlways: 'Sempre',
    embedsOff: 'Desativado',
    embedsReset: count => `Redefinir ${count} ${count === 1 ? 'servi\xE7o permitido' : 'servi\xE7os permitidos'}`,
    product: 'Produto',
    productDesc: 'Atividade das ferramentas apresentada de forma acessível, com resumos concisos.',
    technical: 'Técnico',
    technicalDesc: 'Inclui argumentos e resultados brutos das ferramentas, além de detalhes de baixo nível.',
    themeTitle: 'Tema',
    themeDesc: 'Somente paletas do Desktop. O modo selecionado é aplicado por cima.',
    themeProfileNote: profile => `Salvo no perfil ${profile} \u2014 cada perfil mant\xE9m seu pr\xF3prio tema.`,
    installTitle: 'Instalar a partir do VS Code',
    installDesc:
      'Cole o id de uma extensão do Marketplace (por exemplo, dracula-theme.theme-dracula) para converter o tema de cores dela em uma paleta do Desktop.',
    installPlaceholder: 'publisher.extension',
    installButton: 'Instalar',
    installing: 'Instalando…',
    installError: 'Não foi possível instalar esse tema.',
    installed: name => `\u201C${name}\u201D instalado.`,
    removeTheme: 'Remover tema',
    importedBadge: 'Importado',
    pet: {
      title: 'Mascote',
      intro:
        'Adote um mascote animado do petdex que flutua sobre o app e reage ao que o Hermes está fazendo — corre enquanto as ferramentas são executadas, comemora quando tudo dá certo e fica abatido quando há erros.',
      restartHint:
        'Os mascotes precisam de uma reinicialização rápida — o app em execução foi iniciado antes de este recurso ser adicionado. Feche e abra o Hermes novamente e depois volte aqui.',
      scaleTitle: 'Tamanho',
      scaleDesc: 'Redimensione o mascote flutuante. A alteração é aplicada imediatamente em todos os lugares.',
      roamTitle: 'Passeio livre',
      roamDesc: 'Deixe o mascote andar sozinho pela janela enquanto estiver ocioso.',
      chooseTitle: 'Escolha um mascote',
      chooseDesc: 'Ao escolher um, ele é instalado (se necessário) e ativado.',
      searchPlaceholder: 'Buscar mascotes…',
      unreachable: 'Não foi possível acessar a galeria do petdex. Verifique sua conexão e abra esta página novamente.',
      noMatch: query => `Nenhum mascote corresponde a "${query}".`,
      installedTag: 'instalado',
      generatedTag: 'Gerado',
      countCapped: (cap, total) => `Exibindo ${cap} de ${total} \u2014 digite para restringir os resultados.`,
      count: n => `${n} ${n === 1 ? 'mascote' : 'mascotes'}.`,
      uninstall: name => `Desinstalar ${name}`,
      delete: name => `Excluir ${name}`,
      deleteTitle: name => `Excluir ${name}?`,
      deleteBody: 'Isso exclui o mascote permanentemente — ele não poderá ser reinstalado.',
      deleteConfirm: 'Excluir',
      rename: name => `Renomear ${name}`,
      renameTitle: 'Renomear mascote',
      renamePlaceholder: 'Dê um nome ao seu mascote',
      renameSave: 'Salvar',
      exportPet: name => `Exportar ${name}`,
      adoptFailed: slug => `N\xE3o foi poss\xEDvel adotar ${slug}`,
      uninstallFailed: slug => `N\xE3o foi poss\xEDvel desinstalar ${slug}`,
      renameFailed: slug => `N\xE3o foi poss\xEDvel renomear ${slug}`,
      exportFailed: slug => `N\xE3o foi poss\xEDvel exportar ${slug}`,
      noneAvailable: 'Não há mascotes disponíveis para ativar agora.',
      turnOnFailed: 'Não foi possível ativar o mascote.',
      turnOffFailed: 'Não foi possível desativar o mascote.'
    },
    hideCodeDiffsTitle: 'Ocultar diffs de código',
    hideCodeDiffsDesc:
      'Mostra as edições de arquivos como linhas de tool inline, com contagem de linhas adicionadas/removidas, sem exibir o código.',
    hideThreadTimelineTitle: 'Ocultar barras da linha do tempo da thread',
    hideThreadTimelineDesc: 'Oculta as barras de navegação na borda direita de cada conversa.',
    chatFontTitle: 'Fonte do chat',
    chatFontDesc:
      'Escolha uma fonte instalada para o chat e o resto do app. Útil para fontes de fácil leitura, como a OpenDyslexic; deixe em branco para usar a fonte do tema.',
    chatFontPlaceholder: 'OpenDyslexic ou uma pilha de fontes CSS',
    chatFontPreview: 'Pré-visualização',
    chatFontSample: 'A rápida raposa marrom salta sobre o cão preguiçoso. 0123456789',
    chatFontReset: 'Usar fonte do tema',
    chatTextScaleTitle: 'Tamanho do texto da conversa',
    chatTextScaleDesc:
      'Ajusta o texto da conversa e do editor de mensagens em relação à escala da interface. Barras laterais e controles mantêm o mesmo tamanho.',
    textDirectionTitle: 'Direção do texto',
    textDirectionDesc:
      'Define a direção das mensagens e do editor. Automático segue a primeira letra de cada parágrafo; escolha uma direção se textos mistos ficarem desalinhados. Código sempre segue da esquerda para a direita.',
    textDirection: {
      auto: 'Automático',
      rtl: 'Da direita para a esquerda',
      ltr: 'Da esquerda para a direita'
    },
    modelPricingTitle: 'Preços dos modelos',
    modelPricingDesc:
      'Mostra os preços de entrada, saída e leitura em cache por milhão de tokens no seletor de modelos.',
    fileBrowserTitle: 'Explorador de arquivos',
    fileBrowserDesc:
      'Mostra o explorador de arquivos ao lado da conversa quando há um espaço de trabalho aberto. O botão na barra de título também altera esta opção.'
  },
  fieldLabels: {
    model: 'Modelo padrão',
    modelContextLength: 'Janela de contexto do modelo principal (substituição)',
    fallbackProviders: 'Modelos alternativos',
    toolsets: 'Conjuntos de ferramentas ativados',
    timezone: 'Fuso horário',
    'display.personality': 'Personalidade',
    'display.showReasoning': 'Blocos de raciocínio',
    'desktop.repoScanEnabled': 'Descoberta automática de repositórios',
    'desktop.repoScanRoots': 'Pastas de busca de repositórios',
    'desktop.repoScanExcludePaths': 'Caminhos de repositórios excluídos',
    'agent.maxTurns': 'Máximo de etapas do agente',
    'agent.imageInputMode': 'Imagens anexadas',
    'agent.apiMaxRetries': 'Novas tentativas da API',
    'agent.serviceTier': 'Nível de serviço',
    'agent.toolUseEnforcement': 'Exigência de uso de ferramentas',
    'terminal.cwd': 'Diretório de trabalho',
    'terminal.backend': 'Backend de execução',
    'terminal.timeout': 'Tempo limite de comandos',
    'terminal.persistentShell': 'Shell persistente',
    'terminal.envPassthrough': 'Repasse de variáveis de ambiente',
    'terminal.dockerImage': 'Imagem Docker',
    'terminal.singularityImage': 'Imagem Singularity',
    'terminal.modalImage': 'Imagem Modal',
    'terminal.daytonaImage': 'Imagem Daytona',
    fileReadMaxChars: 'Limite de leitura de arquivos',
    'toolOutput.maxBytes': 'Limite de saída do terminal',
    'toolOutput.maxLines': 'Limite de linhas por página de arquivo',
    'toolOutput.maxLineLength': 'Limite de comprimento de linha',
    'codeExecution.mode': 'Modo de execução de código',
    'approvals.mode': 'Modo de aprovação',
    'approvals.timeout': 'Tempo limite de aprovação',
    'approvals.mcpReloadConfirm': 'Confirmar recarregamentos do MCP',
    commandAllowlist: 'Lista de comandos permitidos',
    'security.redactSecrets': 'Ocultar segredos',
    'security.allowPrivateUrls': 'Permitir URLs privadas',
    'browser.allowPrivateUrls': 'URLs privadas no navegador',
    'browser.autoLocalForPrivateUrls': 'Navegador local para URLs privadas',
    'browser.useRealProfile': 'Usar meu perfil real do navegador',
    'checkpoints.enabled': 'Pontos de restauração de arquivos',
    'checkpoints.maxSnapshots': 'Limite de pontos de restauração',
    'voice.maxRecordingSeconds': 'Duração máxima de gravação',
    'voice.autoTts': 'Ler respostas em voz alta',
    'voice.voiceChatMode': 'Modo de conversa por voz',
    'voice.gptLive.voice': 'Voz do GPT-Live',
    'voice.gptLive.instructions': 'Personalidade do GPT-Live',
    'stt.enabled': 'Transcrição de voz',
    'stt.echoTranscripts': 'Repetir transcrições',
    'stt.provider': 'Provedor de transcrição de voz',
    'stt.streaming': 'Transcrição ao vivo',
    'stt.local.model': 'Modelo de transcrição local',
    'stt.local.language': 'Idioma de transcrição',
    'stt.openai.model': 'Modelo de transcrição da OpenAI',
    'stt.openai.streamingModel': 'Modelo de transcrição ao vivo da OpenAI',
    'stt.groq.model': 'Modelo de transcrição da Groq',
    'stt.mistral.model': 'Modelo de transcrição da Mistral',
    'stt.xai.model': 'Modelo de transcrição da xAI',
    'stt.deepinfra.model': 'Modelo de transcrição da DeepInfra',
    'stt.elevenlabs.modelId': 'Modelo de transcrição da ElevenLabs',
    'stt.elevenlabs.languageCode': 'Idioma da ElevenLabs',
    'stt.elevenlabs.tagAudioEvents': 'Identificar eventos de áudio',
    'stt.elevenlabs.diarize': 'Identificar falantes',
    'tts.provider': 'Provedor de síntese de voz',
    'tts.edge.voice': 'Voz do Edge',
    'tts.openai.model': 'Modelo de síntese de voz da OpenAI',
    'tts.openai.voice': 'Voz da OpenAI',
    'tts.elevenlabs.voiceId': 'Voz da ElevenLabs',
    'tts.elevenlabs.modelId': 'Modelo da ElevenLabs',
    'tts.xai.voiceId': 'Voz da xAI (Grok)',
    'tts.xai.language': 'Idioma da xAI',
    'tts.xai.speed': 'Velocidade de reprodução da xAI',
    'tts.xai.autoSpeechTags': 'Marcações automáticas de fala da xAI',
    'tts.xai.optimizeStreamingLatency': 'Otimização de latência de streaming da xAI',
    'tts.xai.sampleRate': 'Taxa de amostragem da xAI',
    'tts.xai.bitRate': 'Taxa de bits da xAI',
    'tts.minimax.model': 'Modelo de síntese de voz da MiniMax',
    'tts.minimax.voiceId': 'Voz da MiniMax',
    'tts.mistral.model': 'Modelo de síntese de voz da Mistral',
    'tts.mistral.voiceId': 'Voz da Mistral',
    'tts.gemini.model': 'Modelo de síntese de voz do Gemini',
    'tts.gemini.voice': 'Voz do Gemini',
    'tts.neutts.model': 'Modelo do NeuTTS',
    'tts.neutts.device': 'Dispositivo do NeuTTS',
    'tts.kittentts.model': 'Modelo do KittenTTS',
    'tts.kittentts.voice': 'Voz do KittenTTS',
    'tts.piper.voice': 'Voz do Piper',
    'tts.deepinfra.model': 'Modelo de síntese de voz da DeepInfra',
    'tts.deepinfra.voice': 'Voz da DeepInfra',
    'memory.memoryEnabled': 'Memória persistente',
    'memory.userProfileEnabled': 'Perfil do usuário',
    'memory.memoryCharLimit': 'Limite de memória',
    'memory.userCharLimit': 'Limite do perfil',
    'memory.provider': 'Provedor de memória',
    'context.engine': 'Mecanismo de contexto',
    'compression.enabled': 'Compressão automática',
    'compression.threshold': 'Limiar de compressão',
    'compression.codexGpt55Autoraise': 'Aumento automático do limiar de compressão do Codex',
    'compression.targetRatio': 'Meta de compressão',
    'compression.protectLastN': 'Mensagens recentes protegidas',
    'auxiliary.compression.timeout': 'Tempo limite do modelo de compressão (s)',
    'delegation.model': 'Modelo dos subagentes',
    'delegation.provider': 'Provedor dos subagentes',
    'delegation.maxIterations': 'Limite de turnos dos subagentes',
    'delegation.maxConcurrentChildren': 'Subagentes em paralelo',
    'delegation.childTimeoutSeconds': 'Tempo limite dos subagentes',
    'delegation.reasoningEffort': 'Esforço de raciocínio dos subagentes',
    'updates.nonInteractiveLocalChanges': 'Alterações locais na atualização pelo app'
  },
  fieldDescriptions: {
    model: 'Usado em novas conversas, a menos que você escolha outro modelo no editor.',
    modelContextLength:
      'Substitui a janela de contexto detectada apenas do modelo PRINCIPAL da conversa (em tokens). Deixe em 0 para usar o valor detectado do modelo selecionado. Não afeta modelos auxiliares ou MoA.',
    fallbackProviders: 'Entradas provedor:modelo alternativas para tentar se o modelo padrão falhar.',
    'display.personality': 'Estilo padrão do assistente para novas sessões.',
    'display.showReasoning': 'Mostra seções de raciocínio quando o backend as fornece.',
    'desktop.repoScanEnabled': 'Busca repositórios Git em pastas locais para exibir em Projetos.',
    'desktop.repoScanRoots': 'Pastas onde buscar. Deixe vazio para buscar na sua pasta pessoal.',
    'desktop.repoScanExcludePaths': 'Pastas e subpastas que serão ignoradas na descoberta de repositórios.',
    timezone: 'Identificador de fuso horário IANA. Em branco, usa o fuso do sistema.',
    'browser.useRealProfile':
      'A navegação local usa seus logins reais. O Hermes copia o perfil do seu navegador padrão (cookies, logins e preferências) para uma cópia gerenciada e a utiliza com o Chromium incluído no app. Seu perfil original nunca é aberto diretamente, e a cópia é atualizada a cada execução. Também permite que o agente abra uma sessão local com seu perfil real quando solicitado, mesmo com um backend de navegador na nuvem configurado. Apenas navegadores Chromium (Chrome, Edge, Brave, Brave Origin e Chromium) são compatíveis; outros navegadores padrão geram uma mensagem explicativa. Desativado por padrão.',
    'agent.imageInputMode': 'Controla como imagens anexadas são enviadas ao modelo.',
    'agent.maxTurns': 'Limite de turnos com chamadas de ferramentas antes de o Hermes encerrar uma execução.',
    'terminal.cwd': 'Pasta padrão do projeto para ferramentas e terminal.',
    'terminal.persistentShell':
      'Backend SSH: mantém variáveis exportadas entre comandos. Quando desativado, cada comando começa com o ambiente de login; o diretório de trabalho sempre é preservado.',
    'terminal.envPassthrough': 'Variáveis de ambiente repassadas à execução de ferramentas.',
    'terminal.dockerImage': 'Imagem de contêiner usada quando o backend de execução é Docker.',
    'terminal.singularityImage': 'Imagem usada quando o backend de execução é Singularity.',
    'terminal.modalImage': 'Imagem usada quando o backend de execução é Modal.',
    'terminal.daytonaImage': 'Imagem usada quando o backend de execução é Daytona.',
    'codeExecution.mode': 'Define o rigor da restrição da execução de código ao projeto atual.',
    fileReadMaxChars: 'Máximo de caracteres que o Hermes pode ler em uma solicitação de arquivo.',
    'approvals.mode': 'Como o Hermes trata comandos que precisam de aprovação explícita.',
    'approvals.timeout': 'Por quanto tempo os pedidos de aprovação aguardam antes de expirar.',
    'security.redactSecrets': 'Oculta segredos detectados do conteúdo visível ao modelo, quando possível.',
    'checkpoints.enabled': 'Cria cópias de restauração antes de editar arquivos.',
    'memory.memoryEnabled': 'Salva memórias duradouras que podem ajudar em sessões futuras.',
    'memory.userProfileEnabled': 'Mantém um perfil compacto das preferências do usuário.',
    'context.engine': 'Estratégia para gerenciar conversas longas próximas do limite de contexto.',
    'compression.enabled': 'Resume o contexto antigo quando as conversas ficam grandes.',
    'compression.codexGpt55Autoraise':
      'Aumenta o limiar de compressão para 85% nos modelos compatíveis com ChatGPT Codex OAuth.',
    'auxiliary.compression.timeout':
      'Segundos de espera por chamada ao modelo auxiliar de compressão (padrão: 120). Aumente para modelos locais lentos.',
    'voice.autoTts': 'Lê automaticamente as respostas do assistente em voz alta.',
    'voice.voiceChatMode':
      'chained: transcrição → Hermes → síntese de voz com os provedores abaixo. gpt-live: um único modelo de voz bidirecional da OpenAI (gpt-live-1) ouve e fala, e encaminha cada pedido real ao Hermes — o modelo selecionado responde com todas as ferramentas. Requer uma chave de API da OpenAI; a camada de voz custa US$ 0,05 por minuto.',
    'voice.gptLive.voice': 'Voz para o modo GPT-Live. IDs de voz personalizados são aceitos.',
    'voice.gptLive.instructions':
      'Instruções adicionais para a personalidade da voz ao vivo (tom, ritmo, idioma). O Hermes mantém seu próprio prompt de sistema.',
    'tts.xai.voiceId': 'ID de voz da xAI (por exemplo, eve) ou um ID de voz personalizado.',
    'tts.xai.language': 'Código do idioma falado (por exemplo, en, pt-BR) ou "auto" para detecção automática.',
    'tts.xai.speed': 'Velocidade de reprodução. 0,7 = mais lenta, 1,0 = normal, 1,5 = mais rápida.',
    'tts.xai.autoSpeechTags':
      'Permite que um LLM insira marcações expressivas de áudio ([laughing], [sighs]) no texto antes da síntese.',
    'tts.xai.optimizeStreamingLatency':
      'Equilíbrio entre latência e qualidade. 0 = melhor qualidade, 2 = menor latência.',
    'tts.xai.sampleRate': 'Taxa de amostragem de áudio em Hz. Maior = melhor qualidade e arquivos maiores.',
    'tts.xai.bitRate': 'Taxa de bits do MP3 em bps. Só se aplica ao codec mp3.',
    'tts.neutts.device': 'Dispositivo para inferência local do NeuTTS.',
    'stt.enabled': 'Ativa a transcrição de voz local ou por um provedor.',
    'stt.echoTranscripts': 'Publica a transcrição bruta 🎙️ das mensagens de voz na conversa.',
    'stt.streaming': 'Mostra texto enquanto você fala (OpenAI, xAI, ElevenLabs). Em caso de falha, usa a gravação.',
    'stt.elevenlabs.languageCode':
      'Código de idioma ISO-639-3 opcional. Em branco, permite a detecção automática pela ElevenLabs.',
    'updates.nonInteractiveLocalChanges':
      'Quando o Hermes se atualiza pelo app (sem perguntas no terminal), mantém as edições locais do código-fonte (stash) ou as descarta (discard). Atualizações pelo terminal sempre perguntam.'
  },
  about: {
    updates: 'Atualizações',
    channel: {
      heldBody: (v) => `Este build é mais novo que a release estável ${v}. Suas sessões já usam um runtime de gateway que ${v} não consegue abrir, então o Hermes permanece neste build até sair uma release estável mais nova.`,
      title: 'Canal de atualização',
      description:
        'Estável instala apenas versões publicadas. Cada commit acompanha a branch main conforme as alterações chegam.',
      stable: 'Versões estáveis',
      main: 'Cada commit',
      stableConfirmTitle: 'Mudar para versões estáveis?',
      stableConfirmBody:
        'O Hermes passará para a versão publicada mais recente, que pode ser anterior ao código atual. Dados gravados por código mais recente podem não ser lidos corretamente; faça um backup antes.',
      stableConfirm: 'Mudar para estável',
      failed: 'Não foi possível alterar o canal de atualização',
      detailsLabel: 'Canal',
      branch: b => `Branch: ${b}`,
      change: 'Alterar',
      latestRelease: v => `Você está na versão estável mais recente (${v}).`,
      rollbackTitle: v => `Voltar à versão estável ${v}`,
      rollbackBody: v =>
        `Esta compilação é mais recente que a versão estável ${v}. Instalá-la fará o Hermes voltar a essa versão.`,
      rollbackAction: v => `Voltar para ${v}`,
      allChanges: 'Ver todas as alterações'
    }
  },
  config: {
    none: 'Nenhum',
    noneParen: '(nenhum)',
    builtinOnly: 'Somente integrados',
    notSet: 'Não definido',
    commaSeparated: 'valores separados por vírgulas',
    searchPlaceholder: 'Buscar…',
    noResults: 'Nenhum resultado encontrado',
    systemDefault: 'Padrão do sistema',
    loading: 'Carregando a configuração do Hermes...',
    emptyTitle: 'Nada para configurar',
    emptyDesc: 'Esta seção não tem configurações ajustáveis.',
    failedLoad: 'Falha ao carregar as configurações',
    autosaveFailed: 'Falha ao salvar automaticamente',
    imported: 'Configuração importada',
    invalidJson: 'JSON de configuração inválido',
    toolsetsWipeConfirm:
      'Remover todos os conjuntos de ferramentas ativados? Isso desativa memória, terminal, busca na web, delegação e a maioria das outras ferramentas até você reativá-los.',
    keepAwakeTitle: 'Manter o computador ativo',
    keepAwakeDesc:
      'Impeça que este computador entre em suspensão para que execuções longas ou durante a noite continuem. A tela ainda pode escurecer.',
    disableF12Title: 'Desativar F12 para DevTools',
    disableF12Desc:
      'Impeça que F12 abra as Ferramentas do desenvolvedor. Ctrl+Shift+I (ou Cmd+Opt+I no Mac) continua funcionando.',
    attachmentSizeTitle: 'Tamanho máx. para prévia / carregamento de imagem',
    attachmentSizeDesc:
      'O tamanho máximo, em MB, de um arquivo local que o Desktop carregará para prévias e anexos de imagem. Anexos remotos que não sejam imagens usam um limite separado de 256 MB. Definir um valor muito alto carrega o arquivo inteiro na memória e pode travar ou fechar o app.',
    attachmentSizeUnit: 'MB',
    attachmentSizeLabel: 'Tamanho máximo para prévia / carregamento de imagem em megabytes',
    poolLimits: {
      warmTitle: 'Backends de bot em espera',
      warmDesc:
        'Quantos backends de bot ficam rodando para trocas instantâneas. Mais = trocas mais rápidas, mais memória (~60 MB por backend). Aplica imediatamente.',
      warmAria: 'Backends de bot em espera',
      idleTitle: 'Tempo limite de ociosidade do backend',
      idleDesc:
        'Por quanto tempo um backend de bot não usado fica em espera antes de ser encerrado. Aumente para que bots revisitados a cada poucos minutos nunca pagem um início a frio.',
      idleAria: 'Tempo limite de ociosidade do backend em milissegundos'
    },
    memoryConnect: {
      startFailed: 'Não foi possível iniciar a conexão.',
      startFailedTitle: 'Falha ao iniciar conexão',
      timedOut: 'Tempo esgotado — tente novamente.',
      failed: 'Falha na conexão.',
      connectOAuth: 'Conectar via OAuth',
      reconnect: 'Reconectar',
      connect: 'Conectar',
      waitingConsent: 'Aguardando consentimento no navegador…',
      cancel: 'Cancelar',
      apiKeySet: 'chave de API configurada',
      oauthSet: 'OAuth configurado'
    },
    memoryProvider: {
      savedTitle: label => `${label} salvo`,
      savedMessage: 'Configuração do provedor de memória atualizada.',
      saveFailed: label => `Falha ao salvar as configura\xE7\xF5es de ${label}`,
      fullConfigTitle: label => `${label} \u2014 configura\xE7\xE3o completa`,
      fullConfigDesc: (label, profile) =>
        `Todas as op\xE7\xF5es de ${label} para o perfil ${profile}. Campos em branco usam o valor resolvido do host ou o padr\xE3o embutido.`,
      docsLink: label => `Refer\xEAncia de configura\xE7\xE3o de ${label}`,
      save: 'Salvar alterações',
      cancel: 'Cancelar',
      settingsFor: label => `Configura\xE7\xF5es de ${label}`,
      fullConfig: 'Configuração completa…',
      secretSet: label => `${label} configurado`,
      secretNotSet: label => `${label} n\xE3o configurado`,
      keepCurrent: 'Deixe em branco para manter o valor atual',
      aboutField: label => `Sobre ${label}`,
      setBadge: 'configurado'
    },
    auxWarning: {
      banner: (n, names, provider) =>
        n === 1
          ? `1 tarefa auxiliar (${names}) ainda roda em ${provider}, n\xE3o no seu modelo principal.`
          : `${n} tarefas auxiliares (${names}) ainda rodam em ${provider}, n\xE3o no seu modelo principal.`,
      bannerMultiProvider: (n, names) =>
        n === 1
          ? `1 tarefa auxiliar (${names}) ainda roda em outros provedores, n\xE3o no seu modelo principal.`
          : `${n} tarefas auxiliares (${names}) ainda rodam em outros provedores, n\xE3o no seu modelo principal.`,
      resetAll: 'Restaurar tudo para o principal'
    },
    inlineBilling: {
      openVerification: 'Abrir página de verificação',
      dismiss: 'Dispensar',
      waitingLink: 'Aguardando link de verificação…',
      verifyToContinue: 'Verificar para continuar',
      openPortal: 'Abrir portal'
    },
    showOptions: 'Mostrar opções',
    minimizeToTrayTitle: 'Minimizar para a bandeja',
    minimizeToTrayDesc:
      'Minimize as janelas ou feche a janela principal para ocultá-las na bandeja do sistema (barra de menus no macOS) e manter o Hermes em execução. Use Sair do Hermes no menu da bandeja ou Cmd+Q para encerrar. Desativado por padrão; vale apenas para este dispositivo.',
    minimizeToTrayUnavailable:
      'A bandeja do sistema está indisponível. As janelas serão minimizadas e fechadas normalmente. Desative e ative esta opção para tentar novamente.',
    keepAwakeOff: 'Desativado',
    keepAwakeWhileWorking: 'Durante o trabalho',
    keepAwakeAlways: 'Sempre',
    alwaysExternalLinksTitle: 'Sempre abrir links no navegador externo',
    alwaysExternalLinksDesc:
      'Abre todos os links em que você clicar no navegador do sistema, em vez do navegador integrado. A opção “Abrir no navegador integrado” do menu de contexto continua funcionando.',
    voiceShortcutHintTitle: 'Atalho de gravação de voz',
    voiceShortcutHintDesc:
      'Defina o atalho de gravação de voz em Configurações → Atalhos de teclado (“Iniciar / parar conversa por voz”). A opção voice.record_key vale apenas para a CLI e a TUI.'
  },
  quickEntry: {
    enabledTitle: 'Entrada rápida',
    enabledDesc:
      'Abra um pequeno campo de mensagem de qualquer lugar com um atalho global e envie um prompt sem abrir o Hermes.',
    shortcutTitle: 'Atalho da Entrada rápida',
    shortcutDesc: 'Precisa de pelo menos uma tecla modificadora, por exemplo, CommandOrControl+Shift+Space.',
    active: 'O atalho está ativo.',
    takenBy: 'Outro app já usa este atalho — escolha um diferente.',
    invalidShortcut: 'Atalho inválido. Inclua pelo menos uma tecla modificadora.'
  },
  credentials: {
    pasteKey: 'Colar chave',
    pasteLabelKey: label => `Colar chave de ${label}`,
    optional: 'Opcional',
    enterValueFirst: 'Digite um valor primeiro.',
    couldNotSave: 'Não foi possível salvar a credencial.',
    remove: 'Remover',
    getKey: 'Obter uma chave',
    saving: 'Salvando'
  },
  envActions: {
    actions: 'Ações',
    manageInKeys: 'Gerenciar em Chaves de API',
    docs: 'Documentação',
    hideValue: 'Ocultar valor',
    revealValue: 'Mostrar valor',
    replace: 'Substituir',
    set: 'Definir',
    clear: 'Limpar'
  },
  connections: {
    title: 'Gateways cadastrados',
    intro:
      'Gerencie este dispositivo e todos os gateways Hermes que ele consegue acessar por conexões remotas, SSH ou Hermes Cloud.',
    stagedNote:
      'Troque de gateway em Sessões. Perfis, conversas, mensagens e tarefas cron permanecem no gateway deles; o trabalho nos outros gateways continua em execução.',
    launchModeTitle: 'Ao iniciar, voltar para Sessões no último gateway usado',
    launchModeDesc: 'Quando desativado, Sessões abre no gateway Principal.',
    searchPlaceholder: 'Buscar gateways…',
    noSearchResults: 'Nenhum gateway corresponde à sua busca.',
    loadFailed: 'Não foi possível carregar as conexões',
    currentPill: 'Atual',
    primaryPill: 'Principal',
    managedPill: 'Gerenciado pelo app',
    addConnection: 'Adicionar conexão',
    editConnection: 'Editar',
    removeConnection: 'Remover',
    removeConfirmTitle: 'Remover esta conexão?',
    removeConfirmDesc: label =>
      `\u201C${label}\u201D ser\xE1 removida deste app. A inst\xE2ncia em si n\xE3o ser\xE1 alterada \u2014 voc\xEA poder\xE1 adicion\xE1-la novamente a qualquer momento.`,
    makePrimary: 'Tornar principal',
    testConnection: 'Testar',
    testOk: 'Acessível',
    testFailed: 'Falha no teste de conexão',
    saveFailed: 'Não foi possível salvar a conexão',
    removeFailed: 'Não foi possível remover a conexão',
    updateAll: 'Atualizar todas as instâncias',
    updateAllRunning: 'Atualizando todas as instâncias…',
    updateAllDone: 'Atualizações enviadas',
    updateAllFailed: 'Falha ao distribuir as atualizações',
    updateSkippedCloud: 'Gerenciado pelo Hermes Cloud',
    kindLocal: 'Local',
    kindRemote: 'Gateway remoto',
    kindCloud: 'Hermes Cloud',
    kindSsh: 'SSH',
    kindLocalDesc: 'O runtime do Hermes gerenciado por este app.',
    kindRemoteDesc: 'Um gateway Hermes acessível por HTTP(S) — LAN, Tailscale ou internet.',
    kindCloudDesc: 'Uma instância hospedada, descoberta por meio da sua conta do Hermes Cloud.',
    kindSshDesc: 'Uma instalação do Hermes acessada por SSH.',
    labelTitle: 'Nome',
    labelDesc:
      'Obrigatório. Exibido em todos os lugares onde esta instância aparece; deve ser único (por exemplo, “Homelab”, “Notebook do trabalho”).',
    labelPlaceholder: 'Homelab',
    urlTitle: 'URL do gateway',
    sshHostTitle: 'Host SSH',
    headersTitle: 'Cabeçalhos adicionais do gateway',
    headersDesc:
      'Enviados em todas as solicitações HTTP e WebSocket para este gateway — para proxies de acesso como o Cloudflare Access (CF-Access-Client-Id / CF-Access-Client-Secret). Os valores são armazenados de forma criptografada. Cabeçalhos gerenciados pelo Hermes (Authorization, Cookie, Host…) são ignorados.',
    headerValuePlaceholder: 'Valor',
    headerValueSaved: 'Salvo — deixe em branco para manter',
    headerAdd: 'Adicionar cabeçalho',
    headerRemove: 'Remover',
    duplicateLocal: 'Este app já gerencia uma conexão local — só pode haver uma.',
    duplicateUrl: label => `J\xE1 existe uma conex\xE3o com a URL deste gateway (\u201C${label}\u201D).`,
    duplicateSsh: label => `J\xE1 existe uma conex\xE3o com este host SSH (\u201C${label}\u201D).`,
    sameBackendHint: label => `Mesmo backend que \u201C${label}\u201D`,
    localAddHint: 'Local não está disponível: a conexão local gerenciada já existe (só pode haver uma).',
    cloudAddHint:
      'Dica: entrar no Hermes Cloud acima encontra seus agentes automaticamente — use este formulário somente para cadastrar manualmente a URL de uma instância conhecida.',
    save: 'Salvar conexão',
    saving: 'Salvando…',
    cancel: 'Cancelar',
    empty: 'Nenhuma conexão cadastrada ainda.'
  },
  managedUpdates: {
    title: 'Atualizações gerenciadas',
    intro:
      'Atualize de forma transacional as instalações via SSH gerenciadas pelo Desktop: o sistema aguarda as sessões terminarem, atualiza o checkout remoto e restaura todos os perfis com um recibo correlacionado.',
    sshConnection: 'Instalação via SSH gerenciada pelo Desktop',
    update: 'Atualizar',
    updating: 'Atualizando…',
    progress: 'Aguardando as sessões terminarem, atualizando a instalação remota e restaurando os perfis…',
    updated: 'Atualizado',
    partial: 'Atualizado — falha na restauração',
    refused: 'Recusado',
    failed: 'Falha na atualização',
    alreadyRunning: 'Atualização já em andamento',
    receipt: (id, outcome) => `Recibo ${id} \xB7 ${outcome}`,
    receiptVersions: (pre, post) => `${pre} \u2192 ${post}`,
    scopesRestored: profiles => `Perfis restaurados: ${profiles}`,
    scopeNotRestored: (profile, error) => `Perfil \u201C${profile}\u201D n\xE3o restaurado: ${error}`
  },
  gateway: {
    webAccess: {
      failed: 'Não foi possível alterar o acesso pela web',
      intro: 'Abra o Hermes deste computador pelo celular ou outro computador, conectado com sua conta Nous. Quem entrar pode executar comandos neste computador.',
      lanUnencrypted: 'A conexão não é criptografada: outras pessoas nesta rede poderiam ler o que você envia e recebe.',
      modeLan: 'Esta rede',
      modeLanDetail: (url) => `Dispositivos no seu Wi-Fi abrem ${url}. Use apenas em uma rede de confiança.`,
      modePublic: 'Minha própria URL',
      modePublicDetail: (port) => `Um endereço HTTPS que você já roda, como Tailscale Serve ou um túnel, encaminhando para http://127.0.0.1:${port}.`,
      needsNous: 'Primeiro entre com sua conta Nous em Provedores.',
      noLan: 'Este computador não tem endereço de rede que outros dispositivos alcancem.',
      notRunningDetail: 'Inicie para abrir o Hermes a partir de outro dispositivo.',
      pendingOff: 'Desativado, mas o gateway continua servindo o web app até reiniciar.',
      pendingOn: 'Salvo. O gateway serve o web app quando reiniciar.',
      restartBusy: 'Salvo. Uma conversa está em andamento, então o gateway não reiniciou. Escolha Reiniciar gateway quando ela terminar.',
      restartFailed: 'Salvo, mas o gateway não conseguiu reiniciar. Escolha Reiniciar gateway para tentar de novo.',
      restartFailedBecause: reason => `O gateway não conseguiu reiniciar: ${reason}`,
      restartGateway: 'Reiniciar gateway',
      restartNeeded: 'Reinício necessário',
      running: 'Em execução',
      runningLan: 'Abra este endereço em um dispositivo na mesma rede.',
      runningLocal: 'Só este computador consegue abri-lo. Pare e inicie de novo para abri-lo de outros dispositivos.',
      runningPublic: 'Servido pela sua URL.',
      start: 'Iniciar',
      startTimedOut: 'O gateway não serviu o web app em 90 segundos.',
      starting: 'Iniciando',
      stop: 'Parar',
      stopTimedOut: 'O gateway não parou de servir o web app em 90 segundos.',
      stopped: 'Parado',
      stopping: 'Parando',
      title: 'Acesso pela web',
      unavailable: 'Indisponível',
      unavailableDetail: (reason) => `O gateway não conseguiu servir o web app: ${reason}`,
    },
    webappHostDesc: 'O Webapp sempre usa o host Hermes que o serve. Para trocar de gateway, entrar no Hermes Cloud ou gerenciar conexões salvas, use o app Hermes Desktop.',
    webappHostTitle: 'Host do Hermes',
    loading: 'Carregando configurações do gateway...',
    unavailableTitle: 'Configurações do gateway indisponíveis',
    unavailableDesc: 'A ponte IPC do Desktop não disponibiliza as configurações do gateway.',
    title: 'Conexão com o gateway',
    envOverride: 'substituição pelo ambiente',
    intro:
      'Local por padrão. Use o modo remoto quando este aplicativo precisar controlar um backend do Hermes em outro lugar. As conexões com gateways valem para toda a máquina; os perfis são descobertos nos gateways conectados.',
    envOverrideTitle: 'Variáveis de ambiente estão controlando esta sessão do Desktop.',
    envOverrideDesc:
      'Remova HERMES_DESKTOP_REMOTE_URL e HERMES_DESKTOP_REMOTE_TOKEN do ambiente para usar a configuração salva abaixo.',
    modeTitle: 'Modo de conexão',
    localTitle: 'Gateway local',
    localDesc: 'Inicia um backend privado do Hermes no localhost. Este é o padrão e funciona offline.',
    remoteTitle: 'Gateway remoto',
    remoteDesc: 'Conecta este aplicativo Desktop a um backend remoto do Hermes.',
    remoteAuthHint:
      'Gateways hospedados usam OAuth ou nome de usuário e senha; gateways auto-hospedados podem usar um token de sessão.',
    cloudTitle: 'Hermes Cloud',
    cloudDesc: 'Entre uma vez no Hermes Cloud e escolha um dos agentes da sua conta — sem precisar colar uma URL.',
    cloudSignInTitle: 'Hermes Cloud',
    cloudSignIn: 'Entrar no Hermes Cloud',
    cloudSignedIn: 'Conectado ao Hermes Cloud',
    cloudNeedsSignIn: 'Entre no Hermes Cloud para encontrar os agentes da sua conta.',
    cloudSignedInDesc: 'Você está conectado. Escolha um agente abaixo; a sessão é atualizada automaticamente.',
    cloudAgentsTitle: 'Seus agentes',
    cloudOrgPickerTitle: 'Escolha uma organização',
    cloudOrgSelect: 'Selecionar',
    cloudOrgChange: 'Trocar organização',
    cloudOrgRole: role => `Fun\xE7\xE3o: ${role}`,
    cloudLoadingAgents: 'Carregando seus agentes…',
    cloudNoAgents: {
      before: 'Nenhum agente encontrado nesta conta. Crie um no ',
      linkText: 'portal da Nous',
      after: ' e depois atualize.'
    },
    cloudRefresh: 'Atualizar',
    cloudConnect: 'Conectar',
    cloudSavedTitle: 'Gateways da Cloud salvos',
    cloudSavedDesc:
      'Use um gateway salvo sem mudar o padrão. Entre abaixo para adicionar instâncias. Gerencie nomes e login na lista de conexões salvas.',
    cloudUseSaved: 'Usar gateway',
    cloudActive: 'Ativo nesta janela',
    cloudConnecting: 'Conectando…',
    cloudDiscoverFailed: 'Não foi possível carregar seus agentes do Hermes Cloud',
    cloudConnectFailed: 'Não foi possível conectar a esse agente',
    cloudSignInFailed: 'Falha ao entrar no Hermes Cloud',
    cloudSignedOutTitle: 'Desconectado do Hermes Cloud',
    cloudSignedOutMessage: 'A sessão do Hermes Cloud foi apagada.',
    cloudConnectedTitle: 'Conectado',
    cloudConnectedPill: 'Conectado',
    cloudConnectedTo: name => `Conectado a ${name}.`,
    cloudAgentProvisioning: 'Provisionando…',
    cloudStatusLabel: status => `Status: ${status}`,
    remoteUrlTitle: 'URL remota',
    remoteUrlDesc: 'URL base do backend remoto do painel. Prefixos de caminho são aceitos, por exemplo, /hermes.',
    probing: 'Verificando como este gateway faz a autenticação…',
    probeError:
      'Ainda não foi possível acessar este gateway. Verifique a URL — o método de autenticação aparecerá assim que ele responder.',
    signedIn: 'Conectado',
    signIn: 'Entrar',
    signOut: 'Sair',
    signInWith: provider => `Entrar com ${provider}`,
    authTitle: 'Autenticação',
    authSignedInPassword:
      'Este gateway usa nome de usuário e senha. Você está conectado; a sessão é atualizada automaticamente.',
    authSignedInOauth: 'Este gateway usa OAuth. Você está conectado; a sessão é atualizada automaticamente.',
    authNeedsPassword: 'Este gateway usa nome de usuário e senha. Entre para autorizar este aplicativo Desktop.',
    authNeedsOauth: provider => `Este gateway usa OAuth. Entre com ${provider} para autorizar este aplicativo Desktop.`,
    tokenTitle: 'Token de sessão',
    tokenDesc:
      'O token de sessão do painel usado para acesso REST e WebSocket. Deixe em branco para manter o token salvo.',
    existingToken: value => `Token existente ${value}`,
    savedToken: 'salvo',
    pasteSessionToken: 'Cole o token de sessão',
    plainTextConfirmTitle: 'Armazenar o token do gateway como texto simples?',
    plainTextConfirmDesc:
      'Nenhum serviço de chaveiro do sistema operacional foi encontrado nesta máquina. Por isso, o token seria salvo sem criptografia no arquivo de configurações de conexão do aplicativo e poderia ser lido por qualquer processo executado por este usuário. Instale ou ative o GNOME Keyring ou o KWallet para ter armazenamento criptografado.',
    plainTextConfirmAction: 'Salvar como texto simples',
    plainTextStoredTitle: 'Token armazenado como texto simples',
    plainTextStoredDesc:
      'O armazenamento seguro está indisponível, então o token salvo fica sem criptografia no arquivo de configurações de conexão do aplicativo nesta máquina. Instale ou ative o GNOME Keyring ou o KWallet para criptografá-lo.',
    keychainEncryptionTitle: 'Criptografar os segredos salvos com o chaveiro do sistema operacional',
    keychainEncryptionDesc:
      'Desativado por padrão. Quando ativado, os tokens de gateway e as credenciais de login são criptografados com o chaveiro do sistema (Keychain Access, GNOME Keyring ou Windows DPAPI) — o sistema pode pedir permissão ou uma senha. Quando desativado, eles são armazenados como arquivos de texto simples, legíveis apenas pela sua conta de usuário.',
    keychainEncryptionFailed: 'Não foi possível alterar a criptografia dos segredos',
    testRemote: 'Testar conexão remota',
    saveForRestart: 'Salvar para a próxima reinicialização',
    saveAndReconnect: 'Salvar e reconectar',
    diagnostics: 'Diagnóstico',
    diagnosticsDesc: 'Mostra o desktop.log no gerenciador de arquivos — útil quando o gateway não consegue iniciar.',
    openLogs: 'Abrir logs',
    incompleteTitle: 'Gateway remoto incompleto',
    incompleteSignIn: 'Informe uma URL remota e entre antes de mudar para o modo remoto.',
    incompleteToken: 'Informe uma URL remota e um token de sessão antes de mudar para o modo remoto.',
    incompleteSignInTest: 'Informe uma URL remota e entre antes de testar.',
    incompleteTokenTest: 'Informe uma URL remota e um token de sessão antes de testar.',
    enterUrlFirst: 'Informe primeiro uma URL remota.',
    restartingTitle: 'Reiniciando a conexão com o gateway',
    savedTitle: 'Configurações do gateway salvas',
    restartingMessage:
      'O Hermes Desktop será reconectado usando as configurações salvas — a interface permanecerá aberta.',
    savedMessage: 'Salvo para a próxima reinicialização.',
    connectedTo: (baseUrl, version) => `Conectado a ${baseUrl}${version ? ` \xB7 Hermes ${version}` : ''}`,
    reachableTitle: 'Gateway remoto acessível',
    signedOutTitle: 'Desconectado',
    signedOutMessage: 'A sessão do gateway remoto foi apagada.',
    failedLoad: 'Falha ao carregar as configurações do gateway',
    signInFailed: 'Falha ao entrar',
    signOutFailed: 'Falha ao sair',
    testFailed: 'Falha no teste do gateway remoto',
    applyFailed: 'Não foi possível aplicar as configurações do gateway',
    saveFailed: 'Não foi possível salvar as configurações do gateway',
    sshTitle: 'Conectar via SSH',
    sshDesc:
      'O Hermes é iniciado no computador remoto via SSH e encaminhado até este aplicativo por um túnel — você não precisa iniciar nem expor nada por conta própria. É necessário ter acesso SSH funcional ao host por chave.',
    sshTrustHint:
      'A primeira chave de host apresentada é considerada confiável e fixada; alterações posteriores causam uma falha de segurança.',
    sshHostTitle: 'Servidor',
    sshHostDesc: 'user@host ou um alias Host do ~/.ssh/config.',
    sshHostPick: 'Selecione um host…',
    sshHostPickTitle: 'Servidor',
    sshHostPickDesc: 'Um alias Host do ~/.ssh/config ou Personalizado para digitar um.',
    sshHostCustom: 'Personalizado (digitar manualmente)…',
    sshUserTitle: 'Usuário',
    sshUserDesc: 'Em branco = ~/.ssh/config ou seu usuário atual.',
    sshUserPlaceholder: 'do ~/.ssh/config',
    sshPortTitle: 'Porta',
    sshPortDesc: 'Em branco = 22 ou a porta do ~/.ssh/config.',
    sshKeyTitle: 'Arquivo de identidade',
    sshKeyDesc: 'Caminho da chave privada. Em branco = ssh-agent ou ~/.ssh/config.',
    sshHermesPathTitle: 'Caminho do Hermes (opcional)',
    sshHermesPathDesc: 'Caminho completo do binário remoto do Hermes. Em branco = detecção automática.',
    sshHermesPathPlaceholder: 'detecção automática',
    sshTestConnection: 'Testar SSH',
    sshConnect: 'Conectar',
    sshButtonsHint: 'Salvar aplica as alterações na próxima inicialização. Conectar reconecta agora.',
    sshReachable: (host, platform) => `Acess\xEDvel: ${host} (${platform}) \u2014 Hermes encontrado`,
    sshIncompleteHost: 'Informe um host SSH antes de conectar.',
    sshErrUnreachable: 'Não foi possível acessar esse host via SSH. Verifique o host, a porta e sua conexão de rede.',
    sshErrAuth:
      'Falha na autenticação SSH. Carregue sua chave no ssh-agent (ssh-add) ou defina um IdentityFile no ~/.ssh/config — o Hermes executa o ssh sem interação.',
    sshErrHostKey:
      'A chave do host MUDOU desde a última conexão. Confirme se isso era esperado, execute ssh-keygen -R <host> e reconecte.',
    sshErrNotInstalled:
      'O Hermes não está instalado no host remoto. Instale-o lá (curl -fsSL https://hermes-agent.nousresearch.com/install.sh | sh) ou defina o caminho do Hermes.',
    sshErrPlatform:
      'Plataforma remota não compatível. O modo SSH do Hermes Desktop aceita hosts remotos com Linux, macOS e Windows.',
    sshErrTimeout: 'A conexão SSH atingiu o tempo limite. O host pode estar inacessível ou suspenso.',
    sshErrUpdateRequired: 'Atualize o Hermes no host remoto antes de conectar pelo SSH do Desktop.',
    sshErrUnknown: 'Falha na conexão SSH.',
    sshErrInteractiveAuth:
      'O Tailscale SSH exige uma verificação interativa no navegador. No terminal, execute `ssh <host> true`, conclua a verificação e tente novamente — o Hermes executa SSH sem interação.'
  },
  keys: {
    loading: 'Carregando chaves de API e credenciais...',
    failedLoad: 'Falha ao carregar as chaves de API',
    empty: 'Ainda não há nada configurado nesta categoria.'
  },
  search: {
    placeholder: 'Buscar em todas as configurações…',
    pill: 'Buscar'
  },
  profileScope: {
    appliesTo: 'Aplica-se a',
    editsProfile: profile => `As altera\xE7\xF5es nesta p\xE1gina se aplicam ao perfil \u201C${profile}\u201D.`
  },
  mcp: {
    loading: 'Carregando servidores MCP...',
    invalidJson: 'JSON do MCP inválido',
    saveFailed: 'Falha ao salvar',
    removeFailed: 'Falha ao remover',
    reloadFailed: 'Falha ao recarregar o MCP',
    savedTitle: 'Servidor MCP salvo',
    savedMessage: name => `${name} ser\xE1 aplicado ap\xF3s recarregar o MCP.`,
    disabled: 'desativado',
    name: 'Nome',
    serverJson: 'JSON do servidor',
    remove: 'Remover',
    test: 'Testar conexão',
    catalogLoading: 'Carregando catálogo MCP...',
    catalogInstallFailed: name => `Falha ao instalar ${name}`,
    catalogEnvRequired: 'Preencha os valores obrigatórios antes de instalar.',
    capabilitySummary: (tools, prompts, resources) =>
      `${[`${tools} ferramentas`, ...(prompts ? [`${prompts} prompts`] : []), ...(resources ? [`${resources} recursos`] : [])].join(', ')} ativados`,
    costTokens: tokens => `~${tokens} tok/chamada`,
    usage30d: uses => `${uses} usos em 30 dias`,
    statusConnecting: 'Conectando…',
    statusNeedsAuth: 'Requer autenticação',
    statusError: 'Erro',
    statusOff: 'Desativado',
    allServers: 'Todos os servidores',
    authenticatedTitle: 'Autenticado',
    authenticatedMessage: (server, count) => `${server}: ${count} ferramentas`,
    authenticate: 'Autenticar',
    noOutput: 'Nenhuma saída ainda.',
    deepLinkTitle: 'Adicionar servidor MCP?',
    deepLinkDescription:
      'Um link solicitou a adição deste servidor MCP ao Hermes. Revise a configuração exata abaixo — ela vem do link, não do Hermes.',
    deepLinkStdioWarning:
      'Este servidor executa um processo local na sua máquina com o comando mostrado abaixo. Continue apenas se você confiar na origem.',
    deepLinkConfirm: 'Adicionar servidor',
    deepLinkNameInvalid: 'Os nomes devem ter de 1 a 64 letras, dígitos, pontos, hífens ou sublinhados.',
    deepLinkNameConflict: name => `J\xE1 existe um servidor chamado ${name} \u2014 escolha outro nome ou cancele.`,
    deepLinkErrorTitle: 'Link de instalação MCP rejeitado',
    deepLinkErrorName: 'O nome do servidor no link está ausente ou é inválido.',
    deepLinkErrorConfig: 'A configuração no link não é um JSON válido codificado em base64.',
    deepLinkErrorShape: 'A configuração deve ser um objeto JSON com um campo `url` ou `command` do tipo string.',
    deepLinkErrorUrl: 'Somente URLs de servidor http:// e https:// são permitidas.',
    deepLinkErrorTooLarge: 'Os dados da configuração excedem o limite de 32KB.'
  },
  model: {
    loading: 'Carregando configuração do modelo...',
    appliesDesc:
      'Aplica-se a novas sessões. Use o seletor de modelos no campo de mensagem para trocar imediatamente o modelo do chat ativo.',
    provider: 'Provedor',
    model: 'Modelo',
    applying: 'Aplicando...',
    defaultsLabel: 'Padrões',
    reasoning: 'Raciocínio',
    reasoningOff: 'Desativado',
    defaultsFailed: 'Falha ao salvar os padrões do modelo',
    loadFailed: 'Não foi possível carregar os modelos',
    restartRequired:
      'Este backend está rodando código antigo após uma atualização. Reinicie-o para carregar o código novo.',
    restartBackend: 'Reiniciar backend',
    restartingBackend: 'Reiniciando backend...',
    restartFailed: 'Não foi possível reiniciar o backend',
    auxiliaryTitle: 'Modelos auxiliares',
    resetAllToMain: 'Redefinir todos para o principal',
    auxiliaryDesc:
      'As tarefas auxiliares usam o modelo principal por padrão. Atribua um modelo específico a qualquer tarefa para substituí-lo.',
    setToMain: 'Usar o principal',
    change: 'Alterar',
    autoUseMain: 'automático · usar modelo principal',
    providerDefault: '(padrão do provedor)',
    fallbackAdd: 'Adicionar modelo alternativo',
    fallbackEmpty: 'Nenhum modelo alternativo — o modelo padrão será usado, a menos que falhe.',
    notInCatalog: 'não está na lista de modelos deste provedor — as chamadas podem usar um modelo reserva.',
    tasks: {
      vision: {
        label: 'Visão',
        hint: 'Análise de imagens'
      },
      compression: {
        label: 'Compressão',
        hint: 'Compactação de contexto'
      },
      skills_hub: {
        label: 'Central de skills',
        hint: 'Busca de skills'
      },
      approval: {
        label: 'Aprovação',
        hint: 'Aprovação automática inteligente'
      },
      mcp: {
        label: 'MCP',
        hint: 'Roteamento de ferramentas MCP'
      },
      title_generation: {
        label: 'Geração de títulos',
        hint: 'Títulos das sessões'
      },
      review: {
        label: 'Revisão',
        hint: 'Subagente revisor de /review'
      },
      voice_chat: {
        label: 'Conversa por voz',
        hint: 'Respostas faladas no modo de voz'
      },
      triage_specifier: {
        label: 'Especificação de triagem',
        hint: 'Detalhamento de especificações do Kanban'
      },
      kanban_decomposer: {
        label: 'Decomposição do Kanban',
        hint: 'Decomposição de tarefas'
      },
      profile_describer: {
        label: 'Descrição de perfis',
        hint: 'Descrições automáticas de perfis'
      },
      curator: {
        label: 'Curador',
        hint: 'Revisão do uso de skills'
      }
    },
    inheritMainEffort: 'herdar · esforço do model principal',
    moaTitle: 'Mistura de Agentes',
    moaPreset: 'Predefinição',
    moaDescription:
      'Configure presets nomeados que aparecem como models no provider Mixture of Agents. O agregador é o model em ação — ele roda cada passo do loop de tools, e quase todo o custo da execução é cobrado no provider dele. Por padrão, as references aconselham apenas uma vez por turno do usuário.',
    moaAggregator: 'Agregador',
    moaAggregatorBilled: 'model em ação · cobrado pela execução',
    moaReferenceHint: 'aconselha uma vez por turno por padrão',
    setupProviderFallback: 'provedor',
    setUpProvider: name => `Configurar ${name}`,
    staleAuxBefore: (count, names) =>
      `${count} tarefa${count === 1 ? '' : 's'} auxiliar${count === 1 ? '' : 'es'} (${names}) ainda usa${count === 1 ? '' : 'm'} `,
    staleAuxAfter: ', em vez do modelo principal.',
    staleAuxOtherProviders: 'outros provedores',
    moaEnabled: 'Ativado',
    moaSetDefault: 'Definir como padrão',
    moaNewPresetPlaceholder: 'nova predefinição',
    moaAddPreset: 'Adicionar predefinição',
    customModel: 'Modelo personalizado…',
    customModelPlaceholder: 'ID do modelo',
    chooseFromList: 'Escolher da lista',
    moaDefault: 'Padrão:',
    moaReferenceToggle: (enabled, index) => `${enabled ? 'Desativar' : 'Ativar'} referência ${index}`,
    moaReferenceTitle: index => `Referência ${index}`,
    moaAddReference: 'Adicionar modelo de referência',
    mainAppliedTitle: 'Modelo principal atualizado',
    mainAppliedMessage: model => `Novas sessões usarão ${model}.`,
    speed: 'Velocidade',
    speedStandard: 'Padrão',
    staleAuxDismiss: 'Não mostrar novamente',
    inheritsFrom: task => `herda de ${task}`,
    followTask: task => `Seguir ${task}`,
    subagents: {
      routing: {
        addRoute: 'Adicionar rota',
        baseUrlRoute: (url) => `endpoint ${url}`,
        blockedDetail: 'Este modo fica salvo, então o Hermes recusa todos os subagentes em vez de usar silenciosamente o Padrão.',
        blockedDisabled: 'Subagentes não iniciam até a Delegação Avançada ser ativada neste perfil.',
        blockedMissing: 'Subagentes não iniciam até a Delegação Avançada ser instalada.',
        blockedNotLoaded: 'Subagentes não iniciam até o Hermes carregar a Delegação Avançada. Reinicie o Hermes para concluir.',
        blockedPill: 'Não está em execução',
        blockedUnavailable: (label) => `Subagentes não iniciam até ${label} poder executar aqui. O plugin dele informa que não consegue.`,
        blockedUnregistered: (name) => `Subagentes não iniciam até um plugin que forneça “${name}” ser instalado e ativado.`,
        createRoute: 'Adicionar rota',
        defaultBadge: 'Padrão',
        deleteConfirmAction: 'Excluir rota',
        deleteConfirmBody: 'Subagentes não poderão mais escolher.',
        deleteConfirmNextDefault: (name) => `É a rota padrão, então “${name}” vira o padrão.`,
        deleteConfirmTitle: (name) => `Excluir a rota “${name}”?`,
        deleteRoute: 'Excluir',
        descriptionHint: 'Uma linha que o agente lê antes de escolher.',
        descriptionLabel: 'Quando usar',
        descriptionPlaceholder: 'ex.: Barato e rápido: buscas, resumos, edições simples.',
        dialogDesc: 'O agente lê o nome e a descrição para decidir qual rota um subagente segue.',
        dialogEdit: 'Editar rota de modelo',
        dialogNew: 'Nova rota de modelo',
        editRoute: 'Editar',
        effortInherit: 'Padrão do subagente',
        effortLabel: 'Esforço de raciocínio',
        enableFailed: 'Não foi possível ativar a Delegação Avançada',
        enablePlugin: 'Ativar',
        errors: {
          duplicate: 'Outra rota já usa este nome',
          required: 'Obrigatório',
          spaces: 'Sem espaços',
        },
        inUse: 'Em uso',
        inactiveModelMap: (route) => `Rotas de modelo escolhem o modelo de cada subagente. Subagentes sem rota escolhida usam “${route}”.`,
        inactiveModelMapNoDefault: 'Rotas de modelo escolhem o modelo de cada subagente. Subagentes sem rota escolhida usam o modelo do agente principal.',
        inactivePlugin: (label) => `${label} decide o modelo de cada subagente, então esta configuração não se aplica.`,
        inactiveProfiles: (profile) => `Rotas de perfil escolhem o perfil de cada subagente. Subagentes sem perfil escolhido rodam como “${profile}”.`,
        inactiveProfilesNoDefault: 'Rotas de perfil escolhem o perfil de cada subagente. Subagentes sem perfil escolhido usam o modelo do agente principal.',
        inactiveTitle: 'Não usado neste modo',
        installPlugin: 'Instalar plugin',
        installUnavailable: 'A Delegação Avançada ainda não está no catálogo de plugins. Instale em Capacidades › Plugins.',
        intro: 'Como cada subagente recebe seu modelo.',
        loadFailed: 'Não foi possível carregar o roteamento de subagentes',
        makeDefault: 'Tornar padrão',
        modeFailed: 'Não foi possível alterar o roteamento de subagentes',
        modelLabel: 'Modelo',
        modelRoutesEmpty: 'Nenhuma rota ainda. Até você adicionar, subagentes usam o modelo do agente principal.',
        modelRoutesTitle: 'Rotas de modelo',
        modes: {
          default: {
            description: 'Todo subagente roda no modelo de subagente abaixo.',
            label: 'Padrão',
          },
          model_map: {
            description: 'Dê nome a alguns modelos. O agente escolhe um para cada subagente.',
            label: 'Rotas de modelo',
          },
          profile_routes: {
            description: 'Subagentes rodam como um dos seus perfis, com modelo, skills e chaves próprios.',
            label: 'Rotas de perfil',
          },
        },
        nameHint: 'Curto, sem espaços. O agente escolhe rotas por este nome.',
        nameLabel: 'Nome',
        namePlaceholder: 'ex.: rapida',
        optional: 'opcional',
        plugin: 'Plugin',
        pluginDisabled: 'A Delegação Avançada está instalada, mas desativada neste perfil.',
        pluginMissing: 'Rotas de modelo e Rotas de perfil vêm do plugin Delegação Avançada.',
        pluginNotLoaded: 'A Delegação Avançada está ativada, mas o Hermes ainda não a carregou. Reinicie o Hermes para concluir.',
        profileDefault: 'Padrão',
        profileDescriptionPlaceholder: 'Quando usar (opcional)',
        profileEmpty: 'Nenhum outro perfil ainda. Crie um a partir da barra de perfis.',
        profileMissing: (name) => `${name} (perfil não existe mais)`,
        profileRoutesHint: 'Cada perfil marcado traz seu próprio modelo, skills, persona e chaves.',
        profileRoutesTitle: 'Perfis que subagentes podem usar',
        providerLabel: 'Provedor',
        providerPlaceholder: 'Escolha um provedor',
        routeActions: (name) => `Ações de ${name}`,
        saveFailed: 'Não foi possível salvar as rotas',
        saveRoute: 'Salvar rota',
        settingsTitle: 'Padrões de subagente',
        thirdPartyDescription: 'De um plugin. As configurações dele ficam com esse plugin.',
        tierFast: 'Rápido',
        tierHint: 'Somente em modelos que oferecem.',
        tierLabel: 'Velocidade',
        tierNormal: 'Normal',
        tierUltrafast: 'Ultrarrápido',
        title: 'Roteamento',
        useDefault: 'Mudar para Padrão',
      },
      inherit: 'Herdar do agente principal',
      modelOnly: 'Modelo personalizado (usar credenciais do pai)',
      providerLabel: 'Provedor do subagente',
      modelLabel: 'Modelo do subagente',
      direct: 'Sobrescrever com endpoint direto',
      customProvider: 'Provedor personalizado…',
      customProviderLabel: 'Provedor personalizado do subagente',
      parentModel: 'Usar modelo do pai',
      parentModelWarning:
        'O provedor escolhido precisa suportar o modelo do pai. Uma rota somente com provedor pode falhar se o modelo for incompatível. Se esse provedor definir um modelo padrão próprio, os subagentes passarão a usá-lo.',
      directActive:
        'Um endpoint direto está ativo e tem precedência sobre o provedor salvo. O endpoint e as credenciais dele são mantidos enquanto este modo estiver selecionado.',
      directClear:
        'Aplicar esta rota limpa o endpoint direto e a chave armazenada dele. As demais configurações de requisição são mantidas.',
      catalogFailed: 'Catálogo de modelos indisponível. Informe provedor e modelo manualmente, ou tente novamente.',
      draftHint: 'As alterações ficam locais até serem aplicadas.'
    }
  },
  localModels: {
    title: 'Modelos locais',
    runtimeTitle: 'Runtime local',
    runtimeReady: backend => `Pronto \xB7 ${backend}`,
    serverRunning: 'Em execução',
    runtimeInstalled: 'Runtime llama.cpp instalado',
    runtimeInstalledDetail: (tag, backend) =>
      `Build ${tag}, backend ${backend}. O Hermes inicia e gerencia o servidor para voc\xEA.`,
    installTitle: 'Instalar o runtime local',
    installDetail:
      'Baixa o motor de inferência llama.cpp (algumas centenas de MB). Modelos baixados rodam inteiramente nesta máquina — sem conta, nada sai do seu computador.',
    installAction: 'Instalar runtime',
    installing: 'Instalando runtime…',
    installFailed: 'Falha ao instalar o runtime',
    hardwareTitle: 'Esta máquina',
    hardwareLoading: 'Verificando seu hardware…',
    vram: label => `${label} de mem\xF3ria de v\xEDdeo`,
    ram: label => `${label} de RAM`,
    unifiedMemory: 'Memória unificada',
    modelsTitle: 'Modelos',
    recommended: 'Recomendado',
    recommendedReason: {
      'product-default': 'O modelo padrão para esta máquina, escolhido pelo fabricante.',
      'best-quality-resident':
        'O modelo de maior qualidade que roda inteiramente na sua GPU, com velocidade máxima. A escolha equilibra qualidade e velocidade prevista neste hardware.',
      'speed-gated-quality':
        'Um modelo de maior qualidade cabe nesta máquina, mas responderia devagar devido à largura de banda da memória. Este é o melhor modelo que mantém uma boa velocidade.'
    },
    noRecommendationTitle: 'Sem recomendação automática para esta máquina',
    noRecommendationDetail:
      'A configuração automática precisa de um modelo selecionado que caiba inteiramente na memória de GPU ou unificada. Você ainda pode escolher um modelo abaixo ou explorar mais modelos.',
    noRecommendationAction: 'Explorar modelos',
    downloaded: 'Baixado',
    downloadAction: size => `Baixar \xB7 ${size}`,
    downloadProgress: (done, total) => `Baixando ${done} de ${total}`,
    downloadDoneToast: model => `${model} est\xE1 pronto.`,
    installDoneToast: 'Runtime local instalado e pronto.',
    quickstartTitle: 'Rode um modelo nesta máquina',
    quickstartDetail: (model, size) =>
      `Um clique configura tudo: o motor local, ${model} (download de ${size}) e seu padr\xE3o para novas conversas. Nada sai deste computador.`,
    quickstartDetailReady: model =>
      `Um clique torna ${model} o padr\xE3o para novas conversas. Tudo roda nesta m\xE1quina.`,
    quickstartAction: 'Configurar para mim',
    quickstartConfigure: 'Configurar…',
    quickstartDoneToast: model => `${model} configurado \u2014 novas conversas rodam nesta m\xE1quina.`,
    quickstartFailed: 'Falha ao configurar modelo local',
    quickstartStageEngine: 'Motor',
    quickstartStageModel: 'Modelo',
    quickstartStageFinish: 'Concluir',
    useAction: 'Usar',
    activePill: 'Padrão',
    updateTitle: 'Atualização do motor disponível',
    updateDetail: (next, current) =>
      `Uma build mais recente do llama.cpp (${next}) est\xE1 pronta para instalar \u2014 voc\xEA est\xE1 na ${current}. Os modelos continuam funcionando durante o download.`,
    updateAction: 'Atualizar motor',
    updating: 'Atualizando motor…',
    upToDateTitle: 'Motor atualizado',
    upToDateDetail: (tag, backend) =>
      `Rodando llama.cpp ${tag} (${backend}) \u2014 a build mais recente que o Hermes distribui.`,
    activeDetail: 'Novas conversas usam este modelo — ele carrega quando você envia a primeira mensagem',
    activeNotLoaded: 'Carrega na sua primeira mensagem',
    loadedPill: 'Na memória',
    placementResident: 'tudo na GPU',
    placementSpilled: 'parte na RAM',
    placementResidentTip: 'Rodando inteiramente na memória da GPU nesta janela de contexto — velocidade máxima.',
    placementSpilledTip:
      'Parte deste modelo roda da RAM do sistema — funciona, mas mais devagar. Uma build mais compacta ou um contexto menor caberia inteiro.',
    loadingPill: 'Carregando…',
    ejectTip: 'Liberar memória da GPU (carrega de novo na próxima mensagem)',
    ejected: 'Modelo descarregado — memória da GPU liberada.',
    ejectFailed: 'Não foi possível descarregar o modelo',
    stopServer: 'Desligar',
    startServer: 'Ligar',
    runtimeRunningDetail:
      'O servidor local está em execução. Desligá-lo libera toda a memória da GPU e impede novas conversas de usarem modelos locais até religar.',
    serverStopped: 'Servidor local desligado — memória da GPU liberada.',
    serverStarted: 'Servidor local em execução.',
    serverStopFailed: 'Não foi possível desligar o servidor local',
    serverStartFailed: 'Não foi possível iniciar o servidor local',
    activating: 'Iniciando…',
    activateFailed: model => `N\xE3o foi poss\xEDvel mudar para ${model}`,
    activateDoneToast: model => `Novas conversas usam ${model}.`,
    downloadFailed: model => `Download de ${model} falhou`,
    pillFitsGpu: 'Cabe na sua GPU',
    pillUsesRam: 'Usa RAM do sistema',
    pillTooBig: 'Grande demais para esta máquina',
    browseTitle: 'Encontrar mais modelos',
    browseHint:
      'Pesquisa toda a Hugging Face. Modelos baixados aqui são dimensionados para sua máquina automaticamente, mas não são testados por nós.',
    browsePlaceholder: 'Pesquisar modelos por nome ou autor…',
    browseSearching: 'Pesquisando na Hugging Face',
    browseListing: 'Lendo arquivos do modelo',
    browseShowFiles: 'Mostrar arquivos',
    browseRefresh: 'Atualizar',
    browseDownloads: 'downloads',
    browseLikes: 'curtidas',
    browseGated: 'exige login na Hugging Face',
    browseNoGguf: 'Nenhum arquivo de modelo compatível encontrado.',
    browseFitUnknown: 'Ajuste desconhecido',
    browseAlreadyDownloaded: 'Já baixado.',
    addedByYou: 'Adicionado por você',
    browseDownloadStarted: 'Baixando {name}',
    browseDownloadAria: 'Baixar {name}',
    sideloadButton: 'Adicionar arquivo de modelo',
    sideloadTitle: 'Escolher um arquivo de modelo GGUF',
    sideloadDone: 'Adicionado {name}.',
    sideloadAlreadyPresent: 'Já está na sua biblioteca.',
    pillFullContext: max => `Contexto completo de ${max}`,
    pillFullContextTip: 'Roda na janela de contexto completa do modelo desde o início',
    pillUpTo: max => `At\xE9 ${max} de contexto`,
    pillGrowsTip: 'Cresce automaticamente conforme a conversa precisa de mais espaço',
    pillVision: 'Enxerga imagens',
    deleteAction: 'Excluir modelo',
    deleteConfirm: model => `Excluir ${model} do disco?`,
    deleted: model => `${model} exclu\xEDdo.`,
    deleteFailed: 'Falha ao excluir',
    connectionChanged: 'A conexão dos modelos locais mudou',
    downloadStatusRunning: 'Baixando',
    downloadSpeed: rate => `${rate}`,
    downloadEta: time => `~${time} restantes`,
    downloadEtaSeconds: count => `${count} s`,
    downloadEtaMinutes: count => `${count} min`,
    downloadEtaHours: (hours, minutes) => (minutes ? `${hours} h ${minutes} min` : `${hours} h`),
    downloadPausedLabel: 'Pausado',
    downloadPauseAction: 'Pausar',
    downloadResumeAction: 'Retomar',
    downloadPauseFailed: model => `Não foi possível pausar o download de ${model}`,
    downloadResumeFailed: model => `Não foi possível retomar o download de ${model}`
  },
  providers: {
    connectAccount: 'Conectar uma conta',
    haveApiKey: 'Prefere usar uma chave de API?',
    intro:
      'Entre com uma assinatura — sem precisar copiar uma chave de API. O Hermes abre o login no navegador para você, aqui mesmo no app.',
    connected: 'Conectado',
    collapse: 'Recolher',
    connectAnother: 'Conectar outro provedor',
    otherProviders: 'Outros provedores',
    disconnect: 'Desconectar',
    disconnectInTerminal: 'Desconectar (executa o comando de remoção no terminal)',
    removeConfirm: provider => `Remover ${provider}?`,
    removeExternalGeneric: provider => `${provider} \xE9 gerenciado pela pr\xF3pria CLI \u2014 remova por ela.`,
    removeKeyManaged: provider => `${provider} est\xE1 configurado com uma chave de API. Remova-o em Chaves de API.`,
    removeTerminalConfirm: (provider, command) =>
      `Desconectar ${provider}? Isso executar\xE1 "${command}" no terminal para apagar a credencial.`,
    removeTerminalRunning: provider => `Executando a desconex\xE3o de ${provider} no terminal\u2026`,
    removedTitle: 'Conta removida',
    removedMessage: provider => `${provider} foi removido.`,
    failedRemove: provider => `N\xE3o foi poss\xEDvel remover ${provider}`,
    noProviderKeys: 'Nenhuma chave de API de provedor disponível.',
    searchKeys: 'Buscar provedores…',
    noKeysMatch: 'Nenhum provedor corresponde à sua busca.',
    localEndpoint: {
      title: 'Endpoint local / personalizado',
      description:
        'Direcione o Hermes para qualquer endpoint compatível com OpenAI (Zyphra, vLLM, llama.cpp, Ollama etc.).'
    },
    loading: 'Carregando provedores...'
  },
  sessions: {
    loading: 'Carregando sessões arquivadas…',
    archivedTitle: 'Sessões arquivadas',
    archivedIntro:
      'Os chats arquivados ficam ocultos da barra lateral, mas mantêm todas as mensagens. Use Ctrl/⌘+clique em um chat na barra lateral para arquivá-lo.',
    emptyArchivedTitle: 'Nenhuma sessão arquivada',
    emptyArchivedDesc: 'Arquive um chat para ocultá-lo aqui.',
    unarchive: 'Restaurar',
    deletePermanently: 'Excluir permanentemente',
    messages: count => `${count} ${count === 1 ? 'mensagem' : 'mensagens'}`,
    restored: 'Restaurada',
    deleteConfirm: title => `Excluir \u201C${title}\u201D permanentemente? Isso n\xE3o pode ser desfeito.`,
    autoArchiveTitle: 'Arquivar chats inativos automaticamente',
    autoArchiveDesc:
      'Arquive automaticamente os chats que você não acessa há algum tempo. Chats fixados nunca são arquivados e nada é excluído — os chats arquivados apenas são movidos para cá.',
    autoArchiveDaysLabel: 'Arquivar após',
    autoArchiveDaysUnit: 'dias de inatividade',
    autoArchiveFailed: 'Não foi possível atualizar o arquivamento automático',
    defaultDirTitle: 'Diretório padrão do projeto',
    defaultDirDesc:
      'Novas sessões começam nesta pasta, a menos que você escolha outra. Deixe sem definir para usar seu diretório pessoal.',
    defaultDirUpdated: shortcut =>
      `Diretório padrão do projeto atualizado — inicie um novo chat${shortcut ? ` (${shortcut})` : ''} para aplicar a alteração`,
    defaultsTo: label => `O padr\xE3o \xE9 ${label}.`,
    change: 'Alterar',
    choose: 'Escolher',
    clear: 'Limpar',
    notSet: 'Não definido',
    failedLoad: 'Não foi possível carregar as sessões arquivadas',
    unarchiveFailed: 'Falha ao restaurar',
    deleteFailed: 'Falha ao excluir',
    updateDirFailed: 'Não foi possível atualizar o diretório padrão',
    clearDirFailed: 'Não foi possível limpar o diretório padrão'
  },
  toolsets: {
    nousIncluded: 'Incluído com assinatura Nous — entre no Nous Portal para ativar.',
    nousAuthNeededTitle: 'Entrar no Nous Portal',
    nousAuthNeededMessage: provider =>
      `${provider} est\xE1 salvo, mas s\xF3 ser\xE1 ativado quando voc\xEA entrar no Nous Portal.`,
    nousAuthSignIn: 'Entrar',
    nousAuthDoneTitle: 'Nous Portal conectado',
    nousAuthDoneMessage: 'Os backends da sua assinatura já estão ativos.',
    nousAuthFailed: 'Login no Nous Portal não foi concluído',
    noApiKeyRequired: 'Nenhuma API key necessária.',
    postSetupHint: step =>
      `Este backend precisa de uma instala\xE7\xE3o \xFAnica (${step}). Roda nesta m\xE1quina \u2014 pode levar alguns minutos.`,
    postSetupInstalledHint: 'Instalado. Execute a configuração novamente apenas se algo estiver quebrado.',
    postSetupRun: 'Executar configuração',
    postSetupRerun: 'Executar configuração novamente',
    postSetupInstalled: 'Instalado',
    postSetupRunning: 'Instalando…',
    postSetupStarting: 'Iniciando…',
    postSetupCompleteTitle: 'Configuração concluída',
    postSetupCompleteMessage: step => `${step} instalado.`,
    postSetupErrorTitle: 'Configuração terminou com erros',
    postSetupErrorMessage: step => `Verifique o log de ${step}.`,
    postSetupFailed: step => `Falha ao executar a configura\xE7\xE3o de ${step}`,
    webSearchActive: backend => `Busca: ${backend}`,
    webExtractActive: backend => `Extra\xE7\xE3o: ${backend}`,
    webCapabilityUnset: 'não definido',
    webUseForSearch: 'Usar para Busca',
    webUseForExtract: 'Usar para Extração',
    webUsedForSearch: 'Backend de busca',
    webUsedForExtract: 'Backend de extração',
    webCapabilitySelectedMessage: (provider, capability) => `${provider} agora cuida da ${capability} web.`,
    failedSelectCapability: provider => `Falha ao definir ${provider}`,
    loadingModels: 'Carregando catálogo de modelos...',
    modelSectionTitle: 'Modelo',
    modelCount: count => `${count} modelo${count === 1 ? '' : 's'}`,
    modelInUse: 'Em uso',
    modelDefault: 'padrão',
    modelInactiveHint: 'Selecione este backend primeiro para alterar seu modelo.',
    modelSelectedTitle: 'Modelo selecionado',
    modelSelectedMessage: model => `${model} vale para novas sess\xF5es.`,
    failedSelectModel: model => `Falha ao selecionar ${model}`,
    terminalBackend: {
      sectionTitle: 'Backend de execução',
      loading: 'Verificando backends de execução…',
      failedLoad: 'Não foi possível carregar backends de terminal',
      ready: 'Pronto',
      needsSetup: 'Precisa de configuração',
      unavailable: 'Indisponível',
      inUse: 'Em uso',
      selectedTitle: 'Backend selecionado',
      selectedMessage: backend => `Comandos de terminal agora rodam via ${backend}. Vale para novas sess\xF5es.`,
      failedSelect: backend => `Falha ao selecionar ${backend}`,
      needsSetupHint: 'Você pode selecionar este backend agora — comandos falharão até a configuração terminar.',
      needsSetupConfirmTitle: backend => `Selecionar ${backend} mesmo assim?`,
      needsSetupConfirmDescription: detail =>
        `${detail} Sess\xF5es que come\xE7arem depois desta mudan\xE7a ficar\xE3o sem terminal nem tools de arquivos at\xE9 o setup terminar.`,
      needsSetupConfirmDescriptionGeneric:
        'Este backend ainda não está configurado. Sessões que começarem depois desta mudança ficarão sem terminal nem tools de arquivos até o setup terminar.',
      needsSetupConfirmAction: 'Selecionar mesmo assim',
      unavailableTitle: 'Comandos de terminal indisponíveis',
      unavailableMessage: backend =>
        `O Hermes n\xE3o consegue rodar comandos de shell agora: ${backend} n\xE3o est\xE1 pronto. Mude para Local, ou termine de configurar o ${backend} e tente novamente.`,
      openBackendSettings: 'Abrir configurações do terminal',
      useLocal: 'Usar Local',
      switchedToLocal: 'Comandos de terminal agora rodam localmente. Vale para novas sessões.'
    },
    loadingConfig: 'Carregando configuração',
    savedTitle: 'Credencial salva',
    savedMessage: key => `${key} atualizado.`,
    removedTitle: 'Credencial removida',
    removedMessage: key => `${key} removido.`,
    failedSave: key => `Falha ao salvar ${key}`,
    failedRemove: key => `Falha ao remover ${key}`,
    failedReveal: key => `Falha ao revelar ${key}`,
    removeConfirm: key => `Remover ${key} do arquivo .env?`,
    set: 'Definir',
    notSet: 'Não definido',
    selectedTitle: 'Provedor selecionado',
    selectedMessage: provider => `${provider} agora est\xE1 ativo.`,
    failedSelect: provider => `Falha ao selecionar ${provider}`,
    failedLoad: 'Falha ao carregar a configuração das ferramentas',
    noProviderOptions:
      'Este conjunto não tem opções de provedor — basta ativá-lo para usar com sua configuração atual.',
    noProviders: 'Nenhum provedor está disponível para este conjunto no momento.',
    ready: 'Pronto',
    needsSignIn: 'É preciso entrar',
    needsSetup: 'Configuração necessária',
    activeBackend: 'Ativo',
    activeBackendHint: 'Este é o mecanismo ativo',
    useBackend: 'Usar este mecanismo',
    browserRealProfile: {
      label: 'Usar meu perfil real do navegador',
      description:
        'Copia os logins e cookies do seu navegador padrão para um snapshot gerenciado com o qual o agente navega. Seu perfil ativo nunca é aberto diretamente. Vale para novas sessões.',
      enabledTitle: 'Navegação com perfil real ativada',
      enabledMessage: 'Novas sessões navegarão com um snapshot do perfil do seu navegador padrão.',
      disabledTitle: 'Navegação com perfil real desativada',
      disabledMessage: 'O snapshot do perfil será excluído; novas sessões usam um navegador limpo.',
      failedSave: 'Não foi possível salvar a configuração de perfil real',
      prompt: {
        title: 'Continue conectado aos seus sites',
        body: 'Deixe o Hermes navegar com um snapshot do seu perfil padrão do navegador, para os sites abrirem já conectados.',
        bulletSnapshot: 'Cookies e logins são copiados para um snapshot gerenciado.',
        bulletLiveProfile: 'Seu perfil real do navegador nunca é aberto diretamente.',
        bulletLocal: 'Nada sai deste computador.',
        dontShowAgain: 'Não mostrar novamente',
        notNow: 'Agora não',
        enable: 'Usar meu perfil'
      }
    },
    nousAuthFailedMessage: 'Tente novamente.',
    nousAuthTryAgain: 'Tentar novamente',
    postSetupOpenLogs: 'Abrir logs',
    postSetupRunAgain: 'Executar novamente'
  },
  subpages: {
    appearanceTheme: 'Tema',
    appearanceTypography: 'Tipografia',
    appearanceWindowLayout: 'Janela e layout',
    appearanceChatDisplay: 'Exibição do chat',
    appearancePet: 'Mascote',
    appearanceGeneral: 'Geral',
    modelMain: 'Modelo principal',
    modelAuxiliary: 'Modelos auxiliares',
    modelMoa: 'Mistura de Agentes',
    modelFallbacks: 'Modelos de fallback',
    chatBehavior: 'Comportamento',
    chatAttachments: 'Anexos',
    workspaceProjects: 'Projetos e descoberta',
    workspaceShell: 'Ambiente do shell',
    workspaceFiles: 'Arquivos e execução',
    safetyApprovals: 'Aprovações',
    safetyPrivacy: 'Privacidade e rede',
    safetyCheckpoints: 'Checkpoints',
    browserProfile: 'Perfil do navegador',
    browserNetwork: 'URLs locais e privadas',
    memoryPersistent: 'Memória persistente',
    memoryContext: 'Contexto e compressão',
    voiceConversation: 'Conversa por voz',
    voiceTranscription: 'Fala para texto',
    voiceSpeech: 'Texto para fala',
    advancedRuntime: 'Limites do agente',
    advancedTools: 'Acesso a tools',
    advancedTerminal: 'Backend do terminal',
    advancedOutput: 'Limites de saída',
    advancedDelegation: 'Subagentes',
    advancedDesktop: 'Desktop e inicialização',
    gatewayConnection: 'Esta janela',
    gatewayDevices: 'Conexões salvas',
    gatewayManagedUpdates: 'Atualizações remotas',
    gatewayManagedUpdatesUnavailable:
      'Atualizações remotas exigem uma versão desktop com suporte a atualização SSH gerenciada.',
    gatewayManagedUpdatesEmpty: 'Adicione uma conexão SSH em Conexões salvas para gerenciar as atualizações dela aqui.',
    keyboardShortcuts: 'Atalhos de teclado',
    screenCapture: 'Captura de tela',
    notificationAlerts: 'Alertas do desktop',
    notificationSounds: 'Sons',
    archivedSessions: 'Arquivamento e retenção',
    defaultDirectory: 'Pasta de projeto padrão',
    vaultCredentials: 'Credenciais salvas',
    vaultSources: 'Gerenciadores de senhas',
    appUpdates: 'Versão e atualizações',
    uninstall: 'Desinstalar',
    billingOverview: 'Visão geral',
    billingPlans: 'Planos',
    hudGesture: 'Gesto do HUD'
  },
  uninstallSection: {
    dangerZone: 'Zona de perigo',
    confirmUninstall: 'Confirmar desinstalação',
    uninstallHermes: 'Desinstalar o Hermes',
    checkingInstalled: 'Verificando o que está instalado…',
    managedBody: 'Esta instalação é gerenciada pelo sistema, então o Hermes não pode se remover.',
    dataKept: path => `Suas configurações, conversas e segredos ficam em ${path}. Remover o app não os exclui.`,
    openAppsSettings: 'Abrir configurações de Apps',
    chooseHowMuch:
      'Escolha o que remover. O app será fechado para concluir; reabra o instalador a qualquer momento para voltar.',
    confirmBody: what => `Isto remove ${what}. Esta ação não pode ser desfeita.`,
    appLabel: 'App:',
    couldNotStart: 'Não foi possível iniciar a desinstalação.',
    uninstalling: 'Desinstalando…',
    yesUninstall: 'Sim, desinstalar',
    options: {
      gui: {
        title: 'Desinstalar apenas a interface de conversa',
        description: 'Remove este app desktop. O agente Hermes, suas configurações e conversas permanecem.',
        consequence: 'a interface de conversa desktop (este app e seus dados)'
      },
      lite: {
        title: 'Desinstalar interface e agente, mantendo meus dados',
        description:
          'Remove o app e o agente Hermes, mas mantém configurações, conversas e segredos para uma futura reinstalação.',
        consequence: 'a interface de conversa e o agente Hermes (configurações, conversas e segredos são mantidos)'
      },
      full: {
        title: 'Desinstalar tudo',
        description:
          'Remove o app, o agente e todos os dados do usuário: configurações, conversas, tarefas agendadas, segredos e logs.',
        consequence:
          'TUDO — a interface de conversa, o agente Hermes e todas as suas configurações, conversas, segredos e logs'
      }
    }
  },
  poolLimits: {
    warmBotBackendsAria: 'Backends de bot pré-aquecidos',
    warmBotBackendsTitle: 'Backends de Bot Pré-Aquecidos',
    backendIdleTimeoutAria: 'Timeout de inatividade do backend em milissegundos',
    backendIdleTimeoutTitle: 'Timeout de Inatividade do Backend',
    warmTitle: 'Backends de Bot Pré-Aquecidos',
    warmDesc:
      'Quantos backends de bot ficam rodando para troca instantânea. Mais alto = trocas mais rápidas, mais memória (~60MB por backend). Aplica imediatamente.',
    warmAria: 'Backends de bot pré-aquecidos',
    idleDesc:
      'Por quanto tempo um backend de bot não usado fica pré-aquecido antes de ser desligado. Aumente isso para que bots que você revisita a cada poucos minutos nunca paguem um cold start.'
  },
  memoryLayers: {
    activeProvider: 'Provedor de memória ativo',
    selectedProvider: 'Provedor de memória selecionado',
    selectedDesc: current => `Ainda não ativo: as sessões continuam usando ${current} até esta escolha ser salva.`,
    builtinMemory: 'somente memória nativa',
    noProvider: 'Nenhum — somente memória nativa',
    noProviderDesc:
      'O Hermes usa apenas a camada nativa abaixo. Escolha um provedor externo em Configurações › Memória e Contexto para adicionar um.',
    providerDesc: name => `${name} adiciona a própria recuperação de memória a cada sessão, além da camada nativa.`,
    providerNotReadyDesc: name =>
      `${name} é o provedor salvo, mas não adiciona recuperação até estar pronto. A camada nativa funciona de qualquer jeito.`,
    providerUnknownDesc: name => `${name} é o provedor salvo; o Hermes não conseguiu ler se ele está pronto.`,
    statusUnavailable: 'Status de memória indisponível',
    statusUnavailableDesc: 'Não foi possível ler qual provedor de memória está ativo, nem se ele está pronto.',
    retry: 'Tentar de novo',
    status: {
      ready: 'pronto',
      needs_config: 'precisa de configuração',
      unavailable: 'indisponível',
      missing: 'não instalado'
    },
    builtinLayer: 'Camada nativa',
    onByDefault: 'Ativo por padrão',
    on: 'Ativo',
    off: 'Desativado',
    onlyFile: file => `somente ${file}`,
    builtinDesc:
      'MEMORY.md e USER.md são a memória própria do Hermes, separada de qualquer provedor externo. Ambos entram nas sessões por padrão; os interruptores de memória e perfil de usuário em Configurações › Memória e Contexto desativam cada um. Um provedor soma-se a esta camada; nunca a substitui.'
  },
  customEndpoints: {
    title: 'Endpoints personalizados',
    deleteEndpoint: 'Excluir endpoint',
    emptyDescription: 'Adicione um endpoint compatível com OpenAI abaixo.',
    emptyTitle: 'Nenhum endpoint personalizado',
    namePlaceholder: 'ex.: Meu Proxy',
    contextPlaceholder: 'ex.: Uso geral',
    active: 'Ativo',
    apiKeySet: 'Chave de API configurada',
    use: 'Usar',
    editTitle: 'Editar endpoint',
    addTitle: 'Adicionar endpoint',
    fields: {
      name: 'Nome',
      providerId: 'ID do provedor',
      endpointUrl: 'URL do endpoint',
      defaultModel: 'Modelo padrão',
      context: 'Contexto',
      apiKey: 'Chave de API',
      apiKeyNewPlaceholder: 'Deixe em branco para manter a chave atual',
      apiKeyPlaceholder: 'Opcional',
      useNewChats: 'Usar em novas conversas',
      discoverModels: 'Descobrir modelos'
    },
    test: 'Testar',
    save: 'Salvar',
    newEndpoint: 'Novo endpoint',
    apiMode: 'Modo da API',
    autoDetect: 'Detectar automaticamente',
    couldNotLoad: 'Não foi possível carregar os endpoints personalizados',
    endpointSaved: 'Endpoint personalizado salvo.',
    saveFailed: 'Falha ao salvar',
    endpointReachable: 'O endpoint está acessível.',
    endpointReachableTransport: transport => `O endpoint está acessível (rota ${transport} atendida).`,
    endpointReachableModels: (reachable, count) => `${reachable} Encontrados ${count} modelos.`,
    endpointValidationFailed: 'Falha na validação do endpoint.',
    validationFailed: 'Falha na validação',
    activationFailed: 'Falha na ativação',
    deleteConfirm: name => `Excluir ${name}?`,
    deleteFailed: 'Falha ao excluir'
  },
  computerUse: {
    accessibility: 'Acessibilidade',
    screenRecording: 'Gravação de Tela',
    driverHealth: 'Saúde do driver'
  },
  screenshot: {
    enabledTitle: 'Atalho de captura de tela',
    enabledDesc:
      'Pressione as duas teclas Command juntas, em qualquer app, para capturar a janela em primeiro plano e anexá-la ao seu rascunho atual do Hermes. Nunca envia automaticamente. Desativado por padrão; vale apenas neste Mac. O conteúdo da janela pode ser sensível — revise o anexo antes de enviar.',
    statusTitle: 'Status do atalho de captura de tela',
    checking: 'Verificando o atalho de captura de tela…',
    disabled: 'O atalho de captura de tela está desligado.',
    starting: 'Iniciando o listener do atalho. Ele ainda não está pronto.',
    ready: 'O atalho está pronto. As capturas de tela são anexadas ao seu rascunho atual sem enviar.',
    inputPermission:
      'A permissão de Monitoramento de Entrada permite que o Hermes detecte as duas teclas Command enquanto outro app está ativo. Permita o Hermes em Ajustes do Sistema → Privacidade e Segurança → Monitoramento de Entrada, depois volte aqui e tente novamente.',
    screenPermission:
      'A permissão de Gravação de Tela permite que o Hermes capture a janela do app em primeiro plano quando você usar este atalho. Permita o Hermes em Ajustes do Sistema → Privacidade e Segurança → Gravação de Tela, depois volte aqui e tente novamente. Reinicie o Hermes se o macOS pedir.',
    openSettings: 'Abrir Ajustes do Sistema',
    retry: 'Tentar novamente',
    unavailable: 'O atalho de captura de tela está indisponível. Tente novamente ou desligue.',
    errorTitle: 'Erro no atalho de captura de tela',
    loadFailed: 'Não foi possível ler o status do atalho. Tente novamente para verificar a configuração atual.',
    saveFailed: 'Não foi possível confirmar a mudança do atalho. Tente novamente para verificar a configuração atual.',
    permissionFailed:
      'Não foi possível abrir os Ajustes do Sistema. Abra Privacidade e Segurança manualmente e tente novamente.',
    captureFailed: 'Não foi possível capturar a janela em primeiro plano. Nada foi anexado nem enviado.',
    contextChanged: 'O rascunho atual mudou durante a captura. A captura de tela não foi anexada nem enviada.'
  },
  pluginPages: {
    blurb: 'Opções adicionadas pelos plugins instalados. Cada plugin tem sua própria página, e alguns têm subpáginas.',
    empty: 'Nenhum plugin tem configurações ainda.',
    manage: 'Gerenciar plugins',
    agentSettings: 'Configurações do agente',
    pageCount: n => (n === 1 ? '1 página' : `${n} páginas`),
    missing: 'Este plugin não tem uma página de configurações. Ele pode estar desativado ou desinstalado.'
  },
  hudModifier: {
    title: 'Toque para abrir o HUD',
    description:
      'Pressione e solte ⌘ + Option no Mac ou Ctrl + Alt no Windows/Linux para trazer o HUD à frente em qualquer app. Desativado por padrão; vale apenas para este dispositivo.',
    permission:
      'Permita o Hermes em Ajustes do Sistema → Privacidade e Segurança → Monitoramento de Entrada e tente novamente. Este gesto não registra teclas nem captura sua tela.',
    unavailable:
      'O auxiliar de gestos do HUD não iniciou ou parou inesperadamente. Tente novamente ou reinicie o Hermes. O atalho existente do HUD continua funcionando dentro do Hermes.',
    missingHelper:
      'O auxiliar de gestos do HUD está ausente nesta instalação. Atualize ou reinstale o Hermes e tente novamente.',
    unsupportedSession:
      'Esta sessão de desktop não permite toques globais em teclas modificadoras. No Linux, requer X11; Wayland não é compatível.'
  },
  billing: {
    keepGoingOnCredits: {
      approveInBrowser: 'Aprove o Gasto Remoto no seu navegador para alterar isso. Vale assim que você aprovar.',
      approvedRetry: 'O Gasto Remoto está aprovado, mas a alteração não foi salva.',
      cancel: 'Cancelar',
      description: 'Use seus créditos quando o uso incluído acabar. Desligado: o Hermes espera a reposição.',
      openAgain: 'Abrir de novo',
      title: 'Continuar com créditos',
      tryAgain: 'Tentar de novo',
    },
    perMonth: amount => `${amount}/mês`,
    creditsPerMonth: amount => `${amount} créditos/mês`,
    usageLabel: label => `Uso de ${label}`,
    freeTier: {
      signIn: 'Entrar',
      title: 'Você está no plano gratuito da Nous',
      message: 'Entre com uma conta Nous para acessar mais modelos e ferramentas.',
      caption:
        'Usa nous/welcome com conectores incluídos. Entrar mantém seus conectores e adiciona as ferramentas que exigem uma conta, além de todos os outros modelos.',
      name: 'Nous · plano gratuito',
      footnote:
        'O plano gratuito não tem saldo nem cobranças. Pagamentos e uso aparecem quando você entra com uma conta Nous.',
      plan: 'Plano gratuito',
      model: 'Modelo',
      connectors: 'Conectores',
      included: 'Incluídos'
    },
    amountValidation: {
      reloadTo: 'Recarregar até',
      greaterThanThreshold: 'O valor-alvo da recarga deve ser maior que o limite de acionamento.',
      decimal: label => `${label}: informe um valor em dólares com até 2 casas decimais.`,
      positive: label => `${label}: o valor deve ser maior que US$ 0.`,
      minimum: (label, amount) => `${label}: o mínimo é ${amount}.`,
      maximum: (label, amount) => `${label}: o máximo é ${amount}.`
    },
    stepUp: {
      openVerification: 'Abrir página de verificação',
      dismiss: 'Dispensar',
      waiting: 'Aguardando link de verificação…',
      verify: 'Verifique para continuar',
      deniedTitle: 'A verificação não foi aprovada',
      deniedBody: 'A verificação terminou sem permitir gastos remotos para este terminal.',
      successTitle: 'Verificação concluída',
      successBody: 'Gastos remotos estão permitidos para este terminal.'
    },
    charge: {
      added: amount => (amount ? `US$ ${amount} adicionados.` : 'Créditos adicionados.'),
      failedTitle: 'Falha na cobrança',
      unconfirmedTitle: 'Resultado da cobrança não confirmado',
      unconfirmedBody: message =>
        `${message} O resultado da última cobrança não foi confirmado. Confira seu saldo e histórico antes de tentar novamente.`,
      checkTitle: 'Não foi possível verificar a cobrança',
      checkBody: 'Não foi possível verificar a cobrança.',
      untrackedTitle: 'Não foi possível acompanhar a cobrança',
      untrackedBody: 'O serviço de cobrança aceitou a solicitação, mas não retornou um ID de cobrança.',
      timeoutTitle: 'Ainda processando após 5 minutos',
      timeoutBody: 'A cobrança ainda pode ser concluída. Confira o portal antes de tentar novamente.',
      authenticationRequired: 'Seu banco exige verificação (3DS). Conclua-a no portal para finalizar esta compra.',
      expired: 'Seu cartão expirou. Atualize-o no portal.',
      declined: 'Seu cartão foi recusado. Tente outro cartão no portal.',
      failedBody: reason => `A cobrança não foi concluída (${reason}).`
    },
    title: 'Cobrança',
    preview: 'prévia',
    summary: {
      balance: 'Saldo',
      plan: 'Plano',
      autoRefill: 'Recarga automática'
    },
    sections: {
      invoices: 'Faturas',
      plan: 'Plano',
      paymentAndCredits: 'Pagamento e créditos',
      usage: 'Uso'
    },
    usage: {
      title: 'Uso'
    },
    buyCredits: {
      customAmount: 'Valor personalizado de créditos',
      title: 'Comprar créditos agora',
      buyButton: 'Comprar',
      processing: 'Processando… verificando a confirmação',
      added: amount => `${amount} adicionados. O saldo está sendo atualizado.`,
      retry: 'Tentar novamente',
      openPortal: 'Abrir portal'
    },
    plan: {
      title: 'Planos',
      changePlan: 'Alterar plano',
      viewPlans: 'Ver planos',
      backAria: 'Voltar para cobrança',
      current: 'Plano atual',
      scheduled: 'Agendado',
      empty: 'Nenhum plano disponível para troca no momento.',
      undo: 'Desfazer',
      undoing: 'Desfazendo…',
      downgrade: 'Mudar para plano inferior',
      confirmDowngrade: 'Confirmar mudança para plano inferior',
      tryAgain: 'Tentar novamente',
      checkingChange: 'Verificando esta alteração…',
      cannotChange: 'Esta alteração não pode ser feita aqui.',
      alreadyOn: name => `Você já está no ${name} — nada a alterar.`,
      notScheduleable: 'Esta alteração não pode ser agendada aqui.',
      scheduling: 'Agendando…',
      cancel: 'Cancelar',
      effectScheduled: (targetName, effectiveAt, creditsDelta) =>
        `Mudança para ${targetName} — entra em vigor em ${effectiveAt}. Sem cobrança agora; você mantém seu plano atual até lá.${creditsDelta ? ` Alteração nos créditos mensais: ${creditsDelta}.` : ''}`
    },
    autoReload: {
      threshold: 'Limite de acionamento',
      thresholdAria: 'Limite para acionar a recarga automática',
      reloadTo: 'Recarregar até',
      reloadToAria: 'Valor-alvo da recarga automática',
      turnOffConfirm: 'Desativar recarga automática?',
      turnOff: 'Desativar',
      disable: 'Desabilitar',
      updated: 'Recarga automática atualizada.',
      turnedOff: 'Recarga automática desativada.',
      manage: 'Gerenciar',
      save: 'Salvar',
      saving: 'Salvando…',
      cancel: 'Cancelar'
    },
    state: {
      notice: {
        loggedOut: {
          title: 'Conecte sua conta Nous',
          message: 'Entre com sua conta Nous para ver seu saldo, plano e uso aqui.',
          action: 'Entrar'
        },
        openPortal: 'Abrir portal ↗',
        noCard: {
          title: 'Nenhuma forma de pagamento cadastrada',
          message:
            'A compra de créditos avulsos e a recarga automática ficam desativadas até você cadastrar um cartão. Adicione um no portal.',
          action: 'Adicionar cartão ↗'
        }
      },
      paymentMethod: {
        title: 'Forma de pagamento',
        description: 'Gerencie o cartão usado para recargas e renovações de assinatura.',
        addAction: 'Adicionar forma de pagamento',
        updateAction: 'Atualizar',
        provenance: {
          autoRefill: 'cartão da recarga automática',
          customerDefault: 'padrão do cliente',
          subPin: 'cartão da assinatura',
          suffix: label => ` - ${label}`
        }
      },
      buyCredits: {
        description: 'Uma cobrança única no seu cartão, adicionada ao seu saldo hoje.'
      },
      autoRefill: {
        title: 'Recarregar quando o saldo estiver baixo',
        genericDescription: 'Mantenha seu saldo abastecido quando ele cair abaixo do limite definido.',
        offPill: 'Desativada',
        enabledPill: 'Ativada',
        notAvailablePill: '—',
        manageCaption: 'Gerencie a recarga automática pelo portal.',
        turnOnCaption: 'Ative a recarga automática pelo portal',
        chargesDescription: (reloadTo, threshold) =>
          `Cobra ${reloadTo} automaticamente quando seu saldo cai abaixo de ${threshold}.`,
        distinctCardCaption: cardLabel => `A recarga automática cobra de ${cardLabel} — confira no portal`,
        distinctCardFallback: 'outro cartão',
        reconcileAction: 'Conferir ↗'
      },
      usage: {
        window: {
          barLabel: (title) => `${title} · uso incluído usado`,
          captionIncluded: 'Uso incluído',
          captionPaused: 'Pausado: pagamento da assinatura falhou',
          captionPausedOther: 'Pausado: veja Cobrança no Portal',
          captionResetsIn: (duration) => `Reposição em ${duration}`,
          captionTopTierUsedUp: 'Cota mensal esgotada, créditos cobram o resto',
          captionTopTierUsedUpKeepGoingOff: 'Cota mensal esgotada, outros modelos incluídos seguem funcionando',
          month: 'Este mês',
          today: 'Hoje',
          topTier: 'Modelos grandes (mensal)',
          valueUsed: (percent) => `${percent} usado`,
          week: 'Esta semana',
        },
        subscriptionCredits: {
          title: 'Créditos da assinatura',
          barLabel: 'Créditos restantes da assinatura',
          captionResets: date => `Renova em ${date}`,
          valueOf: (remaining, monthly) => `${remaining} de ${monthly} restantes`,
          valueOver: (remaining, monthly, over) => `${remaining} de ${monthly} restantes · ${over} excedentes`
        },
        topupCredits: {
          title: 'Créditos avulsos',
          caption: 'Não expiram'
        },
        monthlyCap: {
          title: 'Limite mensal de gastos',
          barLabel: 'Limite mensal de gastos utilizado',
          captionDefault: 'Teto padrão',
          captionSpending: 'Gastos remotos mensais',
          valueUsed: (spent, limit) => `${spent} de ${limit} utilizados`
        }
      },
      planCard: {
        freeTier: 'Gratuito',
        chooseAction: 'Escolher ↗',
        adjustPlanAction: 'Ajustar plano ↗',
        unavailableCaption: 'Os detalhes da assinatura estão indisponíveis; você ainda pode abrir o portal.',
        downgradeCaption: (tierName, when) => `Muda para ${tierName} em ${when}.`,
        cancellationCaption: when => `Cancela em ${when}.`,
        renewsCaption: date => `Renova em ${date}`,
        noSubscriptionCaption: 'Sem assinatura ativa — modelos pagos consomem créditos avulsos.'
      }
    },
    errors: {
      consentRequired: {
        title: 'É necessário confirmar o cartão',
        message: 'Confirme este cartão no portal para cobranças pelo terminal'
      },
      insufficientScope: {
        title: 'Gastos remotos precisam de aprovação',
        message: 'É necessário permitir gastos remotos. Inicie uma recarga para autorizá-los e tente novamente.'
      },
      remoteSpendingRevoked: {
        title: 'Os gastos remotos foram interrompidos',
        messageByAdmin: 'Um administrador interrompeu os gastos remotos para este terminal.',
        messageBySelf: 'Você interrompeu os gastos remotos para este terminal.'
      },
      remoteSpendingReconnect: who =>
        `${who} Reconecte em Configurações → Gateway para autorizar este dispositivo novamente.`,
      sessionRevoked: {
        title: 'Sessão desconectada',
        message: 'Sua sessão foi desconectada. Entre novamente em Configurações → Gateway.'
      },
      cliBillingDisabled: {
        title: 'Gastos remotos desativados',
        message:
          'Os gastos remotos estão desativados para esta conta. Um administrador de cobrança pode ativá-los na página Hermes Agent do portal.'
      },
      roleRequired: {
        title: 'Permissão de administrador necessária',
        message:
          'Adicionar fundos exige ser administrador ou proprietário da organização. Peça a um administrador ou gerencie pelo portal.'
      },
      idempotencyConflict: {
        title: 'Inicie uma nova recarga',
        message: '🔴 Esta chave de cobrança já foi usada para outro valor. Inicie uma nova recarga.'
      },
      noPaymentMethod: {
        title: 'Nenhum cartão salvo',
        message:
          '💳 Ainda não há cartão salvo para cobranças pelo terminal. Cadastre um no portal (compras avulsas de créditos não salvam um cartão reutilizável).'
      },
      orgAccessDenied: {
        title: 'Acesso à organização negado',
        message: 'Este token não está vinculado a uma organização que você possa gerenciar'
      },
      monthlyCapExceeded: {
        title: 'Limite mensal de gastos atingido',
        messageReached: '🔴 Limite mensal de gastos atingido.',
        messageHeadroom: remaining => `🔴 Limite mensal de gastos atingido — margem restante de US$ ${remaining}.`
      },
      rateLimited: {
        title: 'Muitas cobranças no momento',
        message: mins =>
          mins > 0
            ? `🟡 Muitas cobranças no momento (tente novamente em ~${mins} min). Isto não é uma falha de pagamento.`
            : '🟡 Muitas cobranças no momento. Isto não é uma falha de pagamento.'
      },
      stripeUnavailable: {
        title: 'A Stripe está com problemas',
        message: mins =>
          mins > 0
            ? `A Stripe está com problemas — tente novamente em ~${mins} min`
            : 'A Stripe está com problemas — tente novamente em instantes'
      },
      upgradeCapExceeded: {
        title: 'Limite diário de alterações de plano atingido',
        message: 'Limite diário de alterações de plano atingido — tente novamente amanhã'
      },
      endpointUnavailable: {
        title: 'Endpoint de cobrança indisponível',
        message:
          'O endpoint de cobrança retornou uma resposta que não é JSON (ele pode não estar disponível nesta instalação).'
      },
      timeout: {
        title: 'A solicitação de cobrança excedeu o tempo limite',
        message: 'A solicitação de cobrança excedeu o tempo limite.'
      },
      transport: {
        title: 'Falha na conexão de cobrança',
        message: 'A solicitação de cobrança falhou antes de chegar ao gateway.'
      },
      default: {
        title: 'Falha na solicitação de cobrança',
        message: 'Falha na solicitação de cobrança.'
      }
    }
  }
} satisfies NonNullable<TranslationOverrides['settings']>
