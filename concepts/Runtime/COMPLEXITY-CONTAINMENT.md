# Runtime Complexity Containment

## Formalização técnica das escolhas arquiteturais, seus trade-offs e a contenção da complexidade no AllasCode Runtime

## 1. Tese

O AllasCode adota deliberadamente uma arquitetura internamente complexa para que os sistemas construídos sobre ela possam permanecer semanticamente simples.

A complexidade não é eliminada. Ela é:

1. centralizada;
2. encapsulada;
3. automatizada;
4. supervisionada;
5. testada;
6. observada;
7. governada;
8. impedida de emergir para o domínio.

A propriedade arquitetural fundamental é:

\[
C_{domain} \not\supset C_{runtime}
\]

onde:

- \(C_{domain}\) é a complexidade percebida pelo código de domínio;
- \(C_{runtime}\) é a complexidade necessária para distribuição, consistência, segurança, recuperação, persistência, escalabilidade e execução.

O objetivo não é:

\[
C_{system} \rightarrow 0
\]

O objetivo é:

\[
C_{domain} \rightarrow C_{business}
\]

mesmo quando:

\[
C_{runtime} \gg C_{business}
\]

---

## 2. Runtime Complexity Containment Principle

Definimos:

> **Runtime Complexity Containment Principle — RCCP**

Toda complexidade introduzida por uma decisão arquitetural que não representa diretamente uma regra de domínio DEVE ser absorvida pelo Runtime, por seus Planes ou por mecanismos de infraestrutura administrados por ele.

Formalmente:

\[
\forall c \in C_{architecture}
\]

se:

\[
c \notin C_{business}
\]

então:

\[
owner(c)=Runtime
\]

O Runtime não pode apenas fornecer bibliotecas para que o desenvolvedor trate essa complexidade.

Ele deve assumir sua responsabilidade operacional.

Portanto:

\[
Expose(c) = false
\]

para qualquer:

\[
c \in
\{distribution, routing, retry, supervision, serialization, discovery, scaling, transport, consistency, replication, recovery, observability, security, persistence\}
\]

salvo quando alguma dessas propriedades for explicitamente parte da semântica do domínio.

---

## 3. Regra de não emergência

Chamamos esta propriedade de:

### Runtime Non-Emergence Invariant

\[
RuntimeMechanism \not\Rightarrow DomainResponsibility
\]

O fato de o Runtime utilizar determinada tecnologia ou mecanismo não pode obrigar um Agent, Action ou Intent a conhecê-lo.

Exemplo:

```text
Runtime:
    EventStoreDB
    NATS
    Postgres
    Redis
    Qdrant
    QUIC
    mTLS
```

não pode resultar em:

```text
Action:
    publishToNats()
    queryRedis()
    commitEventStore()
    retry()
    reconnect()
    scale()
```

Uma Action deveria observar apenas algo próximo de:

```text
Input<T>
    ↓
AtomicAction
    ↓
Ok<U> | Error<E>
```

Consequentemente:

\[
ActionKnowledge(RuntimeTopology)=0
\]

idealmente.

---

## 4. Boundary arquitetural

A arquitetura estabelece uma fronteira explícita:

```text
┌──────────────────────────────────────┐
│              DOMAIN                  │
│                                      │
│  Entity                              │
│  Intent                              │
│  Invariant                           │
│  Policy                              │
│  Flow                                │
│  Agent                               │
│  Atomic Action                       │
│  Semantic Types                      │
└──────────────────┬───────────────────┘
                   │ semantic contracts
═══════════════════╪════════════════════
         RUNTIME COMPLEXITY BOUNDARY
═══════════════════╪════════════════════
                   │
┌──────────────────▼───────────────────┐
│              RUNTIME                 │
│                                      │
│ Resolution                           │
│ Binding                              │
│ Supervision                          │
│ Scheduling                           │
│ Healing                              │
│ Routing                              │
│ Settlement                           │
│ Persistence                          │
│ Distribution                         │
│ Scaling                              │
│ Security                             │
│ Observability                        │
│ Resource Lifecycle                   │
│ Data Materialization                 │
│ Consistency Management               │
└──────────────────────────────────────┘
```

A boundary deve ser semanticamente estável mesmo quando a implementação interna é modificada.

---

## 5. Escolha: Atomic Actions

Escolhemos granularidade extremamente pequena:

\[
Intent \rightarrow Agent \rightarrow Actor \rightarrow AtomicAction
\]

### Benefícios

- isolamento;
- composabilidade;
- capacidade de teste;
- supervisão granular;
- escalabilidade granular;
- reuso;
- auditabilidade;
- substituição independente;
- self-healing localizado.

### Trade-off

Quanto menor o componente:

\[
granularity \downarrow \Rightarrow coordinationCost \uparrow
\]

Também aumentam:

- número de mensagens;
- scheduling;
- tracing;
- supervisão;
- lifecycle management;
- roteamento;
- serialização;
- descoberta.

Em arquiteturas tradicionais, essa propriedade poderia tornar o sistema economicamente inviável.

### Absorção pelo Runtime

O Runtime assume:

```text
Action Discovery
Action Binding
Actor Allocation
Scheduling
Input Validation
Nominal Typing
Execution
Timeout
Supervision
Telemetry
Result Routing
Resource Disposal
Scaling
```

Logo:

\[
C_{AtomicAction}^{external} \approx C_{business-function}
\]

---

## 6. Escolha: Agent → Actor → Action

O Agent não é o processo.

O Actor não é o domínio.

A Action não é a unidade de deployment.

Cada elemento possui responsabilidade distinta.

```text
Agent
    semantic/cognitive identity

Actor
    execution identity

Action
    atomic capability
```

### Trade-off

Isso adiciona uma camada intermediária que não existe em arquiteturas convencionais.

O sistema passa a manter:

- identidade semântica;
- identidade operacional;
- lifecycle independente;
- bindings;
- ownership;
- estado cognitivo;
- estado de execução.

### Benefício

Permite que:

\[
Identity \neq Location
\]

\[
Agent \neq Process
\]

\[
ExecutionRestart \neq ProcessRestart
\]

Isso é essencial para retomada granular.

### Runtime

O Runtime resolve:

```text
Agent → Actor
Actor → Action
Actor → Execution Context
Execution → State
Execution → Supervisor
```

Nenhum desses bindings deve ser implementado pelo domínio.

---

## 7. Escolha: recuperação exata de execução

Queremos que uma execução interrompida possa continuar da ação atômica onde parou.

Não simplesmente:

```text
restart process
```

nem:

```text
restart workflow
```

mas:

```text
resume failed atomic execution
```

Formalmente:

Se:

\[
E = (a_1,a_2,\dots,a_n)
\]

ocorreu falha em:

\[
a_k
\]

então o comportamento desejado é:

\[
resume(E)=a_k
\]

em vez de:

\[
resume(E)=a_1
\]

### Trade-off

Isso exige:

- estado persistente;
- checkpoints;
- eventos;
- determinismo suficiente;
- idempotência;
- causalidade;
- supervisão;
- reconstrução de contexto.

É significativamente mais complexo que simplesmente reiniciar um worker.

### Runtime

O Runtime mantém a separação entre:

```text
Cognitive State
Execution State
Last Durable State
Recent Atomic Events
Current Action
Action Inputs
Action Outputs
Causal Context
```

Essa complexidade não pode ser exigida de uma Action.

---

## 8. Escolha: Event Sourcing como fonte causal

O estado durável pode ser derivado de eventos.

\[
S_n = fold(S_0,E_1,E_2,\dots,E_n)
\]

### Benefícios

- auditabilidade;
- reconstrução;
- causalidade;
- replay;
- debugging;
- recovery;
- materializações múltiplas.

### Trade-offs

Event sourcing traz:

- maior complexidade de modelagem;
- versionamento;
- replay;
- materialização;
- consistência eventual;
- evolução de schema;
- gerenciamento de projeções.

### Runtime/Data Plane

Esses mecanismos são responsabilidades do Runtime.

O domínio emite comportamento semanticamente válido.

O Runtime decide:

```text
store event
materialize state
update projection
publish event
settle consumption
checkpoint execution
```

---

## 9. Escolha: consistência eventual

O AllasCode aceita que diferentes projeções tenham diferentes tempos de atualização.

Formalmente:

\[
State_{source}(t) \neq State_{projection}(t)
\]

em determinados intervalos.

### Trade-off

Ganha-se:

- independência;
- escalabilidade;
- desacoplamento;
- múltiplos modelos especializados.

Perde-se consistência imediata global.

### Problema tradicional

O consumidor recebe:

```text
null
```

e precisa descobrir se:

1. a propriedade não existe;
2. a projeção está atrasada;
3. a informação ainda está sendo derivada;
4. ocorreu erro;
5. o dado não pertence àquela projeção.

### Runtime

O Data Plane deve carregar semântica de disponibilidade.

Algo conceitualmente equivalente a:

```text
AbsentByDesign
PendingMaterialization
Stale
Deriving
Available
Invalid
```

Portanto:

\[
MissingData \neq UnknownState
\]

O Runtime precisa saber explicar o estado da informação.

---

## 10. Escolha: polyglot persistence

Cada modelo de dado pode utilizar o mecanismo mais apropriado.

Exemplos:

```text
Relational → Postgres
Graph → Neo4j
Vector → Qdrant
Cache → Redis
Search → Meilisearch
Analytics → DuckDB / ClickHouse
Events → Event Store
```

### Benefício

Maximiza fitness específica.

\[
DB_{selected}=argmax\ Fitness(workload)
\]

### Trade-off

Polyglot persistence aumenta:

- infraestrutura;
- operações;
- drivers;
- observabilidade;
- disponibilidade;
- sincronização;
- backups;
- migração;
- consistência.

Sem abstração adequada:

\[
Polyglot \Rightarrow DeveloperComplexity
\]

### Runtime

O AllasCode exige:

\[
Polyglot \nRightarrow DomainComplexity
\]

Por isso o Data Plane utiliza adapters.

```text
Semantic Data Contract
        ↓
Storage Adapter
        ↓
Physical Technology
```

O domínio não deve saber se determinado modelo está em Postgres, MongoDB, Neo4j ou Redis.

---

## 11. Junior Mode → Polyglot Mode

A arquitetura deve permitir:

```text
Junior Mode
Postgres + Extensions
```

posteriormente:

```text
Polyglot Mode
Specialized Engines
```

sem mudança semântica da aplicação.

Formalmente:

\[
Semantics(Junior)=Semantics(Polyglot)
\]

mesmo quando:

\[
Implementation(Junior)\neq Implementation(Polyglot)
\]

Isso representa uma propriedade de substituição.

Se:

\[
Adapter_A \models Contract
\]

\[
Adapter_B \models Contract
\]

então:

\[
A \leftrightarrow B
\]

não pode exigir alteração no domínio.

---

## 12. Escolha: mensagens e eventos como comunicação primária

Componentes não devem depender diretamente da localização um do outro.

### Benefícios

- desacoplamento;
- elasticidade;
- substituição;
- resiliência;
- distribuição.

### Trade-offs

Messaging introduz:

- duplicates;
- ordering;
- delivery guarantees;
- poison messages;
- replay;
- backpressure;
- consumer lag;
- partitioning.

### Runtime

Esses conceitos devem permanecer internos.

A Action não deveria precisar saber:

```text
Kafka partition
NATS subject
consumer group
delivery attempt
offset
ack
```

Ela deveria conhecer apenas:

```text
Semantic Event<T>
```

---

## 13. Escolha: canonical semantic events

Eventos são identificados semanticamente, não pelo transporte.

Exemplo conceitual:

```text
{Agent}.{Intent}.{Type}
```

onde:

```text
Type ∈ {Ok, Error}
```

O transporte pode variar:

```text
NATS
Kafka
QUIC
RabbitMQ
in-memory
```

mas:

\[
EventIdentity \neq TransportIdentity
\]

---

## 14. Escolha: tipos nominais

Eventos e resultados devem possuir identidade semântica real.

Não basta equivalência estrutural.

\[
Structure(A)=Structure(B)
\]

não implica:

\[
Type(A)=Type(B)
\]

### Benefício

O Runtime pode rotear pelo tipo sem inspecionar semanticamente o payload.

Exemplo:

```text
Ok<T>
    → process.pipeline

Error<E>
    → self-healing.pipeline
```

### Trade-off

Exige:

- geração de tipos;
- registry;
- compatibility rules;
- schema evolution;
- adapters.

### Runtime

Essa complexidade fica no Type Plane e no Runtime.

A Action apenas produz o tipo declarado.

---

## 15. Escolha: Intent imutável

O Intent representa a vontade originária e não deve ser alterado durante execução.

\[
Intent_{t_0}=Intent_{t_n}
\]

### Benefício

Preserva causalidade.

Self-healing não pode redefinir o objetivo.

### Trade-off

Toda recuperação precisa encontrar outro caminho para o mesmo Intent.

Isso torna recovery mais difícil.

### Runtime

O Runtime deve:

```text
preserve intent
change execution strategy
change actor
change action
change resource
change route
change projection
```

mas nunca:

```text
change meaning of intent
```

---

## 16. Escolha: Self-Healing como pipeline

Falha não é tratada apenas como exception.

Ela possui fluxo arquitetural próprio.

```text
Action.Error
    ↓
Self-Healing
    ↓
Alternative Action
    ↓
Validation
    ↓
Success
```

Caso os mecanismos automáticos sejam esgotados:

```text
Human-in-the-Healing-Loop
```

### Trade-off

Isso é muito mais complexo que:

```text
try/catch
```

É necessário manter:

- recovery graph;
- evidências;
- causalidade;
- limites;
- testes;
- supervisão;
- non-loop guarantees.

### Runtime

O Runtime é responsável por percorrer o grafo.

A Action não implementa seu próprio sistema de recuperação.

---

## 17. Invariante de healing finito

Se o grafo de recuperação é:

\[
G_h=(V_h,E_h)
\]

deve existir uma função de progresso:

\[
P:V_h\rightarrow\mathbb{N}
\]

tal que para toda transição de recuperação:

\[
v_i\rightarrow v_j
\]

tenhamos:

\[
P(v_j)<P(v_i)
\]

ou que a transição termine em:

```text
Success
Human
Terminal Policy
```

Isso impede recovery infinito.

---

## 18. Escolha: supervisão hierárquica

Cada unidade de execução deve possuir supervisão.

### Benefícios

- fault isolation;
- restart localizado;
- métricas locais;
- scaling localizado;
- policies específicas.

### Trade-off

Supervisão hierárquica adiciona:

- árvores;
- lifecycle;
- políticas;
- coordenação;
- estado.

### Runtime

A Action não cria supervisor.

O Runtime instancia:

```text
Supervisor(Action)
```

e gerencia:

```text
spawn
monitor
clone
restart
dispose
scale
```

---

## 19. Escolha: scaling por comportamento

A unidade de escala não precisa ser o serviço.

Pode ser:

\[
ScaleUnit=Behavior
\]

ou:

\[
ScaleUnit=Action
\]

### Benefício

Escalabilidade extremamente precisa.

Uma única Action quente pode passar de:

```text
1 worker
```

para:

```text
N workers
```

sem duplicar todo o serviço.

### Trade-off

O Runtime precisa decidir:

- quando escalar;
- quanto escalar;
- quando reduzir;
- como manter fairness;
- como evitar thrashing.

Podemos modelar:

\[
Pressure=\alpha Q+\beta L+\gamma U+\delta F
\]

onde:

- \(Q\) = queue depth;
- \(L\) = latency;
- \(U\) = utilization;
- \(F\) = failure pressure.

Spawn:

\[
Pressure>T_{up}
\]

Destroy:

\[
Pressure<T_{down}
\]

mantendo:

\[
T_{down}<T_{up}
\]

para produzir hysteresis.

---

## 20. Escolha: resource lifecycle automático

A arquitetura possui recursos efêmeros.

A execução não deve depender de garbage collection convencional para recursos semanticamente lineares.

Após consumo válido:

\[
consume(x)\Rightarrow unavailable(x)
\]

Quando necessário:

\[
Ok\rightarrow destroy(resource)\rightarrow emit(Settled)
\]

### Trade-off

Exige tracking preciso de ownership.

### Runtime

O Runtime deve gerenciar lifecycle.

A lógica de domínio não pode ficar manualmente destruindo estruturas internas da plataforma.

---

## 21. Escolha: Zero Trust

A arquitetura assume que confiança não deve emergir implicitamente da rede.

Entre outras propriedades:

- identity;
- authentication;
- authorization;
- encryption;
- replay protection;
- integrity;
- capability verification.

### Trade-off

Zero Trust aumenta brutalmente a complexidade operacional.

Se cada Action precisar gerenciar:

```text
mTLS
DPoP
keys
nonces
certificates
encryption
rotation
```

o sistema se torna inviável.

### Runtime

Esses mecanismos pertencem a:

```text
Gateway
UbiQ
Runtime
Security Plane
```

De forma que:

\[
SecurityComplexity_{Action}\approx0
\]

sem reduzir:

\[
SecurityGuarantees
\]

---

## 22. Escolha: observabilidade completa

Arquitetura distribuída sem observabilidade é inoperável.

### Trade-off

Mais observabilidade implica:

\[
Telemetry\uparrow \Rightarrow CPU+Network+Storage+Cost\uparrow
\]

### Runtime

A observabilidade pode ser negociada adaptativamente.

Definimos:

\[
O=f(Risk,Failure,Uncertainty,Importance)
\]

Exemplo:

```text
Healthy
    → minimal

Anomalous
    → metrics + traces

Error
    → detailed trace

Healing failure
    → evidence-rich diagnostics
```

A Action não decide manualmente quais spans registrar.

---

## 23. Escolha: fitness functions

Tecnologias e mecanismos não são tratados como dogmas arquiteturais.

São hipóteses.

Uma implementação:

\[
I
\]

é válida enquanto:

\[
Fitness(I)\ge Requirements
\]

O Runtime pode comparar:

\[
Fitness(I_1) \quad vs \quad Fitness(I_2)
\]

para:

- storage;
- messaging;
- serialization;
- scheduling;
- runtime strategy;
- data models.

### Consequência

Arquitetura passa de:

```text
architecture as fixed structure
```

para:

```text
architecture as continuously verified hypothesis
```

---

## 24. Escolha: LLM como mecanismo de implementação

LLMs reduzem drasticamente o custo marginal da implementação.

Mas não podem ser a autoridade arquitetural.

O pipeline correto é:

```text
Intent
↓
Specification
↓
Invariants
↓
Semantic Types
↓
Policies
↓
Tests
↓
LLM Generation
↓
Sandbox
↓
Validation
↓
Integration Tests
↓
Runtime Admission
```

Portanto:

\[
LLM \neq ArchitectureAuthority
\]

\[
LLM \neq RuntimeAuthority
\]

A LLM produz candidatos de implementação.

O Runtime e os testes determinam admissibilidade.

---

## 25. Action Admission Invariant

Uma Action não existe operacionalmente antes de satisfazer seu pipeline de validação.

Formalmente:

\[
ActionExists(a)\iff Tests(a)=Pass \land Integration(a)=Pass \land Invariants(a)=Satisfied
\]

Logo:

```text
source code exists
```

não implica:

```text
runtime capability exists
```

---

## 26. Micro-skills

Toda Action possui uma micro-skill correspondente.

Consequentemente:

\[
ActionExists(a)\Rightarrow SkillExists(a)
\]

\[
\neg SkillExists(a)\Rightarrow \neg AvailableAction(a)
\]

O Agent recebe apenas as skills necessárias ao Intent corrente.

\[
SkillSet_{agent,intent}=\{s_i\mid required(s_i,intent)\}
\]

Isso diminui:

- tool ambiguity;
- prompt size;
- accidental capability exposure;
- incorrect action selection.

---

## 27. Escolha: Control Plane declarativo

O usuário não deve configurar a infraestrutura diretamente.

Ele declara:

```text
Intent
Rules
Constraints
Entities
Policies
Requirements
```

O Runtime determina:

```text
Agents
Actions
Flows
Bindings
Storage
Scaling
Recovery
Security
```

quando essas decisões puderem ser inferidas de forma segura.

O objetivo é:

\[
UserConcern=Domain
\]

em vez de:

\[
UserConcern=Infrastructure
\]

---

## 28. Matriz consolidada dos trade-offs

| Escolha | Ganho | Custo introduzido | Quem absorve |
|---|---|---|---|
| Atomic Actions | isolamento | coordenação | Runtime |
| Actors | execução independente | lifecycle | Runtime |
| Event sourcing | causalidade | replay/materialização | Data Plane |
| Eventual consistency | escalabilidade | estado temporariamente divergente | Data Plane |
| Polyglot persistence | fitness específica | operação | Data Plane |
| Messaging | desacoplamento | delivery semantics | UbiQ/Runtime |
| Nominal typing | segurança semântica | registry/schema | Type Plane |
| Intent imutável | causalidade | recovery mais difícil | Runtime |
| Self-healing | resiliência | grafo de recuperação | Runtime |
| Supervisão | fault isolation | hierarquia operacional | Runtime |
| Fine-grained scaling | eficiência | controle dinâmico | Runtime |
| Zero Trust | segurança | enorme complexidade | Security Plane |
| Full observability | auditabilidade | overhead | Observability Plane |
| LLM generation | velocidade | código não confiável | Tests + Runtime |
| Multi-runtime/polyglot | especialização | integração | Adapters |
| Dynamic skills | precisão | geração/contextualização | Runtime |
| Offline-first | disponibilidade | sincronização | Data Plane |
| Projection models | eficiência de leitura | materialização | Data Plane |

---

## 29. Complexity Leakage

Chamamos qualquer violação da boundary de:

> **Complexity Leakage**

Exemplos:

```text
Action sabendo que usa Kafka
Action implementando retry
Agent sabendo qual banco consultar
Flow sabendo quantos workers existem
Entity conhecendo Redis
Action gerenciando mTLS
Intent especificando endereço de serviço
```

Formalmente:

\[
Leak(c,d)
\]

quando uma responsabilidade \(c\) pertencente ao Runtime precisa ser manipulada por um componente de domínio \(d\).

A fitness function correspondente pode ser:

\[
LeakageRatio=\frac{|RuntimeConcernsExposedToDomain|}{|RuntimeConcerns|}
\]

Objetivo:

\[
LeakageRatio\rightarrow0
\]

---

## 30. Runtime Surface Area

Existe, entretanto, um risco inverso.

Se o Runtime expõe APIs demais:

\[
RuntimeAPI\uparrow \Rightarrow LeakProbability\uparrow
\]

Portanto a superfície pública do Runtime deve ser semanticamente pequena.

Idealmente composta por abstrações como:

```text
Intent
Event
Action
Result
Evidence
Policy
Projection
Capability
```

e não por mecanismos físicos.

---

## 31. Runtime interno deliberadamente complexo

O Runtime do AllasCode é complexo porque resolve simultaneamente problemas que normalmente são distribuídos entre diversas plataformas:

```text
Application Runtime
Actor Runtime
Workflow Engine
Event Processor
Service Mesh
Data Plane
Policy Engine
Recovery Engine
Scheduler
Autoscaler
Security Runtime
Observability Runtime
Capability Runtime
AI Execution Runtime
```

Em sistemas convencionais essas responsabilidades aparecem em produtos distintos.

No AllasCode elas possuem uma semântica comum.

Isso explica a complexidade.

Não é complexidade acidental.

É:

> **Essential Infrastructure Complexity**

necessária para remover complexidade repetitiva das aplicações.

---

## 32. Complexidade essencial × acidental

Definimos:

\[
C_{runtime}=C_{essential}+C_{accidental}
\]

A existência de Runtime complexo só é justificável enquanto:

\[
C_{essential}\gg C_{accidental}
\]

Portanto o Runtime deve continuamente eliminar:

- duplicação;
- abstrações redundantes;
- dependências acidentais;
- APIs desnecessárias;
- mecanismos não mensuráveis.

O objetivo não é celebrar complexidade.

É concentrar apenas a complexidade inevitável.

---

## 33. Amortização arquitetural

Sem Runtime:

\[
C_{total}=\sum_{i=1}^{N}(C_{business_i}+C_{infra_i})
\]

Com Runtime:

\[
C_{total}=C_{runtime}+\sum_{i=1}^{N}C_{business_i}
\]

O custo médio de infraestrutura por aplicação é:

\[
\frac{C_{runtime}}{N}
\]

E conceitualmente:

\[
\lim_{N\rightarrow\infty}\frac{C_{runtime}}{N}=0
\]

Essa é a razão econômica para investir pesadamente no Runtime.

---

## 34. Runtime as Architectural Operating System

O Runtime não deve ser entendido apenas como executor de código.

Ele funciona mais próximo de um:

> **Architectural Operating System**

O sistema recebe especificações semânticas e administra recursos físicos necessários para satisfazê-las.

```text
Semantic Requirement
        ↓
Runtime
        ↓
Architecture Decision
        ↓
Physical Execution
```

Isso inclui decisões sobre:

```text
where
how
how many
using what
with which consistency
with which recovery
with which security
with which storage
```

O domínio declara principalmente:

```text
what
why
constraints
invariants
```

---

## 35. Semantic/Physical Separation

Formalmente:

\[
Architecture=SemanticArchitecture+PhysicalArchitecture
\]

A arquitetura semântica deve ser relativamente estável.

A física pode evoluir.

\[
\Delta Physical\nRightarrow\Delta Semantic
\]

sempre que possível.

Exemplo:

```text
NATS → Kafka
```

não deveria alterar:

```text
Intent
Action
Flow
Event
```

Da mesma forma:

```text
Postgres → specialized graph database
```

não deveria alterar a entidade do domínio.

---

## 36. Regra de substituibilidade

Para duas implementações físicas:

\[
I_1,I_2
\]

se ambas satisfazem o contrato:

\[
I_1\models C
\]

\[
I_2\models C
\]

então o Runtime deve permitir:

\[
I_1\rightarrow I_2
\]

desde que as fitness functions continuem válidas.

O domínio permanece inalterado.

---

## 37. Architecture Fitness Governance

Toda escolha física deve estar vinculada às características pelas quais foi selecionada.

Por exemplo:

```text
TigerBeetle
→ financial correctness
→ deterministic accounting
→ throughput

Qdrant
→ vector search

Neo4j
→ graph traversal
```

Não é:

```text
Technology X is better.
```

É:

\[
TechnologyX\text{ is preferable under }WorkloadY
\]

---

## 38. Architectural Decision Lifecycle

Toda decisão possui:

```text
Requirement
↓
Candidate
↓
Trade-off Analysis
↓
Fitness Functions
↓
Implementation
↓
Measurement
↓
Validation
↓
Evolution
```

Consequentemente, decisões arquiteturais tornam-se artefatos verificáveis.

---

## 39. Regra fundamental

Uma escolha complexa só deve entrar no Runtime se:

\[
Benefit_{system}>Complexity_{runtime}
\]

E simultaneamente:

\[
ComplexityLeakage\approx0
\]

Se a complexidade passar para cada aplicação, o benefício arquitetural diminui drasticamente.

---

## 40. Invariantes globais

### INV-RUNTIME-001 — Domain Independence

Nenhum componente de domínio deve depender de uma tecnologia física específica sem que isso seja requisito explícito do domínio.

### INV-RUNTIME-002 — Location Transparency

Nenhum Agent ou Action deve depender da localização física de outro componente.

### INV-RUNTIME-003 — Transport Transparency

Eventos semânticos não devem depender de protocolo ou broker específico.

### INV-RUNTIME-004 — Persistence Transparency

Entidades e Intents não devem depender diretamente do mecanismo de storage.

### INV-RUNTIME-005 — Recovery Ownership

Toda política genérica de retry, restart, fallback ou healing pertence ao Runtime.

### INV-RUNTIME-006 — Security Ownership

Autenticação de infraestrutura, transporte seguro, rotação de chave e proteção contra replay pertencem ao Runtime.

### INV-RUNTIME-007 — Observability Ownership

Tracing e telemetria não devem alterar a semântica da Action.

### INV-RUNTIME-008 — Scaling Transparency

Nenhum componente do domínio deve assumir cardinalidade fixa de executores.

### INV-RUNTIME-009 — Intent Preservation

Nenhum mecanismo de recuperação pode alterar semanticamente o Intent originário.

### INV-RUNTIME-010 — Runtime Replaceability

Implementações físicas equivalentes semanticamente devem poder ser substituídas mediante validação por fitness functions.

---

## 41. Teste arquitetural de leakage

Para cada componente \(D\) do domínio:

```text
Entity
Intent
Agent
Action
Flow
Policy
```

deve ser possível perguntar:

> Se substituirmos broker, banco, protocolo, scheduler, estratégia de scaling ou plataforma de execução, este artefato precisa mudar?

Se a resposta for `sim` sem que a tecnologia seja requisito do domínio, existe uma violação arquitetural.

```text
ArchitectureViolation
```

---

## 42. Runtime Complexity Budget

O Runtime pode ser complexo, mas não infinitamente complexo.

Cada novo mecanismo deve justificar:

\[
\frac{ComplexityRemovedFromApplications\times Reuse}{ComplexityAddedToRuntime}>1
\]

Quanto maior o número de soluções reutilizando aquele mecanismo, maior sua justificativa.

---

## 43. A função do desenvolvedor muda

O desenvolvedor deixa progressivamente de ser:

```text
mechanism implementer
```

e passa a ser:

```text
semantic architect
constraint designer
invariant author
fitness designer
domain modeler
technology evaluator
```

A LLM executa grande parte da implementação mecânica.

O Runtime verifica e governa.

---

## 44. Separação de autoridade

A arquitetura possui três autoridades diferentes.

### Humano

Decide:

```text
Intent
Business Meaning
Requirements
Trade-offs
Constraints
Invariants
```

### LLM

Produz:

```text
Candidate Implementations
Transformations
Adapters
Tests
Documentation
```

### Runtime

Determina:

```text
Admissibility
Execution
Supervision
Recovery
Placement
Scaling
Settlement
Persistence
```

Nenhuma dessas responsabilidades deve ser confundida.

---

## 45. Resultado arquitetural

O objetivo final é atingir:

\[
SystemComplexity=High
\]

simultaneamente a:

\[
ApplicationComplexity=Low
\]

\[
DomainExpressiveness=High
\]

Portanto não estamos tentando construir uma arquitetura simples.

Estamos tentando construir:

> **um sistema capaz de executar arquiteturas complexas através de interfaces semanticamente simples.**

---

## 46. Princípio final

A principal regra do Runtime pode ser condensada em:

> **Complexity may exist below the Runtime Boundary, but it must not emerge above it unless the domain explicitly requires that complexity.**

Ou:

\[
Complexity_{physical}\rightarrow Runtime
\]

\[
Complexity_{semantic}\rightarrow Domain
\]

Nunca o contrário.

O AllasCode Runtime é, por isso, deliberadamente uma das partes mais complexas de toda a arquitetura.

Essa complexidade não é um defeito se cumprir três condições:

\[
Reusable\land Observable\land Contained
\]

Se qualquer uma delas deixar de ser verdadeira, a complexidade deixou de ser arquiteturalmente justificável.

A função do Runtime é tornar possível que sistemas muito sofisticados existam sem obrigar cada desenvolvedor, Agent ou Action a carregar a complexidade necessária para fazê-los funcionar.
