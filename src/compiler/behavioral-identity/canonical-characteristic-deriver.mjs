const IDENTITY_KEY_NAMES = new Set([
  "cpf", "cnpj", "email", "externalId", "id", "phone",
  "providerReference", "sku", "slug", "username",
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
  if (!name) throw new TypeError("entity must declare name, entity, or type");

  const properties = entity.properties ?? {};
  return {
    ...entity,
    name,
    properties,
    propertyNames: Array.isArray(properties) ? properties.map(String) : Object.keys(properties),
    identityKeys: entity.identityKeys ?? entity.identity_keys ?? [],
    canonicalLabels: entity.canonicalLabels ?? entity.canonical_labels ?? [],
    canonicalCharacteristics:
      entity.canonicalCharacteristics ?? entity.canonical_characteristics ?? [],
  };
}

export function deriveCanonicalCharacteristics(entityInput) {
  const entity = normalizeEntity(entityInput);
  const explicit = entity.canonicalCharacteristics.map((value) =>
    normalizeCharacteristic(entity.name, value, "explicit", entity.propertyNames),
  );
  const identityKeys = entity.identityKeys.map((value) =>
    normalizeCharacteristic(entity.name, value, "identity_key", entity.propertyNames),
  );
  const inferred = entity.propertyNames
    .filter((name) => IDENTITY_KEY_NAMES.has(name))
    .map((name) =>
      normalizeCharacteristic(entity.name, name, "inferred_identity_key", entity.propertyNames),
    );
  const labels = [...entity.canonicalLabels,
    ...entity.propertyNames.filter((name) => CANONICAL_LABEL_NAMES.has(name))]
    .map((name) =>
      normalizeCharacteristic(entity.name, name, "canonical_label", entity.propertyNames),
    );
  return dedupeCharacteristics([...explicit, ...identityKeys, ...inferred, ...labels]);
}

export function normalizeCharacteristic(
  entityName,
  input,
  source = "explicit",
  propertyNames,
) {
  let entity;
  let property;
  let rest = {};

  if (typeof input === "string") {
    const separator = input.indexOf(".");
    entity = separator >= 0 ? input.slice(0, separator) : entityName;
    property = separator >= 0 ? input.slice(separator + 1) : input;
  } else {
    if (!input || typeof input !== "object") {
      throw new TypeError("canonical characteristic must be a string or object");
    }
    rest = input;
    entity = input.entity ?? entityName;
    property = input.property ?? input.name;
  }

  if (!entity || !property) {
    throw new TypeError("canonical characteristic must resolve entity and property");
  }

  const valid = propertyNames === undefined || propertyNames.includes(property);
  return {
    ...rest,
    entity,
    property,
    path: pathOf(entity, property),
    source: rest.source ?? source,
    role:
      rest.role ??
      (source === "canonical_label" ? "recognition_label" : "semantic_coupling_point"),
    valid,
    diagnostic: valid ? undefined : `Property ${pathOf(entity, property)} is not declared`,
  };
}

export function dedupeCharacteristics(characteristics) {
  const seen = new Set();
  return characteristics.filter(({ path }) => {
    if (seen.has(path)) return false;
    seen.add(path);
    return true;
  });
}
