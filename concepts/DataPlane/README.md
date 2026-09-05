# Fitness Self-Driven Evolutionary Data Plane

O **Fitness Self-Driven Evolutionary Data Plane (FSEDP)** é o modelo de Data Plane do AllasCode no qual a realização física de persistência é tratada como uma variável evolutiva.

O significado do sistema pertence ao **Semantic Contract**.  
A tecnologia pertence aos **Adapters**.  
A mudança é julgada pelas **Fitness Functions**.  
A decisão pertence ao **Evolution Contract**.  
Toda afirmação necessária para promoção deve ser sustentada por **Evidence produzida no contexto corrente**.

## Regra central

> Nenhuma tecnologia é promovida por reputação, benchmark externo ou preferência arquitetural. Uma implementação física só pode substituir outra quando produzir evidência local e atual de que satisfaz os contratos e objetivos vigentes.

Benchmarks, papers, catálogos e outras fontes externas podem descobrir candidatos, mas seus resultados não são considerados Fitness Evidence.

## Fronteira semântica

Durante uma Evaluation Epoch:

```text
Semantic Contract = immutable
Evolution Contract = immutable version
Physical Implementation = evolvable
```

Uma mudança incompatível no Semantic Contract inicia outra versão semântica e uma nova Evaluation Epoch.

## Modelo

```text
Semantic Contract
       ↓
Effect / Port
       ↓
Adapter
       ↓
Physical Data Technology
```

Adapters diferentes podem implementar o mesmo Effect desde que demonstrem equivalência semântica.

## Ciclo

```text
Discover
→ Register Candidate
→ Capture Current Context
→ Sandbox
→ Replay Current Workload
→ Execute Fitness Suite
→ Produce Evidence Bundle
→ Evaluate Evolution Contract
→ Promote | Defer | Reject | Supersede
```

Evidência histórica pode ser usada para aprendizado, descoberta e análise longitudinal, mas não autoriza uma mutação corrente.

## Modos

### Postgres

Restringe o espaço de busca ao PostgreSQL e às transformações permitidas sobre ele.

### Stable Polyglot

Permite um conjunto explicitamente aprovado de tecnologias especializadas.

### Evidence-Optimized

Permite qualquer tecnologia elegível, independentemente de popularidade, desde que ela passe pelos mesmos contratos, invariantes e mecanismos de evidência.

O modo controla o espaço de busca. O Evolution Contract controla a decisão.

## Artefatos

- [Definição formal](./concept.md)
- [Evolution Contract](./examples/evolution-contract.yaml)
- [Fitness Suite](./examples/fitness-suite.yaml)
- [Candidate](./examples/candidate.yaml)
- [Evidence Bundle](./examples/evidence-bundle.yaml)

## Relação com Semantics

Este conceito compõe-se com os artefatos semânticos existentes do AllasCode, em especial:

- `Invariant`
- `Policy`
- `Evidence`
- `Semantic Effect`

O Data Plane não redefine esses conceitos. Ele os especializa para evolução de persistência e infraestrutura de dados.
