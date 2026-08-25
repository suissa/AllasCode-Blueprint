# Actions

Atomic behaviors representing domain actions. Each action is independently identifiable and invocable.
Eu congelaria uma `Action` do AllasCode como um **Semantic AtomicBehavior autocontido**: ela precisa declarar identidade, contrato externo, configuração interna, tipos, schemas, eventos, regras de uso, especificação comportamental, formalização, implementação, testes e exemplos.

A estrutura-base que eu adotaria seria:

```text
semantics/
└── atomicbehavior/
    └── actions/
        └── isBetween/
            ├── README.md
            ├── manifest.yml
            ├── config.yml
            ├── interface.yml
            │
            ├── schema/
            │   ├── input.schema.yml
            │   ├── output.schema.yml
            │   └── config.schema.yml
            │
            ├── events/
            │   ├── requested.event.yml
            │   ├── accepted.event.yml
            │   ├── rejected.event.yml
            │   ├── success.event.yml
            │   └── failure.event.yml
            │
            ├── specifications/
            │   ├── behavior.spec.yml
            │   ├── invariants.spec.yml
            │   └── scenarios.spec.yml
            │
            ├── formalization/
            │   ├── isBetween.agda
            │   ├── isBetween.law
            │   ├── isBetween.rule
            │   └── isBetween.prov
            │
            ├── implementation/
            │   └── isBetween.zig
            │
            ├── examples/
            │   ├── valid.yml
            │   ├── invalid.yml
            │   └── invocation.yml
            │
            └── tests/
                ├── behavior.test.yml
                ├── contract.test.yml
                └── implementation.test.zig
```

A ideia é que cada diretório tenha uma responsabilidade única.

---

## `README.md`

É a **explicação humana do artefato**.

O `manifest.yml` informa para máquinas o que a Action é. O `README.md` explica para um humano por que ela existe, quando utilizá-la, quando não utilizá-la e como se comporta.

```md
# isBetween

`isBetween` verifies whether a comparable value exists within two boundaries.

## Semantic meaning

Given a value `x`, a lower boundary `min` and an upper boundary `max`,
the behavior succeeds when:

min <= x <= max

## Example

Input:

value: 10
min: 5
max: 20

Result:

true

## Intended usage

The behavior can specialize properties whose semantic type implements
the `Comparable` capability.

Examples:

- Payment.amount.isBetween
- Product.price.isBetween
- Inventory.quantity.isBetween

## Invalid usage

A property that does not satisfy the required behavioral type cannot
specialize this Action.
```

Ele não é autoridade de execução. É documentação derivada/compatível com os contratos.

---

# `manifest.yml`

Esse é o arquivo mais importante.

Ele representa **a identidade semântica e aquilo que a Action expõe para o restante do AllasCode**.

Eu usaria:

```yaml
api_version: allascode/v1
kind: Action

identity:
  canonical_label: isBetween
  version: 1.0.0

  description: >
    Determines whether a comparable value is contained between
    a lower and an upper boundary.

  universal_url:
    https://semantics.allascode.org/atomicbehavior/actions/isBetween/1.0.0

classification:
  atomic_behavior: true
  behavior_type: predicate
  purity: pure
  deterministic: true
  idempotent: true

specialization:
  required: true

  canonical_pattern:
    "{entity}.{property}.isBetween"

  examples:
    - Payment.amount.isBetween
    - Product.price.isBetween
    - Inventory.quantity.isBetween

semantic_requirements:
  capabilities:
    - Comparable

  input_types:
    - Comparable

  output_type:
    canonical_label: Boolean

usage:
  policy: constrained

  allowed:
    capabilities:
      - Comparable

invocation:
  mode: request

  authorization:
    policy: open

events:
  listen:
    - isBetween.requested

  emit:
    - isBetween.accepted
    - isBetween.rejected
    - isBetween.success
    - isBetween.failure

contracts:
  interface: ./interface.yml
  schemas: ./schema
  specifications: ./specifications
  formalization: ./formalization

implementation:
  path: ./implementation
```

Aqui existe uma distinção importante.

O `canonical_label` da Action genérica é:

```text
isBetween
```

Mas ela não é executada como função órfã.

Quando especializada:

```text
Payment.amount.isBetween
```

essa passa a ser a identidade da aplicação concreta.

Ou seja:

```text
Generic Action
isBetween

        ↓ specialization

Payment.amount.isBetween
```

---

# `config.yml`

O `config.yml` contém valores que entram **para dentro da implementação**.

Ele não define identidade.

Exemplo:

```yaml
boundaries:
  lower_inclusive: true
  upper_inclusive: true

comparison:
  normalize_before_compare: true
  reject_nan: true

runtime:
  timeout_ms: 50
```

Por exemplo, outra especialização poderia sobrescrever:

```yaml
boundaries:
  lower_inclusive: false
  upper_inclusive: true
```

Então:

```text
manifest.yml
    = quem eu sou / o que exponho

config.yml
    = como devo operar internamente
```

Essa separação que você havia definido é boa.

---

# `interface.yml`

Essa peça é importante por causa da distinção que você já havia estabelecido: `manifest` e `config` possuem valores, enquanto a interface declara **o contrato tipado desses valores**.

Exemplo:

```yaml
api_version: allascode/v1
kind: AtomicBehaviorInterface

behavior:
  canonical_label: isBetween

input:
  value:
    type: Comparable
    required: true

  min:
    type: Comparable
    required: true

  max:
    type: Comparable
    required: true

output:
  result:
    type: Boolean
    required: true

config:
  boundaries.lower_inclusive:
    type: Boolean
    required: true

  boundaries.upper_inclusive:
    type: Boolean
    required: true

events:
  listen:
    isBetween.requested:
      payload: IsBetweenInput

  emit:
    isBetween.success:
      payload: IsBetweenOutput

    isBetween.failure:
      payload: AtomicBehaviorError
```

Portanto:

```text
manifest
   +
config
   +
interface
   ↓
contrato completo
```

---

# `schema/input.schema.yml`

A interface fala semanticamente dos tipos.

O schema define a **estrutura concreta dos dados**.

```yaml
$schema: "https://json-schema.org/draft/2020-12/schema"

$id: "allascode://isBetween/input"

type: object
additionalProperties: false

required:
  - value
  - min
  - max

properties:
  value: {}

  min: {}

  max: {}
```

Você pode notar que eu propositalmente não coloquei:

```yaml
type: number
```

porque isso destruiria a genericidade do comportamento.

`isBetween` não é `Number.isBetween`.

A restrição real vem de:

```text
Comparable
```

e do Behavior Type.

---

# `schema/output.schema.yml`

```yaml
$schema: "https://json-schema.org/draft/2020-12/schema"

$id: "allascode://isBetween/output"

type: object
additionalProperties: false

required:
  - result

properties:
  result:
    type: boolean
```

---

# `schema/config.schema.yml`

Valida o próprio `config.yml`.

```yaml
$schema: "https://json-schema.org/draft/2020-12/schema"

type: object
additionalProperties: false

required:
  - boundaries
  - comparison

properties:

  boundaries:
    type: object

    required:
      - lower_inclusive
      - upper_inclusive

    properties:

      lower_inclusive:
        type: boolean

      upper_inclusive:
        type: boolean

  comparison:
    type: object

    properties:

      normalize_before_compare:
        type: boolean

      reject_nan:
        type: boolean
```

Isso permite validar configuração antes de instanciar o AtomicBehavior.

---

# `events/requested.event.yml`

Toda interação externa com esse Actor começa por evento/request.

```yaml
canonical_label: isBetween.requested

kind: request

producer:
  type: Actor

consumer:
  canonical_label: isBetween

payload:
  schema: ../schema/input.schema.yml

correlation:
  required: true

causation:
  required: true
```

Exemplo runtime:

```yaml
event: isBetween.requested

producer:
  canonical_label: PaymentAgent

target:
  canonical_label: Payment.amount.isBetween

payload:
  value: 100
  min: 10
  max: 500
```

---

# `events/accepted.event.yml`

Esse evento é interessante no seu modelo porque a Action pode aceitar ou rejeitar **a própria invocação**.

```yaml
canonical_label: isBetween.accepted

kind: authorization

meaning:
  invocation_authorized: true

payload:
  invocation_id:
    type: UUID

  requester:
    type: ActorIdentity
```

Fluxo:

```text
PaymentAgent
    -> isBetween.requested

isBetween
    -> isBetween.accepted
```

Só então ocorre a execução.

---

# `events/rejected.event.yml`

```yaml
canonical_label: isBetween.rejected

kind: authorization

meaning:
  invocation_authorized: false

payload:

  reason:
    type: SemanticError

  requester:
    type: ActorIdentity
```

Exemplo:

```yaml
event: isBetween.rejected

payload:
  requester: CustomerAgent

  reason:
    canonical_label: Invocation.NotAuthorized
```

---

# `events/success.event.yml`

`success` é obrigatório para todo AtomicBehavior.

```yaml
canonical_label: isBetween.success

kind: result

status: Ok

payload:
  schema: ../schema/output.schema.yml
```

Exemplo:

```yaml
event: isBetween.success

payload:
  result: true
```

---

# `events/failure.event.yml`

Também obrigatório.

```yaml
canonical_label: isBetween.failure

kind: result

status: Error

payload:

  error:
    type: SemanticError

  input_reference:
    type: InvocationReference
```

Exemplo:

```yaml
event: isBetween.failure

payload:

  error:
    canonical_label: Comparable.InvalidBounds

    message:
      "Lower boundary cannot be greater than upper boundary."
```

Logo, uma lei estrutural pode ser:

```text
∀ AtomicBehavior B:

B.events.emit ⊇ {
    B.success<Ok>,
    B.failure<Error>
}
```

---

# `specifications/behavior.spec.yml`

Aqui você declara **o comportamento esperado**, sem dizer como implementá-lo.

```yaml
canonical_label: isBetween.behavior

given:
  value: Comparable
  min: Comparable
  max: Comparable

when:
  action: isBetween

then:

  - if:
      expression: min <= value && value <= max

    result:
      value: true

  - if:
      expression: value < min || value > max

    result:
      value: false
```

A implementação Zig, Haskell, Rust etc. precisa obedecer a isso.

---

# `specifications/invariants.spec.yml`

Define propriedades que **jamais podem ser violadas**.

```yaml
canonical_label: isBetween.invariants

invariants:

  - canonical_label: Bounds.Ordered

    rule:
      min <= max

  - canonical_label: Comparison.TypePreservation

    rule:
      type(value) compatible_with type(min)
      and
      type(value) compatible_with type(max)

  - canonical_label: Deterministic.Result

    rule:
      same_input_and_config_implies_same_output
```

Isso diferencia:

```text
schema validation
```

de:

```text
semantic validity
```

---

# `specifications/scenarios.spec.yml`

São casos conhecidos.

```yaml
canonical_label: isBetween.scenarios

scenarios:

  - name: inside-range

    input:
      value: 50
      min: 10
      max: 100

    expected:
      result: true

  - name: lower-boundary

    input:
      value: 10
      min: 10
      max: 100

    expected:
      result: true

  - name: outside-range

    input:
      value: 101
      min: 10
      max: 100

    expected:
      result: false

  - name: invalid-bounds

    input:
      value: 50
      min: 100
      max: 10

    expected:
      error:
        canonical_label: Bounds.Ordered.Violation
```

Esses cenários podem virar automaticamente testes.

---

# `formalization/isBetween.agda`

Aqui está a formalização mecanizada.

Exemplo conceitual:

```agda
module IsBetween where

open import Data.Bool
open import Relation.Binary

variable
  A : Set

record Comparable (A : Set) : Set₁ where
  field
    _≤_ : A → A → Bool

isBetween :
  {{ _ : Comparable A }} →
  A →
  A →
  A →
  Bool

isBetween value min max =
  (min ≤ value) ∧ (value ≤ max)
```

Não precisa necessariamente ser a implementação utilizada em runtime.

Ela é uma projeção formal.

---

# `formalization/isBetween.law`

Aqui eu colocaria a lei independente da linguagem.

```text
law IsBetweenCorrectness

∀ x min max ∈ Comparable:

isBetween(x, min, max) = true
⇔
min ≤ x ∧ x ≤ max
```

Isso é algo que você pode posteriormente projetar para Agda.

---

# `formalization/isBetween.rule`

Regra de uso.

```text
rule IsBetweenUsage

Given:

Behavior B = isBetween

Property P

P : T

Then:

B may specialize P
iff
T implements Comparable
```

Essa rule está diretamente ligada à discussão que tivemos sobre o **filho conceder a permissão de utilização**.

---

# `formalization/isBetween.prov`

Representa a evidência/proveniência da prova.

Eu faria algo estruturado, e não colocaria simplesmente "true".

```yaml
artifact:
  canonical_label: isBetween

property:
  canonical_label: IsBetweenCorrectness

formalizer:
  language: Agda

source:
  file: ./isBetween.agda

verification:

  status: proved

  verifier:
    name: agda
    version: "2.8"

  postulates: 0
  holes: 0
```

A extensão definitiva ainda merece ser formalizada, mas semanticamente é isso que ela deveria representar.

---

# `implementation/isBetween.zig`

Aqui finalmente entra **como fazer**.

```zig
pub fn isBetween(
    comptime T: type,
    value: T,
    min: T,
    max: T,
) bool {
    return value >= min and value <= max;
}
```

A implementação não define o significado de `isBetween`.

Ela implementa algo que já foi definido anteriormente por:

```text
manifest
interface
schema
specification
formalization
```

Isso é uma regra importante do AllasCode:

```text
Semantics
    ↓
Specification
    ↓
Formalization
    ↓
Implementation
```

e nunca:

```text
Implementation
    ↓
"vamos descobrir o que ela significa"
```

---

# `examples/valid.yml`

Exemplo documental/executável:

```yaml
action:
  canonical_label: Product.price.isBetween

input:
  value: 49.90
  min: 10.00
  max: 100.00

expected:
  result: true
```

---

# `examples/invalid.yml`

```yaml
action:
  canonical_label: Customer.name.isBetween

input:
  value: Jean
  min: A
  max: Z

expected:

  error:
    canonical_label: BehaviorType.NotAllowed
```

Mesmo que alguma linguagem consiga comparar strings, isso não significa automaticamente que o contrato semântico daquele `Customer.name` permita `isBetween`.

Essa é justamente a diferença entre:

```text
programming-language compatibility
```

e:

```text
AllasCode semantic compatibility
```

---

# `examples/invocation.yml`

Mostra a relação Actor → Actor.

```yaml
from:
  kind: Agent
  canonical_label: FinancialAgent

to:
  kind: AtomicBehavior
  canonical_label: Payment.amount.isBetween

event:
  canonical_label: isBetween.requested

payload:
  value: 150.00
  min: 100.00
  max: 500.00

expected:

  events:

    - isBetween.accepted

    - isBetween.success
```

---

# `tests/behavior.test.yml`

Testa a semântica independentemente da linguagem.

```yaml
suite:
  canonical_label: isBetween.behavior

cases:

  - input:
      value: 50
      min: 10
      max: 100

    expected:
      result: true

  - input:
      value: 101
      min: 10
      max: 100

    expected:
      result: false
```

---

# `tests/contract.test.yml`

Esse é especialmente importante no seu modelo.

Testa a governança:

```yaml
suite:
  canonical_label: isBetween.contract

cases:

  - name: valid-specialization

    specialization:
      property: Payment.amount
      type: Money
      capabilities:
        - Comparable

    expected:
      allowed: true

  - name: invalid-specialization

    specialization:
      property: Customer.name
      type: PersonName

    expected:
      allowed: false

  - name: unauthorized-agent

    invocation:
      requester: UnknownAgent

    policy:
      agents:
        allow:
          - FinancialAgent

    expected:
      authorization: denied
```

---

# `tests/implementation.test.zig`

Por último, testa especificamente a implementação escolhida.

```zig
const std = @import("std");
const between = @import("../implementation/isBetween.zig");

test "value inside boundaries" {
    try std.testing.expect(
        between.isBetween(i32, 50, 10, 100)
    );
}

test "value outside boundaries" {
    try std.testing.expect(
        !between.isBetween(i32, 101, 10, 100)
    );
}
```

---

Então eu congelaria o contrato estrutural de uma `Action` assim:

```text
Action
│
├── README.md
│      humano entende
│
├── manifest.yml
│      identidade + metadados + exposição
│
├── config.yml
│      configuração interna
│
├── interface.yml
│      contrato tipado
│
├── schema/
│      estrutura concreta dos dados
│
├── events/
│      protocolo de comunicação
│
├── specifications/
│      comportamento + invariantes + cenários
│
├── formalization/
│      leis + regras + provas
│
├── implementation/
│      execução concreta
│
├── examples/
│      exemplos de utilização
│
└── tests/
       evidência executável
```

E semanticamente:

```text
                    Action
                      │
             ┌────────┴────────┐
             │                 │
         Identity          Contract
             │                 │
          manifest         interface
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                  schema     events     usage
                    │          │          │
                    └──────────┼──────────┘
                               │
                        specifications
                               │
                     ┌─────────┴─────────┐
                     │                   │
               formalization      implementation
                     │                   │
                   proof               runtime
                     │                   │
                     └─────────┬─────────┘
                               │
                              tests
                               │
                               ▼
                         Action.Valid
```

Eu colocaria ainda uma regra de compilação do framework:

```text
Action.Valid ⇔
    Identity.Valid
 ∧  Interface.Valid
 ∧  Schema.Valid
 ∧  Events.Valid
 ∧  Usage.Valid
 ∧  Specification.Valid
 ∧  RequiredFormalization.Valid
 ∧  Implementation.Conforms
 ∧  Tests.Pass
```

Isso é mais importante do que simplesmente exigir que certos arquivos existam: **a pasta vira uma unidade semanticamente compilável e validável pelo AllasCode**.
