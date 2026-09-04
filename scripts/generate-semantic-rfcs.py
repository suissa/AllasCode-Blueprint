from pathlib import Path
import re
import sys

# The committed RFC collection is checked against this deterministic source.

OUT = Path('concepts/Semantics/RFCs')
OUT.mkdir(parents=True, exist_ok=True)

TITLES = '''
0055|Semantic Agent Definition Specification
0056|Semantic Agent Manifest Specification
0057|Semantic Agent Configuration Specification
0058|Semantic Agent Contract Specification
0059|Semantic Agent Intent Specification
0060|Semantic Agent Goal Specification
0061|Semantic Agent Objective Specification
0062|Semantic Agent Policy Specification
0063|Semantic Agent Constraint Specification
0064|Semantic Agent Invariant Specification
0065|Semantic Agent Event Specification
0066|Semantic Agent State Specification
0067|Semantic Agent Context Specification
0068|Semantic Agent Capability Specification
0069|Semantic Agent Skill Specification
0070|Semantic Agent Tool Specification
0071|Semantic Agent Resource Specification
0072|Semantic Agent Permission Specification
0073|Semantic Agent Authorization Specification
0074|Semantic Agent Authentication Specification
0075|Semantic Agent Identity Specification
0076|Semantic Agent Trust Specification
0077|Semantic Agent Evidence Specification
0078|Semantic Agent Proof Specification
0079|Semantic Agent Provenance Specification
0080|Semantic Agent Audit Specification
0081|Semantic Agent Telemetry Specification
0082|Semantic Agent Observability Specification
0083|Semantic Agent Error Specification
0084|Semantic Agent Recovery Specification
0085|Semantic Agent Self-Healing Specification
0086|Semantic Agent Retry Specification
0087|Semantic Agent Compensation Specification
0088|Semantic Agent Resilience Specification
0089|Semantic Agent Antifragility Specification
0090|Semantic Agent Supervisor Specification
0091|Semantic Agent Actor Specification
0092|Semantic Agent Action Specification
0093|Semantic Agent Atomic Action Specification
0094|Semantic Agent Behavior Specification
0095|Semantic Agent Atomic Behavior Specification
0096|Semantic Agent Behavioral Type Specification
0097|Semantic Agent Behavioral Contract Specification
0098|Semantic Agent Semantic Type Specification
0099|Semantic Agent Semantic Event Type Specification
0100|Semantic Agent Semantic State Type Specification
0101|Semantic Agent Semantic Effect Specification
0102|Semantic Agent Semantic Evidence Specification
0103|Semantic Agent Semantic Proof Specification
0104|Semantic Agent Semantic Validation Specification
0105|Semantic Agent Semantic Resolution Specification
0106|Semantic Agent Semantic Routing Specification
0107|Semantic Agent Semantic Orchestration Specification
0108|Semantic Agent Semantic Choreography Specification
0109|Semantic Agent Semantic Collaboration Specification
0110|Semantic Agent Trust Relationship Specification
0111|Semantic Agent Delegation Specification
0112|Semantic Agent Communication Specification
0113|Semantic Agent Interaction Protocol Specification
0114|Semantic Agent Coordination Specification
0115|Semantic Agent Workflow Specification
0116|Semantic Agent Execution Specification
0117|Semantic Agent Observation Specification
0118|Semantic Agent Evaluation Specification
0119|Semantic Agent Learning Specification
0120|Semantic Agent Evolution Specification
0121|Semantic Agent Memory Specification
0122|Semantic Agent Knowledge Specification
0123|Semantic Agent Reasoning Specification
0124|Semantic Agent Decision Specification
0125|Semantic Agent Planning Specification
0126|Semantic Agent Workflow Composition Specification
0127|Semantic Agent Coordination Runtime Specification
0128|Semantic Agent Capability Discovery Specification
0129|Semantic Agent Delegation Resolution Specification
0130|Semantic Agent Execution Coordination Specification
0131|Semantic Agent Observation Processing Specification
0132|Semantic Agent Evaluation Criteria Specification
0133|Semantic Agent Learning Adaptation Specification
0134|Semantic Agent Memory Persistence Specification
0135|Semantic Agent Knowledge Relation Specification
0136|Semantic Agent Reasoning Process Specification
0137|Semantic Agent Decision Policy Specification
0138|Semantic Agent Planning Strategy Specification
0139|Semantic Agent Workflow Engine Specification
0140|Semantic Agent Execution Runtime Specification
0141|Semantic Agent Observation Stream Specification
0142|Semantic Agent Evaluation Engine Specification
0143|Semantic Agent Feedback Loop Specification
0144|Semantic Agent Adaptation Engine Specification
0145|Semantic Agent Learning Engine Specification
0146|Semantic Agent Memory Architecture Specification
0147|Semantic Agent Knowledge Graph Specification
0148|Semantic Agent Reasoning Engine Specification
0149|Semantic Agent Decision Engine Specification
0150|Semantic Agent Planning Engine Specification
0151|Semantic Agent Execution Engine Specification
0152|Semantic Agent Observation Engine Specification
0153|Semantic Agent Evaluation Verification Engine Specification
0154|Semantic Agent Feedback Engine Specification
0155|Semantic Agent Adaptation Runtime Engine Specification
0156|Semantic Agent Self-Improvement Engine Specification
0157|Semantic Agent Meta-Learning Engine Specification
0158|Semantic Agent Evolution Engine Specification
0159|Semantic Agent Governance Engine Specification
0160|Semantic Agent Lifecycle Engine Specification
0161|Semantic Agent Identity Engine Specification
0162|Semantic Agent Trust Engine Specification
0163|Semantic Agent Capability Engine Specification
0164|Semantic Agent Skill Engine Specification
0165|Semantic Agent Tool Engine Specification
0166|Semantic Agent Resource Engine Specification
0167|Semantic Agent Context Engine Specification
0168|Semantic Agent Memory Engine Specification
0169|Semantic Agent Knowledge Engine Specification
0170|Semantic Agent Reasoning Evaluation Engine Specification
0171|Semantic Agent Decision Selection Engine Specification
0172|Semantic Agent Goal Engine Specification
0173|Semantic Agent Intent Engine Specification
0174|Semantic Agent Constraint Engine Specification
0175|Semantic Agent Policy Engine Specification
0176|Semantic Agent Rule Engine Specification
0177|Semantic Agent Invariant Engine Specification
0178|Semantic Agent Evidence Engine Specification
0179|Semantic Agent Proof Engine Specification
0180|Semantic Agent Provenance Engine Specification
0181|Semantic Agent Audit Engine Specification
0182|Semantic Agent Event Engine Specification
0183|Semantic Agent State Engine Specification
0184|Semantic Agent Effect Engine Specification
0185|Semantic Agent Transaction Engine Specification
0186|Semantic Agent Compensation Engine Specification
0187|Semantic Agent Recovery Engine Specification
0188|Semantic Agent Self-Healing Orchestration Engine Specification
0189|Semantic Agent Human-in-the-Healing-Loop Engine Specification
0190|Semantic Agent Supervisor Engine Specification
0191|Semantic Agent Actor Runtime Engine Specification
0192|Semantic Agent Atomic Action Engine Specification
0193|Semantic AtomicBehavior Type Engine Specification
0194|Semantic Behavior-Typed Algebra Engine Specification
0195|Semantic Agent Behavioral Composition Engine Specification
0196|Semantic Agent Behavioral Resolution Engine Specification
0197|Semantic Agent Contradiction Detection Engine Specification
0198|Semantic Agent Normal Form Engine Specification
0199|Semantic Agent Formal Proof Engine Specification
0200|Semantic Agent Agda Verification Engine Specification
0201|Semantic Agent Specification Engine Specification
0202|Semantic Agent Spec-to-Action Transformation Engine Specification
0203|Semantic Agent Micro-Skill Generation Engine Specification
0204|Semantic Agent Dynamic Skill Injection Engine Specification
0205|Semantic Agent Dependency Engine Specification
0206|Semantic Agent Binding Engine Specification
0207|Semantic Agent Routing Engine Specification
0208|Semantic Agent Orchestration Engine Specification
0209|Semantic Agent Choreography Engine Specification
0210|Semantic Agent Messaging Engine Specification
0211|Semantic Agent Execution Settlement Engine Specification
0212|Semantic Agent Data Plane Engine Specification
0213|Semantic Agent Storage Adapter Engine Specification
0214|Semantic Agent State Reconstruction Engine Specification
0215|Semantic Agent Event Store Engine Specification
0216|Semantic Agent Snapshot Engine Specification
0217|Semantic Agent Checkpoint and Resume Engine Specification
0218|Semantic Agent Cost Governance Engine Specification
0219|Semantic Agent Resource Scheduling Engine Specification
0220|Semantic Agent Architecture Conformance Engine Specification
'''.strip()


RFC = dict(line.split('|', 1) for line in TITLES.splitlines())

DETAILS = {
    '0110': 'Modela relações de confiança entre agentes, identidades e participantes, sem duplicar a avaliação de confiança base definida em RFC-0076.',
    '0126': 'Define composição e dependências entre etapas de workflows, enquanto RFC-0115 define o workflow como conceito geral e RFC-0139 trata sua execução.',
    '0127': 'Define coordenação em tempo de execução entre participantes já selecionados, distinta da coordenação conceitual de RFC-0114.',
    '0129': 'Resolve delegações compatíveis e seus destinatários, distinta da declaração de delegação de RFC-0111.',
    '0130': 'Coordena a execução distribuída entre unidades, distinta da definição geral de execução de RFC-0116.',
    '0131': 'Define o fluxo contínuo de observações produzidas durante a execução.',
    '0132': 'Define critérios e métodos de avaliação, distinta da avaliação como conceito geral de RFC-0118.',
    '0133': 'Define adaptação do aprendizado a partir de resultados observados, distinta do aprendizado conceitual de RFC-0119.',
    '0134': 'Define a arquitetura de persistência e recuperação da memória, distinta da memória conceitual de RFC-0121.',
    '0135': 'Define a representação relacional de conhecimento, distinta do conhecimento conceitual de RFC-0122.',
    '0136': 'Define o processo operacional de raciocínio, distinta do raciocínio conceitual de RFC-0123.',
    '0137': 'Define decisões governadas por políticas, distinta da decisão conceitual de RFC-0124.',
    '0138': 'Define estratégias de planejamento, distinta do planejamento conceitual de RFC-0125.',
    '0139': 'Define a execução operacional de workflows, distinta do workflow conceitual de RFC-0115 e da composição de RFC-0126.',
    '0153': 'Verifica resultados de avaliação produzidos pelo engine de RFC-0142.',
    '0155': 'Executa adaptações em runtime, distinta da definição de adaptação de RFC-0144.',
    '0170': 'Avalia e compõe resultados do raciocínio, distinta do engine de raciocínio de RFC-0148.',
    '0171': 'Seleciona uma decisão final entre alternativas válidas, distinta do engine de decisão de RFC-0149.'
}

def filename(i, title):
    return f"{i}-" + re.sub(r'[^A-Za-z0-9]+', '-', title).strip('-') + '.md'

def body(i, title):
    subject = title.replace('Semantic Agent ', '').replace(' Specification', '')
    nxt = ''
    ni = f'{int(i)+1:04d}'
    if ni in RFC:
        nxt = f'\n## Próximo artefato\n\n**RFC-{ni} — {RFC[ni]}**\n'
    detail = DETAILS.get(i, f'Define o escopo semântico específico de {subject}.')
    return f'''# RFC-{i} — {title}

**Status:** Draft  
**Categoria:** AllasCode Semantic Architecture  
**Versão:** 0.1.0

## Resumo

Esta RFC formaliza **{subject}** como um artefato semântico de primeira classe do AllasCode. Seu objetivo é retirar significado de implementações implícitas e convertê-lo em contrato versionável, componível, verificável e auditável.

> **Semântica antes do mecanismo. A implementação pode mudar; o contrato semântico deve permanecer verificável.**

## Motivação

Sistemas agentivos não devem depender de significado escondido em código, prompts, infraestrutura ou convenções locais. Esta RFC delimita a responsabilidade de **{subject}**, suas relações com os demais componentes e as propriedades que uma implementação precisa demonstrar.

## Escopo semântico

{detail}

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
{subject}
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
  id: "rfc-{i}"
  canonical_label: "{re.sub(r'[^a-z0-9]+', '.', subject.lower()).strip('.')}"
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
{nxt}'''

expected_files = {filename(i, title) for i, title in RFC.items()} | {'INDEX.md', 'README.md'}
stale_files = {p.name for p in OUT.glob('*.md')} - expected_files
index = ['# Semantic RFC Index', '']
for i, title in RFC.items():
    index.append(f'- [RFC-{i} — {title}]({filename(i, title)})')
expected_index = '\n'.join(index) + '\n'

if '--check' in sys.argv:
    mismatches = sorted(stale_files)
    for i, title in RFC.items():
        path = OUT / filename(i, title)
        if not path.exists() or path.read_text(encoding='utf-8') != body(i, title):
            mismatches.append(path.name)
    if not (OUT / 'INDEX.md').exists() or (OUT / 'INDEX.md').read_text(encoding='utf-8') != expected_index:
        mismatches.append('INDEX.md')
    if mismatches:
        print('Generated RFC drift detected:')
        for item in sorted(set(mismatches)): print(f' - {item}')
        raise SystemExit(1)
    print(f'RFC collection is up to date: {len(RFC)} RFCs')
    raise SystemExit(0)

for name in stale_files: (OUT / name).unlink()
for i, title in RFC.items():
    (OUT / filename(i, title)).write_text(body(i, title), encoding='utf-8')
(OUT / 'INDEX.md').write_text(expected_index, encoding='utf-8')
print(f'Generated {len(RFC)} RFCs in {OUT}')
\n# Exact content equality is enforced by --check.\n