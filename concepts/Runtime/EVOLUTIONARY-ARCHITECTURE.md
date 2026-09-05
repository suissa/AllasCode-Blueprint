# Evolutionary Architecture in the AllasCode Runtime

## Formalização técnica dos conceitos de *Building Evolutionary Architectures* aplicados ao AllasCode

## 1. Objetivo

O AllasCode adota como princípio que a arquitetura deve ser capaz de evoluir continuamente sem exigir que cada aplicação reconstruída sobre o Runtime carregue a complexidade dessa evolução.

A definição-base adotada é a de arquitetura evolucionária como arquitetura capaz de suportar mudança guiada, incremental e multidimensional.

No AllasCode, essa definição é estendida:

> Uma arquitetura evolucionária é aquela em que mudanças semânticas e físicas podem ser introduzidas incrementalmente, avaliadas por fitness functions, admitidas ou rejeitadas pelo Runtime e aplicadas sem permitir que a complexidade da evolução emerja para o domínio.

Formalmente:

\[
Evolution = GuidedChange + IncrementalChange + MultiDimensionalChange
\]

com a restrição:

\[
Evolution \nRightarrow ComplexityLeakage
\]

Esta propriedade complementa o **Runtime Complexity Containment Principle — RCCP** definido em `COMPLEXITY-CONTAINMENT.md`.

---

## 2. Princípio de mudança guiada

Mudança arquitetural não deve ocorrer apenas porque uma implementação nova parece melhor.

Toda mudança deve possuir um objetivo mensurável.

Definimos:

\[
ChangeCandidate = (Current, Proposed, Objectives)
\]

A mudança só é admissível quando o estado proposto satisfaz as características arquiteturais protegidas.

\[
Admit(Proposed) \iff \forall f \in F_{required},\ f(Proposed)=Pass
\]

onde \(F_{required}\) é o conjunto de fitness functions obrigatórias para aquela dimensão da arquitetura.

### Implementação no AllasCode

O Runtime deve manter um **Architecture Fitness Registry** contendo as propriedades protegidas e os mecanismos usados para verificá-las.

Exemplo conceitual:

```yaml
fitness:
  - id: runtime.domain-complexity-leakage
    dimension: architecture
    scope: holistic
    cadence: continual
    required: true

  - id: dataplane.projection-lag
    dimension: data
    scope: projection
    cadence: continual
    required: true

  - id: action.memory-budget
    dimension: runtime
    scope: atomic
    cadence: triggered
    required: true
```

A mudança deixa de ser uma decisão puramente narrativa e passa a ser uma hipótese executável.

---

## 3. Fitness Functions como primeira classe arquitetural

Uma fitness function é uma avaliação objetiva de uma ou mais características arquiteturais.

No AllasCode:

\[
FitnessFunction : ArchitectureState \rightarrow Evidence
\]

A evidência pode ser usada para decidir:

```text
accept
reject
warn
quarantine
rollback
observe
```

### 3.1 Tipos de fitness function

O Runtime deve suportar as categorias descritas no livro, traduzidas para mecanismos concretos.

#### Atomic vs Holistic

**Atomic** avalia um componente isolado.

Exemplos:

```text
Action execution memory
Action latency
Action dependency count
Schema compatibility
Adapter conformance
```

**Holistic** avalia a arquitetura inteira ou uma região ampla.

Exemplos:

```text
end-to-end latency
cross-plane coupling
availability
semantic leakage
system recovery time
projection convergence
```

Formalmente:

\[
F_{atomic}(x)
\]

versus:

\[
F_{holistic}(System)
\]

#### Triggered vs Continual vs Temporal

**Triggered** roda em resposta a um evento:

```text
commit
PR
new Action
new Adapter
new schema
new Flow
```

**Continual** é avaliada durante execução:

```text
latency
queue depth
healing rate
error rate
resource pressure
projection lag
```

**Temporal** verifica uma propriedade ao longo de um intervalo:

```text
p99 latency <= threshold for 30 minutes
recovery success >= target over 24 hours
no architectural leakage in last N releases
```

#### Static vs Dynamic

**Static** inspeciona artefatos sem executar o sistema.

Exemplos:

```text
import graph
forbidden dependency
manifest validation
schema compatibility
Action purity constraints
```

**Dynamic** exige execução real.

Exemplos:

```text
benchmark
chaos test
load test
recovery test
projection convergence test
```

#### Automated vs Manual

O AllasCode deve preferir fitness functions automatizadas.

Uma verificação manual só é aceitável quando não existe mecanismo suficientemente confiável de automação.

\[
Prefer(Automated) > Prefer(Manual)
\]

#### Intentional vs Emergent

**Intentional** é definida antes da mudança para proteger uma propriedade conhecida.

**Emergent** nasce após observar um novo comportamento ou falha.

No AllasCode, uma falha arquitetural relevante deve poder produzir uma nova fitness function.

```text
Runtime anomaly
    ↓
Evidence
    ↓
Architecture analysis
    ↓
New invariant / fitness function
    ↓
Future automatic protection
```

Isso transforma incidentes em novas restrições permanentes.

---

## 4. Outcomes sobre implementações

Fitness functions devem proteger resultados arquiteturais, não tecnologias específicas, salvo quando a tecnologia for parte explícita da decisão.

Ruim:

```text
must use Redis
```

Melhor:

```text
cache p95 latency < X
cache failure must not break correctness
cache must support required eviction semantics
```

Formalmente:

\[
Protect(Outcome) > Protect(Implementation)
\]

Isso é essencial para o Runtime conseguir trocar tecnologias internamente.

Exemplo:

```text
Redis
    ↓ replacement candidate
Dragonfly
    ↓
fitness validation
    ↓
accepted if semantic + operational requirements hold
```

O domínio permanece inalterado.

---

## 5. Mudança incremental

Grandes mudanças arquiteturais aumentam blast radius, incerteza e dificuldade de rollback.

Portanto o Runtime deve preferir sequências de pequenas mudanças verificáveis.

Se:

\[
M = \{m_1,m_2,\dots,m_n\}
\]

então cada passo deve manter a arquitetura em estado admissível:

\[
\forall i,\ State_i \models Invariants
\]

Não basta que apenas o estado final seja correto.

### Implementação

Toda migração estrutural deve ser transformada em uma sequência de transições.

Exemplo:

```text
Postgres-only projection
    ↓
introduce ProjectionAdapter interface
    ↓
dual-compatible implementation
    ↓
create specialized projection engine
    ↓
shadow materialization
    ↓
compare outputs
    ↓
read canary
    ↓
progressive migration
    ↓
remove old physical path
```

Cada estágio possui fitness functions próprias.

---

## 6. Deployment Pipeline como Architectural Admission Pipeline

No livro, deployment pipelines são o principal mecanismo para aplicar fitness functions de forma automatizada.

No AllasCode, o conceito deve ser ampliado para um **Architectural Admission Pipeline**.

```text
Candidate Change
      ↓
Static Structural Checks
      ↓
Semantic Validation
      ↓
Type Proof / Schema Checks
      ↓
Unit Fitness Functions
      ↓
Integration Fitness Functions
      ↓
Benchmarks
      ↓
Security Checks
      ↓
Sandbox Runtime
      ↓
Canary / Shadow
      ↓
Continual Runtime Fitness
      ↓
Admission
```

A mesma lógica deve se aplicar a:

- Actions;
- Agents;
- Actors;
- Flows;
- Adapters;
- data models;
- runtime strategies;
- protocols;
- storage engines;
- generated code;
- LLM-generated changes.

---

## 7. Automated Architectural Governance

Governança arquitetural não deve depender de revisão humana repetitiva.

Se uma regra pode ser formalizada, ela deve ser executada automaticamente.

\[
GovernanceRule \rightarrow ExecutableConstraint
\]

### Exemplos no AllasCode

```text
Action cannot import broker client
Action cannot depend on physical database driver
Intent cannot reference network address
Domain cannot reference runtime topology
Healing graph must be finite
Every Action must have a micro-skill
Every Action must emit nominal Ok/Error
Every Adapter must satisfy canonical interface
```

Essas regras devem ser verificadas antes da admissão.

### Architectural Policy as Code

Exemplo conceitual:

```yaml
rule:
  id: runtime.no-transport-leakage
  applies_to:
    - action
    - agent
    - intent
  forbid_dependencies:
    - kafka
    - nats
    - rabbitmq
  severity: reject
```

O objetivo é substituir:

```text
architecture guideline document
```

por:

```text
architecture executable constraint
```

---

## 8. Coupling apropriado

Arquitetura evolucionária não exige ausência de coupling.

Exige **coupling apropriado**.

O problema não é:

\[
Coupling > 0
\]

mas:

\[
UnnecessaryCoupling > 0
\]

No AllasCode devemos distinguir pelo menos:

```text
semantic coupling
static coupling
dynamic coupling
data coupling
operational coupling
temporal coupling
transport coupling
```

### Regra

Coupling necessário à semântica pode permanecer acima da Runtime Boundary.

Coupling de mecanismo deve permanecer abaixo dela.

\[
SemanticCoupling \rightarrow Domain
\]

\[
MechanismCoupling \rightarrow Runtime
\]

### Fitness functions

Podemos medir:

\[
CouplingScore = w_sS+w_dD+w_oO+w_tT
\]

onde cada componente representa uma dimensão de coupling.

O objetivo não é minimizar cegamente o valor, mas impedir crescimento não justificado.

---

## 9. Connascence

Connascence descreve o grau em que elementos precisam conhecer ou mudar em conjunto.

O AllasCode deve reduzir connascence física e preservar apenas connascence semântica inevitável.

Exemplo ruim:

```text
Action A must know Kafka topic name used by Action B
```

Exemplo desejado:

```text
Action A emits SemanticEvent<T>
Runtime resolves physical route
```

Assim:

\[
Connascence_{physical}\rightarrow0
\]

sem obrigatoriamente eliminar:

\[
Connascence_{semantic}
\]

---

## 10. Architectural Quantum

Um architectural quantum representa uma unidade arquitetural que possui alta coesão funcional e coupling estático suficiente para ser tratada como unidade evolutiva/deployável.

No AllasCode, não devemos mapear automaticamente quantum para microservice.

A unidade mais natural pode ser formada por:

```text
Intent
+ Agent
+ required Actors
+ Atomic Actions
+ semantic contracts
+ required projections
```

ou por subconjuntos dessa composição, dependendo da independência de deployment e coupling.

Definimos:

\[
Q = (B,C,D,O)
\]

onde:

- \(B\) = behaviors;
- \(C\) = contracts;
- \(D\) = required data boundaries;
- \(O\) = operational dependencies.

### Runtime Quantum Resolution

O Runtime pode calcular candidatos a quanta com base no grafo real de dependências.

```text
semantic graph
+ static dependency graph
+ runtime call graph
+ data dependency graph
    ↓
quantum analyzer
    ↓
candidate execution/deployment boundaries
```

Isso permite que a fronteira física seja derivada em vez de fixada prematuramente.

---

## 11. Granularidade evolucionária

Quanto maior o quantum, maior o blast radius de uma mudança.

Quanto menor, maior o custo de coordenação.

\[
QuantumSize\uparrow \Rightarrow CoordinationCost\downarrow, ChangeBlastRadius\uparrow
\]

\[
QuantumSize\downarrow \Rightarrow CoordinationCost\uparrow, ChangeIsolation\uparrow
\]

O AllasCode Runtime já absorve parte substancial do coordination cost, portanto consegue operar com granularidade menor sem expor esse custo ao domínio.

Isto é uma vantagem direta da arquitetura Agent → Actor → Atomic Action.

---

## 12. Independent Deployability

Uma unidade é realmente evolucionária quando pode mudar sem exigir deployment coordenado de todo o sistema.

Definimos:

\[
IndependentDeployability(q)
\]

como a capacidade de alterar \(q\) mantendo contratos externos compatíveis.

### Implementação

- contracts versionados;
- adapters compatíveis;
- nominal types;
- schema compatibility checks;
- shadow execution;
- canary rollout;
- event compatibility;
- migration stages.

O Runtime deve rejeitar mudança que exija coordinated deployment oculto não declarado.

---

## 13. High Functional Cohesion

Quanta evolutivos devem agrupar comportamento que muda pelas mesmas razões.

No AllasCode, Intent é uma forte fronteira semântica para medir coesão.

Podemos definir:

\[
Cohesion(q)=\frac{InternalSemanticRelations}{AllSemanticRelations}
\]

Um quantum com baixa coesão deve ser candidato a divisão.

---

## 14. Reuse: abstração + baixa volatilidade

Reutilização aumenta coupling.

Portanto não devemos reutilizar apenas porque dois componentes têm código semelhante.

Uma abstração reutilizada deve possuir:

1. semântica comum real;
2. baixa volatilidade;
3. contrato estável;
4. benefício maior que o coupling introduzido.

Formalmente:

\[
ReuseValue = AbstractionQuality \times Stability - CouplingCost
\]

Isso é especialmente importante para Atomic Actions e micro-skills.

Duas Actions visualmente semelhantes não devem ser unificadas se pertencem a semânticas diferentes e tendem a evoluir de forma independente.

---

## 15. Orthogonal Operational Coupling

Sidecars, service meshes e mecanismos similares são úteis porque removem coupling operacional do código de domínio.

O AllasCode leva essa ideia além ao colocar essas responsabilidades diretamente abaixo da Runtime Boundary.

Exemplos:

```text
security
telemetry
routing
retry
settlement
serialization
transport
backpressure
```

A implementação é ortogonal ao comportamento de domínio.

Isso reforça o RCCP:

\[
OperationalConcern \nRightarrow DomainCode
\]

---

## 16. Evolutionary Data

Dados são uma das formas mais fortes de coupling arquitetural.

O Data Plane deve permitir evolução de schemas, projections e motores físicos sem exigir mudanças simultâneas nos consumidores.

### 16.1 Expand / Migrate / Contract

Mudanças incompatíveis devem seguir um padrão incremental.

```text
Expand
    ↓
accept old + new representation
    ↓
Migrate
    ↓
backfill / rematerialize / dual-read validation
    ↓
Contract
    ↓
remove obsolete representation
```

Em nenhum momento o sistema deve entrar deliberadamente em um estado no qual nenhum contrato válido exista.

### 16.2 Event evolution

Eventos persistidos não podem ser tratados como estruturas descartáveis.

O Runtime deve manter:

```text
event schema version
semantic type version
upcaster/downstream compatibility
migration evidence
projection compatibility
```

### 16.3 Projection evolution

Nova projeção deve poder ser criada por replay ou materialização paralela.

```text
source events
    ├─ old projection
    └─ candidate projection
          ↓
      compare semantics
          ↓
      fitness pass
          ↓
      promote
```

### 16.4 Shared database integration

Consumers não devem usar tabelas compartilhadas como API implícita.

\[
PhysicalSchema \neq PublicContract
\]

A integração deve ocorrer por contrato semântico, evento ou projection declarada.

---

## 17. Data entanglement

Quando múltiplas partes do sistema dependem diretamente da mesma estrutura física, a evolução de dados é bloqueada.

Definimos:

\[
DataEntanglement(d)=ConsumersDirectlyCoupledToPhysicalRepresentation(d)
\]

Fitness function:

\[
DataEntanglement \le T
\]

Idealmente, para domínio:

\[
DirectPhysicalDataCoupling=0
\]

---

## 18. Two-phase commit e evolução

Transações distribuídas fortemente acopladas reduzem evolvabilidade.

O AllasCode prefere progressão causal explícita baseada em eventos, settlement e self-healing.

Em vez de exigir:

```text
A + B + C commit atomically
```

preferimos:

```text
A.Ok
 ↓
B.Ok
 ↓
C.Error
 ↓
Healing / compensation / settlement
```

quando a semântica do domínio permite.

Isso reduz coupling temporal e operacional entre quanta.

---

## 19. Age and Quality of Data

Nem todo dado precisa da mesma atualidade.

O Data Plane deve tornar freshness uma propriedade explícita.

```yaml
projection:
  freshness:
    max_lag_ms: 250
```

ou semanticamente:

```text
Fresh
AcceptablyStale
Stale
Pending
Invalid
```

A idade do dado passa a ser parte verificável da arquitetura, não uma suposição oculta.

---

## 20. Last Responsible Moment

Decisões irreversíveis devem ser adiadas até o último momento responsável — não indefinidamente, mas até que haja informação suficiente para escolhê-las melhor.

No AllasCode isso é possível porque Semantic Architecture e Physical Architecture são separadas.

Exemplo:

```text
Domain requirement: graph traversal
```

não precisa imediatamente significar:

```text
Neo4j forever
```

O contrato pode ser definido primeiro e a tecnologia selecionada quando benchmarks e workload reais existirem.

Formalmente:

\[
CommitDecision(t)=min\{t \mid DelayRisk(t) \ge DecisionUncertaintyBenefit(t)\}
\]

---

## 21. Reversibilidade como característica arquitetural

Mudanças reversíveis são mais seguras para evolução.

O Runtime deve favorecer:

```text
adapter boundaries
versioned contracts
shadow execution
canary deployment
feature switches
parallel materialization
replayable events
rollback metadata
```

Definimos:

\[
Reversibility(c) = Cost(reverse(c))
\]

Quanto menor o custo de reversão, maior a liberdade evolutiva.

---

## 22. Prefer Evolvable over Predictable

Não devemos tentar prever todas as necessidades futuras.

Devemos criar mecanismos que permitam responder quando elas aparecerem.

Portanto:

\[
Value(Evolvability) > Value(SpeculativeGeneralization)
\]

O Runtime deve ser extensível por contratos e adapters, sem antecipar todas as tecnologias que existirão.

---

## 23. Remove Needless Variability

Evolução não significa permitir variabilidade em tudo.

Variabilidade não necessária aumenta espaço de estados e custo de testes.

O AllasCode deve padronizar agressivamente aquilo que não precisa ser escolha de domínio.

Exemplos de invariantes que não devem ser configuráveis por Action:

```text
success/error event semantics
self-healing entry mechanism
runtime supervision contract
semantic event identity rules
Action admission rules
```

Apenas dimensões que produzem benefício real devem permanecer configuráveis.

---

## 24. Anticorruption Layers

Dependências externas introduzem semânticas que podem contaminar o modelo interno.

Todo sistema externo relevante deve ser protegido por uma boundary de tradução.

```text
External API
    ↓
Adapter / Anticorruption Layer
    ↓
Canonical Semantic Contract
    ↓
Runtime
```

Assim:

\[
ExternalChange \nRightarrow DomainChange
\]

sempre que o contrato interno puder permanecer estável.

---

## 25. Sacrificial Architecture

Algumas partes da arquitetura podem ser deliberadamente temporárias.

O erro é permitir que uma solução temporária se torne uma dependência sem mecanismo de substituição.

No AllasCode, Junior Mode é um exemplo válido de arquitetura sacrificial controlada em algumas dimensões:

```text
Junior Mode
Postgres + extensions
```

pode ser usado enquanto satisfizer fitness functions.

Quando deixar de satisfazê-las:

```text
fitness degradation
    ↓
polyglot candidate
    ↓
shadow migration
    ↓
validation
    ↓
promotion
```

A transição é prevista pelo contrato, mesmo que o momento exato não seja previsto.

---

## 26. Mitigação de mudança externa

Frameworks, bibliotecas, provedores, bancos e protocolos mudam fora do nosso controle.

Toda dependência externa deve possuir uma avaliação de volatilidade.

\[
ExternalRisk = Volatility \times Coupling \times ReplacementCost
\]

Dependências com alto risco devem possuir boundaries mais fortes.

Exemplo:

```text
Runtime interface
    ↓
Provider Adapter
    ↓
External system
```

Não:

```text
Domain → Provider SDK
```

---

## 27. Versionamento interno de serviços e contratos

Versões devem proteger consumidores sem tornar o domínio consciente da topologia física.

O Runtime deve manter:

```text
semantic contract version
accepted predecessor versions
migration path
compatibility window
deprecation state
```

A resolução física continua interna.

---

## 28. Architect for Testability

Uma arquitetura não é evolutiva se suas características importantes não puderem ser verificadas.

Logo:

\[
Evolvability \Rightarrow Testability
\]

Cada decisão significativa deve responder:

> Como saberemos automaticamente que essa propriedade continua válida depois de uma mudança?

Se não houver resposta, a decisão ainda não está suficientemente formalizada.

---

## 29. Conway's Law

A estrutura organizacional influencia a estrutura do software.

No AllasCode, Agents, Actions e Planes fornecem boundaries explícitas que ajudam a impedir que a organização informal produza coupling arbitrário.

Também podemos usar essa relação de forma inversa:

```text
desired semantic boundaries
    ↓
ownership boundaries
    ↓
team / agent responsibilities
```

Para sistemas onde Agents de IA implementam grande parte do código, a “estrutura da equipe” passa a incluir também distribuição de capabilities e contextos entre Agents.

Logo, Conway's Law deve ser considerada também para **Agent Topology**.

---

## 30. Fitness Function-Driven Architecture

O AllasCode deve evoluir para um modelo no qual decisões físicas podem ser propostas e avaliadas automaticamente.

```text
Requirements
    ↓
Candidate Architecture A
Candidate Architecture B
Candidate Architecture C
    ↓
Fitness Suite
    ↓
Evidence
    ↓
Selection
```

Formalmente:

\[
Architecture^* = argmax_{a \in Candidates} Fitness(a)
\]

sujeito a invariantes obrigatórias:

\[
\forall i \in Invariants,\ i(a)=true
\]

Isso é mais forte que CI tradicional.

É governança arquitetural executável.

---

## 31. Fitness dimensions do AllasCode

O Architecture Fitness Registry deve iniciar pelo menos com estas dimensões:

| Dimensão | Exemplos de métricas |
|---|---|
| Semantic purity | physical dependency leakage, canonical contract violations |
| Runtime containment | complexity leakage ratio, runtime API surface |
| Performance | latency, throughput, allocations, startup time |
| Resilience | recovery success rate, MTTR, healing depth |
| Data | projection lag, convergence, schema compatibility |
| Coupling | static, dynamic, data and operational coupling |
| Security | trust violations, replay resistance, identity validation |
| Evolvability | change blast radius, rollback cost, coordinated deployment count |
| Cost | compute, storage, network and model inference cost |
| Observability | evidence completeness, traceability, telemetry overhead |
| Resource lifecycle | leaks, linear ownership violations, orphan execution state |

---

## 32. Fitness Function Manifest

Proposta de contrato declarativo:

```yaml
id: runtime.complexity-leakage
version: 1

scope:
  type: holistic
  targets:
    - agents
    - actions
    - intents
    - flows

dimension: evolvability

cadence:
  mode: triggered
  on:
    - pull_request
    - runtime_release

execution:
  type: static
  runner: architecture-analyzer

expectation:
  metric: complexity_leakage_ratio
  operator: eq
  value: 0

failure:
  action: reject
```

Outro exemplo contínuo:

```yaml
id: dataplane.projection-freshness
version: 1

dimension: data
scope:
  type: atomic
  targets:
    - projection:order-summary

cadence:
  mode: continual

execution:
  type: dynamic
  runner: runtime-observer

expectation:
  metric: projection_lag_ms
  operator: lte
  value: 250

failure:
  action: trigger-adaptation
```

---

## 33. Runtime Evolution Controller

Devemos introduzir conceitualmente um componente responsável por governar evolução arquitetural.

```text
Architecture Change Candidate
          ↓
Evolution Controller
          ↓
Fitness Registry
          ↓
Static Analyzer
          ↓
Sandbox / Benchmark
          ↓
Shadow Runtime
          ↓
Canary
          ↓
Continual Observation
          ↓
Promote | Reject | Rollback
```

Responsabilidades:

```text
change admission
fitness orchestration
evidence collection
migration staging
canary control
rollback
compatibility verification
architectural drift detection
```

O Evolution Controller não altera Intents nem regras de domínio.

Ele só pode modificar mecanismos físicos e estratégias cuja variabilidade foi explicitamente autorizada.

---

## 34. Architectural Drift Detection

Arquiteturas degradam gradualmente quando pequenas mudanças locais violam decisões anteriores.

O Runtime deve detectar drift continuamente.

Definimos um vetor de características:

\[
A_t=(f_1,f_2,\dots,f_n)
\]

E um envelope admissível:

\[
E=(r_1,r_2,\dots,r_n)
\]

Existe drift quando:

\[
\exists i:\ f_i(A_t) \notin r_i
\]

A resposta pode ser:

```text
warn
reject next release
trigger adaptation
rollback
open architectural issue
```

---

## 35. Hypothesis- and Data-Driven Architecture

Uma mudança arquitetural deve poder ser formulada como hipótese.

Exemplo:

```text
Hypothesis:
Moving projection X from Postgres to engine Y will reduce p99 latency
without increasing consistency lag above the allowed envelope.
```

Então:

\[
H \rightarrow Experiment \rightarrow Evidence \rightarrow Decision
\]

Não:

\[
Preference \rightarrow PermanentTechnologyChoice
\]

Esse mecanismo deve ser usado especialmente para escolha de bancos especializados, mensageria, estratégias de scheduling e implementação de Actions de alto volume.

---

## 36. Continuous Architecture Evidence

Toda fitness function deve produzir evidência persistível.

```text
FitnessEvaluation {
    fitness_id
    architecture_version
    target
    timestamp
    result
    measurements
    evidence_ref
}
```

Assim, decisões arquiteturais passam a ter histórico causal.

Podemos responder:

```text
why was this adapter promoted?
why was this database selected?
when did latency start degrading?
which invariant blocked this release?
```

---

## 37. Architectural evolution e self-healing

Self-healing recupera uma execução específica.

Evolutionary Architecture corrige ou melhora a arquitetura que produziu aquela execução.

São níveis diferentes.

```text
execution failure
    ↓
self-healing
    ↓
recovery evidence
    ↓
repeated failure pattern
    ↓
architecture evolution candidate
    ↓
fitness validation
    ↓
new runtime strategy
```

Portanto:

\[
Healing = LocalRuntimeAdaptation
\]

\[
Evolution = ValidatedArchitecturalChange
\]

Healing não pode silenciosamente virar mudança permanente de arquitetura sem passar por admissão arquitetural.

---

## 38. Architectural evolution e LLMs

LLMs podem gerar candidatos de evolução, mas não devem decidir unilateralmente sua admissibilidade.

```text
Runtime evidence
    ↓
LLM analysis
    ↓
Candidate change
    ↓
Fitness functions
    ↓
formal/static validation
    ↓
benchmark
    ↓
shadow/canary
    ↓
Runtime admission
```

Formalmente:

\[
LLMProposal \neq ArchitectureDecision
\]

A LLM amplia o espaço de soluções exploráveis; fitness functions e invariantes restringem esse espaço.

---

## 39. New Architecture Invariants

### INV-EVO-001 — Guided Change

Nenhuma mudança arquitetural permanente deve ser promovida sem objetivos verificáveis.

### INV-EVO-002 — Incremental Safety

Toda etapa intermediária de uma migração deve satisfazer as invariantes obrigatórias.

### INV-EVO-003 — Fitness Coverage

Toda característica arquitetural crítica deve possuir pelo menos um mecanismo verificável de proteção.

### INV-EVO-004 — Outcome Preference

Fitness functions devem preferir resultados e propriedades semânticas a tecnologias específicas.

### INV-EVO-005 — Reversibility

Mudanças físicas significativas devem possuir estratégia de rollback ou substituição antes da promoção.

### INV-EVO-006 — Coupling Visibility

Coupling significativo deve ser mensurável e não pode permanecer acidentalmente implícito.

### INV-EVO-007 — Data Evolvability

Mudanças de representação de dados não devem exigir coordinated deployment oculto de consumidores.

### INV-EVO-008 — Runtime Boundary Preservation

Evolução física do Runtime não pode introduzir Complexity Leakage para o domínio.

### INV-EVO-009 — Evidence Required

Toda promoção arquitetural automatizada deve gerar evidência persistível da decisão.

### INV-EVO-010 — LLM Non-Authority

Nenhuma alteração arquitetural gerada por LLM é válida antes de passar pelo mesmo pipeline de fitness e admissão aplicado a alterações humanas.

### INV-EVO-011 — No Silent Permanent Adaptation

Adaptações operacionais podem ocorrer automaticamente, mas mudanças permanentes da arquitetura devem passar pelo Evolution Controller.

### INV-EVO-012 — Semantic Stability

Sempre que possível:

\[
\Delta Physical \nRightarrow \Delta Semantic
\]

---

## 40. Fluxo completo de evolução no AllasCode

```text
Observation / Requirement / Incident
                ↓
Architectural Hypothesis
                ↓
Candidate Change
                ↓
Identify affected dimensions
                ↓
Resolve required fitness functions
                ↓
Static + semantic validation
                ↓
Sandbox
                ↓
Benchmark / integration verification
                ↓
Shadow execution
                ↓
Canary
                ↓
Continual fitness evaluation
                ↓
       ┌────────┴────────┐
       │                 │
    Promote           Reject
       │                 │
       ↓                 ↓
Architecture State    Evidence
       │                 │
       ↓                 ↓
Continuous Drift     Candidate revision
Monitoring
```

---

## 41. Relação com Runtime Complexity Containment

`COMPLEXITY-CONTAINMENT.md` define onde a complexidade deve existir.

Este documento define como essa arquitetura complexa pode mudar sem perder suas garantias.

Os dois princípios se complementam:

\[
RCCP = ContainComplexity
\]

\[
EvolutionaryArchitecture = SafelyChangeContainedComplexity
\]

Portanto:

\[
AllasCodeRuntime = ContainedComplexity + GuidedEvolution
\]

A arquitetura pode ser internamente extremamente sofisticada desde que:

```text
complexity remains contained
changes remain measurable
fitness remains acceptable
semantic contracts remain stable
rollback remains possible
```

---

## 42. Síntese

Os conceitos de *Building Evolutionary Architectures* são particularmente adequados ao AllasCode porque o Runtime já pretende centralizar os mecanismos que normalmente tornam evolução arquitetural cara.

O passo adicional é transformar essa capacidade em governança executável.

O resultado desejado não é apenas um Runtime complexo e reutilizável.

É um Runtime que consegue demonstrar continuamente que suas escolhas ainda são adequadas e trocar essas escolhas de forma incremental quando deixarem de ser.

A regra final é:

> **No architectural choice is permanent merely because it exists; it remains valid only while its contracts, invariants and fitness functions continue to hold.**

Formalmente:

\[
ArchitectureDecisionValid(d,t) \iff Contracts(d,t) \land Invariants(d,t) \land Fitness(d,t)
\]

Assim, arquitetura deixa de ser somente uma estrutura projetada no passado e passa a ser um sistema continuamente verificado no presente.

---

## Referência conceitual

Este documento adapta conceitos de:

- Neal Ford, Rebecca Parsons, Patrick Kua e Pramod Sadalage, *Building Evolutionary Architectures: Automated Software Governance*, 2nd Edition, O'Reilly Media, 2022.

Conceitos utilizados e reinterpretados para o AllasCode incluem: guided incremental change across multiple dimensions, architectural fitness functions, automated governance, evolutionary architecture topologies, appropriate coupling, connascence, architectural quanta, evolutionary data, last responsible moment, testability, Conway's Law, reversible decisions, anticorruption layers, sacrificial architecture e fitness-function-driven architecture.
