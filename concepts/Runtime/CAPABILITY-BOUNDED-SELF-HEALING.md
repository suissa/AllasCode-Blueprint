# Capability-Bounded Read-Only Self-Healing

## 1. Objetivo

O AllasCode adota uma fronteira explícita entre **liberdade de solução** e **autoridade de mutação**.

Um Agent pode raciocinar livremente sobre a solução, ler contratos, Skills, schemas, invariants, testes e evidências disponíveis, mas não recebe autoridade genérica para modificar o sistema.

A autoridade de escrita é concedida pelo Runtime como uma **Capability operacional mínima**, aplicada também no nível do sistema operacional.

O princípio é:

> **Não limitar a criatividade do Agent ao enumerar soluções permitidas; limitar rigorosamente quais recursos ele possui autoridade para modificar.**

Em particular, o mecanismo de healing possui apenas duas superfícies mutáveis:

```text
CodeHealerAgent   -> */implementation.zig
SystemHealerAgent -> Blueprint/config/core.yml
```

Todo o restante é read-only para esses Agents.

---

## 2. Capability não é apenas uma instrução para a LLM

No AllasCode, uma Capability de escrita não deve existir apenas como texto em prompt, documentação ou política interpretada pelo Agent.

Ela deve ser materializada como uma propriedade executável do Runtime.

Portanto:

```text
Semantic Capability
        ↓
Runtime Resolution
        ↓
Execution Identity
        ↓
Filesystem View
        ↓
OS Permissions / Namespace
        ↓
Allowed Mutation Surface
```

O Agent não é considerado confiável para preservar sozinho a fronteira.

A fronteira é responsabilidade do Runtime e do sistema operacional.

### Propriedade fundamental

Definimos:

```text
WritableSet(agent, execution)
```

como o conjunto exato de recursos que uma execução pode modificar.

Uma escrita é admissível somente quando:

```text
path ∈ WritableSet(agent, execution)
```

Qualquer tentativa fora desse conjunto deve falhar antes de alterar o recurso protegido.

---

## 3. Regra de mutabilidade

Para o mecanismo de self-healing, o AllasCode distingue dois tipos de erro que podem exigir mutação automática.

### 3.1 Erro de implementação

É um erro corrigível pela implementação física de uma Atomic Action sem alterar seu contrato semântico.

A única superfície mutável é:

```text
*/implementation.zig
```

O contrato da Action, schemas, invariants, eventos, testes, Skills e demais definições permanecem imutáveis para o Agent.

### 3.2 Erro de sistema

É um erro decorrente de configuração operacional do sistema, sem necessidade de alterar a implementação de uma Action.

A única superfície mutável é:

```text
Blueprint/config/core.yml
```

O `SystemHealerAgent` não possui autoridade para modificar código.

### 3.3 Conjuntos disjuntos

A arquitetura exige:

```text
WritableSet(CodeHealerAgent)
∩
WritableSet(SystemHealerAgent)
=
∅
```

Nenhum healer pode modificar simultaneamente implementação e configuração.

Essa separação preserva causalidade: uma correção pode ser atribuída claramente a uma alteração de código ou a uma alteração de configuração.

---

## 4. CodeHealerAgent

O `CodeHealerAgent` é responsável exclusivamente por produzir novas implementações candidatas para Atomic Actions.

Sua autoridade é:

```text
READ:
- contrato da Action
- Skill da Action
- schemas
- invariants
- tipos
- documentação
- testes unitários visíveis
- evidências de falha permitidas pelo Runtime

WRITE:
- implementation.zig

NO WRITE:
- testes
- manifests
- schemas
- invariants
- eventos
- contratos
- Skills
- runtime
- configurações globais
- outras Actions
- integração
- acceptance suite
```

O `CodeHealerAgent` não altera a definição de sucesso.

Ele apenas propõe uma implementação capaz de satisfazer uma definição de sucesso externa e imutável.

### Regra

```text
CodeHealerAgent proposes.
Runtime validates.
Verifier accepts or rejects.
Runtime promotes.
```

O Agent que produz a solução não possui autoridade para promovê-la.

---

## 5. SystemHealerAgent

O `SystemHealerAgent` é responsável exclusivamente por corrigir parâmetros operacionais declarados como healable.

Sua autoridade é:

```text
READ:
- Blueprint/config/core.yml
- schema da configuração
- constraints
- evidências de execução
- métricas e traces permitidos
- falhas classificadas como sistêmicas

WRITE:
- Blueprint/config/core.yml

NO WRITE:
- implementation.zig
- código-fonte
- contratos
- schemas de domínio
- invariants
- testes
- manifests
- fluxos
- Actions
```

Mesmo dentro de `core.yml`, o Runtime pode restringir propriedades específicas por schema ou policy.

Uma propriedade somente pode ser alterada automaticamente quando for declarada como healable.

Portanto, a autorização lógica é mais restrita que a simples permissão de escrita física no arquivo.

---

## 6. Classificação de falhas

O mecanismo de healing não deve forçar toda falha a ser imediatamente classificada como erro de código ou erro de sistema.

A classificação mínima é:

```text
CodeFault
SystemFault
UnknownFault
```

### CodeFault

A evidência indica que a implementação física de uma Action não satisfaz seu contrato ou suas propriedades operacionais.

Destino:

```text
CodeHealerAgent
```

### SystemFault

A evidência indica que a implementação continua semanticamente válida, mas a configuração operacional impede execução correta, segura ou eficiente.

Destino:

```text
SystemHealerAgent
```

### UnknownFault

Não há evidência suficiente para conceder autoridade de escrita a nenhum healer.

O sistema deve executar diagnóstico adicional sem mutação.

Isso impede que um healer altere o sistema apenas para descobrir a origem do problema por tentativa e erro.

---

## 7. Healers não delegam autoridade entre si

O `CodeHealerAgent` não chama diretamente o `SystemHealerAgent` para modificar configuração, e o `SystemHealerAgent` não chama diretamente o `CodeHealerAgent` para modificar código.

Um healer pode produzir evidência sugerindo reclassificação.

Exemplo conceitual:

```text
CodeHealerAgent
      ↓
PossibleSystemConfigurationFault evidence
      ↓
Healing Supervisor
      ↓
reclassification
      ↓
SystemHealerAgent
```

A mudança de domínio de autoridade é decidida pelo Runtime/Healing Supervisor, nunca pelo healer atual.

---

## 8. Read-only deve ser uma propriedade do SO

Arquivos protegidos não devem ser apenas considerados read-only por convenção.

O Runtime deve construir uma visão de filesystem em que recursos protegidos sejam realmente não graváveis para a identidade de execução do Agent.

A implementação pode utilizar mecanismos como:

- usuário/UID não privilegiado por Agent ou identidade de execução;
- ownership separado entre Runtime e Agent;
- permissões de filesystem;
- read-only bind mounts;
- mount namespaces;
- Landlock ou mecanismo equivalente de restrição de paths;
- remoção de Linux capabilities não necessárias;
- ausência de privilege escalation;
- filesystem temporário isolado por ExecutionID.

A propriedade exigida é independente do mecanismo usado:

> **Uma tentativa de mutação fora do WritableSet deve ser negada pelo Runtime/OS antes que o estado protegido seja modificado.**

---

## 9. AgentID, UID e ExecutionID

A identidade conceitual do Agent não deve ser confundida com a identidade técnica usada pelo sistema operacional.

O modelo recomendado é:

```text
AgentID
= identidade lógica e semântica do Agent

UID/GID ou Security Principal
= identidade de segurança usada para aplicar permissões

ExecutionID
= isolamento de uma execução específica
```

Um mesmo `AgentID` pode possuir múltiplas execuções simultâneas, cada uma com seu próprio namespace e superfície de recursos.

O Runtime é executado sob uma identidade privilegiada separada e nunca compartilha sua autoridade com o Agent.

---

## 10. Layout físico e recursos imutáveis

Os arquivos canônicos podem ser armazenados em uma árvore controlada exclusivamente pelo Runtime.

Exemplo conceitual:

```text
/runtime-store/actions/<ActionID>/
  contract/
  schemas/
  invariants/
  skills/
  tests/
  implementation.zig
```

O workspace entregue ao Agent é uma visão derivada dessa árvore.

```text
workspace/action/
  contract/...            RO
  schemas/...             RO
  invariants/...          RO
  skills/...              RO
  tests/unit/...          RO
  implementation.zig      RW para CodeHealerAgent
```

Para o `SystemHealerAgent`:

```text
workspace/system/
  Blueprint/config/core.yml   RW
  demais arquivos             RO
```

---

## 11. Symlinks não são a fronteira de segurança

Links simbólicos podem ser usados para compor uma visão conveniente do workspace, mas não devem ser a principal fronteira de segurança.

A permissão efetiva é determinada pelo alvo e pelo diretório que contém o link.

Se o Agent puder escrever no diretório onde o symlink existe, ele poderá tentar remover o link e criar outro arquivo com o mesmo nome, alterando a visão local de ferramentas que resolvem aquele path.

Portanto:

```text
symlink = mecanismo de composição
OS boundary = mecanismo de segurança
```

Quando symlinks forem usados, tanto o alvo quanto a estrutura de diretórios relevante devem preservar a fronteira de escrita definida pelo Runtime.

---

## 12. Git por Action

Cada Action pode possuir histórico Git independente para registrar a evolução de sua implementação.

Entretanto, o Agent não deve receber escrita sobre `.git`.

O modelo é:

```text
Agent
  ↓
modifica implementation.zig
  ↓
Runtime detecta mudança
  ↓
validação
  ↓
Runtime gera commit
```

O commit pode registrar:

- AgentID;
- ExecutionID;
- ActionID;
- hash anterior;
- hash candidato;
- causa da tentativa;
- evidência usada;
- resultados de testes;
- resultado de integração;
- acceptance/conformance;
- decisão de promoção ou rejeição.

O Git é mecanismo de proveniência e recuperação, não a principal barreira de segurança.

---

## 13. Git reset como defesa adicional

Se um recurso protegido aparecer alterado apesar das restrições de SO, isso representa uma violação da fronteira de execução.

O Runtime pode restaurar o workspace com Git como última linha de defesa, mas a sequência correta é:

```text
OS / namespace      -> prevenção
Landlock / policy   -> contenção adicional
Git diff            -> detecção
Git reset --hard    -> recuperação
Event Sourcing      -> auditoria
```

Um reset não deve apagar silenciosamente a evidência da tentativa.

A violação deve gerar um evento auditável, por exemplo:

```text
Action.WriteBoundaryViolation.Error
```

contendo, quando permitido:

- AgentID;
- ExecutionID;
- ActionID;
- path alvo;
- operação solicitada;
- timestamp;
- processo responsável;
- política/capability violada.

---

## 14. Save de implementation.zig dispara validação

O `CodeHealerAgent` não controla o ciclo de validação.

Ao salvar `implementation.zig`, o Runtime executa automaticamente a cadeia de avaliação configurada.

```text
implementation.zig saved
        ↓
syntax/build validation
        ↓
visible unit tests
        ↓
hidden integration tests
        ↓
sealed acceptance/conformance
        ↓
HealingVerifier
        ↓
accept | reject | quarantine
```

O Agent pode ler os testes unitários necessários para compreender o contrato local.

Os testes de integração e acceptance não precisam existir dentro da pasta da Action e podem permanecer fora da superfície de leitura do Agent.

Isso impede que a implementação seja construída apenas para reproduzir detalhes acidentais de um fluxo completo conhecido.

---

## 15. Testes ocultos e vazamento por feedback

Um teste oculto deixa de ser efetivamente oculto se o Agent puder fazer tentativas ilimitadas e receber detalhes suficientes para reconstruí-lo.

Por isso a arquitetura distingue níveis de feedback.

### Development / unit tests

Feedback detalhado pode ser fornecido.

Objetivo: permitir correção local rápida.

### Integration tests

Feedback pode ser parcial e orientado à propriedade violada.

Objetivo: verificar comportamento dentro de fluxos que o Agent não controla.

### Acceptance / conformance

Feedback deve ser mínimo o suficiente para evitar reconstrução do conjunto selado.

Objetivo: decidir promoção, não ensinar o candidato a memorizar o evaluator.

O princípio é:

> **O evaluator não pode se transformar em uma API de extração dos próprios testes.**

---

## 16. HealingVerifier

A entidade que propõe uma mudança não valida sua própria proposta.

O `HealingVerifier` não possui autoridade para modificar código ou configuração.

Ele recebe:

- estado anterior;
- mudança candidata;
- evidência da falha;
- resultados de testes;
- resultados de integração;
- resultados de acceptance/conformance;
- invariants aplicáveis.

E produz uma decisão verificável:

```text
accept
reject
quarantine
needs-human
```

A promoção final pertence ao Runtime.

### Invariant

```text
Proposer(change) != AuthorityThatPromotes(change)
```

---

## 17. Causalidade do self-healing

A restrição de superfícies mutáveis reduz o número de variáveis que podem explicar uma mudança de comportamento.

Se uma execução de healing altera somente `implementation.zig`, a diferença de comportamento pode ser atribuída à implementação candidata dentro das demais condições registradas.

Se uma execução altera somente `core.yml`, a diferença pode ser atribuída à configuração candidata dentro das demais condições registradas.

Isso produz evidência mais limpa para aprendizagem futura.

```text
Failure Evidence
      ↓
Single Mutation Domain
      ↓
Validation Evidence
      ↓
Causal Attribution
      ↓
Healing Knowledge
```

---

## 18. Experiência acumulada sem reduzir o espaço de exploração

O histórico de healing pode influenciar semanticamente tentativas futuras sem transformar experiências anteriores em proibições rígidas.

O Runtime pode acumular conhecimento como:

```text
- esta classe de falha foi corrigida anteriormente por uma mudança de implementação;
- este padrão de implementação quebrou idempotência;
- esta otimização reduziu latência mas violou uma invariant;
- este parâmetro de configuração resolveu congestionamento sob determinado regime;
- esta alteração de timeout mascarou um CodeFault e deve ter baixa prioridade;
```

Esse conhecimento altera a prioridade de hipóteses, não a autoridade de escrita.

Assim:

```text
Invariants      -> limites duros
Capabilities    -> autoridade operacional
Knowledge       -> prioridade de exploração
Agent           -> geração de soluções
Evidence        -> atualização do conhecimento
```

---

## 19. Invariants arquiteturais

O Runtime deve preservar pelo menos as seguintes invariants.

### INV-HEAL-001 — Minimal Write Surface

Nenhum healer recebe escrita fora de sua superfície declarada.

### INV-HEAL-002 — Disjoint Healing Authority

`CodeHealerAgent` e `SystemHealerAgent` possuem conjuntos de escrita disjuntos.

### INV-HEAL-003 — Code Healing Scope

O `CodeHealerAgent` só pode modificar `implementation.zig` das Actions explicitamente autorizadas para a execução.

### INV-HEAL-004 — System Healing Scope

O `SystemHealerAgent` só pode modificar `Blueprint/config/core.yml`, respeitando ainda as propriedades declaradas como healable.

### INV-HEAL-005 — Immutable Evaluator

Nenhum healer pode modificar testes, acceptance, conformance, invariants ou mecanismos usados para decidir a validade da própria mudança.

### INV-HEAL-006 — Independent Promotion

Nenhum healer pode promover sua própria alteração.

### INV-HEAL-007 — OS-Enforced Boundary

A restrição de escrita deve ser aplicada por mecanismo externo ao raciocínio do Agent, preferencialmente pelo Runtime e pelo sistema operacional.

### INV-HEAL-008 — Violation Is Evidence

Uma tentativa de escrita fora do WritableSet deve gerar evidência auditável e invalidar ou colocar em quarentena a execução conforme política.

### INV-HEAL-009 — Git Metadata Isolation

O Agent não recebe autoridade de escrita sobre o repositório Git que registra sua própria evolução.

### INV-HEAL-010 — Unknown Does Not Mutate

Uma falha não classificada não concede automaticamente autoridade de mutação a nenhum healer.

---

## 20. Modelo resumido

```text
                  Failure
                     ↓
             Healing Supervisor
                     ↓
        ┌────────────┼────────────┐
        ↓            ↓            ↓
    CodeFault    SystemFault   UnknownFault
        ↓            ↓            ↓
CodeHealerAgent  SystemHealer   Diagnose Only
        ↓            ↓
implementation   core.yml
    .zig             ↓
        └──────┬─────┘
               ↓
        Automatic Validation
               ↓
        HealingVerifier
               ↓
      Runtime Promotion
               ↓
       Evidence + History
```

---

## 21. Regra arquitetural final

O mecanismo pode ser resumido em quatro frases:

> **O Agent pode explorar soluções livremente, mas não pode escolher sua própria superfície de mutação.**

> **O CodeHealerAgent modifica somente implementação.**

> **O SystemHealerAgent modifica somente configuração sistêmica.**

> **A validade e a promoção da mudança permanecem fora da autoridade de ambos.**
