import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  function login(email, password) { return signInWithEmailAndPassword(auth, email, password); }
  function register(email, password, displayName) {
    return createUserWithEmailAndPassword(auth, email, password).then(cred => {
      // Definir o displayName diretamente no objeto do utilizador do Firebase Auth
      // Esta atualização será refletida no `handleUser` quando o estado mudar.
      cred.user.displayName = displayName;
      return cred;
    });
  }
  function logout() { return firebaseSignOut(auth); }

  async function switchActiveCompany(companyId) {
    if (currentUser && currentUser.companies[companyId]) {
      await updateDoc(doc(db, 'users', currentUser.uid), { activeCompanyId: companyId });
      await refreshAuth();
    }
  }
  
  async function refreshAuth() {
    setLoading(true);
    const user = auth.currentUser;
    if (user) {
        await handleUser(user);
    }
    setLoading(false);
  }

  const handleUser = async (user) => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      let userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Lógica para quando um utilizador se regista pela primeira vez
        let initialProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            companies: {}, 
            companyIds: [],
            activeCompanyId: null
        };

        // CORREÇÃO: A lógica para verificar um convite existente estava errada.
        // Agora, fazemos uma query correta na coleção 'invites'.
        const invitesRef = collection(db, "invites");
        const q = query(invitesRef, where("email", "==", user.email), limit(1));
        const inviteQuerySnap = await getDocs(q);

        if (!inviteQuerySnap.empty) {
            const inviteDoc = inviteQuerySnap.docs[0];
            const inviteData = inviteDoc.data();
            
            initialProfile.companies[inviteData.companyId] = inviteData.role;
            initialProfile.companyIds.push(inviteData.companyId);
            initialProfile.activeCompanyId = inviteData.companyId;
            
            // Apaga o convite após ter sido utilizado
            await deleteDoc(doc(db, 'invites', inviteDoc.id));
        }
        
        await setDoc(userRef, initialProfile);
        userSnap = await getDoc(userRef);
      }
      setCurrentUser(userSnap.data());
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      await handleUser(user);
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  const value = { currentUser, loading, login, register, logout, refreshAuth, switchActiveCompany };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
