# Outcome as a Service (OaaS): Arquitetura de Referência FullAgenticStack

**Status:** proposta de formalização arquitetural  
**Versão:** 0.1.0  
**Data:** 2026-10-16  
**Escopo:** AllasCode, AllasCode-Blueprint, runtime em Zig e soluções Outcome as a Service  
**Natureza:** documento de arquitetura; detalhes de implementação devem ser confirmados contra o código e os contratos versionados.

## Resumo

Outcome as a Service (OaaS) entrega resultados de negócio verificáveis, e não apenas funcionalidades, endpoints ou acesso a um modelo de IA. A arquitetura combina FullAgenticStack como paradigma de execução, Trajectory-Driven Development (T-DD) como método de especificação e conformidade, AllasCode como sistema de contratos e composição, e um runtime em Zig como plano de execução de atores, ações, mensagens e capacidades.

A intenção humana é interpretada e refinada em comportamento, contratos, estado, autoridade, capacidades e trajetória. A execução produz evidências que são comparadas com o destino acordado. Agentes podem operar de forma reativa ou proativa, mas não recebem autoridade irrestrita: políticas, contratos, validações e limites de risco governam as ações. Os mecanismos de transporte são intercambiáveis e não devem definir a semântica de negócio.

A arquitetura busca manter estáveis os contratos observáveis enquanto permite substituir implementações, modelos, canais, armazenamento e infraestrutura. “Imutável por contrato” significa preservar as garantias declaradas, não congelar o código nem prometer determinismo onde existam dependências externas.

## 1. Vocabulário normativo

Os termos **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** e **MAY** expressam, respectivamente, requisito obrigatório, proibição, recomendação, recomendação negativa e opção.

- **Outcome / Destiny:** condições de negócio que precisam ser verdadeiras ao final.
- **Intent:** objetivo semântico solicitado ou inferido com incerteza explícita.
- **Behavior:** comportamento necessário para alcançar o destino.
- **Trajectory:** sequência ou grafo de transições, decisões, ações e evidências que liga intenção e destino.
- **Evidence:** observações verificáveis de que uma condição ou transição ocorreu.
- **Contract:** precondições, pós-condições, invariantes, limites, versões e erros permitidos.
- **Actor:** unidade responsável por uma responsabilidade delimitada e identificável.
- **Agent:** ator que usa raciocínio, políticas e/ou modelos para selecionar ações; não é automaticamente autoridade para executá-las.
- **Atomic Action / AtomicSkill:** capacidade pequena, tipada, delimitada e verificável.
- **Runtime:** mecanismo que valida, agenda e executa atores, ações, mensagens e trajetórias.
- **OaaS:** serviço cujo critério de entrega é a aceitação de um resultado acordado, sustentado por evidências.

## 2. Princípios arquiteturais

1. **Outcome-first:** o contrato começa pelo resultado de negócio, critérios de aceitação e evidências, não pela tela ou endpoint.
2. **Intent-to-execution:** toda capacidade de negócio exposta deve possuir uma representação de intenção e um caminho de execução autorizado.
3. **Trajectory as specification:** a trajetória declarada é a referência para execução, teste, observabilidade e auditoria.
4. **Contract-preserving evolution:** implementações podem mudar desde que continuem conformes aos contratos compatíveis.
5. **Agents as actors, not root authority:** agentes propõem e coordenam ações; políticas determinísticas e verificações de autorização limitam efeitos.
6. **Explicit uncertainty:** ambiguidades, confiança insuficiente, evidência ausente ou conflito de contratos resultam em esclarecimento, bloqueio ou encaminhamento humano, não em sucesso presumido.
7. **Proactive by construction:** o sistema pode antecipar riscos e preparar trabalho com base em estado e eventos; iniciar comunicação ou efeitos externos depende de preferências, políticas, orçamento e autorização.
8. **Transport independence:** a intenção declara o que precisa ocorrer; bindings selecionam os canais disponíveis sem alterar a semântica.
9. **Data minimization and zero trust:** cada ator recebe apenas dados e capacidades necessários. Nenhum processo, modelo, canal ou hardware é confiável por padrão.
10. **Evidence before acceptance:** uma resposta do modelo ou um status interno não prova, por si só, que o resultado de negócio foi realizado.

## 3. Modelo formal T-DD para OaaS

Uma especificação pode ser modelada como:

`Σ = ⟨D, I, B, E, C, S, A, K, T, X⟩`

onde:

- `D`: destino de negócio (Destiny/Outcome);
- `I`: intenção;
- `B`: comportamentos necessários;
- `E`: evidências requeridas;
- `C`: contratos e invariantes;
- `S`: estados e transições legais;
- `A`: atores e suas autoridades;
- `K`: capacidades/skills executáveis;
- `T`: trajetória;
- `X`: exclusões e comportamentos proibidos.

A cadeia de refinamento é:

`Implementation ⊨ Trajectory ⊨ Behavior ⊨ Intent ⊨ Destiny`

O símbolo `⊨` representa conformidade com as condições formalizadas; não implica que a intenção humana, por si só, seja matematicamente completa. A intenção precisa ser operacionalizada e validada antes da execução.

O ciclo de desenvolvimento e operação é:

`DESTINY → INTENT → BEHAVIOR → EVIDENCE → CONTRACT → STATE → ACTOR → SKILL → TRAJECTORY → DSL → IMPLEMENTATION → OBSERVATION → CONFORMANCE`

A observação realimenta a manutenção da especificação, as correções e o planejamento futuro. Refinamentos não podem remover silenciosamente garantias já aceitas: uma mudança incompatível requer nova versão de contrato e política explícita de migração.

### Critério de aceitação OaaS

Um outcome só é aceito quando:
1. os critérios terminais declarados são satisfeitos;
2. as evidências obrigatórias foram obtidas de fontes autorizadas;
3. invariantes e exclusões não foram violados;
4. efeitos colaterais estão reconciliados ou explicitamente pendentes;
5. o nível de confiança e a política de risco permitem aceitação;
6. o resultado é apresentado com proveniência suficiente para auditoria.

“Solicitação processada”, “agente respondeu” e “workflow terminou” não são equivalentes a “outcome alcançado”.

## 4. Visão lógica do sistema

```text
Pessoa / Sistema externo
        |
        v
Canais (chat, web, áudio, API, eventos)
        |
        v
Intent Gateway
  - normalização multimodal
  - classificação: ação, pergunta, esclarecimento
  - extração de contexto e incerteza
        |
        v
Trajectory / Policy Orchestrator
  - valida intenção e contrato
  - resolve comportamento e dependências
  - consulta políticas, orçamento e permissões
        |
        v
Zig Runtime
  - atores e sessões isolados
  - mailbox / dispatch / scheduler
  - execução de ações atômicas
  - limites, timeout, cancelamento e backpressure
        |
        +------> adaptadores de transporte
        |        HTTP/3, QUIC, SSE, WS, gRPC, stdio, queues
        |
        +------> agentes e capacidades de domínio
        |
        v
Autoridades de dados / serviços
  - persistência autoritativa
  - validação de domínio
  - efeitos externos idempotentes quando possível
        |
        v
Evidence, provenance, telemetry and audit
        |
        v
Outcome evaluator / acceptance
        |
        +----> resposta, confirmação ou pergunta
        +----> replanejamento / recuperação
        +----> aprovação humana quando exigida
```

Este desenho é uma separação lógica de responsabilidades, não uma afirmação de que todos os componentes já estejam implementados em cada repositório.

## 5. Responsabilidades por camada

### 5.1 Interface e Intent Gateway

O gateway recebe linguagem natural, arquivos e sinais de canais suportados. Deve distinguir pelo menos:
- intenção de executar uma ação;
- pergunta informacional;
- pedido de esclarecimento;
- resposta a uma pergunta pendente;
- cancelamento ou alteração de uma execução em curso.

A classificação é uma hipótese tipada, não autorização. Antes de executar uma ação mutável, o sistema valida o payload, o ator, o contexto, a política e o contrato. Transcrição de áudio ou presença em um canal não constituem prova de identidade.

### 5.2 Trajectory / Policy Orchestrator

Transforma intenção validada em plano de comportamento. Resolve pré-condições, dependências, alternativas, evidências, exclusões, limites de custo e pontos de aprovação. O plano pode ser recalculado, mas cada transição precisa manter rastreabilidade com a especificação e a versão de contrato.

Perguntas e tarefas ambíguas devem gerar uma pergunta contextual, não uma execução especulativa. Quando evidências contradizem o plano ou o estado mudou, o orquestrador pausa, revalida ou replaneja.

### 5.3 AllasCode e Blueprint

AllasCode é o espaço de definição e composição das capacidades, contratos, comportamentos e mecanismos comuns usados pelas soluções. AllasCode-Blueprint documenta e materializa padrões de referência para novas soluções. O blueprint deve apontar para contratos canônicos versionados, exemplos válidos, testes de conformidade e decisões arquiteturais.

Os arquivos semânticos (por exemplo, `.yml`, `.json`, `.semantic.md`, `.implementation.md` ou DSL equivalente) devem permitir rastrear a intenção até a ação executável. O formato específico e os campos obrigatórios são definidos pelo schema canônico do repositório, não por este documento.

### 5.4 Runtime em Zig

O runtime em Zig é o plano de execução de baixo nível: alocação e ciclo de vida de atores, roteamento de mensagens, agendamento, limites de concorrência, isolamento de sessão, cancelamento e adaptação a transportes. Zig oferece controle explícito sobre memória e representação, mas não torna automaticamente o sistema seguro; invariantes de memória, parsing, concorrência e ciclo de vida precisam de testes e revisão.

Diretrizes de runtime:
- cada mensagem possui envelope tipado com identidade, correlação, versão, origem, destino, contexto de autorização e metadados de deadline;
- validar tamanho, schema, versão, permissões e limites antes de enfileirar ou executar;
- mailboxes têm capacidade finita e política explícita de overflow/backpressure;
- timeouts, retries e deduplicação são políticas declaradas por operação;
- ações mutáveis usam idempotency key quando o serviço de destino oferece suporte;
- sessões e memórias de agentes são separadas por identidade e domínio de autorização;
- falhas não devem produzir ACK de sucesso antes da persistência autoritativa;
- a ordem observável de eventos deve ser especificada por chave/partição quando necessária; não presumir ordenação global;
- escala e clonagem de atores devem preservar identidade lógica, idempotência, roteamento e ownership;
- transporte é adaptador: trocar QUIC por NATS ou outro canal não pode alterar o contrato semântico.

Uma política de escalabilidade baseada em pressão de mailbox pode usar limiares configuráveis (por exemplo, iniciar mitigação perto de 90% da capacidade), mas esses valores são parâmetros operacionais a medir, não constantes universais. Clonar um ator exige definir quem recebe novos eventos, como sessões em andamento são mantidas e como se evitam processamento duplicado e perda de ordem.

### 5.5 Autoridade de dados

O armazenamento autoritativo valida e persiste mudanças de domínio. Agentes não devem contornar a autoridade do domínio escrevendo diretamente em projeções ou caches. Eventos e projeções derivadas são publicados após a mutação autoritativa, idealmente por outbox/CDC ou mecanismo equivalente que evite divergência entre commit e publicação.

Projeções podem ser reconstruídas. Evidências de execução devem preservar origem, instante, versão semântica, correlação e status de validação, sem copiar dados pessoais desnecessários.

## 6. OpenIntent: contrato semântico e bindings de transporte

O OpenIntent Protocol (OIP), enquanto especificação em evolução, é tratado aqui como a fronteira declarativa entre intenção, capacidade, contrato e comunicação. A forma exata do protocolo deve acompanhar sua especificação canônica e versão implementada.

Um contrato de intenção deve definir, no mínimo:
- identificador e versão;
- capacidade requerida;
- schema de entrada e saída;
- precondições, pós-condições e erros;
- padrão de interação (request/response, stream, event ou pub/sub);
- deadline, idempotência e política de retry;
- autenticação, autorização e classificação de dados;
- política de evidência e aceitação;
- bindings de transporte permitidos.

O canal pode selecionar QUIC/HTTP/3, SSE, WebSocket, gRPC, stdio ou filas conforme suporte e configuração. O contrato semântico não deve embutir pressupostos exclusivos de um transporte. Um evento publicado em múltiplos canais deve possuir identidade estável e política explícita de deduplicação.

## 7. Proatividade por construção

O sistema não precisa esperar uma nova mensagem humana para detectar riscos ou preparar trabalho. Pode observar eventos autorizados, estado de domínio e tendências para:
- antecipar atrasos, faltas de estoque ou falhas;
- preparar análises e respostas;
- sugerir ações antes de um limiar crítico;
- consolidar conhecimento durante períodos ociosos;
- pedir confirmação quando a decisão ultrapassar a autoridade delegada.

A proatividade tem níveis distintos: **observar**, **preparar**, **recomendar**, **solicitar confirmação** e **executar**. Cada nível exige política e evidência adequadas. A preferência do usuário por silêncio, o custo estimado, a sensibilidade dos dados e o risco da ação devem influenciar a decisão. A arquitetura não deve transformar previsão em fato nem enviar mensagens não solicitadas quando a política do canal proíbe isso.

## 8. Intent-as-a-Tool e contenção preventiva

Intent-as-a-Tool introduz sinais explícitos de intenção comportamental como ponto de controle anterior à ação final. O runtime pode tratar esse sinal como evento de política: registrar, avaliar risco, interromper a trajetória, pedir justificativa estruturada, encaminhar para revisão ou redirecionar para uma alternativa segura.

O sinal não prova acesso ao raciocínio privado nem substitui controles externos. O agente pode omitir, classificar incorretamente ou emitir sinal falso. Por isso, a decisão final deve combinar intenção declarada, contexto, permissões, validação da ação, limites de ferramenta e observações independentes. Ferramentas de intenção não devem conceder autorização por si próprias.

## 9. eXtreme Zero Trust e segurança

A confiança é verificada em cada fronteira: usuário, sessão, agente, ferramenta, transporte, serviço e armazenamento. A proteção do hardware, TLS ou criptografia em repouso não corrige um contrato permissivo, uma autorização incorreta ou uma falha de memória.

Controles mínimos:
- autenticação forte e identidade de workload;
- autorização por capacidade e menor privilégio;
- validação estrita de entrada/saída e limites de tamanho;
- isolamento de memória/sessão e separação de tenants;
- criptografia em trânsito e repouso com gestão de chaves;
- rotação, revogação e expiração de credenciais;
- proteção contra replay, confused deputy, prompt injection e exfiltração por ferramentas;
- redaction de PII e segredos em logs, traces e telemetria;
- trilhas de auditoria com acesso restrito;
- políticas de retenção e exclusão de dados;
- revisão de dependências, fuzzing e testes de segurança do runtime.

A computação confidencial/TEE pode reduzir a exposição de dados em uso em cenários específicos, mas depende do modelo de ameaça, atestação, firmware, microcódigo e código executado no enclave. Deve ser uma camada adicional, nunca a única fronteira de confiança.

## 10. Observabilidade, proveniência e evidência

Cada trajetória deve ter um identificador de correlação e registrar eventos de ciclo de vida, sem registrar indiscriminadamente prompts, dados pessoais ou segredos. Uma evidência útil inclui:
- qual contrato e versão foram aplicados;
- qual ator/capacidade produziu a observação;
- qual estado anterior e posterior foi validado;
- timestamp e origem confiável;
- decisão de política relevante e sua versão;
- status: observado, validado, rejeitado, pendente ou contraditório.

Logs técnicos, evidências de negócio e auditoria de segurança são categorias diferentes e podem ter políticas de retenção diferentes. Métricas recomendadas: taxa de aceitação de outcomes, trajetórias replanejadas, falhas de contrato, duplicatas, latência por etapa, custo por outcome aceito, intervenções humanas, violações bloqueadas e divergência entre estado previsto e observado.

## 11. Autocura e evolução controlada

Autocura deve seguir um ciclo limitado:
1. detectar uma falha a partir de evidência;
2. classificar impacto e risco;
3. identificar hipóteses de causa;
4. selecionar uma recuperação permitida (retry, replay, rollback, reinício, correção);
5. executar dentro de limites de autorização;
6. validar contratos e regressões;
7. registrar o resultado e atualizar o conhecimento quando apropriado.

Correções de código geradas por agentes não devem ir diretamente para produção apenas porque um teste isolado passou. Exigir CI, testes de contrato, testes de segurança, análise de impacto, revisão/aprovação conforme o risco e mecanismo de rollback. A arquitetura aprende com incidentes, mas não deve alterar automaticamente os próprios invariantes fundamentais.

## 12. Testes e conformidade

Cada capacidade deve ter testes que cubram:
- schemas válidos e inválidos;
- precondições, pós-condições e invariantes;
- trajetória esperada e caminhos de erro;
- idempotência, timeout, cancelamento e retry;
- duplicação, reordenação e perda de mensagens;
- autorização e isolamento entre tenants;
- limites de memória, filas e concorrência;
- falha parcial de dependências;
- equivalência semântica entre transportes suportados;
- evidência e critério de aceitação do outcome.

A conformidade deve ser testada em três níveis:
1. **Unitário:** atomic actions e validadores.
2. **Contrato/integração:** atores, armazenamento e transportes.
3. **Trajetória/outcome:** cenário ponta a ponta, incluindo evidências e efeitos externos.

Benchmarks devem separar throughput, latência p50/p95/p99, memória, CPU, custo de modelo, tamanho de mensagens e comportamento sob backpressure. Resultados devem ser reproduzíveis e não devem ser generalizados para ambientes diferentes sem qualificação.

## 13. Exemplo de trajetória OaaS

**Outcome:** uma solicitação comercial válida resulta em pedido confirmado e estoque reservado, sem cobrança duplicada.

1. O usuário expressa a intenção em um canal permitido.
2. O gateway classifica a mensagem como ação e coleta campos ausentes por perguntas.
3. O contrato valida identidade, autorização, cliente, itens, preço e limites.
4. O orquestrador declara as transições e evidências necessárias.
5. Uma capacidade verifica disponibilidade no sistema autoritativo.
6. A ação de reserva usa uma chave de idempotência.
7. A autoridade de domínio persiste o pedido/reserva e publica o evento correspondente.
8. A projeção e a evidência são reconciliadas com o commit autoritativo.
9. O avaliador verifica os critérios terminais.
10. O canal confirma somente o estado realmente observado; se a reserva estiver pendente, comunica o estado pendente e não sucesso.

**Exclusões:** não cobrar sem autorização; não declarar reserva sem confirmação autoritativa; não repetir efeitos não idempotentes sem reconciliação; não expor dados de outro tenant.

## 14. Modelo comercial: Outcome as a Service

OaaS define a oferta comercial pelo resultado e seus critérios de aceitação. Cada oferta deve especificar:
- problema e público-alvo;
- outcome prometido e limites explícitos;
- dados e integrações necessários;
- evidências usadas para aceitar o resultado;
- condições de dependência do cliente/terceiros;
- orçamento, limites de uso e custos variáveis;
- exceções, riscos e caminho de intervenção humana;
- métrica de sucesso e processo de contestação;
- tratamento de dados e retenção.

A cobrança pode ser por outcome aceito, assinatura, volume ou combinação. A métrica comercial não deve incentivar o sistema a declarar sucesso prematuramente. Outcomes dependentes de terceiros precisam distinguir trabalho executado de resultado externo confirmado.

## 15. Mapeamento dos conceitos-fonte

- [Trajectory-Driven Development (T-DD)](https://dev.to/fullagenticstack/trajectory-driven-development-t-dd-desenvolvimento-orientado-por-trajetorias-semanticas-de-4k35): formalização de destino, intenção, comportamento, evidência, contrato e trajetória.
- [Arquitetura evolutiva, autônoma e imutável por contrato](https://dev.to/fullagenticstack/a-arquitetura-do-futuro-evolutiva-autonoma-orientada-a-intencoes-e-imutavel-por-contrato-1kg1): extensão por composição, preservação de garantias e evolução baseada em evidências.
- [Proactive by Construction](https://dev.to/fullagenticstack/proactive-by-construction-why-the-next-generation-of-agents-must-anticipate-not-just-react-1m58): operação state-driven, preparação antecipada e políticas de comunicação.
- [FullAgenticStack](https://dev.to/fullagenticstack/fullagenticstack-um-paradigma-de-arquitetura-de-software-para-sistemas-totalmente-agenticos-57lo): agência como primitiva distribuída pela stack.
- [Intent-as-a-Tool](https://dev.to/fullagenticstack/intent-as-a-tool-uma-forma-mais-inteligente-de-detectar-quando-um-agente-de-ia-comeca-a-seguir-o-4iee): sinalização preventiva de intenções comportamentais.
- [OpenIntent Protocol](https://dev.to/fullagenticstack/openintent-protocol-um-protocolo-declarativo-para-comunicacao-entre-agentes-baseada-em-intencoes-f2o): declaração semântica e desacoplamento dos bindings de transporte.
- [eXtreme Zero Trust](https://dev.to/fullagenticstack/extreme-zero-trust-por-que-o-hardware-mais-seguro-do-mundo-nao-consegue-proteger-dados-mal-escritos-3jj): segurança do software e dos dados além da confiança no hardware.
- [suissa/AllasCode](https://github.com/suissa/AllasCode): implementação e contratos canônicos.
- [suissa/AllasCode-Blueprint](https://github.com/suissa/AllasCode-Blueprint): padrões de referência para novas soluções.

## 16. Decisões que devem permanecer explícitas

Este documento não fixa prematuramente:
- API pública exata do runtime Zig;
- formato definitivo do OpenIntent Protocol;
- garantias globais de ordenação;
- política universal de clonagem e migração de atores;
- valores universais de capacidade, timeout ou escala;
- armazenamento único para todos os domínios;
- determinismo para operações que dependem de estado externo;
- autonomia irrestrita para mudanças de código ou efeitos irreversíveis.

Esses pontos devem ser definidos por ADRs, schemas e testes versionados nos repositórios. Onde a implementação atual divergir deste documento, a divergência deve ser registrada como gap, não descrita como funcionalidade concluída.

## 17. Critérios de maturidade arquitetural

Uma solução pode ser considerada conforme à referência OaaS quando:
- cada oferta possui outcome e evidências de aceitação explícitos;
- intenções mutáveis são validadas por contratos e políticas;
- ações são executadas por capacidades delimitadas;
- trajetórias são observáveis e comparáveis com a especificação;
- falhas e estados pendentes não são apresentados como sucesso;
- o runtime aplica limites de recursos e isolamento;
- os transportes podem ser substituídos sem alterar semântica de domínio;
- há evidência de testes de contrato, trajetória, segurança e recuperação;
- custos e dependências externas são medidos por outcome;
- mudanças incompatíveis possuem versionamento e migração explícitos.

---

**Síntese:** OaaS define o resultado aceito; T-DD especifica a trajetória verificável; FullAgenticStack distribui a agência pela stack; AllasCode formaliza contratos e capacidades; o runtime em Zig executa atores e ações sob limites; OpenIntent desacopla intenção de transporte; Proactive by Construction antecipa trabalho; Intent-as-a-Tool fornece um ponto de controle preventivo; eXtreme Zero Trust restringe a confiança a cada fronteira. A evidência de execução conecta todos esses elementos ao outcome realmente entregue.
