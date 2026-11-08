// Conecta el modelo y el estado con el nombre visible del documento.

import { createDocument } from "./document.js";
import { getState, setState, subscribe } from "./state.js";

const documentNameElement = document.querySelector(".fs-document-name");

if (!documentNameElement) {
    throw new Error("No se encontró el nombre del documento en la página.");
}

setState({ document: createDocument() });

subscribe((nextState) => {
    documentNameElement.textContent = nextState.document.name;
});

documentNameElement.textContent = getState().document.name;
