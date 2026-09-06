# Everything as Code para Sistemas

## Resumo

Everything as Code (EaC) é o princípio segundo o qual a definição normativa de um sistema deve possuir representação formal, versionável, validável e reproduzível no próprio sistema de código. O objetivo não é transformar todo dado em código, nem confundir estrutura de diretórios com formalização. O critério central é permitir reconstruir o comportamento normativo do sistema a partir de suas definições formais e de dependências externas explicitamente declaradas.

A tese central é:

> Se algo é necessário para determinar o que o sistema é ou como ele deve se comportar, esse algo precisa ser formalmente representado, ou precisa ser declarado como um oráculo normativo com identidade, contrato e semântica verificável.

EaC distingue:

- **CODE**: definições do sistema — estrutura, comportamento, regras, contratos, tipos, invariantes, estados, eventos, capacidades, políticas, relações e propriedades não funcionais normativas.
- **DATA**: estado produzido em runtime — eventos ocorridos, registros, conteúdo, observações e demais fatos produzidos pela execução.

Um pedido concreto é dado. A definição dos estados válidos de um pedido e das transições permitidas é código.

---

## 1. Modelo formal mínimo

Seja:

- `K_normative`: conhecimento necessário para determinar o comportamento normativo;
- `F`: conjunto de definições formais internas do sistema;
- `O`: conjunto de oráculos declarados;
- `TCB`: Trusted Semantic Computing Base, isto é, o conjunto mínimo de checkers, runtimes e interpretadores cuja semântica é assumida pelo sistema.

EaC não exige o fechamento absoluto impossível `K_normative = ∅` fora do código. Exige **fechamento relativo**:

`K_normative ⊆ F ∪ O`

com a obrigação adicional de que todo `o ∈ O` possua:

- identidade estável;
- contrato formal;
- tipo de autoridade;
- entradas e saídas;
- condições de validade;
- política de falha;
- versão ou mecanismo de evolução;
- mecanismo verificável de integração com o sistema.

Relógio, RNG, decisão humana, serviço externo, hardware, modelo de linguagem e outros fatores não determinísticos podem existir, mas não podem permanecer como conhecimento normativo implícito.

A regressão semântica termina na `TCB`. O sistema deve declarar explicitamente onde uma definição deixa de ser refinada internamente e passa a ser confiada a um checker executável.

---

## 2. Cinco axiomas normativos

As antigas leis numeradas são substituídas por cinco axiomas com IDs estáveis. Regras mais específicas são teoremas, corolários ou obrigações derivadas desses axiomas.

### EAC-A-CLOSURE — Fechamento Normativo Relativo

Toda informação necessária para determinar o comportamento normativo deve estar formalmente representada no sistema ou declarada como oráculo normativo.

Consequências:

- regras de negócio não podem depender apenas de documentação humana;
- configurações manuais não declaradas não podem alterar semântica normativa;
- dependências externas normativas precisam ser explicitadas;
- comportamento não determinístico definido é permitido; comportamento não definido não é.

### EAC-A-CANON — Canonicidade e Refinamento

Cada conceito normativo possui uma fonte canônica e toda representação derivada deve possuir relação verificável com essa fonte.

Não é suficiente manter manualmente três representações equivalentes em paralelo. Deve existir uma relação como:

`CanonicalSpec ⊒ Implementation`

`CanonicalSpec ⊒ Tests`

`CanonicalSpec ⊒ DocumentationProjection`

A relação pode ser garantida por geração, type checking, proof checking, model checking, schema validation, mutation testing, conformance testing ou outro checker explicitamente declarado.

Coincidência textual não constitui refinamento.

### EAC-A-DECIDE — Decidibilidade Operacional dos Predicados Normativos

Todo predicado que bloqueia, permite, valida, classifica ou altera comportamento normativo precisa possuir mecanismo automático de decisão dentro da TCB declarada.

Exemplos:

- preconditions;
- postconditions;
- invariantes;
- autorização;
- state transitions;
- contratos;
- regras de negócio;
- políticas de segurança;
- SLOs normativos;
- limites de custo quando eles determinam comportamento.

Um texto declarativo sem checker não satisfaz este axioma.

### EAC-A-IDENTITY — Identidade Semântica

Todo elemento normativamente relevante deve possuir identidade semântica estável independente de posição física, número ordinal ou detalhe acidental de implementação.

Isso inclui Entity, Action, Behavior, Capability, Event, Intent, State, Property, Rule, Policy, Contract e Law.

Por isso, IDs como `EAC-A-CLOSURE` e `EAC-T-ACTION-RESULT` são normativos; "Lei 7" não deve ser usada como identidade primária.

### EAC-A-EVOLUTION — Evolução Rastreável e Semântica Retroativa

Toda mudança normativa precisa declarar impacto sobre artefatos, evidências, dados e decisões produzidos por versões anteriores.

Uma alteração de `N` para `N+1` deve permitir responder:

- quais decisões antigas continuam válidas;
- quais evidências expiram ou são revogadas;
- quais projeções precisam ser recalculadas;
- quais dados precisam ser reinterpretados, migrados ou preservados sob a semântica antiga;
- qual versão da definição governou cada fato produzido.

Rastreabilidade de commit, sozinha, não é suficiente para retroatividade semântica.

---

## 3. Teoremas e obrigações derivadas

### EAC-T-EXPLICIT — Explicitabilidade Semântica

Deriva de `EAC-A-CLOSURE` e `EAC-A-IDENTITY`.

Comportamentos relevantes não podem depender de convenções informais sem representação formal.

### EAC-T-TYPING — Tipagem Semântica

Deriva de `EAC-A-IDENTITY` e `EAC-A-DECIDE`.

Dados que participam de comportamento normativo devem carregar significado suficiente para distinguir conceitos estruturalmente semelhantes, como `Email`, `PhoneNumber`, `OrderId`, `Money` e `Currency`.

### EAC-T-INVARIANT — Invariantes Codificados

Deriva de `EAC-A-CANON` e `EAC-A-DECIDE`.

Toda condição obrigatória deve possuir representação verificável e mecanismo de enforcement ou rejeição.

### EAC-T-ATOMIC — Atomicidade Comportamental

Deriva de `EAC-A-IDENTITY`.

Comportamentos semanticamente distintos devem poder ser identificados como unidades formais. Atomicidade semântica não implica distribuição física.

### EAC-T-ACTION-RESULT — Ação → Resultado

Toda Action formal deve possuir resultado semanticamente identificável:

`Action : Input → Result`

O resultado pode representar Success, Failure, StateChange, Event, Value ou Entity, mas seus efeitos normativos não podem permanecer implícitos.

### EAC-T-STATE — Estados e Transições Codificados

Estados relevantes e transições permitidas/proibidas devem ser representados formalmente.

### EAC-T-EVENT — Eventos Semanticamente Definidos

Todo evento normativo deve declarar pelo menos identidade, produtor, significado, payload, versão e contrato de consumo.

### EAC-T-CONTRACT — Contratos Codificados

Fronteiras comportamentais devem declarar Input, Output, Preconditions, Postconditions, Errors, StateEffects, Events e Capabilities aplicáveis.

### EAC-T-CAPABILITY — Capacidades Explícitas

Autorização comportamental deve ser representada como relação explícita entre ator, capacidade e ação, e não como convenções dispersas.

### EAC-T-RECONSTRUCTION — System Reconstruction Test

Um sistema satisfaz o Reconstruction Test quando um consumidor autorizado consegue reconstruir seu comportamento normativo sem depender de conhecimento humano externo não declarado.

Diretórios, READMEs placeholders e nomenclatura arquitetural não contam como implementação normativa.

### EAC-T-BEHAVIORAL-CLOSURE — Behavioral Closure

O conjunto de comportamentos normativos observáveis deve ser explicável pelas definições formais e pelos oráculos declarados:

`ObservableNormativeBehavior ⊆ Semantics(F, O, TCB)`

Se um comportamento relevante só pode ser explicado por convenção humana, configuração escondida ou serviço externo não declarado, o sistema não possui fechamento comportamental.

---

## 4. Relação de refinamento como mecanismo de primeira classe

EaC exige distinguir três estados:

1. **specification** — o que deve ocorrer;
2. **implementation** — o que o runtime executa;
3. **evidence** — por que aceitamos que implementação refina a especificação.

A obrigação central é:

`Evidence ⊢ Implementation refines Specification`

O checker pode ser formal ou empírico, desde que não finja força que não possui.

Exemplos válidos de evidência:

- prova Agda realmente executada com `agda --safe`;
- model checking;
- property-based testing;
- semantic mutation testing;
- contract conformance tests;
- content-addressed attestations;
- selective semantic tests derivados de impacto.

Mutation score de invariantes declaradas é evidência empírica de refinamento, não prova matemática. O status deve refletir exatamente isso.

---

## 5. Evidência verificável

Um artefato de evidência não pode afirmar `verified_by: X` apenas porque existe um arquivo associado a X.

Estados normativos recomendados:

- `unproven`: existe uma claim, mas não há checker executado;
- `empirically-validated`: existe validação automatizada empírica;
- `formally-verified`: proof checker executado com sucesso sobre o artefato correspondente;
- `expired`: evidência excedeu sua validade temporal;
- `revoked`: evidência foi explicitamente invalidada.

Uma evidência formal deve registrar no mínimo:

- digest dos inputs;
- digest da especificação;
- digest da implementação;
- checker e versão;
- comando ou método de verificação;
- timestamp;
- validade/expiração;
- attestation/trust class quando aplicável;
- relação de impacto semântico.

Content-addressed evidence com expiração e revogação permite levar conceitos de provenance e supply-chain attestation para semântica de domínio, não apenas para build artifacts.

---

## 6. Conhecimento normativo não funcional

Latência, custo, segurança, disponibilidade, consumo de memória e outros atributos são normativos quando sua violação altera decisões ou comportamento do sistema.

Por exemplo:

- se uma Action deixa de ser escolhida acima de determinado custo, custo é normativo;
- se um SLO força fallback, o SLO é normativo;
- se postura de segurança bloqueia determinado canal, a política de segurança é normativa.

Esses predicados entram em `K_normative` e ficam sujeitos aos mesmos axiomas.

---

## 7. Níveis de conformidade EaC

EaC não é apenas binário. O sistema pode evoluir por níveis.

### Level 0 — Conventional

Comportamento normativo distribuído entre código, documentação, convenções e operações manuais.

### Level 1 — Declared

Conceitos normativos principais possuem representação explícita, mas ainda não há canonicidade ou enforcement completo.

### Level 2 — Canonical

Cada conceito relevante possui fonte canônica e identidades estáveis; duplicações precisam declarar relação de derivação.

### Level 3 — Executable

Predicados normativos principais possuem checkers executáveis e CI capaz de impedir violações conhecidas.

### Level 4 — Evidence-Backed

Conformidade entre spec e implementation produz evidência verificável, rastreável e content-addressed, com validade e revogação.

### Level 5 — Reconstructable & Closed

O sistema passa o Reconstruction Test e demonstra Behavioral Closure relativo aos oráculos e à TCB declarados, incluindo evolução e retroatividade semântica.

A classificação pode ser aplicada por componente; um repositório não deve declarar Level 5 global se partes normativas permanecem apenas como placeholders.

---

## 8. Conformidade do próprio Blueprint

O Blueprint deve obedecer às mesmas regras que define.

Regras obrigatórias:

1. Uma pasta com README de uma linha representa intenção estrutural, não capability implementada.
2. Backends vazios ou placeholders devem ser classificados como `planned`, `stub` ou equivalente, nunca como implementados.
3. Arquivos `.valid` só podem usar estado de verificação que tenha sido produzido por checker executado.
4. Claims formais sem checker ficam `unproven`.
5. Dependências normativas externas precisam ser declaradas como oráculos ou internalizadas no repositório.
6. Workflows gerados não podem apontar para fontes normativas inexistentes.
7. CI deve produzir evidência e não apenas citar uma ferramenta formal.
8. Toda feature marcada como existente deve linkar implementação, exemplo de consumo e teste/evidência correspondente.

---

## 9. Prior art e posicionamento

EaC deve ser posicionado explicitamente em relação a áreas preexistentes, sem alegar substituí-las:

- Model-Driven Architecture / MOF;
- B e Event-B / refinement;
- Alloy;
- TLA+;
- Design by Contract;
- policy-as-code, incluindo OPA/Rego;
- configuration languages como CUE e Dhall;
- AsyncAPI e contratos orientados a eventos;
- software supply-chain attestation, como in-toto/SLSA.

O diferencial pretendido de EaC não é "modelar tudo". É combinar:

1. fechamento normativo relativo;
2. identidade semântica canônica;
3. relação explícita de refinamento;
4. reconstruibilidade;
5. evidência semântica verificável e content-addressed;
6. seleção de validação orientada por impacto semântico;
7. retroatividade semântica durante evolução.

Essas relações precisam ser sustentadas por referências e comparação técnica específica antes de qualquer claim acadêmica de novidade.

---

## 10. Checklist executável de classificação

Um componente só pode avançar de nível quando todas as obrigações do nível anterior forem satisfeitas.

Checklist mínimo:

- [ ] identidades normativas estáveis;
- [ ] fonte canônica por conceito;
- [ ] oráculos normativos declarados;
- [ ] TCB declarada;
- [ ] invariantes verificáveis;
- [ ] contratos executáveis;
- [ ] relação Spec → Implementation definida;
- [ ] testes ou proofs materializados a partir da semântica ou vinculados por checker de conformidade;
- [ ] evidência com provenance;
- [ ] nenhum `.valid` sem validação real;
- [ ] semantic impact capaz de selecionar verificações relevantes;
- [ ] merge gate bloqueando violações protegidas;
- [ ] política de retroatividade para mudanças normativas;
- [ ] Reconstruction Test executável ou auditável;
- [ ] Behavioral Closure demonstrável relativo a `O` e `TCB`.

---

## Conclusão

Everything as Code para sistemas não significa "tudo em YAML" e não significa que todo runtime state seja código. Significa que o conhecimento necessário para determinar o comportamento normativo possui fonte formal, identidade estável, mecanismo de decisão e relação rastreável com sua implementação.

A classificação forte de EaC não decorre da quantidade de arquivos formais presentes em um repositório. Ela decorre da capacidade de demonstrar:

`Definition → Refinement → Execution → Evidence → Reconstruction`

com dependências externas explicitamente fechadas por contrato.

Esse é o critério que separa documentação estruturada de uma arquitetura realmente governada por semântica como código.
