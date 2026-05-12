import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }
    
    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:5000';
    const newSocket = io(socketUrl);
    setSocket(newSocket);
    
    newSocket.emit('userOnline', user._id);

    newSocket.on('newMessageNotification', (msg) => {
      if (!window.location.pathname.includes('/messages')) {
        toast((t) => (
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
            toast.dismiss(t.id);
            navigate(user.role === 'mentor' ? '/mentor/messages' : '/student/messages');
          }}>
            <div className="text-2xl">💬</div>
            <div>
              <p className="font-bold text-sm text-slate-800">New Message</p>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">{msg.message}</p>
            </div>
          </div>
        ), { duration: 5000, style: { padding: '12px 16px', borderRadius: '16px' } });
      }
    });

    return () => newSocket.disconnect();
  }, [user, navigate]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
