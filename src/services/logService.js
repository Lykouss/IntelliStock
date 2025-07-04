import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp, query, getDocs, orderBy, onSnapshot } from 'firebase/firestore';

const getLogsCollection = (companyId) => collection(db, 'companies', companyId, 'logs');

/**
 * Cria um novo registo de log para uma ação na empresa.
 */
export const createLog = (companyId, logData) => {
    if (!companyId || !logData) {
        return Promise.reject(new Error("Dados insuficientes para criar o log."));
    }
    return addDoc(getLogsCollection(companyId), {
        ...logData,
        timestamp: serverTimestamp()
    });
};

/**
 * Busca todos os logs de uma empresa, ordenados por data.
 */
export const getLogs = async (companyId) => {
    if (!companyId) return [];
    const q = query(getLogsCollection(companyId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const logs = [];
    snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
    return logs;
};

/**
 * NOVA FUNÇÃO: Ouve as atualizações de logs em tempo real.
 * @param {string} companyId - O ID da empresa.
 * @param {function} callback - Função a ser chamada com a lista de logs atualizada.
 * @returns {function} Uma função para cancelar a subscrição do listener (unsubscribe).
 */
export const streamLogs = (companyId, callback) => {
    if (!companyId) return () => {};

    const logsQuery = query(getLogsCollection(companyId), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(logs);
    }, (error) => {
        console.error("Erro ao ouvir os logs em tempo real:", error);
        callback([]);
    });

    return unsubscribe;
};
