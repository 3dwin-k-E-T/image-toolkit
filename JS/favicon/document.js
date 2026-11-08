// Define el modelo serializable del documento y sus operaciones inmutables.

export const ELEMENT_TYPES = Object.freeze([
    "image",
    "text",
    "rect",
    "circle",
    "line",
    "path",
]);

const ELEMENT_TYPE_SET = new Set(ELEMENT_TYPES);
const DOCUMENT_FIELDS = new Set(["name", "width", "height", "background"]);
const ELEMENT_FIELDS = new Set([
    "x",
    "y",
    "width",
    "height",
    "rotation",
    "opacity",
    "visible",
    "locked",
    "assetId",
    "naturalWidth",
    "naturalHeight",
]);
let fallbackIdCounter = 0;

function createId() {
    if (typeof globalThis.crypto?.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
    }

    // El contador y la parte aleatoria mantienen el respaldo único entre llamadas.
    fallbackIdCounter += 1;
    return `id-${Date.now().toString(36)}-${fallbackIdCounter.toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function validateName(name) {
    if (typeof name !== "string" || name.trim().length === 0) {
        throw new Error("El nombre debe ser un texto no vacío.");
    }

    return name.trim();
}

function validateDocumentDimension(value, label) {
    if (!Number.isInteger(value) || value < 1 || value > 1024) {
        throw new Error(`El ${label} debe ser un entero entre 1 y 1024.`);
    }

    return value;
}

function validateColor(color) {
    if (typeof color !== "string" || !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
        throw new Error("El color debe estar en formato hexadecimal #RGB o #RRGGBB.");
    }

    return color;
}

function normalizeBackground(background) {
    if (background === undefined) {
        return { type: "transparent", color: null };
    }

    if (background === null || typeof background !== "object" || Array.isArray(background)) {
        throw new Error("El fondo debe ser un objeto de tipo transparente o color.");
    }

    if (background.type === "transparent") {
        return { type: "transparent", color: null };
    }

    if (background.type === "color") {
        return { type: "color", color: validateColor(background.color) };
    }

    throw new Error("El tipo de fondo debe ser transparente o color.");
}

function validateElementDimension(value, label) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        throw new Error(`La dimensión ${label} del elemento debe ser un número positivo.`);
    }

    return value;
}

function normalizeElement(type, props = {}) {
    if (!ELEMENT_TYPE_SET.has(type)) {
        throw new Error("El tipo de elemento no está permitido.");
    }

    if (props === null || typeof props !== "object" || Array.isArray(props)) {
        throw new Error("Las propiedades del elemento deben ser un objeto.");
    }

    const x = props.x ?? 0;
    const y = props.y ?? 0;
    const rotation = props.rotation ?? 0;
    const opacity = props.opacity ?? 1;
    const visible = props.visible ?? true;
    const locked = props.locked ?? false;

    if (typeof x !== "number" || !Number.isFinite(x) ||
        typeof y !== "number" || !Number.isFinite(y)) {
        throw new Error("Las coordenadas del elemento deben ser números finitos.");
    }
    if (typeof rotation !== "number" || !Number.isFinite(rotation)) {
        throw new Error("La rotación debe ser un número finito.");
    }
    if (typeof opacity !== "number" || !Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
        throw new Error("La opacidad debe ser un número entre 0 y 1.");
    }
    if (typeof visible !== "boolean" || typeof locked !== "boolean") {
        throw new Error("La visibilidad y el bloqueo deben ser valores booleanos.");
    }

    // Solo se copian campos del modelo para evitar guardar referencias u opciones ajenas.
    const element = {
        id: props.id ?? createId(),
        type,
        x,
        y,
        width: validateElementDimension(props.width ?? 100, "ancho"),
        height: validateElementDimension(props.height ?? 100, "alto"),
        rotation,
        opacity,
        visible,
        locked,
    };

    if (typeof element.id !== "string" || element.id.trim().length === 0) {
        throw new Error("El identificador del elemento debe ser un texto no vacío.");
    }

    if (type === "image") {
        if (typeof props.assetId !== "string" || props.assetId.trim().length === 0) {
            throw new Error("La imagen debe referenciar un assetId no vacío.");
        }
        if (!Number.isInteger(props.naturalWidth) || props.naturalWidth < 1 ||
            !Number.isInteger(props.naturalHeight) || props.naturalHeight < 1) {
            throw new Error("Las dimensiones naturales de la imagen deben ser enteros positivos.");
        }

        element.assetId = props.assetId;
        element.naturalWidth = props.naturalWidth;
        element.naturalHeight = props.naturalHeight;
    }

    return element;
}

function cloneDocument(doc, elements = doc.elements) {
    return {
        ...doc,
        background: { ...doc.background },
        elements: elements.map((element) => ({ ...element })),
    };
}

function touchDocument(doc) {
    const previousTime = Date.parse(doc.updatedAt);
    // Asegura un ISO distinto incluso si varias operaciones ocurren en el mismo milisegundo.
    const nextTime = Math.max(Date.now(), Number.isFinite(previousTime) ? previousTime + 1 : 0);

    return new Date(nextTime).toISOString();
}

function validateDocumentChanges(changes, allowedFields, label) {
    if (changes === null || typeof changes !== "object" || Array.isArray(changes)) {
        throw new Error(`Los cambios del ${label} deben ser un objeto.`);
    }

    for (const key of Object.keys(changes)) {
        if (!allowedFields.has(key)) {
            throw new Error(`No se permite cambiar "${key}" en ${label}.`);
        }
    }
}

/**
 * Crea un documento con valores iniciales validados.
 * @param {{name?: string, width?: number, height?: number, background?: {type: string, color?: string|null}}} [options]
 * @returns {{id: string, name: string, width: number, height: number, background: {type: string, color: string|null}, elements: object[], createdAt: string, updatedAt: string}}
 */
export function createDocument(options = {}) {
    if (options === null || typeof options !== "object" || Array.isArray(options)) {
        throw new Error("Las opciones del documento deben ser un objeto.");
    }

    const timestamp = new Date().toISOString();

    return {
        id: createId(),
        name: validateName(options.name ?? "Sin título"),
        width: validateDocumentDimension(options.width ?? 512, "ancho"),
        height: validateDocumentDimension(options.height ?? 512, "alto"),
        background: normalizeBackground(options.background),
        elements: [],
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}

/**
 * Crea un elemento validado con valores base por defecto.
 * @param {"image"|"text"|"rect"|"circle"|"line"|"path"} type
 * @param {object} [props]
 * @returns {object}
 */
export function createElement(type, props = {}) {
    return normalizeElement(type, props);
}

/**
 * Añade un elemento al final del orden de superposición.
 * @param {object} doc
 * @param {object} element
 * @returns {object}
 */
export function addElement(doc, element) {
    if (!doc || !Array.isArray(doc.elements)) {
        throw new Error("El documento no contiene una lista de elementos válida.");
    }

    const normalizedElement = normalizeElement(element?.type, element);
    if (doc.elements.some((current) => current.id === normalizedElement.id)) {
        throw new Error("Ya existe un elemento con ese identificador.");
    }

    return {
        ...cloneDocument(doc, [...doc.elements, normalizedElement]),
        updatedAt: touchDocument(doc),
    };
}

/**
 * Actualiza un elemento sin permitir cambiar su identificador ni su tipo.
 * @param {object} doc
 * @param {string} elementId
 * @param {object} changes
 * @returns {object}
 */
export function updateElement(doc, elementId, changes) {
    if (!doc || !Array.isArray(doc.elements)) {
        throw new Error("El documento no contiene una lista de elementos válida.");
    }

    const index = doc.elements.findIndex((element) => element.id === elementId);
    if (index === -1) {
        throw new Error("No existe un elemento con ese identificador.");
    }

    validateDocumentChanges(changes, ELEMENT_FIELDS, "el elemento");
    const updatedElement = normalizeElement(doc.elements[index].type, {
        ...doc.elements[index],
        ...changes,
        id: doc.elements[index].id,
    });
    const elements = doc.elements.map((element, currentIndex) =>
        currentIndex === index ? updatedElement : { ...element }
    );

    return {
        ...cloneDocument(doc, elements),
        updatedAt: touchDocument(doc),
    };
}

/**
 * Elimina el elemento indicado del documento.
 * @param {object} doc
 * @param {string} elementId
 * @returns {object}
 */
export function removeElement(doc, elementId) {
    if (!doc || !Array.isArray(doc.elements)) {
        throw new Error("El documento no contiene una lista de elementos válida.");
    }

    if (!doc.elements.some((element) => element.id === elementId)) {
        throw new Error("No existe un elemento con ese identificador.");
    }

    return {
        ...cloneDocument(doc, doc.elements.filter((element) => element.id !== elementId)),
        updatedAt: touchDocument(doc),
    };
}

/**
 * Actualiza solo las propiedades permitidas del documento.
 * @param {object} doc
 * @param {{name?: string, width?: number, height?: number, background?: {type: string, color?: string|null}}} changes
 * @returns {object}
 */
export function updateDocument(doc, changes) {
    if (!doc || !Array.isArray(doc.elements)) {
        throw new Error("El documento no contiene una lista de elementos válida.");
    }

    validateDocumentChanges(changes, DOCUMENT_FIELDS, "el documento");
    const updated = {
        ...doc,
        ...changes,
        background: changes.background === undefined
            ? { ...doc.background }
            : normalizeBackground(changes.background),
    };

    return {
        ...cloneDocument(updated),
        name: validateName(updated.name),
        width: validateDocumentDimension(updated.width, "ancho"),
        height: validateDocumentDimension(updated.height, "alto"),
        updatedAt: touchDocument(doc),
    };
}
