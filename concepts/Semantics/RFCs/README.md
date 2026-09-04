# AllasCode Semantic RFCs

## Por que estas RFCs existem

A coleção de RFCs em `concepts/Semantics/RFCs` existe para transformar os conceitos arquiteturais do AllasCode em contratos técnicos explícitos, versionáveis, discutíveis e verificáveis. A arquitetura não deve depender de significado escondido em código, prompts, nomes de funções ou decisões de infraestrutura. Cada RFC isola uma responsabilidade semântica e define seu propósito, fronteiras, invariantes, relações, segurança, evidências e critérios de conformidade.

O objetivo não é criar uma coleção de documentos independentes. As RFCs formam uma especificação arquitetural progressiva: conceitos de identidade, intenção, políticas, tipos e comportamentos são usados para definir execução; execução produz eventos e evidências; observação e avaliação alimentam healing, aprendizado e evolução; persistência e reconstrução preservam continuidade; governança e conformidade limitam todo o ciclo.

O princípio central é:

> **Semântica antes do mecanismo. A implementação pode mudar; o significado e as garantias devem permanecer verificáveis.**

## Formato canônico

Cada RFC é um arquivo Markdown independente e deve seguir a nomenclatura:

```text
{ID}-{Título}.md
```

Exemplo:

```text
0167-Semantic-Agent-Context-Engine-Specification.md
0168-Semantic-Agent-Memory-Engine-Specification.md
0169-Semantic-Agent-Knowledge-Engine-Specification.md
```

Regras:

1. `ID` possui quatro dígitos e é imutável depois da publicação.
2. O título do arquivo deve corresponder ao título da RFC.
3. Espaços são representados por `-`.
4. O arquivo usa extensão `.md`.
5. Renomear um conceito semanticamente incompatível exige nova RFC ou decisão explícita de supersessão; não se deve reutilizar silenciosamente um ID publicado.

## Estrutura recomendada

Uma RFC deve conter, quando aplicável:

```text
Título / ID
Status
Categoria
Versão

Resumo
Motivação
Definição
Objetivos
Não objetivos
Modelo conceitual
Descriptor / contrato
Fluxo normativo
Estados e lifecycle
Tipagem
Relações com outras RFCs
Segurança
Observabilidade
Evidência / prova
Self-healing / recovery
Versionamento
Invariantes
Violações
Exemplos
Critérios de conformidade
Glossário
```

Nem toda RFC precisa repetir seções que não façam sentido para seu domínio. Entretanto, identidade, contrato, invariantes, versionamento e relações arquiteturais devem ser explícitos sempre que forem relevantes.

## Linguagem normativa

RFCs normativas podem utilizar `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT` e `MAY` para distinguir requisitos obrigatórios, recomendações e extensões opcionais. Uma RFC conceitual pode usar linguagem descritiva enquanto estiver em `Draft`, mas deve tornar as garantias normativas explícitas antes de ser considerada estável.

## Status

Status recomendados:

- `Draft` — conceito em elaboração;
- `Experimental` — especificação implementável em validação;
- `Proposed` — candidata a padrão do projeto;
- `Accepted` — aceita como contrato arquitetural;
- `Implemented` — existe implementação de referência validada;
- `Superseded` — substituída por outra RFC;
- `Deprecated` — mantida apenas por compatibilidade ou histórico.

## Como as RFCs se conectam

A sequência conceitual principal pode ser resumida como:

```text
Expression
  ↓
Intent
  ↓
Semantic Context
  ↓
Entity Resolution
  ↓
Parameters
  ↓
Specification
  ↓
Capability
  ↓
AtomicBehavior
  ↓
Atomic Action
  ↓
Actor / Supervisor
  ↓
Execution
  ↓
Effect
  ↓
Event
  ↓
Evidence / Proof
  ↓
Observation
  ↓
Evaluation
  ↓
Healing | Learning | Evolution
```

No AllasCode, `Capability` descreve **o que pode ser feito**; `Skill` descreve **como uma Capability pode ser implementada**; `Tool` representa **o recurso externo usado pela Skill**; `Resource` representa **o orçamento computacional/físico necessário**; `Context` fornece **a visão semântica limitada necessária à execução**; `Memory` preserva **informação recuperável para execuções futuras**.

## Atomic Actions e micro-skills

A menor unidade executável deve ser uma Atomic Action. Cada Action possui contrato semântico e uma micro-skill que funciona como manual de uso da Action. Se não existe skill válida, a Action não deve ser considerada disponível para composição.

O agente não precisa receber todas as skills existentes. A partir do Intent e do estado atual, o runtime resolve as Actions necessárias e gera/injeta apenas o conjunto mínimo de micro-skills requerido para aquele cenário.

```text
Intent
  ↓
Required Capabilities
  ↓
Compatible Atomic Actions
  ↓
Micro-Skills
  ↓
Dynamic Agent Skill
```

## Intent e self-healing

O Intent é imutável durante a execução. Falhas não autorizam o runtime a redefinir o objetivo. Elas iniciam um pipeline de healing explícito.

```text
Error
  ↓
Classify
  ↓
Self-Healing Graph
  ↓
Validate Invariants
  ├── valid → Ok
  └── unresolved → previous healing boundary
                         ↓
                  Human-in-the-Healing-Loop
```

A cadeia deve possuir término. O humano é a última fronteira de recuperação quando nenhuma Action autorizada consegue satisfazer a intenção e as invariantes.

## Evento, evidência e settlement

Evento e evidência não são sinônimos. Um evento comunica que algo ocorreu. Evidência sustenta de forma verificável uma afirmação sobre o que ocorreu. O settlement registra que uma etapa distribuída atingiu o estado final exigido pelo protocolo.

```text
Action succeeds
  ↓
Success Event
  ↓
Consumer processes event
  ↓
Consumption Evidence
  ↓
Execution Settlement
```

Isso permite distinguir `mensagem publicada`, `mensagem entregue`, `mensagem consumida`, `efeito realizado` e `execução liquidada`.

## Persistência e retomada exata

Event Store, snapshots, estado consolidado e checkpoints são complementares. O objetivo de retomada não é simplesmente reiniciar um processo: é reconstruir o estado necessário e continuar exatamente na menor unidade que ainda não produziu sucesso validado.

```text
Event Store + Snapshot + Checkpoint
              ↓
       State Reconstruction
              ↓
Last successful Atomic Action
              ↓
Resume failed/pending Atomic Action
```

## Implementação e conformidade

As RFCs são independentes da linguagem, mas a implementação de referência pode mapear contratos semânticos para tipos nominais, manifests, schemas, grafos `2flow`, Actors, Supervisors, adapters de transporte e adapters de dados.

Uma implementação deve ser considerada conforme apenas quando puder demonstrar, de forma automatizável, que os contratos relevantes foram satisfeitos:

```text
Descriptor Valid
∧ Types Valid
∧ Dependencies Resolved
∧ Policies Satisfied
∧ Invariants Hold
∧ Effects Declared
∧ Evidence Verifiable
∧ Audit Complete
```

## Política para novas RFCs

Uma nova RFC deve nascer de uma lacuna real de semântica, implementação, interoperabilidade, prova formal, segurança ou governança. Não se deve criar uma nova Engine apenas porque um substantivo pode ser separado nominalmente.

Antes de criar uma RFC:

1. verificar se a responsabilidade já está coberta;
2. identificar a lacuna concreta;
3. definir a fronteira semântica;
4. listar invariantes que justificam a separação;
5. explicar como ela compõe com RFCs existentes;
6. definir como a implementação pode demonstrar conformidade.

## Diretório

Este diretório é a fonte versionada das RFCs semânticas do AllasCode. O histórico Git registra a evolução editorial; o ID e a versão da RFC registram a evolução semântica do contrato.
