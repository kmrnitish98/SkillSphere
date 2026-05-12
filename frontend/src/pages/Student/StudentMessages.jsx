import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaPaperPlane, FaUserCircle, FaArrowLeft, FaPlus } from 'react-icons/fa';
import { getConversations, getMessages, sendMessage, markMessagesSeen, getMyPayments } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Loader from '../../components/Loader/Loader';

const StudentMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [availableMentors, setAvailableMentors] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  
  const socket = useSocket();
  const messagesEndRef = useRef(null);

  // Initialize socket listeners
  useEffect(() => {
    if (!user || !socket) return;

    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => {
        if (msg.sender === user._id) return prev;
        if (activeChat && msg.conversationId === activeChat._id) {
          return [...prev, msg];
        }
        return prev;
      });
      
      setConversations(prev => {
        const exists = prev.find(c => c._id === msg.conversationId);
        if (exists) {
          return prev.map(c => c._id === msg.conversationId ? { ...c, lastMessage: msg.message, updatedAt: new Date() } : c);
        } else {
          // Refresh conversations if it's a completely new chat we don't have
          getConversations().then(res => setConversations(res.data.data));
          return prev;
        }
      });
    };

    socket.on('receiveMessage', handleReceiveMessage);

    const handleTyping = ({ conversationId, userId, isTyping }) => {
      if (userId !== user._id) {
        setTypingUsers(prev => ({ ...prev, [conversationId]: isTyping }));
      }
    };

    socket.on('typing', handleTyping);

    return () => {
      socket.off('onlineUsers');
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('typing', handleTyping);
    };
  }, [user, activeChat, socket]);

  // Load conversations and mentors
  useEffect(() => {
    Promise.all([
      getConversations(),
      getMyPayments()
    ]).then(([convRes, payRes]) => {
      setConversations(convRes.data.data);
      
      // Extract unique mentors from payments
      const mentorsMap = {};
      payRes.data?.data?.forEach(payment => {
        if (payment.course?.mentor) {
          mentorsMap[payment.course.mentor._id] = payment.course.mentor;
        }
      });
      setAvailableMentors(Object.values(mentorsMap));
    }).finally(() => setLoading(false));
  }, []);

  // Load messages when chat is selected
  useEffect(() => {
    if (!activeChat || !socket) return;
    
    if (activeChat.isNew) {
      setMessages([]);
      return;
    }

    socket.emit('joinChat', activeChat._id);
    
    getMessages(activeChat._id)
      .then(res => {
        setMessages(res.data.data);
        markMessagesSeen(activeChat._id).catch(() => {});
        // Reset unread count locally
        setConversations(prev => prev.map(c => c._id === activeChat._id ? { ...c, unreadCount: 0 } : c));
      });
  }, [activeChat]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;

    const receiverId = activeChat.participants.find(p => p._id !== user._id)?._id;
    if (!receiverId) return;

    const msgData = {
      receiverId,
      message: messageInput
    };

    const tempMsg = {
      _id: Date.now().toString(),
      sender: user._id,
      receiver: receiverId,
      message: messageInput,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setMessageInput('');
    
    if (!activeChat.isNew) {
      socket?.emit('typing', { conversationId: activeChat._id, userId: user._id, isTyping: false });
    }

    try {
      const res = await sendMessage(msgData);
      const savedMsg = res.data.data;
      
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? savedMsg : m));
      socket?.emit('sendMessage', savedMsg);
      
      if (activeChat.isNew) {
        // Refresh conversations to get the newly created conversation ID
        const convRes = await getConversations();
        setConversations(convRes.data.data);
        const newConv = convRes.data.data.find(c => c._id === savedMsg.conversationId);
        setActiveChat(newConv);
      } else {
        setConversations(prev => prev.map(c => {
          if (c._id === activeChat._id) {
            return { ...c, lastMessage: savedMsg.message, updatedAt: new Date() };
          }
          return c;
        }));
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
    }
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    if (!activeChat || activeChat.isNew) return;
    
    socket?.emit('typing', { 
      conversationId: activeChat._id, 
      userId: user._id, 
      isTyping: e.target.value.length > 0 
    });
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p._id !== user._id) || {};
  };

  const startNewChat = (mentor) => {
    // Check if conversation already exists
    const existing = conversations.find(c => c.participants.some(p => p._id === mentor._id));
    if (existing) {
      setActiveChat(existing);
    } else {
      setActiveChat({
        isNew: true,
        participants: [user, mentor],
      });
    }
    setShowNewChat(false);
    setShowChatMobile(true);
  };

  if (loading) return <Loader />;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-[calc(100vh-140px)] flex flex-col relative"
    >
      <div className="mb-4 hidden sm:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500 mt-1">Communicate with your mentors in real-time.</p>
        </div>
      </div>

      <div className="flex-1 bg-white sm:rounded-2xl shadow-sm border sm:border-slate-100 flex overflow-hidden relative -mx-4 sm:mx-0">
        
        {/* Sidebar - Conversation List */}
        <div className={`w-full sm:w-1/3 sm:border-r border-slate-100 flex flex-col bg-slate-50/30 absolute sm:relative h-full transition-transform duration-300 z-10 ${showChatMobile ? '-translate-x-full sm:translate-x-0' : 'translate-x-0'}`}>
          <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
            <h2 className="font-bold text-slate-800 sm:hidden">Messages</h2>
            <button 
              onClick={() => setShowNewChat(!showNewChat)}
              className="bg-green-100 text-green-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors flex items-center gap-1 ml-auto sm:ml-0"
            >
              <FaPlus /> New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {showNewChat ? (
              <div className="p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Mentors</h3>
                {availableMentors.length === 0 ? (
                  <p className="text-sm text-slate-500">You haven't enrolled in any courses yet.</p>
                ) : (
                  availableMentors.map(mentor => (
                    <div 
                      key={mentor._id}
                      onClick={() => startNewChat(mentor)}
                      className="p-3 bg-white border border-slate-100 rounded-xl mb-2 cursor-pointer hover:border-green-300 hover:shadow-sm transition-all flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {mentor.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{mentor.name}</h4>
                        <p className="text-xs text-slate-500">Mentor</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-2xl mb-4">
                  <FaPaperPlane />
                </div>
                <p className="text-slate-500 text-sm mb-4">No conversations yet.</p>
                <button 
                  onClick={() => setShowNewChat(true)}
                  className="text-green-600 font-semibold text-sm hover:underline"
                >
                  Message a Mentor
                </button>
              </div>
            ) : (
              conversations.map(chat => {
                const otherUser = getOtherParticipant(chat);
                const isOnline = onlineUsers.includes(otherUser._id);
                
                return (
                  <div 
                    key={chat._id} 
                    onClick={() => {
                      setActiveChat(chat);
                      setShowChatMobile(true);
                    }}
                    className={`p-4 border-b border-slate-50 cursor-pointer transition-colors flex items-center gap-3 ${activeChat?._id === chat._id ? 'bg-green-50/50 sm:border-l-4 sm:border-l-green-500' : 'hover:bg-slate-50'}`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-white shadow-sm">
                        {otherUser.avatar ? (
                          <img src={otherUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          otherUser.name?.charAt(0) || 'U'
                        )}
                      </div>
                      {isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-sm text-slate-900 truncate">{otherUser.name}</h3>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(chat.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{chat.lastMessage || 'Start a conversation'}</p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`w-full sm:w-2/3 flex flex-col bg-slate-50 absolute sm:relative h-full transition-transform duration-300 z-20 ${showChatMobile ? 'translate-x-0' : 'translate-x-full sm:translate-x-0'}`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3 shadow-sm z-10 shrink-0">
                <button 
                  onClick={() => setShowChatMobile(false)}
                  className="sm:hidden w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-full mr-1"
                >
                  <FaArrowLeft />
                </button>
                
                {(() => {
                  const otherUser = getOtherParticipant(activeChat);
                  const isOnline = onlineUsers.includes(otherUser._id);
                  return (
                    <>
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {otherUser.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-800 leading-tight">{otherUser.name}</h2>
                        <p className={`text-xs font-medium flex items-center gap-1 ${isOnline ? 'text-green-500' : 'text-slate-400'}`}>
                          {isOnline ? (
                            <><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Online</>
                          ) : 'Offline'}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    No messages yet. Say hi!
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isSelf = msg.sender === user._id;
                    const showAvatar = idx === 0 || messages[idx - 1].sender !== msg.sender;
                    
                    return (
                      <div key={msg._id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} gap-2`}>
                        {!isSelf && (
                          <div className="w-8 shrink-0">
                            {showAvatar && (
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold mt-auto">
                                {getOtherParticipant(activeChat).name?.charAt(0)}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative group ${isSelf ? 'bg-green-500 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'}`}>
                          <p className="leading-relaxed">{msg.message}</p>
                          <p className={`text-[10px] mt-1.5 font-medium flex items-center justify-end gap-1 ${isSelf ? 'text-green-100' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isSelf && (
                              msg.seen ? (
                                <svg className="w-3.5 h-3.5 text-blue-300 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L7 17l-5-5"></path><path d="M22 10l-7.5 7.5L13 16"></path></svg>
                              ) : (
                                <svg className="w-3.5 h-3.5 text-green-200 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                              )
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Typing Indicator */}
                {!activeChat.isNew && typingUsers[activeChat._id] && (
                  <div className="flex justify-start gap-2">
                    <div className="w-8 shrink-0"></div>
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={messageInput}
                      onChange={handleTyping}
                      placeholder="Type your message..." 
                      className="w-full px-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0"
                  >
                    <FaPaperPlane className="text-sm sm:text-base -ml-1" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 hidden sm:flex bg-slate-50/50">
              <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
                <FaPaperPlane />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Messages</h2>
              <p className="text-slate-500 max-w-sm mb-6">Select a conversation or start a new chat with your mentors.</p>
              <button 
                onClick={() => setShowNewChat(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all"
              >
                New Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StudentMessages;
