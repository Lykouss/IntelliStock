import { db } from '../firebase/firebaseConfig';
import { 
    doc, updateDoc, getDocs, collection, addDoc, query, 
    where, deleteDoc, runTransaction,
    onSnapshot, getDoc // CORREÇÃO: 'getDoc' foi adicionado à lista de importações.
} from 'firebase/firestore';
import { createLog } from './logService';

// --- Funções de Escrita ---
export const updateUserProfile = async (uid, data, user) => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
    if (user && user.activeCompanyId && data.companies) {
      await createLog(user.activeCompanyId, {
          user: { uid: user.uid, displayName: user.displayName, email: user.email },
          action: 'EDITAR_FUNÇÃO',
          details: `A função do utilizador com UID ${uid} foi alterada.`
      });
    }
};

export const createInvite = async (companyId, companyName, email, displayName, role, user) => {
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where("email", "==", email), where("companyId", "==", companyId));
    const existingInvites = await getDocs(q);
    if (!existingInvites.empty) {
        throw new Error("Já existe um convite pendente para este email nesta empresa.");
    }
    await addDoc(invitesRef, { companyId, companyName, email, displayName, role });
    await createLog(companyId, {
        user: { uid: user.uid, displayName: user.displayName, email: user.email },
        action: 'CRIAR_CONVITE',
        details: `Convite enviado para ${email} com a função de ${role}.`
    });
};

export const removeUserFromCompany = async (companyId, userToRemove, actor) => {
    if (!companyId || !userToRemove?.uid || !actor?.uid) return Promise.reject(new Error("Dados insuficientes."));
    const userRef = doc(db, 'users', userToRemove.uid);
    const isLeaving = actor.uid === userToRemove.uid;
    const action = isLeaving ? 'SAIR_DA_EMPRESA' : 'REMOVER_UTILIZADOR';
    const details = isLeaving
      ? `Utilizador ${actor.displayName} saiu da empresa.`
      : `Utilizador ${userToRemove.displayName} (${userToRemove.email}) foi removido por ${actor.displayName}.`;
    await createLog(companyId, {
        user: { uid: actor.uid, displayName: actor.displayName, email: actor.email },
        action: action,
        details: details
    });
    await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data();
        const newCompaniesMap = { ...userData.companies };
        delete newCompaniesMap[companyId];
        const newCompanyIds = userData.companyIds.filter(id => id !== companyId);
        const newActiveCompanyId = userData.activeCompanyId === companyId ? (newCompanyIds[0] || null) : userData.activeCompanyId;
        transaction.update(userRef, {
            companies: newCompaniesMap,
            companyIds: newCompanyIds,
            activeCompanyId: newActiveCompanyId
        });
    });
};

// --- Funções de Streaming e Leitura ---

export const getAllUsersInCompany = async (companyId) => {
    if (!companyId) return [];
    const usersQuery = query(collection(db, 'users'), where('companyIds', 'array-contains', companyId));
    const userSnapshot = await getDocs(usersQuery);
    return userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
};

export const streamUsersInCompany = (companyId, callback) => {
    if (!companyId) return () => {};
    const usersQuery = query(collection(db, 'users'), where('companyIds', 'array-contains', companyId));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        callback(users);
    }, (error) => { console.error("Erro ao ouvir utilizadores:", error); callback([]); });
    return unsubscribe;
};

export const streamPendingInvites = (companyId, callback) => {
    if (!companyId) return () => {};
    const invitesQuery = query(collection(db, 'invites'), where("companyId", "==", companyId));
    const unsubscribe = onSnapshot(invitesQuery, (snapshot) => {
        const invites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(invites);
    }, (error) => { console.error("Erro ao ouvir convites:", error); callback([]); });
    return unsubscribe;
};

export const streamInvitesForUser = (email, callback) => {
    if (!email) return () => {};
    const invitesQuery = query(collection(db, 'invites'), where("email", "==", email));
    const unsubscribe = onSnapshot(invitesQuery, (snapshot) => {
        const invites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(invites);
    }, (error) => {
        console.error("Erro ao ouvir convites do utilizador:", error);
        callback([]);
    });
    return unsubscribe;
};

// --- Outras funções ---

export const getInvitesForUser = async (email) => {
    if (!email) return [];
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const acceptInvite = async (userId, inviteId, user) => {
    const inviteRef = doc(db, 'invites', inviteId);
    const userRef = doc(db, 'users', userId);
    let companyId;
    await runTransaction(db, async (transaction) => {
        const inviteDoc = await transaction.get(inviteRef);
        if (!inviteDoc.exists()) throw new Error("Convite não encontrado.");
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("Utilizador não encontrado.");
        const inviteData = inviteDoc.data();
        const userData = userDoc.data();
        companyId = inviteData.companyId;
        const newCompaniesMap = { ...userData.companies, [inviteData.companyId]: inviteData.role };
        const newCompanyIdsArray = [...(userData.companyIds || []), inviteData.companyId];
        transaction.update(userRef, {
            companies: newCompaniesMap,
            companyIds: newCompanyIdsArray,
            activeCompanyId: inviteData.companyId
        });
        transaction.delete(inviteRef);
    });
    await createLog(companyId, {
        user: { uid: user.uid, displayName: user.displayName, email: user.email },
        action: 'ACEITAR_CONVITE',
        details: `Utilizador aceitou o convite para se juntar à empresa.`
    });
};

export const rejectInvite = (inviteId) => {
    return deleteDoc(doc(db, 'invites', inviteId));
};

export const deleteInvite = async (companyId, invite, user) => {
    const inviteRef = doc(db, 'invites', invite.id);
    const inviteSnap = await getDoc(inviteRef);
    const inviteEmail = inviteSnap.exists() ? inviteSnap.data().email : 'N/A';
    await deleteDoc(inviteRef);
     await createLog(companyId, {
        user: { uid: user.uid, displayName: user.displayName, email: user.email },
        action: 'CANCELAR_CONVITE',
        details: `Convite para ${inviteEmail} foi cancelado.`
    });
}
