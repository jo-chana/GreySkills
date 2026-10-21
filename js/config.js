// Configuración de la base compartida (Firebase).
//
// Mientras GS.FIREBASE esté en null, Grey Skills guarda los datos solo en este navegador.
// Para conectar Firestore, pega aquí el objeto firebaseConfig que entrega la consola de Firebase
// (Configuración del proyecto → Tus apps → Web). Estos datos no son secretos: la protección
// de la información la dan las reglas de seguridad de Firestore.
window.GS = window.GS || {};

GS.FIREBASE = null;

// Si la base compartida está completamente vacía, carga una sola vez los datos de ejemplo.
// Se cambia a false antes de cargar personas reales.
GS.DATOS_DE_PRUEBA = true;
