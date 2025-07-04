import { db } from '../firebase/firebaseConfig';
import { 
  collection, addDoc, serverTimestamp, getDocs,
  doc, updateDoc, deleteDoc, 
  query, onSnapshot // Importar 'query' e 'onSnapshot'
} from 'firebase/firestore';
import { createLog } from './logService';

const getSuppliersCollection = (companyId) => collection(db, 'companies', companyId, 'suppliers');

export const addSupplier = async (companyId, supplierData, user) => {
  if (!companyId) throw new Error("ID da empresa é necessário.");
  if (!user || !user.uid) throw new Error("Dados do utilizador inválidos para criar o log.");
  
  const newSupplierRef = await addDoc(getSuppliersCollection(companyId), { ...supplierData, createdAt: serverTimestamp() });
  
  await createLog(companyId, {
      user: { uid: user.uid, displayName: user.displayName, email: user.email },
      action: 'CRIAR_FORNECEDOR',
      details: `Fornecedor "${supplierData.name}" foi criado.`
  });
  return newSupplierRef;
};

export const getSuppliers = async (companyId) => {
  if (!companyId) return [];
  const snapshot = await getDocs(getSuppliersCollection(companyId));
  const suppliers = [];
  snapshot.forEach((doc) => suppliers.push({ id: doc.id, ...doc.data() }));
  return suppliers;
};

export const updateSupplier = async (companyId, id, updatedData, user) => {
  if (!companyId) throw new Error("ID da empresa é necessário.");
  if (!user || !user.uid) throw new Error("Dados do utilizador inválidos para criar o log.");

  const supplierDoc = doc(db, 'companies', companyId, 'suppliers', id);
  await updateDoc(supplierDoc, updatedData);
  
  await createLog(companyId, {
      user: { uid: user.uid, displayName: user.displayName, email: user.email },
      action: 'EDITAR_FORNECEDOR',
      details: `Fornecedor "${updatedData.name}" (ID: ${id}) foi atualizado.`
  });
};

export const deleteSupplier = async (companyId, supplier, user) => {
  if (!companyId) throw new Error("ID da empresa é necessário.");
  if (!user || !user.uid) throw new Error("Dados do utilizador inválidos para criar o log.");

  const supplierDoc = doc(db, 'companies', companyId, 'suppliers', supplier.id);
  await deleteDoc(supplierDoc);
  
  await createLog(companyId, {
      user: { uid: user.uid, displayName: user.displayName, email: user.email },
      action: 'APAGAR_FORNECEDOR',
      details: `Fornecedor "${supplier.name}" (ID: ${supplier.id}) foi apagado.`
  });
};

/**
 * NOVA FUNÇÃO: Ouve as atualizações de fornecedores em tempo real.
 * @param {string} companyId - O ID da empresa.
 * @param {function} callback - Função a ser chamada com a lista de fornecedores atualizada.
 * @returns {function} Uma função para cancelar a subscrição do listener (unsubscribe).
 */
export const streamSuppliers = (companyId, callback) => {
  if (!companyId) return () => {};

  const suppliersQuery = query(getSuppliersCollection(companyId));

  const unsubscribe = onSnapshot(suppliersQuery, (querySnapshot) => {
    const suppliers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(suppliers);
  }, (error) => {
    console.error("Erro ao ouvir os fornecedores em tempo real:", error);
    callback([]);
  });

  return unsubscribe;
};
