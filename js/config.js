// Configuración de la base compartida (Firebase).
//
// Mientras GS.FIREBASE esté en null, Grey Skills guarda los datos solo en este navegador.
// Para conectar Firestore, pega aquí el objeto firebaseConfig que entrega la consola de Firebase
// (Configuración del proyecto → Tus apps → Web). Estos datos no son secretos: la protección
// de la información la dan las reglas de seguridad de Firestore.
window.GS = window.GS || {};

GS.FIREBASE = {
  apiKey: 'AIzaSyClvslKK0WgS3Gr7MBhN8saypFBTxSRaeM',
  authDomain: 'greyskills-a6a7b.firebaseapp.com',
  projectId: 'greyskills-a6a7b',
  storageBucket: 'greyskills-a6a7b.firebasestorage.app',
  messagingSenderId: '83517558197',
  appId: '1:83517558197:web:086c9c600e969295ce1dfc'
};

// Clave común del acceso provisional, guardada como huella SHA-256 (no el texto de la clave).
// El código es público: esto solo frena a curiosos, no es seguridad real. En null, no se pide clave.
GS.CLAVE_HASH = null;

// Si la base compartida está completamente vacía, carga una sola vez los datos de ejemplo.
// Se cambia a false antes de cargar personas reales.
GS.DATOS_DE_PRUEBA = true;
