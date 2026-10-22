// Acceso con RUT y contraseña (Firebase Authentication).
//
// Cada persona tiene una cuenta cuyo "correo" se arma con su RUT: 12345678k.1@<GS.DOMINIO_CUENTAS>.
// Ese correo no existe ni se usa para enviar nada; solo identifica la cuenta.
// El número (1, 2, …) sube cada vez que su jefatura restablece la clave: se crea una cuenta nueva
// y la anterior deja de valer, porque accesos/{rut} apunta solo a la vigente.
//
// accesos/{rut} = { personaId, n, provisoria }. Se lee antes de ingresar, por eso no guarda datos personales.
window.GS = window.GS || {};

(function (GS) {
  let altas = null;   // segunda instancia de Firebase: crea cuentas sin cerrar la sesión de quien las crea
  let acceso = null;  // { rut, personaId, n, provisoria } de la sesión actual

  const correo = (rut, n) => GS.limpiarRut(rut).toLowerCase() + '.' + n + '@' + GS.DOMINIO_CUENTAS;
  const docAcceso = (fs, rut) => fs.collection('accesos').doc(GS.limpiarRut(rut));

  // 8 caracteres sin letras ni números que se confundan (O/0, I/1, L).
  function claveProvisoria() {
    const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const v = crypto.getRandomValues(new Uint32Array(8));
    return Array.from(v, (x) => A[x % A.length]).join('').replace(/^(.{4})/, '$1-');
  }

  // Revisa que la cuenta con sesión abierta sea la vigente para ese RUT.
  async function leerAcceso(fs, user) {
    const m = String(user.email || '').match(/^([0-9k]+)\.(\d+)@/);
    if (!m) return null;
    const d = await docAcceso(fs, m[1]).get();
    if (!d.exists || d.data().n !== Number(m[2])) return null;
    return Object.assign({ rut: m[1].toUpperCase() }, d.data());
  }

  function mensajeIngreso(e) {
    if (e && e.code === 'auth/too-many-requests') return GS.t('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
    if (e && e.code === 'auth/network-request-failed') return GS.t('Sin conexión a internet. Revisa tu conexión e inténtalo de nuevo.');
    return GS.t('RUT o clave incorrectos.');
  }

  GS.auth = {
    // Ingreso con RUT encendido (si no, se usa el acceso por vista).
    activo() { return GS.ACCESO === 'rut' && !!GS.FIREBASE; },
    // Se pueden crear accesos cuando hay base compartida, aunque el ingreso con RUT siga apagado.
    disponible() { return !!GS.FIREBASE; },
    personaId() { return acceso ? acceso.personaId : null; },
    provisoria() { return !!(acceso && acceso.provisoria); },

    async init() {
      if (!this.activo()) return;
      const app = await GS.firebase();
      const auth = app.auth();
      // La sesión dura mientras la pestaña esté abierta: los computadores de los edificios son compartidos.
      await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
      const user = await new Promise((ok) => { const off = auth.onAuthStateChanged((u) => { off(); ok(u); }); });
      if (!user) return;
      acceso = await leerAcceso(app.firestore(), user);
      if (!acceso) { await auth.signOut(); return; }
      // Persona desactivada: las reglas no le dejan leer su ficha.
      let vigente = false;
      try { const p = await app.firestore().collection('personas').doc(acceso.personaId).get(); vigente = p.exists && p.data().activo === true; }
      catch (e) { if (!e || e.code !== 'permission-denied') throw e; }
      if (!vigente) {
        await auth.signOut();
        acceso = null;
        GS.ui.ingreso = { msg: GS.t('Tu acceso está desactivado. Si crees que es un error, habla con tu jefatura.') };
      }
    },

    async ingresar(rut, clave) {
      if (!GS.rutValido(rut)) throw new Error(GS.t('Revisa tu RUT: el dígito verificador no calza.'));
      if (!clave) throw new Error(GS.t('Escribe tu clave.'));
      const app = await GS.firebase();
      const d = await docAcceso(app.firestore(), rut).get();
      if (!d.exists) throw new Error(GS.t('Este RUT todavía no tiene acceso. Pídele a tu jefatura que te lo cree.'));
      try { await app.auth().signInWithEmailAndPassword(correo(rut, d.data().n), String(clave).trim()); }
      catch (e) { console.error(e); throw new Error(mensajeIngreso(e)); }
    },

    async salir() {
      if (!this.activo()) return;
      const app = await GS.firebase();
      await app.auth().signOut();
      acceso = null;
    },

    // actual: clave vigente (no se pide en el cambio obligatorio del primer ingreso).
    async cambiarClave(actual, nueva, repetir) {
      nueva = String(nueva || '');
      if (nueva.length < 8) throw new Error(GS.t('La clave nueva debe tener al menos 8 caracteres.'));
      if (nueva !== String(repetir || '')) throw new Error(GS.t('Las dos claves nuevas no coinciden.'));
      const app = await GS.firebase();
      const u = app.auth().currentUser;
      if (!u || !acceso) throw new Error(GS.t('Tu sesión terminó. Vuelve a ingresar.'));
      if (actual != null) {
        try { await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, String(actual).trim())); }
        catch (e) { throw new Error(e && e.code === 'auth/too-many-requests' ? mensajeIngreso(e) : GS.t('La clave actual no es correcta.')); }
      }
      try { await u.updatePassword(nueva); }
      catch (e) {
        if (e && e.code === 'auth/requires-recent-login') throw new Error(GS.t('Por seguridad, cierra sesión, vuelve a ingresar y cambia la clave de inmediato.'));
        if (e && e.code === 'auth/weak-password') throw new Error(GS.t('Esa clave es muy débil. Usa una más larga.'));
        throw e;
      }
      if (acceso.provisoria) {
        await docAcceso(app.firestore(), acceso.rut).update({ provisoria: false });
        acceso.provisoria = false;
      }
    },

    // Crea (o restablece) el acceso de una persona. Devuelve la clave provisoria para entregársela.
    // La clave no se guarda en ninguna parte: solo se muestra a quien la creó.
    async crearAcceso(persona, porId) {
      if (!this.disponible()) throw new Error(GS.t('Para crear accesos hay que conectar la base compartida.'));
      if (!persona.activo) throw new Error(GS.t('{nombre} está desactivada. Reactívala antes de crear su acceso.', { nombre: persona.nombre }));
      const app = await GS.firebase();
      const fs = app.firestore();
      if (!altas) {
        altas = firebase.initializeApp(GS.FIREBASE, 'altas').auth();
        await altas.setPersistence(firebase.auth.Auth.Persistence.NONE);
      }
      const rut = GS.limpiarRut(persona.rut);
      const previo = await docAcceso(fs, rut).get();
      let n = Math.max(previo.exists ? previo.data().n : 0, (persona.cuenta && persona.cuenta.n) || 0) + 1;
      const clave = claveProvisoria();
      for (let intento = 0; ; intento++) {
        try { await altas.createUserWithEmailAndPassword(correo(rut, n), clave); break; }
        catch (e) {
          // Quedó una cuenta de un intento anterior que no terminó: se usa el número siguiente.
          if (e && e.code === 'auth/email-already-in-use' && intento < 5) { n++; continue; }
          console.error(e);
          if (e && e.code === 'auth/too-many-requests') throw new Error(GS.t('Firebase limita cuántos accesos se crean por hora. Espera un rato y vuelve a intentarlo.'));
          if (e && e.code === 'auth/operation-not-allowed') throw new Error(GS.t('Falta activar "Correo electrónico/contraseña" en Firebase Authentication.'));
          if (e && e.code === 'auth/network-request-failed') throw new Error(GS.t('Sin conexión a internet. Inténtalo de nuevo.'));
          throw new Error(GS.t('No se pudo crear el acceso. Inténtalo de nuevo.'));
        }
      }
      await altas.signOut();
      await docAcceso(fs, rut).set({ personaId: persona.id, n, provisoria: true });
      await GS.store.update('personas', persona.id, { cuenta: { n, creadaEn: GS.ahora(), creadaPor: porId || null } });
      return clave;
    }
  };
})(window.GS);
