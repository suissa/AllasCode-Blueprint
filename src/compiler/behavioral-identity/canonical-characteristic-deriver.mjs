const IDENTITY_KEY_NAMES = new Set([
  "cpf",
  "cnpj",
  "email",
  "externalId",
  "id",
  "phone",
  "providerReference",
  "sku",
  "slug",
  "username",
]);

const CANONICAL_LABEL_NAMES = new Set(["displayName", "label", "name"]);

export function pathOf(entityName, propertyName) {
  return `${entityName}.${propertyName}`;
}

export function normalizeEntity(entity) {
  if (!entity || typeof entity !== "object") {
    throw new TypeError("entity must be an object");
  }

  const name = entity.name ?? entity.entity ?? entity.type;
  if (!name) {
    throw new TypeError("entity must declare name, entity, or type");
  }

  return {
    ...entity,
    name,
    properties: entity.properties ?? {},
    identityKeys: entity.identityKeys ?? entity.identity_keys ?? [],
    canonicalLabels: entity.canonicalLabels ?? entity.canonical_labels ?? [],
    canonicalCharacteristics:
      entity.canonicalCharacteristics ?? entity.canonical_characteristics ?? [],
  };
}

export function deriveCanonicalCharacteristics(entityInput) {
  const entity = normalizeEntity(entityInput);
  const explicit = entity.canonicalCharacteristics.map((characteristic) =>
    normalizeCharacteristic(entity.name, characteristic, "explicit"),
  );

  const fromIdentityKeys = entity.identityKeys.map((key) =>
    normalizeCharacteristic(entity.name, key, "identity_key"),
  );

  const propertyNames = Array.isArray(entity.properties)
    ? entity.properties
    : Object.keys(entity.properties);

  const inferred = propertyNames
    .filter((propertyName) => IDENTITY_KEY_NAMES.has(propertyName))
    .map((propertyName) =>
      normalizeCharacteristic(entity.name, propertyName, "inferred_identity_key"),
    );

  const labels = [
    ...entity.canonicalLabels,
    ...propertyNames.filter((propertyName) => CANONICAL_LABEL_NAMES.has(propertyName)),
  ].map((propertyName) =>
    normalizeCharacteristic(entity.name, propertyName, "canonical_label"),
  );

  return dedupeCharacteristics([...explicit, ...fromIdentityKeys, ...inferred, ...labels]);
}

export function normalizeCharacteristic(entityName, input, source = "explicit") {
  if (typeof input === "string") {
    const [maybeEntity, maybeProperty] = input.includes(".")
      ? input.split(".", 2)
      : [entityName, input];

    return {
      entity: maybeEntity,
      property: maybeProperty,
      path: pathOf(maybeEntity, maybeProperty),
      source,
      role: source === "canonical_label" ? "recognition_label" : "semantic_coupling_point",
    };
  }

  if (!input || typeof input !== "object") {
    throw new TypeError("canonical characteristic must be a string or object");
  }

  const entity = input.entity ?? entityName;
  const property = input.property ?? input.name;
  if (!property) {
    throw new TypeError("canonical characteristic object must declare property or name");
  }

  return {
    ...input,
    entity,
    property,
    path: input.path ?? pathOf(entity, property),
    source: input.source ?? source,
    role: input.role ?? "semantic_coupling_point",
  };
}

export function dedupeCharacteristics(characteristics) {
  const seen = new Set();
  return characteristics.filter((characteristic) => {
    const key = characteristic.path;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

