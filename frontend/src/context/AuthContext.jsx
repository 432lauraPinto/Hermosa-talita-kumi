import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  deleteUser,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, callFn } from '../firebase';
import {
  validarFechaNacimiento,
  validarNombreCompleto,
  validarTelefonoBolivia,
} from '../utils/validators';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState('');

  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setFirebaseUser(fbUser);

      if (!fbUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const userRef = doc(db, 'users', fbUser.uid);

      unsubProfile = onSnapshot(
        userRef,
        async (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.activo === false) {
              setAuthNotice('Tu cuenta se encuentra desactivada. Contacta al administrador.');
              setProfile(null);
              setLoading(false);
              await signOut(auth);
              return;
            }
            setProfile({ uid: snap.id, ...data });
            setLoading(false);
          } else {
            // Estado transitorio durante registro mientras finaliza crearPerfil()
            setProfile(null);
            setLoading(false);
          }
        },
        (err) => {
          console.warn('[AuthContext] Error leyendo perfil:', err.message);
          setProfile(null);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  async function login(email, password) {
    setAuthNotice('');
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));

    if (!snap.exists()) {
      await signOut(auth);
      throw new Error('Tu cuenta no tiene un perfil completo. Regístrate nuevamente o contacta al centro.');
    }

    const data = snap.data();
    if (data.activo === false) {
      await signOut(auth);
      const err = new Error('Tu cuenta se encuentra desactivada. Contacta al administrador.');
      err.code = 'auth/user-disabled';
      throw err;
    }

    const perfilCompleto = { uid: snap.id, ...data };
    setProfile(perfilCompleto);
    return { user: cred.user, profile: perfilCompleto };
  }

  async function register({
    nombre,
    telefono,
    email,
    password,
    sucursalPreferida = null,
    aceptaWhatsapp = true,
    aceptaTerminos = false,
  }) {
    setAuthNotice('');
    const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);

    try {
      await updateProfile(cred.user, { displayName: nombre.trim() }).catch(() => {});
      const res = await callFn('crearPerfil', {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        sucursalPreferida: sucursalPreferida || null,
        aceptaWhatsapp: Boolean(aceptaWhatsapp),
        aceptaTerminos: Boolean(aceptaTerminos),
      });

      // Verificación de correo no bloqueante (visible en consola/UI del emulador y correo en producción)
      sendEmailVerification(cred.user).catch(() => {});
      return { user: cred.user, profile: res?.perfil || null };
    } catch (err) {
      // Si falló la creación del perfil, revertir el usuario Auth recién creado para no dejar cuentas huérfanas
      await deleteUser(cred.user).catch(() => signOut(auth));
      throw err;
    }
  }

  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  }

  async function resendVerificationEmail() {
    if (!auth.currentUser) throw new Error('Debes iniciar sesión primero.');
    await sendEmailVerification(auth.currentUser);
  }

  async function logout() {
    setAuthNotice('');
    await signOut(auth);
  }

  async function actualizarPerfilPropio({
    nombre,
    telefono,
    sucursalPreferida = null,
    aceptaWhatsapp = true,
    fechaNacimiento = null,
  }) {
    if (!firebaseUser) throw new Error('Debes iniciar sesión.');

    const checkNombre = validarNombreCompleto(nombre);
    if (!checkNombre.valido) throw new Error(checkNombre.motivo);

    const checkTel = validarTelefonoBolivia(telefono);
    if (!checkTel.valido) throw new Error(checkTel.motivo);

    const checkFecha = validarFechaNacimiento(fechaNacimiento);
    if (!checkFecha.valido) throw new Error(checkFecha.motivo);

    const userRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userRef, {
      nombre: checkNombre.valor,
      telefono: checkTel.valor,
      sucursalPreferida: sucursalPreferida || null,
      aceptaWhatsapp: Boolean(aceptaWhatsapp),
      fechaNacimiento: checkFecha.valor,
      updatedAt: serverTimestamp(),
    });
  }

  const user = firebaseUser
    ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: Boolean(firebaseUser.emailVerified),
        nombre: profile?.nombre || firebaseUser.displayName || firebaseUser.email,
        telefono: profile?.telefono || '',
        role: profile?.role || 'cliente',
        sucursales: Array.isArray(profile?.sucursales) ? profile.sucursales : [],
        sucursalPreferida: profile?.sucursalPreferida || null,
        aceptaWhatsapp: profile?.aceptaWhatsapp !== false,
        fechaNacimiento: profile?.fechaNacimiento || '',
        activo: profile?.activo !== false,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: user?.role || null,
        isAdmin: user?.role === 'admin',
        isEncargado: user?.role === 'encargado',
        isStaff: user?.role === 'admin' || user?.role === 'encargado',
        isCliente: user?.role === 'cliente',
        loading,
        authNotice,
        clearAuthNotice: () => setAuthNotice(''),
        login,
        register,
        resetPassword,
        resendVerificationEmail,
        logout,
        actualizarPerfilPropio,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
