Everything as a Code para Sistemas

Resumo

Everything as a Code (EaC) é normalmente apresentado como uma extensão dos princípios de as Code: aquilo que define um sistema deve ser representado como código, submetido a controle de versão, validação, testes e automação. As definições existentes, entretanto, geralmente abrangem infraestrutura, pipelines e operação, tornando pouco precisa a aplicação do conceito exclusivamente ao desenvolvimento de sistemas.

Este artigo propõe uma definição restrita de Everything as a Code aplicado ao sistema, na qual o objeto de codificação é exclusivamente o sistema de software: sua estrutura, comportamento, dados semânticos, contratos, regras, estados, eventos, ações, capacidades, políticas internas e relações entre esses elementos.

O objetivo não é simplesmente colocar arquivos em um repositório. Um sistema somente pode ser classificado como Everything as a Code quando sua implementação possui informação suficiente para reconstruir seu comportamento sem depender de conhecimento implícito, configuração manual ou documentação externa como fonte normativa.

A tese central é:

«Se algo é necessário para determinar o que o sistema é ou como ele se comporta, então esse algo deve possuir uma representação formal dentro do código do sistema.»

---

1. Definição

Para este artigo:

Everything as a Code para sistemas é o princípio segundo o qual toda informação normativa necessária para definir a estrutura, o comportamento e as relações internas de um sistema deve possuir uma representação formal, versionável, validável e reproduzível no próprio código do sistema.

Isso não significa que absolutamente todos os dados existentes no sistema precisem ser código.

É necessário distinguir:

Definição do sistema
        ↓
      CODE
        ↓
Estrutura + comportamento + regras + contratos + semântica

Estado produzido pelo sistema
        ↓
      DATA
        ↓
Eventos ocorridos + registros + conteúdo produzido em runtime

Um pedido de usuário, por exemplo, é dado.

A definição de que um pedido pode possuir determinado estado é código.

O pedido "12345" é dado.

A definição de que um pedido pode transicionar de "pending" para "paid" sob determinadas condições é código.

Essa distinção é fundamental para evitar transformar EaC em uma tentativa de transformar todo dado em código.

---

2. O problema dos sistemas convencionais

Um sistema tradicional normalmente possui múltiplas fontes de verdade.

Por exemplo:

Código
 ├── comportamento
 ├── validações
 └── processamento

Banco de dados
 ├── schema
 └── constraints

Configuração
 ├── parâmetros
 └── flags

Documentação
 ├── regras
 └── contratos

Conhecimento dos desenvolvedores
 ├── decisões arquiteturais
 └── comportamentos implícitos

Testes
 └── exemplos de comportamento

Convenções
 └── comportamento não declarado

Consequentemente, o comportamento efetivo do sistema pode ser:

SystemBehavior =
    Code
  + Configuration
  + DatabaseRules
  + ImplicitConventions
  + ExternalKnowledge
  + RuntimeAssumptions

Isso produz uma propriedade problemática:

Código ≠ especificação completa do sistema

O sistema existe parcialmente no código e parcialmente fora dele.

A proposta de EaC é eliminar essa fragmentação da especificação normativa.

O objetivo passa a ser:

SystemBehavior = FormalSystemDefinition(Code)

Os dados de runtime continuam existindo, mas não constituem uma segunda fonte normativa para definir o sistema.

---

3. O princípio da completude

A primeira lei necessária para classificar um sistema como Everything as a Code é a Lei da Completude Normativa.

Lei 1 — Completude Normativa

«Toda informação externa ao código que seja necessária para determinar o comportamento normativo do sistema deve ser incorporada à representação formal do sistema.»

Em termos conceituais:

∀ n ∈ NormativeSystemKnowledge

n MUST have
FormalRepresentation(n)

Isso não exige que a representação seja necessariamente escrita na mesma linguagem de programação.

Pode ser:

code
schema
DSL
type declaration
contract
policy
state machine
event definition
test
metadata
declarative specification

desde que exista uma relação formal entre a representação e o comportamento do sistema.

Uma documentação dizendo:

«"Usuários suspensos não podem realizar pagamentos."»

não é suficiente.

Uma política executável que impeça essa operação é.

---

4. O princípio da fonte única

Lei 2 — Single Source of Truth

Cada conceito normativo do sistema deve possuir uma fonte canônica.

Não deve existir:

Rule A no código
Rule A novamente na documentação
Rule A novamente no teste
Rule A novamente na configuração

sem uma relação formal entre essas representações.

O ideal é:

Canonical Definition
        ↓
 ┌──────┼──────┐
 ↓      ↓      ↓
Code   Tests   Docs

Ou seja, documentação e testes podem derivar ou verificar a definição, mas não devem competir com ela como fontes independentes.

Isso reduz o fenômeno de semantic drift.

---

5. O princípio da executabilidade

Lei 3 — Executabilidade

«Toda definição que afirma uma restrição comportamental deve poder ser avaliada automaticamente.»

Uma definição como:

User must be authenticated

deve possuir uma representação que permita verificar:

authenticated(user) == true

O mesmo princípio vale para:

validation
authorization
state transition
business rule
capability
contract
invariant
precondition
postcondition

O objetivo é eliminar regras puramente textuais que não possuem mecanismo de verificação.

---

6. O princípio da determinabilidade

Lei 4 — Determinabilidade

«Dado o mesmo estado válido e os mesmos inputs, o comportamento especificado pelo sistema deve ser determinável pela definição codificada.»

Isso não significa que todo sistema precise ser matematicamente determinístico.

Sistemas podem possuir:

randomness
time
external events
concurrency
distributed state

Mas esses elementos precisam possuir semântica definida.

Por exemplo:

RandomSelection

não precisa produzir sempre o mesmo resultado.

Porém sua existência, finalidade, entrada e contrato devem estar definidos.

A diferença é:

Comportamento não determinístico definido
        ≠
Comportamento não definido

---

7. O princípio da explicitabilidade

Lei 5 — Explicitabilidade Semântica

«O comportamento relevante do sistema não pode depender de convenções que não possuam representação formal.»

Considere:

if (x) {
    ...
}

Se o significado de "x" depende de uma convenção informal conhecida apenas pela equipe, o sistema possui semântica implícita.

Em EaC, a intenção deve ser expressável.

Por exemplo:

isEligible(user)

é semanticamente superior a depender de uma combinação obscura de flags.

Essa propriedade está diretamente relacionada ao princípio de meaningful names: a representação deve carregar significado suficiente para permitir a compreensão estrutural do sistema.

---

8. O princípio da identidade

Lei 6 — Identidade Canônica

Todo elemento semanticamente relevante deve possuir uma identidade estável.

Exemplos:

Entity
Action
Capability
Event
Intent
State
Property
Rule
Policy
Contract

Uma entidade não deve ser identificada apenas por sua posição no código.

Ela deve possuir identidade semântica.

Por exemplo:

Order
Payment
Inventory
User
Product

são identidades conceituais.

Isso permite que diferentes partes do sistema referenciem o mesmo conceito sem depender da implementação específica.

---

9. O princípio da tipagem semântica

Lei 7 — Tipagem Semântica

«Todo dado que participa de comportamento normativo deve possuir significado semântico suficiente para ser distinguido de dados apenas estruturalmente semelhantes.»

Por exemplo:

string

é uma informação estrutural.

Mas:

Email
PhoneNumber
ProductId
OrderId
Currency
Money

possuem significado semântico.

A transformação:

string → Email

não deve ser apenas documentação.

Deve existir uma representação formal capaz de validar o conceito.

Assim:

Primitive Type
      ↓
Semantic Type
      ↓
Constraints
      ↓
Behavior

---

10. O princípio da invariância

Lei 8 — Invariantes Codificados

Toda condição que obrigatoriamente deve permanecer verdadeira no sistema deve possuir representação verificável.

Exemplo:

Order.total >= 0

ou:

PaidOrder MUST have Payment

ou:

Inventory.quantity >= 0

Uma invariante escrita apenas em documentação não constitui EaC.

Ela deve poder ser:

validated
tested
enforced

automaticamente.

---

11. O princípio do comportamento atômico

Lei 9 — Atomicidade Comportamental

Todo comportamento identificável do sistema deve possuir uma unidade formal de representação.

Uma operação não deve existir apenas como efeito colateral escondido dentro de outra operação.

Por exemplo:

CreateOrder
ReserveInventory
AuthorizePayment
ConfirmOrder

devem ser identificáveis como comportamentos distintos quando possuem semânticas distintas.

Isso não implica necessariamente microserviços.

Atomicidade semântica não é sinônimo de distribuição física.

Uma aplicação monolítica pode ser completamente compatível com esse princípio.

---

12. O princípio ação → resultado

Uma ação deve possuir resultado semanticamente identificável.

Formalmente:

Action : Input → Result

O resultado pode representar:

Success
Failure
StateChange
Event
Value
Entity

Uma função que executa comportamento relevante mas cujo efeito é completamente implícito dificulta a formalização do sistema.

A ação deve tornar sua semântica observável.

---

13. O princípio dos estados explícitos

Lei 10 — Estados Codificados

Quando um conceito possui estados semanticamente relevantes, esses estados devem ser representados formalmente.

Em vez de:

status = 0
status = 1
status = 2

deve existir algo equivalente a:

Pending
Paid
Cancelled
Completed

Mais importante ainda, devem ser codificadas as transições permitidas:

Pending → Paid
Pending → Cancelled
Paid → Completed

e proibidas:

Completed → Pending
Cancelled → Paid

A máquina de estados deixa de existir implicitamente no código espalhado.

Ela passa a ser parte da definição do sistema.

---

14. O princípio dos eventos

Lei 11 — Eventos Semanticamente Definidos

Todo evento relevante para o comportamento do sistema deve possuir uma definição formal.

Um evento deve possuir pelo menos:

Identity
Producer
Meaning
Payload
Version
Consumers/contract

Por exemplo:

OrderCreated
OrderPaid
InventoryReserved
PaymentFailed

O evento não deve ser apenas:

"order.created"

jogado em algum mecanismo de comunicação.

Ele deve representar uma unidade semântica do sistema.

---

15. O princípio dos contratos

Lei 12 — Contratos Codificados

Toda fronteira comportamental do sistema deve possuir contrato formal.

Isso inclui:

Input
Output
Preconditions
Postconditions
Errors
State effects
Events
Capabilities

Um endpoint, por exemplo, não deve ser definido apenas por sua URL.

Sua definição completa deve poder responder:

Who can invoke it?
What does it accept?
What does it produce?
What can it change?
What events can it emit?
What conditions must hold?
What happens when it fails?

---

16. O princípio das capacidades

Lei 13 — Capacidades Explícitas

A autorização para executar determinado comportamento deve ser representada como capacidade do sistema.

Em vez de espalhar:

if user.role == "admin"

por diversas operações, o sistema deve possuir um conceito formal semelhante a:

Capability:
    ManageInventory

e relações:

Actor
   ↓
Capability
   ↓
Action

Isso separa:

quem é

de:

o que pode fazer

e de:

o que efetivamente fez

Essa separação é importante para a codificação completa da semântica do sistema.

---

17. O princípio das regras como código

Lei 14 — Regras Executáveis

Toda regra normativa deve ser expressável como uma função, política, restrição ou outro artefato executável.

Por exemplo:

CanCancel(order, actor)

deve ser capaz de determinar:

true
false

sem depender da interpretação humana de documentação.

Isso transforma:

Business Rule

em:

Executable Semantic Rule

---

18. O princípio das relações

Lei 15 — Relações Codificadas

Não basta definir entidades isoladamente.

As relações entre elas também fazem parte do sistema.

Por exemplo:

Order → Customer
Order → Product
Payment → Order
Reservation → Customer
Action → Capability
Event → Entity

Se essas relações são necessárias para determinar o comportamento, devem possuir representação formal.

O sistema deixa de ser apenas um conjunto de classes e passa a ser um modelo semântico codificado.

---

19. O princípio da ausência de comportamento fantasma

Lei 16 — No Ghost Behavior

«Nenhum comportamento normativamente relevante pode existir somente como efeito emergente de convenções não declaradas.»

Exemplos de comportamento fantasma:

"Essa função só pode ser chamada depois daquela."
"Esse campo sempre vem preenchido."
"Esse evento normalmente significa..."
"Esse status 3 significa pago."
"Essa configuração precisa ser alterada manualmente."
"Todo mundo sabe que essa classe faz isso."

Se isso influencia o comportamento do sistema, precisa ser formalizado.

---

20. O princípio da verificabilidade

Lei 17 — Verificabilidade Total

Toda definição normativa deve possuir pelo menos um mecanismo automático de verificação apropriado.

Pode ser:

type checking
schema validation
unit test
property test
contract test
invariant checking
static analysis
model checking
runtime assertion

O objetivo não é testar tudo da mesma maneira.

O objetivo é garantir:

Definition
    ↓
Validation Mechanism

---

21. O princípio da reconstruibilidade

Lei 18 — Reconstruibilidade Semântica

Um sistema EaC deve permitir que um novo desenvolvedor ou ferramenta obtenha sua definição estrutural e comportamental a partir dos artefatos codificados.

Não pode ser necessário perguntar:

"Como isso funciona?"

e depender exclusivamente da memória de alguém.

A documentação pode explicar.

Mas a documentação não pode ser a única fonte da verdade.

---

22. O princípio da evolução

Lei 19 — Evolução Versionável

Toda alteração na definição do sistema deve produzir uma mudança rastreável.

Portanto:

System Version N
        ↓
Change
        ↓
System Version N+1

deve ser possível identificar:

what changed
why changed
which semantics changed
which contracts changed
which tests changed

Isso transforma a evolução do sistema em uma sequência observável de estados formais.

---

23. O princípio da compatibilidade semântica

Lei 20 — Compatibilidade Formal

Alterações não devem ser avaliadas apenas sintaticamente.

O sistema deve conseguir determinar se uma mudança:

preserves behavior
extends behavior
changes behavior
breaks behavior

Por exemplo:

Adicionar campo opcional

pode ser compatível.

Enquanto:

Alterar condição de autorização

pode ser uma alteração semântica crítica mesmo que nenhuma assinatura de função tenha mudado.

---

24. O que não é Everything as a Code

Um sistema não se torna EaC simplesmente porque:

✓ usa Git
✓ possui muitos arquivos
✓ possui testes
✓ possui TypeScript
✓ possui YAML
✓ possui JSON
✓ possui schemas
✓ possui documentação

Também não basta:

"Está tudo no repositório."

A pergunta correta é:

«O repositório contém informação suficiente para determinar formalmente o sistema?»

Um projeto pode possuir milhões de linhas de código e ainda depender de conhecimento externo.

Nesse caso:

Muito código ≠ Everything as a Code

---

25. O teste definitivo

Pode-se definir um teste conceitual:

The System Reconstruction Test

Considere:

S = Sistema
C = Conjunto de artefatos codificados
K = Conhecimento externo necessário

Um sistema satisfaz EaC se:

K_normative = ∅

onde "K_normative" representa conhecimento externo necessário para determinar o comportamento normativo do sistema.

Ou seja:

Behavior(S) = Behavior(C)

e não:

Behavior(S) = Behavior(C + conhecimento informal)

Essa é uma definição muito mais rigorosa que simplesmente exigir que os artefatos estejam versionados.

---

26. Como converter um sistema existente

A transformação de um sistema tradicional para EaC não deve começar reescrevendo código.

Ela deve começar pela descoberta da semântica existente.

O processo pode ser dividido em oito fases.

Fase 1 — Inventário semântico

Mapear:

Entities
Properties
Types
Actions
Capabilities
States
Transitions
Events
Rules
Policies
Contracts
Dependencies
Invariants
Side effects

O objetivo é descobrir aquilo que o sistema realmente é.

---

Fase 2 — Descoberta das fontes de verdade

Para cada comportamento, identificar sua origem:

source code
database
configuration
tests
documentation
convention
external service
developer knowledge

Isso produz um mapa:

Behavior
   ↓
Source of Truth

O objetivo é encontrar comportamentos que atualmente não possuem fonte formal.

---

Fase 3 — Extração da semântica

Código existente frequentemente contém semântica escondida.

Por exemplo:

if (order.status === 2 && user.type === 1) {
    ...
}

pode representar:

Capability: RefundOrder

Precondition:
    Order.status == Paid
    Actor.capability == RefundOrder

A transformação EaC consiste em recuperar a semântica e dar-lhe identidade.

---

Fase 4 — Canonicalização

Conceitos equivalentes devem ser unificados.

Por exemplo:

Customer
Client
Buyer
UserCustomer

podem representar o mesmo conceito ou conceitos diferentes.

Isso precisa ser resolvido explicitamente.

O objetivo é produzir um vocabulário canônico:

Canonical Entity
Canonical Property
Canonical Action
Canonical Event
Canonical Capability

---

Fase 5 — Extração das regras

Regras espalhadas pelo código devem ser transformadas em unidades identificáveis.

Antes:

Controller
 ├── validation
 ├── authorization
 ├── business rule
 ├── state change
 └── event emission

Depois:

Action
 ├── Input
 ├── Preconditions
 ├── Authorization
 ├── Rules
 ├── State transition
 ├── Result
 └── Events

Isso não exige necessariamente uma nova linguagem.

Pode ser realizado por abstrações da própria linguagem existente.

---

Fase 6 — Formalização dos estados e eventos

Identificar:

implicit state machines
implicit events
implicit transitions

e transformá-los em estruturas explícitas.

Isso normalmente revela uma grande quantidade de comportamento que estava escondida em:

if
switch
enum
database status
boolean flags
callbacks
listeners

---

Fase 7 — Eliminação da duplicação normativa

Depois de formalizar os conceitos, deve-se procurar múltiplas definições da mesma regra.

Exemplo:

Frontend:
    age >= 18

Backend:
    age > 17

Database:
    age >= 18

Documentation:
    adult = 18

O objetivo é estabelecer uma definição canônica.

Por exemplo:

AdultAge = 18

e derivar as validações necessárias.

---

Fase 8 — Validação da completude

Finalmente, aplicar o:

System Reconstruction Test

Pergunte para cada comportamento:

Existe uma definição formal?
Existe identidade?
Existe contrato?
Existe validação?
Existe teste?
Existe relação com os demais conceitos?
Existe comportamento implícito?
Existe conhecimento externo necessário?

Enquanto existir comportamento normativo sem representação formal, a transformação não está completa.

---

27. A arquitetura conceitual de um sistema EaC

Um sistema EaC pode ser modelado como:

                    SYSTEM
                      │
        ┌─────────────┼─────────────┐
        │             │             │
     Structure     Semantics     Behavior
        │             │             │
     Entities       Types         Actions
     Properties     Rules         Events
     Relations      Policies      States
     Contracts      Invariants    Transitions
                      │
                      ↓
                Capabilities
                      │
                      ↓
                 Authorization

O código de implementação deixa de ser uma coleção arbitrária de funções e passa a ser uma realização de um modelo semântico explícito.

---

28. A diferença entre Code as Implementation e Everything as Code

A distinção fundamental é:

Traditional Software

Code
  ↓
Implementation

enquanto:

Everything as a Code

Semantic Definition
        ↓
Structure
        ↓
Behavior
        ↓
Contracts
        ↓
Rules
        ↓
Implementation

No primeiro modelo, o código é principalmente a implementação.

No segundo, o código representa também a definição do sistema.

Essa diferença é central.

---

29. Critério formal de classificação

Pode-se definir um sistema "S" como EaC se:

EaC(S) =
    Completeness(S)
 ∧  Canonicality(S)
 ∧  Explicitness(S)
 ∧  Executability(S)
 ∧  Verifiability(S)
 ∧  Reproducibility(S)
 ∧  Versionability(S)
 ∧  SemanticIdentity(S)
 ∧  Contractuality(S)
 ∧  BehavioralClosure(S)

Onde:

Completeness

Toda informação normativa possui representação formal.

Canonicality

Cada conceito normativo possui uma fonte canônica.

Explicitness

O comportamento relevante não depende de convenções ocultas.

Executability

As definições relevantes podem ser executadas ou avaliadas.

Verifiability

As definições podem ser verificadas automaticamente.

Reproducibility

O comportamento pode ser reconstruído a partir das definições.

Versionability

As mudanças na definição são rastreáveis.

Semantic Identity

Conceitos possuem identidade semântica estável.

Contractuality

Interfaces e comportamentos possuem contratos formais.

Behavioral Closure

Não existe comportamento normativo necessário fora do modelo codificado.

A última propriedade é particularmente importante.

---

30. Behavioral Closure

Um sistema tradicional pode ser representado como:

System =
    Code
  + ImplicitKnowledge
  + Configuration
  + Conventions
  + Documentation

Um sistema EaC deve buscar:

System =
    FormalCode
  + RuntimeData

onde:

FormalCode

contém toda a definição normativa.

O runtime pode produzir novos dados.

Mas esses dados não redefinem arbitrariamente o que o sistema é.

Essa propriedade pode ser denominada:

Behavioral Closure.

É uma das características mais fortes para diferenciar um verdadeiro sistema EaC de simplesmente um projeto com muitos arquivos declarativos.

---

31. As leis mínimas de Everything as a Code

Para classificação prática, as leis podem ser condensadas em:

1. Lei da Completude — todo conhecimento normativo deve ser codificado.

2. Lei da Fonte Canônica — cada conceito normativo deve possuir uma definição canônica.

3. Lei da Explicitabilidade — comportamento relevante não pode depender de convenções implícitas.

4. Lei da Identidade — conceitos semanticamente relevantes devem possuir identidade.

5. Lei da Tipagem Semântica — dados relevantes devem possuir significado formal.

6. Lei da Atomicidade — comportamentos distintos devem possuir unidades identificáveis.

7. Lei do Resultado — uma ação deve possuir resultado semanticamente identificável.

8. Lei dos Estados — estados e transições relevantes devem ser codificados.

9. Lei dos Eventos — eventos relevantes devem possuir contratos semânticos.

10. Lei dos Contratos — fronteiras comportamentais devem ser formalmente especificadas.

11. Lei das Capacidades — permissões para comportamento devem ser formalmente representadas.

12. Lei das Regras Executáveis — regras normativas devem poder ser avaliadas automaticamente.

13. Lei das Invariantes — condições obrigatórias devem possuir verificação automática.

14. Lei das Relações — relações semanticamente relevantes devem ser codificadas.

15. Lei da Verificabilidade — definições normativas devem possuir mecanismos automáticos de validação.

16. Lei da Reconstruibilidade — o sistema deve ser reconstruível semanticamente a partir de seus artefatos.

17. Lei da Evolução Versionável — mudanças semânticas devem ser rastreáveis.

18. Lei da Compatibilidade — mudanças devem poder ser analisadas semanticamente.

19. Lei da Ausência de Comportamento Fantasma — nenhum comportamento normativo pode depender exclusivamente de conhecimento informal.

20. Lei do Fechamento Comportamental — o comportamento normativo do sistema deve estar contido em sua definição formal.

---

32. Conclusão

Everything as a Code, quando restrito ao desenvolvimento de sistemas, não deve ser entendido como "colocar tudo em arquivos".

Essa interpretação é insuficiente.

O conceito mais rigoroso é:

«Um sistema é Everything as a Code quando sua definição normativa possui fechamento formal: estrutura, semântica, comportamento, regras, contratos, estados, eventos, capacidades e relações necessárias para determinar seu funcionamento estão representados como artefatos codificados, versionáveis e verificáveis.»

A transformação de um sistema existente, portanto, não é simplesmente uma migração de configuração para YAML, criação de schemas ou reorganização de diretórios.

É uma extração e formalização da semântica do sistema.

O processo fundamental é:

Existing System
      ↓
Semantic Discovery
      ↓
Behavior Extraction
      ↓
Canonicalization
      ↓
Formalization
      ↓
Verification
      ↓
Behavioral Closure
      ↓
Everything as a Code

A principal diferença em relação às definições convencionais de EaC é que esta abordagem não mede EaC pela quantidade de artefatos transformados em código. Ela mede pela completude da representação formal do sistema.

Portanto:

Everything as Code
≠ Everything stored as code

Everything as Code
= Everything normative represented as code

Essa distinção permite transformar EaC de uma prática geral de engenharia em um critério técnico verificável para determinar se um sistema realmente possui uma definição codificada completa.