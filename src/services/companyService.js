import { db } from '../firebase/firebaseConfig';
// CORREÇÃO: Removida a importação de 'deleteDoc' não utilizada.
import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';

/**
 * Busca os detalhes de uma empresa específica.
 */
export const getCompanyDetails = async (companyId) => {
    if (!companyId) return null;
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);
    return companySnap.exists() ? { id: companySnap.id, ...companySnap.data() } : null;
};

/**
 * Atualiza os detalhes de uma empresa.
 */
export const updateCompanyDetails = (companyId, data) => {
    if (!companyId) return Promise.reject(new Error("ID da empresa não fornecido."));
    const companyRef = doc(db, 'companies', companyId);
    return updateDoc(companyRef, data);
};

/**
 * Transfere a propriedade de uma empresa.
 */
export const transferCompanyOwnership = async (companyId, oldOwnerId, newOwnerId) => {
    if (!companyId || !oldOwnerId || !newOwnerId) {
        return Promise.reject(new Error("Dados insuficientes para a transferência."));
    }
    const batch = writeBatch(db);
    const companyRef = doc(db, 'companies', companyId);
    batch.update(companyRef, { ownerId: newOwnerId });
    const oldOwnerRef = doc(db, 'users', oldOwnerId);
    batch.update(oldOwnerRef, { [`companies.${companyId}`]: 'Administrador' });
    const newOwnerRef = doc(db, 'users', newOwnerId);
    batch.update(newOwnerRef, { [`companies.${companyId}`]: 'Dono' });
    return batch.commit();
}

/**
 * Apaga uma empresa e remove as referências de todos os seus utilizadores.
 */
export const deleteCompany = async (companyId, usersInCompany) => {
    if (!companyId || !usersInCompany) return Promise.reject(new Error("Dados insuficientes."));

    const batch = writeBatch(db);
    const companyRef = doc(db, 'companies', companyId);
    batch.delete(companyRef);

    usersInCompany.forEach(user => {
        const userRef = doc(db, 'users', user.uid);
        const newCompanyIds = user.companyIds.filter(id => id !== companyId);
        const newCompaniesMap = { ...user.companies };
        delete newCompaniesMap[companyId];

        batch.update(userRef, {
            companyIds: newCompanyIds,
            companies: newCompaniesMap,
            activeCompanyId: user.activeCompanyId === companyId ? (newCompanyIds[0] || null) : user.activeCompanyId
        });
    });

    return batch.commit();
}
