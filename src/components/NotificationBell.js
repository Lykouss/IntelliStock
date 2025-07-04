import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
// A importação mudou para usar a função de streaming
import { streamInvitesForUser, acceptInvite, rejectInvite } from '../services/userService';

// Estilos
const bellContainerStyles = { position: 'relative', marginRight: '20px' };
const bellButtonStyles = { background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '5px' };
const badgeStyles = { position: 'absolute', top: '0', right: '0', width: '10px', height: '10px', backgroundColor: '#e74c3c', borderRadius: '50%', border: '2px solid white' };
const dropdownStyles = {
    position: 'absolute', top: '140%', right: 0,
    backgroundColor: 'white', borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100,
    width: '320px', padding: '15px'
};
const buttonGroupStyles = { display: 'flex', justifyContent: 'space-between', marginTop: '10px' };
const actionButtonStyles = { flex: 1, padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', margin: '0 5px' };

export default function NotificationBell() {
    const { currentUser, refreshAuth } = useAuth();
    const [invites, setInvites] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // O useEffect agora gere a subscrição em tempo real para os convites do utilizador.
    useEffect(() => {
        if (currentUser?.email) {
            const unsubscribe = streamInvitesForUser(currentUser.email, (pendingInvites) => {
                setInvites(pendingInvites);
            });
            // Cancela a subscrição ao desmontar o componente.
            return () => unsubscribe();
        }
    }, [currentUser?.email]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAccept = async (inviteId) => {
        try {
            await acceptInvite(currentUser.uid, inviteId, currentUser);
            await refreshAuth();
            // A lista de convites atualiza-se automaticamente, não é preciso fazer mais nada.
        } catch (error) {
            alert("Falha ao aceitar o convite.");
        }
    };

    const handleReject = async (inviteId) => {
        try {
            await rejectInvite(inviteId);
            // A lista de convites atualiza-se automaticamente.
        } catch (error) {
            alert("Falha ao rejeitar o convite.");
        }
    };

    const BellIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
    );

    return (
        <div style={bellContainerStyles} ref={dropdownRef}>
            <button style={bellButtonStyles} onClick={() => setDropdownOpen(!dropdownOpen)}>
                <BellIcon />
                {invites.length > 0 && <div style={badgeStyles}></div>}
            </button>
            {dropdownOpen && (
                <div style={dropdownStyles}>
                    <h4>Notificações</h4>
                    {invites.length > 0 ? (
                        invites.map(invite => (
                            <div key={invite.id} style={{borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px'}}>
                                <p>Você foi convidado para a empresa <strong>{invite.companyName || invite.companyId}</strong> como <strong>{invite.role}</strong>.</p>
                                <div style={buttonGroupStyles}>
                                    <button style={{...actionButtonStyles, backgroundColor: '#2ecc71', color: 'white'}} onClick={() => handleAccept(invite.id)}>Aceitar</button>
                                    <button style={{...actionButtonStyles, backgroundColor: '#e74c3c', color: 'white'}} onClick={() => handleReject(invite.id)}>Rejeitar</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Nenhuma notificação nova.</p>
                    )}
                </div>
            )}
        </div>
    );
}
