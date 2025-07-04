import { db } from '../firebase/firebaseConfig';
import { 
  collection, addDoc, serverTimestamp, getDocs,
  doc, updateDoc, deleteDoc, runTransaction,
  query, onSnapshot, orderBy
} from 'firebase/firestore';
import { createLog } from './logService';

// --- PRODUTOS ---

const getProductsCollection = (companyId) => collection(db, 'companies', companyId, 'products');

export const addProduct = async (companyId, productData, user) => {
  const newProductRef = await addDoc(getProductsCollection(companyId), { ...productData, createdAt: serverTimestamp() });
  await createLog(companyId, {
      user: { uid: user.uid, displayName: user.displayName, email: user.email },
      action: 'CRIAR_PRODUTO',
      details: `Produto "${productData.name}" (SKU: ${productData.sku}) foi criado.`
  });
  return newProductRef;
};

export const updateProduct = async (companyId, id, updatedData, user) => {
  const productDoc = doc(db, 'companies', companyId, 'products', id);
  await updateDoc(productDoc, updatedData);
  await createLog(companyId, {
      user: { uid: user.uid, displayName: user.displayName, email: user.email },
      action: 'EDITAR_PRODUTO',
      details: `Produto "${updatedData.name}" (ID: ${id}) foi atualizado.`
  });
};

export const deleteProduct = async (companyId, product, user) => {
  const productDoc = doc(db, 'companies', companyId, 'products', product.id);
  await deleteDoc(productDoc);
  await createLog(companyId, {
      user: { uid: user.uid, displayName: user.displayName, email: user.email },
      action: 'APAGAR_PRODUTO',
      details: `Produto "${product.name}" (ID: ${product.id}) foi apagado.`
  });
};

export const getProducts = async (companyId) => {
  if (!companyId) return [];
  const snapshot = await getDocs(getProductsCollection(companyId));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const streamProducts = (companyId, callback) => {
  if (!companyId) return () => {};
  const productsQuery = query(getProductsCollection(companyId));
  const unsubscribe = onSnapshot(productsQuery, (querySnapshot) => {
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(products);
  }, (error) => {
    console.error("Erro ao ouvir os produtos em tempo real:", error);
    callback([]);
  });
  return unsubscribe;
};


// --- MOVIMENTAÇÕES DE STOCK ---

const getMovementsCollection = (companyId) => collection(db, 'companies', companyId, 'stock_movements');

export const addStockMovement = async (companyId, productId, type, quantityMoved, user) => {
  let productName = 'N/A';
  await runTransaction(db, async (transaction) => {
      const productRef = doc(db, 'companies', companyId, 'products', productId);
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists()) throw new Error("Produto não encontrado!");
      
      productName = productDoc.data().name;
      const currentQuantity = productDoc.data().quantity;
      const newQuantity = type === 'entrada' ? currentQuantity + Number(quantityMoved) : currentQuantity - Number(quantityMoved);
      
      if (newQuantity < 0) throw new Error("Stock insuficiente.");
      
      transaction.update(productRef, { quantity: newQuantity });
      transaction.set(doc(getMovementsCollection(companyId)), {
        productId, type, quantityMoved: Number(quantityMoved), date: serverTimestamp(), productName,
        user: { uid: user.uid, displayName: user.displayName, email: user.email }
      });
  });

  await createLog(companyId, {
      user: { uid: user.uid, displayName: user.displayName, email: user.email },
      action: 'MOVIMENTAR_STOCK',
      details: `Movimento de ${type} de ${quantityMoved} unidade(s) no produto "${productName}".`
  });
};

export const getMovements = async (companyId) => {
    if (!companyId) return [];
    const snapshot = await getDocs(getMovementsCollection(companyId));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * NOVA FUNÇÃO: Ouve as atualizações de movimentações de stock em tempo real.
 */
export const streamMovements = (companyId, callback) => {
    if (!companyId) return () => {};
    const movementsQuery = query(getMovementsCollection(companyId), orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(movementsQuery, (snapshot) => {
        const movements = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(movements);
    }, (error) => {
        console.error("Erro ao ouvir as movimentações em tempo real:", error);
        callback([]);
    });

    return unsubscribe;
};
