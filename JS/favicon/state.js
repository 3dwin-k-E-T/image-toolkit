// Mantiene el estado de la interfaz y el registro opaco de assets importados.

import { createDocument } from "./document.js";

let state = {
    document: createDocument(),
    selectedIds: [],
};
const listeners = new Set();
const assets = new Map();
let fallbackAssetCounter = 0;

function createAssetId() {
    if (typeof globalThis.crypto?.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
    }

    fallbackAssetCounter += 1;
    return `asset-${Date.now().toString(36)}-${fallbackAssetCounter.toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Devuelve el estado actual de la aplicación.
 * @returns {{document: object, selectedIds: string[]}}
 */
export function getState() {
    return state;
}

/**
 * Combina las claves recibidas y notifica a los suscriptores.
 * @param {Partial<{document: object, selectedIds: string[]}>} changes
 * @returns {{document: object, selectedIds: string[]}}
 */
export function setState(changes) {
    if (changes === null || typeof changes !== "object" || Array.isArray(changes)) {
        throw new Error("Los cambios del estado deben ser un objeto.");
    }

    const previousState = state;
    state = { ...previousState, ...changes };

    // Conserva una sola instantánea nueva y entrega ambas versiones a cada suscriptor.
    for (const listener of listeners) {
        listener(state, previousState);
    }

    return state;
}

/**
 * Registra un suscriptor y devuelve la función que lo cancela.
 * @param {(state: object, previousState: object) => void} listener
 * @returns {() => void}
 */
export function subscribe(listener) {
    if (typeof listener !== "function") {
        throw new Error("El suscriptor debe ser una función.");
    }

    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * Guarda un asset opaco bajo un identificador nuevo.
 * @param {*} asset
 * @returns {string}
 */
export function registerAsset(asset) {
    let assetId = createAssetId();
    while (assets.has(assetId)) {
        assetId = createAssetId();
    }

    assets.set(assetId, asset);
    return assetId;
}

/**
 * Devuelve el asset asociado al identificador o undefined si no existe.
 * @param {string} assetId
 * @returns {*|undefined}
 */
export function getAsset(assetId) {
    return assets.get(assetId);
}

/**
 * Quita del registro un asset y señala si existía.
 * @param {string} assetId
 * @returns {boolean}
 */
export function removeAsset(assetId) {
    return assets.delete(assetId);
}
