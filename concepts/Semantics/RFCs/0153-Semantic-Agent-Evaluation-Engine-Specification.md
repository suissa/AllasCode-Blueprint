# RFC-0153 — Semantic Agent Evaluation Engine Specification

**Status:** Draft  
**Categoria:** AllasCode Semantic Architecture  
**Versão:** 0.1.0

## Resumo

Esta RFC formaliza **Evaluation Engine** como um artefato semântico de primeira classe do AllasCode. Seu objetivo é retirar significado de implementações implícitas e convertê-lo em contrato versionável, componível, verificável e auditável.

> **Semântica antes do mecanismo. A implementação pode mudar; o contrato semântico deve permanecer verificável.**

## Motivação

Sistemas agentivos não devem depender de significado escondido em código, prompts, infraestrutura ou convenções locais. Esta RFC delimita a responsabilidade de **Evaluation Engine**, suas relações com os demais componentes e as propriedades que uma implementação precisa demonstrar.

## Objetivos

- identidade canônica e versão;
- entradas e saídas semanticamente tipadas;
- pré-condições, pós-condições e invariantes explícitas;
- separação entre resolução e efeitos;
- evidências correlacionáveis;
- governança, observabilidade e auditoria;
- comportamento explícito de falha e recuperação.

## Não objetivos

Esta RFC não exige linguagem, banco, broker, cloud ou framework específicos. Implementações físicas podem variar desde que preservem o contrato observável.

## Modelo conceitual

```text
Intent
  ↓
Context
  ↓
Identity + Trust + Governance
  ↓
Evaluation Engine
  ↓
Typed Result
  ↓
Evidence
  ↓
Observation + Audit
```

## Descriptor

```yaml
artifact:
  id: "rfc-0153"
  canonical_label: "evaluation.engine"
  version: "1.0.0"

contract:
  input: Input
  output:
    ok: Ok
    error: Error
```

## Fluxo normativo

```text
Declared
→ Resolved
→ Validated
→ Authorized
→ Executing
→ Settled
```

Falhas recuperáveis seguem `Error → Classify → Healing → Validate → Ok | Escalate`. O Intent original permanece imutável durante healing.

## Tipagem

`Ok` e `Error` representam tipos nominais de resultado e não códigos de transporte. O runtime pode usar esses tipos para escolher pipelines sem interpretar o payload completo.

## Evidência e eventos

Evento comunica que algo ocorreu. Evidência é um artefato verificável que sustenta uma afirmação sobre uma propriedade, transição ou efeito. Um evento pode transportar ou referenciar uma evidência, mas os dois conceitos não são equivalentes.

## Segurança e governança

Capacidade nunca implica autorização. Antes de efeitos externos, a implementação deve validar identidade, autoridade, contexto, política, compatibilidade e invariantes aplicáveis.

## Self-healing

O pipeline de healing deve ser explícito, finito e orientado ao Intent. Se nenhuma estratégia automática satisfizer as invariantes, a execução deve escalar para Human-in-the-Healing-Loop.

## Observabilidade

Uma execução deve permitir reconstruir:

```text
Intent → Resolution → Binding → Action → Effect → Event → Evidence → Evaluation → Settlement
```

## Versionamento

Mudanças incompatíveis de significado, pré-condições, pós-condições, invariantes ou efeitos exigem nova versão semântica incompatível.

## Invariantes

1. identidade semântica estável;
2. capacidade não implica autorização;
3. Intent imutável durante a execução;
4. efeitos declarados;
5. resultados tipados;
6. evidências com proveniência;
7. healing preserva invariantes;
8. mudanças incompatíveis são versionadas;
9. execução auditável;
10. implementações substituíveis preservam o contrato.

## Violações

São violações: significado apenas em nomes de função; execução sem autorização; mistura de contextos; sucesso sem evidência obrigatória; loops infinitos de recovery; mudança de contrato sem versão; lógica normativa escondida em prompt não versionado.

## Conformidade

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

## Relações arquiteturais

Esta RFC compõe-se com Identity, Trust, Governance, Capability, Skill, Tool, Resource, Context, Memory, Knowledge, Execution, Observation, Evidence, Proof e Lifecycle. Nenhum componente isolado é autoridade absoluta sobre toda a execução.

## Glossário

**Intent** — objetivo semântico imutável de uma execução.  
**Atomic Action** — menor unidade executável e recuperável.  
**Evidence** — artefato verificável que sustenta uma afirmação.  
**Settlement** — confirmação do estado final exigido por uma etapa distribuída.  
**Healing** — recuperação orientada ao Intent e validada por invariantes.

## Próximo artefato

**RFC-0154 — Semantic Agent Feedback Engine Specification**
